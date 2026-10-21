import express, { Request, Response } from 'express';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import Stripe from 'stripe';
import {
  createStripeExpressConnectRouter,
  createStripeWebhookHandler,
  type CheckoutPayload,
} from './src/lib/stripe-express-connect/server/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATABASE_PATH = path.resolve(process.env.DATABASE_PATH || path.join(__dirname, 'data', 'registry.sqlite'));
const LEGACY_DATA_FILE = path.resolve(__dirname, 'data', 'registry.json');
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const WEDDING_FUND_GIFT_ID = 'wedding-fund';
const WEDDING_FUND_TITLE = 'Contributo libero per gli sposi';

// The database directory must live on persistent storage in production.
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

type RegistryData = {
  version?: number;
  lastModified?: number;
  settings: any;
  gifts: any[];
  guests: any[];
  donations: any[];
};

// In-memory SSE clients. SQLite is the sole source of truth.
let sseClients: Response[] = [];

function createInitialRegistry(): RegistryData {
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

function readLegacyRegistry(): RegistryData | null {
  try {
    if (!fs.existsSync(LEGACY_DATA_FILE)) return null;
    const legacy = JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, 'utf-8')) as RegistryData;
    return legacy && typeof legacy === 'object' ? legacy : null;
  } catch (err) {
    console.warn('Unable to import legacy registry.json; creating an empty registry instead.', err);
    return null;
  }
}

function normaliseRegistry(value: Partial<RegistryData>): RegistryData {
  const initial = createInitialRegistry();
  return {
    ...initial,
    ...value,
    settings: value.settings && typeof value.settings === 'object' ? value.settings : initial.settings,
    gifts: Array.isArray(value.gifts) ? value.gifts : [],
    guests: Array.isArray(value.guests) ? value.guests : [],
    donations: Array.isArray(value.donations) ? value.donations : [],
  };
}

const registryDb = new DatabaseSync(DATABASE_PATH);
registryDb.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS registry_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    version INTEGER NOT NULL,
    last_modified INTEGER NOT NULL
  );
`);

function initialiseRegistryDatabase() {
  const existing = registryDb.prepare('SELECT id FROM registry_state WHERE id = 1').get();
  if (existing) return;

  const initial = normaliseRegistry(readLegacyRegistry() || createInitialRegistry());
  const version = Number(initial.version) || 1;
  const lastModified = Number(initial.lastModified) || Date.now();
  initial.version = version;
  initial.lastModified = lastModified;
  registryDb.prepare(
    'INSERT INTO registry_state (id, data, version, last_modified) VALUES (1, ?, ?, ?)',
  ).run(JSON.stringify(initial), version, lastModified);
}

initialiseRegistryDatabase();

// Helper to load the complete registry from SQLite.
function loadRegistry(): RegistryData {
  const row = registryDb.prepare(
    'SELECT data, version, last_modified AS lastModified FROM registry_state WHERE id = 1',
  ).get() as { data: string; version: number; lastModified: number } | undefined;

  if (!row) {
    throw new Error('SQLite registry has not been initialised.');
  }

  try {
    const data = normaliseRegistry(JSON.parse(row.data) as RegistryData);
    data.version = row.version;
    data.lastModified = row.lastModified;
    return data;
  } catch (err) {
    console.error('Unable to read SQLite registry state:', err);
    throw new Error('SQLite registry contains invalid data.');
  }
}

// Save one atomic registry snapshot and notify connected browsers.
function saveRegistry(data: RegistryData) {
  try {
    const current = registryDb.prepare('SELECT version FROM registry_state WHERE id = 1').get() as { version: number } | undefined;
    const saved = normaliseRegistry(JSON.parse(JSON.stringify(data)) as RegistryData);
    saved.lastModified = Date.now();
    saved.version = (current?.version || 0) + 1;
    registryDb.prepare(
      'UPDATE registry_state SET data = ?, version = ?, last_modified = ? WHERE id = 1',
    ).run(JSON.stringify(saved), saved.version, saved.lastModified);

    // Broadcast to SSE clients
    const payload = `data: ${JSON.stringify({ type: 'REGISTRY_UPDATED', version: saved.version, lastModified: saved.lastModified })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(payload);
      } catch {
        // ignore closed connections
      }
    });

    return saved;
  } catch (err) {
    console.error('Error writing SQLite registry:', err);
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

  // Stripe onboarding updates the SQLite registry after Stripe redirects back
  // here. The client can reconcile its cached state through this endpoint.
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

  // Express Dashboard login links are short-lived and must be generated by the
  // server for the connected account; never expose the platform secret client-side.
  app.get('/api/stripe-connect/dashboard', async (_req: Request, res: Response) => {
    const accountId = loadRegistry().settings?.stripeAccountId;
    if (!accountId || typeof accountId !== 'string' || !accountId.startsWith('acct_')) {
      return res.status(409).json({ error: 'Non è collegato alcun account Stripe per questa lista.' });
    }

    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return res.redirect(loginLink.url);
    } catch (error) {
      console.error('Unable to create Stripe Express Dashboard login link:', error);
      return res.status(502).json({
        error: 'Non è stato possibile aprire il Dashboard Stripe dell’account collegato.',
      });
    }
  });

  // Do not trust an account ID sent by the browser when resuming onboarding.
  // The email entered in the UI is saved only when onboarding is explicitly
  // started, so changing the input cannot be reverted by a background refresh.
  app.use('/api/stripe-connect', async (req, res, next) => {
    if (req.method === 'POST' && req.path === '/onboard') {
      const settings = loadRegistry().settings || {};
      const canResumeOnboarding = Boolean(
        settings.stripeAccountId &&
        (settings.stripeStatus === 'pending' || settings.stripeStatus === 'connected')
      );
      const requestedEmail = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';

      if (!/^\S+@\S+\.\S+$/.test(requestedEmail)) {
        return res.status(400).json({ error: 'Inserisci un indirizzo email valido.' });
      }

      try {
        if (requestedEmail !== settings.stripeEmail) {
          // Keep Stripe and our registry aligned when onboarding is resumed.
          if (canResumeOnboarding) {
            await stripe.v2.core.accounts.update(settings.stripeAccountId, { contact_email: requestedEmail });
          }
          const current = loadRegistry();
          current.settings = { ...current.settings, stripeEmail: requestedEmail };
          saveRegistry(current);
        }

        req.body = {
          ...req.body,
          // A disconnected registry starts a new Express account. This prevents
          // stale/demo acct_ IDs from ever being sent to Stripe again.
          accountId: canResumeOnboarding ? settings.stripeAccountId : undefined,
          email: requestedEmail,
        };
      } catch (error) {
        console.error('Unable to update Stripe account email:', error);
        return res.status(400).json({
          error: 'Stripe non ha accettato la nuova email. Riprova o modifica l’account dal Dashboard Stripe.',
        });
      }
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
