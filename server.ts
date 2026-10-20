import express, { Request, Response } from 'express';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import {
  createStripeExpressConnectRouter,
  createStripeWebhookHandler,
  type CheckoutPayload,
} from './stripe-express-connect/src/server/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.resolve(__dirname, 'data', 'registry.json');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const WEDDING_FUND_GIFT_ID = 'wedding-fund';
const WEDDING_FUND_TITLE = 'Contributo libero per gli sposi';

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory cache & SSE clients
let sseClients: Response[] = [];

// Helper to load registry from disk
function loadRegistry() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading registry.json:', err);
  }
  return {
    version: 1,
    lastModified: Date.now(),
    settings: {
      coupleNames: 'Giovanni & Francesca',
      eventTitle: 'Il nostro Matrimonio',
      eventLocation: 'Villa Cordevigo Wine Relais, Cavaion Veronese (VR)',
      welcomeMessage:
        'La vostra presenza è per noi il dono più prezioso. Se desiderate accompagnarci nel realizzare i nostri sogni per la nuova vita insieme o contribuire al nostro viaggio di nozze, qui potete inserire la vostra quota libera con versamento diretto su PayPal o bonifico bancario.',
      currency: '€',
      paypalEmail: 'giovanni.francesca.wedding@gmail.com',
      paypalMeUsername: 'giovannifrancescawedding',
      bankIban: 'IT60 X 05428 11101 000000124890',
      bankAccountHolder: 'Giovanni Rossi e Francesca Bianchi',
      bankName: 'Intesa Sanpaolo - Filiale Verona Centro',
      bankBic: 'BCITITMM',
      heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    },
    gifts: [],
    guests: [],
    donations: [],
  };
}

// Helper to save registry to disk and broadcast
function saveRegistry(data: any) {
  try {
    data.lastModified = Date.now();
    data.version = (data.version || 0) + 1;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Broadcast to SSE clients
    const payload = `data: ${JSON.stringify({ type: 'REGISTRY_UPDATED', version: data.version, lastModified: data.lastModified })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        // ignore closed connections
      }
    });

    return data;
  } catch (err) {
    console.error('Error writing registry.json:', err);
    throw err;
  }
}

function saveStripeDonation(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return;

  const current = loadRegistry();
  const metadata = session.metadata || {};
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;
  const donations = Array.isArray(current.donations) ? current.donations : [];

  // Webhooks may be retried by Stripe: the PaymentIntent is our idempotency key.
  if (donations.some((donation: any) => donation.stripePaymentIntentId === paymentIntentId)) return;

  const amount = (session.amount_total || 0) / 100;
  const gift = (current.gifts || []).find((item: any) => item.id === metadata.giftId);
  const isWeddingFund = metadata.giftId === WEDDING_FUND_GIFT_ID;
  if ((!gift && !isWeddingFund) || amount <= 0) {
    console.warn('Ignoring Stripe checkout with incomplete registry metadata', { sessionId: session.id });
    return;
  }

  const guestEmail = metadata.guestEmail || session.customer_details?.email || '';
  const guestName = metadata.guestName || session.customer_details?.name || 'Invitato';
  const requestedGuestId = metadata.guestId;
  let guest = (current.guests || []).find((item: any) => item.id === requestedGuestId)
    || (current.guests || []).find((item: any) => item.email?.toLowerCase() === guestEmail.toLowerCase());

  if (guest) {
    guest = {
      ...guest,
      totalDonated: Number(guest.totalDonated || 0) + amount,
      donationsCount: Number(guest.donationsCount || 0) + 1,
      rsvpStatus: guest.rsvpStatus === 'pending' ? 'attending' : guest.rsvpStatus,
    };
    current.guests = current.guests.map((item: any) => item.id === guest.id ? guest : item);
  } else {
    guest = {
      id: `guest-stripe-${session.id}`,
      fullName: guestName,
      email: guestEmail,
      phone: metadata.guestPhone || '',
      group: metadata.guestGroup || 'Altri',
      rsvpStatus: 'attending',
      totalDonated: amount,
      donationsCount: 1,
      thankYouSent: false,
      avatarColor: 'bg-[#A6C1D8]',
    };
    current.guests = [guest, ...(current.guests || [])];
  }

  current.donations = [{
    id: `don-stripe-${session.id}`,
    guestId: guest.id,
    guestName: guest.fullName,
    guestEmail: guest.email,
    giftId: isWeddingFund ? WEDDING_FUND_GIFT_ID : gift.id,
    giftTitle: isWeddingFund ? WEDDING_FUND_TITLE : gift.title,
    amount,
    paymentMethod: 'stripe',
    status: 'completed',
    stripePaymentIntentId: paymentIntentId,
    stripeCheckoutSessionId: session.id,
    message: metadata.message || '',
    createdAt: new Date().toISOString(),
    thankYouSent: false,
  }, ...donations];

  if (gift) {
    const giftDonations = current.donations.filter((donation: any) => donation.giftId === gift.id && donation.status === 'completed');
    const raisedAmount = giftDonations.reduce((total: number, donation: any) => total + Number(donation.amount || 0), 0);
    current.gifts = current.gifts.map((item: any) => item.id === gift.id ? {
      ...item,
      raisedAmount,
      contributionsCount: giftDonations.length,
      status: !item.isInfiniteQuota && item.targetAmount > 0 && raisedAmount >= item.targetAmount ? 'completed' : item.status,
    } : item);
  }

  saveRegistry(current);
}

if (STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET) {
  app.post(
    '/api/stripe-webhook',
    express.raw({ type: 'application/json' }),
    createStripeWebhookHandler({
      stripeSecretKey: STRIPE_SECRET_KEY,
      webhookSecret: STRIPE_WEBHOOK_SECRET,
      onCheckoutCompleted: async (session) => saveStripeDonation(session),
    }),
  );
}

// Middleware: allow large payloads (e.g. uploaded images from local device)
app.use(express.json({ limit: '15mb' }));

// Global Security & Iframe Embedding Headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow iframe embedding anywhere without browser blocking
  res.setHeader('Content-Security-Policy', "frame-ancestors *");
  res.setHeader('X-Frame-Options', 'ALLOWALL');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// 1. API: Get entire registry
app.get('/api/registry', (req: Request, res: Response) => {
  const data = loadRegistry();
  res.json(data);
});

// 2. API: Fast version check for polling
app.get('/api/registry/version', (req: Request, res: Response) => {
  const data = loadRegistry();
  res.json({
    version: data.version || 1,
    lastModified: data.lastModified || Date.now(),
    giftCount: data.gifts?.length || 0,
  });
});

// 3. API: Save & Synchronize entire state (called by Dashboard & iframe)
app.post('/api/registry/sync', (req: Request, res: Response) => {
  const { gifts, guests, donations, settings } = req.body;
  const current = loadRegistry();

  const updated = {
    ...current,
    gifts: gifts !== undefined ? gifts : current.gifts,
    guests: guests !== undefined ? guests : current.guests,
    donations: donations !== undefined ? donations : current.donations,
    settings: settings !== undefined ? settings : current.settings,
  };

  const saved = saveRegistry(updated);
  res.json({ success: true, version: saved.version, lastModified: saved.lastModified });
});

// 4. API: Server-Sent Events stream for instant real-time sync across all windows/iframes
app.get('/api/registry/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', time: Date.now() })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    sseClients = sseClients.filter((client) => client !== res);
  });
});

// Stripe Connect Express: the platform key stays on the server; the couple only
// ever receives Stripe-hosted onboarding and the guest only sees Stripe Checkout.
if (STRIPE_SECRET_KEY) {
  const stripe = new Stripe(STRIPE_SECRET_KEY);

  // Stripe onboarding updates the server-side registry after Stripe redirects
  // back here. Firestore cannot be updated from this callback, so the client
  // uses this small endpoint to reconcile its cached/Firebase state.
  app.get('/api/stripe-connect/registry-status', (_req: Request, res: Response) => {
    const settings = loadRegistry().settings || {};
    const connected = settings.stripeStatus === 'connected' && settings.stripeEnabled === true;

    res.json({
      stripeAccountId: settings.stripeAccountId || '',
      stripeAccountName: settings.stripeAccountName || '',
      stripeEmail: settings.stripeEmail || '',
      stripeStatus: connected ? 'connected' : (settings.stripeStatus || 'disconnected'),
      stripeEnabled: connected,
      applePayEnabled: connected,
      applePayThroughStripe: connected,
    });
  });

  // Do not trust an account ID sent by the browser when resuming onboarding.
  app.use('/api/stripe-connect', (req, _res, next) => {
    if (req.method === 'POST' && req.path === '/onboard') {
      const settings = loadRegistry().settings || {};
      const canResumeOnboarding = Boolean(
        settings.stripeAccountId &&
        (settings.stripeStatus === 'pending' || settings.stripeStatus === 'connected')
      );
      req.body = {
        ...req.body,
        // A disconnected registry starts a new Express account. This prevents
        // stale/demo acct_ IDs from ever being sent to Stripe again.
        accountId: canResumeOnboarding ? settings.stripeAccountId : undefined,
        email: settings.stripeEmail || req.body?.email || undefined,
      };
    }
    next();
  });

  app.use('/api/stripe-connect', createStripeExpressConnectRouter({
    stripeSecretKey: STRIPE_SECRET_KEY,
    onboarding: {
      refreshUrl: `${APP_URL}/api/stripe-connect/refresh`,
      returnUrl: `${APP_URL}/api/stripe-connect/return`,
    },
    checkout: {
      successUrl: `${APP_URL}/?stripe_checkout=success`,
      cancelUrl: `${APP_URL}/?stripe_checkout=cancelled`,
    },
    onAccountCreated: async (account, request) => {
      const current = loadRegistry();
      const email = typeof request.body?.email === 'string' ? request.body.email : current.settings?.stripeEmail || '';
      current.settings = {
        ...current.settings,
        stripeAccountId: account.id,
        stripeEmail: email,
        stripeAccountName: current.settings?.coupleNames || 'Lista nozze',
        stripeEnabled: false,
        stripeStatus: 'pending',
        stripeConnectedAt: new Date().toISOString(),
      };
      saveRegistry(current);
    },
    resolveAccountId: () => loadRegistry().settings?.stripeAccountId || null,
    validateCheckout: (_request, payload: CheckoutPayload) => {
      const current = loadRegistry();
      const giftId = payload.metadata?.giftId;
      const gift = (current.gifts || []).find((item: any) => item.id === giftId);
      const isWeddingFund = giftId === WEDDING_FUND_GIFT_ID;
      const amount = Number(payload.amount);
      if (!gift && !isWeddingFund) throw new Error('Regalo non disponibile. Riapri la lista e riprova.');
      if (!Number.isFinite(amount) || amount < 0.5) throw new Error('L’importo deve essere almeno 0,50.');

      return {
        amount,
        currency: 'eur',
        title: isWeddingFund ? WEDDING_FUND_TITLE : `Regalo nozze: ${gift.title}`,
        description: `Contributo per ${current.settings?.coupleNames || 'gli sposi'}`,
        metadata: {
          giftId: gift.id,
          guestId: payload.metadata?.guestId || '',
          guestName: payload.metadata?.guestName || '',
          guestEmail: payload.metadata?.guestEmail || '',
          guestPhone: payload.metadata?.guestPhone || '',
          guestGroup: payload.metadata?.guestGroup || 'Altri',
          message: payload.metadata?.message || '',
        },
      };
    },
  }));

  const finishOnboarding = async (req: Request, res: Response) => {
    const current = loadRegistry();
    const accountId = current.settings?.stripeAccountId;
    if (!accountId) return res.redirect('/?stripe_connect=missing-account');

    try {
      const account = await stripe.v2.core.accounts.retrieve(accountId) as any;
      const connected = (account.requirements?.currently_due ?? []).length === 0;
      current.settings = {
        ...current.settings,
        stripeEnabled: connected,
        stripeStatus: connected ? 'connected' : 'pending',
        applePayThroughStripe: connected,
        applePayEnabled: connected,
      };
      saveRegistry(current);
      return res.redirect(`/?stripe_connect=${connected ? 'complete' : 'pending'}`);
    } catch (error) {
      console.error('Unable to refresh Stripe Connect account status:', error);
      return res.redirect('/?stripe_connect=error');
    }
  };

  app.get('/api/stripe-connect/return', finishOnboarding);
  app.get('/api/stripe-connect/refresh', finishOnboarding);
} else {
  app.use('/api/stripe-connect', (_req, res) => {
    res.status(503).json({ error: 'Stripe Connect non è configurato sul server. Imposta STRIPE_SECRET_KEY.' });
  });
}

// 5. Stripe Integration APIs (Apple Pay & Credit Cards)
app.get('/api/stripe/status', (req: Request, res: Response) => {
  const data = loadRegistry();
  const settings = data.settings || {};
  const hasEnvSecret = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasConfiguredSecret = Boolean(settings.stripeSecretKey);
  const isConnected = Boolean(settings.stripeEnabled && (settings.stripePublishableKey || settings.stripeAccountId));

  res.json({
    connected: isConnected,
    stripeEnabled: settings.stripeEnabled ?? false,
    stripeAccountId: settings.stripeAccountId || null,
    stripeAccountName: settings.stripeAccountName || null,
    stripePublishableKey: settings.stripePublishableKey || null,
    stripeMode: settings.stripeMode || 'test',
    applePayEnabled: settings.applePayEnabled !== false && settings.stripeEnabled !== false,
    hasServerSecretKey: hasEnvSecret || hasConfiguredSecret,
  });
});

app.post('/api/stripe/disconnect', (req: Request, res: Response) => {
  const current = loadRegistry();
  const settings = current.settings || {};

  const updatedSettings = {
    ...settings,
    stripeEnabled: false,
    stripeStatus: 'disconnected' as const,
    stripePublishableKey: '',
    stripeSecretKey: '',
    stripeAccountId: '',
    stripeAccountName: '',
    stripeEmail: '',
    applePayThroughStripe: false,
  };

  const updated = {
    ...current,
    settings: updatedSettings,
  };
  saveRegistry(updated);
  res.json({ success: true, settings: updatedSettings });
});

app.post('/api/stripe/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'eur', giftTitle, guestName, guestEmail } = req.body;
    const current = loadRegistry();
    const settings = current.settings || {};

    const amountInCents = Math.round((Number(amount) || 0) * 100);
    if (amountInCents <= 0) {
      return res.status(400).json({ error: 'Importo non valido' });
    }

    const secretKey = settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

    if (secretKey) {
      try {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(secretKey);
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: currency.toLowerCase(),
          description: `Regalo nozze: ${giftTitle || 'Lista Nozze'} da ${guestName || 'Invitato'}`,
          automatic_payment_methods: { enabled: true },
          metadata: {
            giftTitle: giftTitle || '',
            guestName: guestName || '',
            guestEmail: guestEmail || '',
            couple: settings.coupleNames || '',
          },
        });

        return res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          amount: amount,
          currency: currency,
          mode: 'live_stripe',
        });
      } catch (stripeErr: any) {
        console.warn('Stripe SDK call failed or key invalid, using simulation:', stripeErr.message);
      }
    }

    // Fallback or demo / sandbox mode: realistic simulated payment intent
    const simulatedId = `pi_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.json({
      clientSecret: `${simulatedId}_secret_${Math.random().toString(36).substring(2, 10)}`,
      paymentIntentId: simulatedId,
      amount: amount,
      currency: currency,
      mode: 'simulated_stripe',
      message: 'PaymentIntent pronto per Apple Pay e Carta di Credito',
    });
  } catch (err: any) {
    console.error('Error in create-payment-intent:', err);
    res.status(500).json({ error: err.message || 'Errore creazione pagamento Stripe' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
