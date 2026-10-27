import Stripe from 'stripe';
import {
  dashboardSessionCookie,
  expiredDashboardSessionCookie,
  hasDashboardSession,
  isDashboardPasswordValid,
  isDashboardProtectionConfigured,
} from './dashboard-auth.ts';
import {
  RegistryStoreConfigurationError,
  loadRegistry,
  saveRegistry,
  type RegistryData,
} from './registry-store.ts';
import { createDirectPaymentIntent } from './stripe-direct-payments.ts';
import { sendDonationNotification } from './email-notifications.ts';

type CheckoutPayload = {
  amount: number;
  currency?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, string>;
};

const WEDDING_FUND_GIFT_ID = 'wedding-fund';
const WEDDING_FUND_TITLE = 'Contributo libero per gli sposi';
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function configuredAppUrl(request: Request): string {
  const configured = process.env.APP_URL?.replace(/\/$/, '');
  return configured || new URL(request.url).origin;
}

function stripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Stripe Connect non è configurato sul server. Imposta STRIPE_SECRET_KEY.');
  return new Stripe(secretKey, { apiVersion: '2026-09-30.preview' as Stripe.LatestApiVersion });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Errore non previsto.';
}

async function requestJson(request: Request): Promise<Record<string, any>> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, any>;
  } catch {
    throw new Error('Il corpo della richiesta deve essere JSON valido.');
  }
}

function stripeConnectionSettings(settings: Record<string, any>) {
  const connected = settings.stripeStatus === 'connected' && settings.stripeEnabled === true;
  return {
    stripeAccountId: settings.stripeAccountId || '',
    stripeAccountName: settings.stripeAccountName || '',
    stripeEmail: settings.stripeEmail || '',
    stripeStatus: connected ? 'connected' : (settings.stripeStatus || 'disconnected'),
    stripeEnabled: connected,
    applePayEnabled: connected,
    applePayThroughStripe: connected,
  };
}

function stripeMetadata(input?: Record<string, string>): Record<string, string> | undefined {
  if (!input) return undefined;
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key, value]) => key.length <= 40 && typeof value === 'string')
      .map(([key, value]) => [key, value.slice(0, 500)]),
  );
}

function toCents(amount: number): number {
  const cents = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(cents) || cents < 50) throw new Error('L’importo deve essere almeno 0,50.');
  return cents;
}

async function saveStripeDonation(session: Stripe.Checkout.Session, dashboardUrl: string): Promise<void> {
  if (session.payment_status !== 'paid') return;

  const current = await loadRegistry();
  const metadata = session.metadata || {};
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;
  const donations = Array.isArray(current.donations) ? current.donations as any[] : [];
  if (donations.some((donation) => donation.stripePaymentIntentId === paymentIntentId)) return;

  const amount = (session.amount_total || 0) / 100;
  const giftId = metadata.giftId || '';
  const gift = (current.gifts as any[]).find((item) => item.id === giftId);
  const isWeddingFund = giftId === WEDDING_FUND_GIFT_ID;
  if ((!gift && !isWeddingFund) || amount <= 0) return;

  const guestEmail = metadata.guestEmail || session.customer_details?.email || '';
  const guestName = metadata.guestName || session.customer_details?.name || 'Invitato';
  const requestedGuestId = metadata.guestId;
  let guest = (current.guests as any[]).find((item) => item.id === requestedGuestId)
    || (current.guests as any[]).find((item) => item.email?.toLowerCase() === guestEmail.toLowerCase());

  if (guest) {
    guest = {
      ...guest,
      totalDonated: Number(guest.totalDonated || 0) + amount,
      donationsCount: Number(guest.donationsCount || 0) + 1,
      rsvpStatus: guest.rsvpStatus === 'pending' ? 'attending' : guest.rsvpStatus,
    };
    current.guests = (current.guests as any[]).map((item) => item.id === guest.id ? guest : item);
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
    current.guests = [guest, ...(current.guests as any[])];
  }

  const donation = {
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
  };
  current.donations = [donation, ...donations];

  if (gift) {
    const giftDonations = (current.donations as any[]).filter((donation) => donation.giftId === gift.id && donation.status === 'completed');
    const raisedAmount = giftDonations.reduce((total, donation) => total + Number(donation.amount || 0), 0);
    current.gifts = (current.gifts as any[]).map((item) => item.id === gift.id ? {
      ...item,
      raisedAmount,
      contributionsCount: giftDonations.length,
      status: !item.isInfiniteQuota && item.targetAmount > 0 && raisedAmount >= item.targetAmount ? 'completed' : item.status,
    } : item);
  }

  await saveRegistry(current);
  await sendDonationNotification(donation, current.settings, dashboardUrl);
}

async function notifyNewDonations(
  current: RegistryData,
  submittedDonations: unknown,
  dashboardUrl: string,
): Promise<void> {
  if (!Array.isArray(submittedDonations)) return;
  const knownDonationIds = new Set(
    (current.donations as Array<{ id?: unknown }>).map((donation) => String(donation.id || '')),
  );
  const newDonations = submittedDonations.filter((donation): donation is Record<string, unknown> => {
    if (!donation || typeof donation !== 'object' || Array.isArray(donation)) return false;
    const id = typeof donation.id === 'string' ? donation.id : '';
    return Boolean(id) && !knownDonationIds.has(id);
  });

  await Promise.all(newDonations.map(async (donation) => {
    await sendDonationNotification({
      id: String(donation.id),
      guestName: typeof donation.guestName === 'string' ? donation.guestName : undefined,
      guestEmail: typeof donation.guestEmail === 'string' ? donation.guestEmail : undefined,
      giftTitle: typeof donation.giftTitle === 'string' ? donation.giftTitle : undefined,
      amount: typeof donation.amount === 'number' ? donation.amount : undefined,
      paymentMethod: typeof donation.paymentMethod === 'string' ? donation.paymentMethod : undefined,
      status: typeof donation.status === 'string' ? donation.status : undefined,
      message: typeof donation.message === 'string' ? donation.message : undefined,
      createdAt: typeof donation.createdAt === 'string' ? donation.createdAt : undefined,
    }, current.settings, dashboardUrl);
  }));
}

async function onboard(request: Request): Promise<Response> {
  const body = await requestJson(request);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const country = typeof body.country === 'string' ? body.country.toUpperCase() : 'IT';
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Inserisci un indirizzo email valido.' }, 400);

  const current = await loadRegistry();
  const settings = current.settings as Record<string, any>;
  const canResume = typeof settings.stripeAccountId === 'string'
    && settings.stripeAccountId.startsWith('acct_')
    && (settings.stripeStatus === 'pending' || settings.stripeStatus === 'connected');
  const stripe = stripeClient();

  let accountId: string;
  if (canResume) {
    accountId = settings.stripeAccountId;
    if (email !== settings.stripeEmail) {
      await stripe.v2.core.accounts.update(accountId, { contact_email: email });
      current.settings = { ...settings, stripeEmail: email };
      await saveRegistry(current);
    }
  } else {
    const account = await stripe.v2.core.accounts.create({
      contact_email: email,
      dashboard: 'express',
      identity: { country },
      defaults: { responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' } },
      configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
    });
    accountId = account.id;
    current.settings = {
      ...settings,
      stripeAccountId: accountId,
      stripeEmail: email,
      stripeAccountName: settings.coupleNames || 'Lista nozze',
      stripeEnabled: false,
      stripeStatus: 'pending',
      stripeConnectedAt: new Date().toISOString(),
      applePayEnabled: false,
      applePayThroughStripe: false,
    };
    await saveRegistry(current);
  }

  const appUrl = configuredAppUrl(request);
  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        refresh_url: `${appUrl}/api/stripe-connect/refresh`,
        return_url: `${appUrl}/api/stripe-connect/return`,
      },
    },
  });

  return json({ accountId, onboardingUrl: link.url, onboardingComplete: false });
}

async function createCheckout(request: Request): Promise<Response> {
  const body = await requestJson(request) as CheckoutPayload;
  const current = await loadRegistry();
  const settings = current.settings as Record<string, any>;
  const giftId = body.metadata?.giftId;
  const gift = (current.gifts as any[]).find((item) => item.id === giftId);
  const isWeddingFund = giftId === WEDDING_FUND_GIFT_ID;
  const amount = Number(body.amount);
  if ((!gift && !isWeddingFund) || !Number.isFinite(amount) || amount < 0.5) {
    return json({ error: 'Regalo o importo non valido. Riapri la lista e riprova.' }, 400);
  }

  const accountId = settings.stripeAccountId;
  if (typeof accountId !== 'string' || !accountId.startsWith('acct_')) {
    return json({ error: 'Account Stripe della coppia non disponibile.' }, 409);
  }

  const payload: CheckoutPayload = {
    amount,
    currency: 'eur',
    title: isWeddingFund ? WEDDING_FUND_TITLE : `Regalo nozze: ${gift.title}`,
    description: `Contributo per ${settings.coupleNames || 'gli sposi'}`,
    metadata: {
      giftId: isWeddingFund ? WEDDING_FUND_GIFT_ID : gift.id,
      guestId: body.metadata?.guestId || '',
      guestName: body.metadata?.guestName || '',
      guestEmail: body.metadata?.guestEmail || '',
      guestPhone: body.metadata?.guestPhone || '',
      guestGroup: body.metadata?.guestGroup || 'Altri',
      message: body.metadata?.message || '',
    },
  };

  const appUrl = configuredAppUrl(request);
  const amountInCents = toCents(payload.amount);
  const session = await stripeClient().checkout.sessions.create({
    mode: 'payment',
    success_url: `${appUrl}/?stripe_checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?stripe_checkout=cancelled`,
    line_items: [{
      price_data: {
        currency: payload.currency || 'eur',
        unit_amount: amountInCents,
        product_data: { name: payload.title || 'Contributo', description: payload.description },
      },
      quantity: 1,
    }],
    metadata: stripeMetadata(payload.metadata),
    payment_intent_data: { metadata: stripeMetadata(payload.metadata) },
  }, { stripeAccount: accountId });
  if (!session.url) throw new Error('Stripe non ha restituito l’URL di Checkout.');
  return json({ id: session.id, url: session.url });
}

async function finishOnboarding(request: Request): Promise<Response> {
  const current = await loadRegistry();
  const settings = current.settings as Record<string, any>;
  const accountId = settings.stripeAccountId;
  const appUrl = configuredAppUrl(request);
  if (typeof accountId !== 'string' || !accountId.startsWith('acct_')) {
    return Response.redirect(`${appUrl}/?stripe_connect=missing-account`, 302);
  }

  try {
    const account = await stripeClient().v2.core.accounts.retrieve(accountId) as any;
    const connected = (account.requirements?.currently_due ?? []).length === 0;
    current.settings = {
      ...settings,
      stripeEnabled: connected,
      stripeStatus: connected ? 'connected' : 'pending',
      applePayThroughStripe: connected,
      applePayEnabled: connected,
    };
    await saveRegistry(current);
    return Response.redirect(`${appUrl}/?stripe_connect=${connected ? 'complete' : 'pending'}`, 302);
  } catch (error) {
    console.error('Unable to refresh Stripe Connect account status:', error);
    return Response.redirect(`${appUrl}/?stripe_connect=error`, 302);
  }
}

async function createPaymentIntent(request: Request): Promise<Response> {
  const body = await requestJson(request);
  const amount = Number(body.amount) || 0;
  const amountInCents = Math.round(amount * 100);
  if (amountInCents <= 0) return json({ error: 'Importo non valido.' }, 400);

  const current = await loadRegistry();
  const settings = current.settings as Record<string, any>;
  const secretKey = process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey;
  if (!secretKey) return json({ error: 'Stripe non è configurato sul server.' }, 503);
  const connectedAccountId = settings.stripeAccountId;
  if (typeof connectedAccountId !== 'string' || !connectedAccountId.startsWith('acct_')) {
    return json({ error: 'Account Stripe Connect della coppia non disponibile.' }, 409);
  }

  const paymentIntent = await createDirectPaymentIntent(new Stripe(secretKey), {
    amount: amountInCents,
    currency: typeof body.currency === 'string' ? body.currency.toLowerCase() : 'eur',
    connectedAccountId,
    description: `Regalo nozze: ${body.giftTitle || 'Lista Nozze'} da ${body.guestName || 'Invitato'}`,
    metadata: {
      giftTitle: body.giftTitle || '',
      guestName: body.guestName || '',
      guestEmail: body.guestEmail || '',
      couple: settings.coupleNames || '',
    },
  });
  return json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
    currency: body.currency || 'eur',
    mode: 'live_stripe',
  });
}

export async function handleVercelApi(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  const { pathname } = new URL(request.url);
  try {
    if (request.method === 'GET' && pathname === '/api/health') {
      await loadRegistry();
      return json({ status: 'ok', storage: 'turso' });
    }

    if (request.method === 'GET' && pathname === '/api/dashboard/session') {
      return json({
        configured: isDashboardProtectionConfigured(),
        authenticated: hasDashboardSession(request.headers.get('cookie') || undefined),
      });
    }
    if (request.method === 'POST' && pathname === '/api/dashboard/login') {
      if (!isDashboardProtectionConfigured()) return json({ error: 'Protezione dashboard non configurata.' }, 503);
      const body = await requestJson(request);
      if (!isDashboardPasswordValid(body.password)) return json({ error: 'Credenziali non valide.' }, 401);
      return new Response(JSON.stringify({ authenticated: true }), {
        status: 200,
        headers: { ...JSON_HEADERS, 'Set-Cookie': dashboardSessionCookie() },
      });
    }
    if (request.method === 'POST' && pathname === '/api/dashboard/logout') {
      return new Response(null, { status: 204, headers: { 'Set-Cookie': expiredDashboardSessionCookie() } });
    }

    if (request.method === 'GET' && pathname === '/api/registry') return json(await loadRegistry());
    if (request.method === 'GET' && pathname === '/api/registry/version') {
      const data = await loadRegistry();
      return json({ version: data.version || 1, lastModified: data.lastModified || Date.now(), giftCount: data.gifts.length });
    }
    if (request.method === 'POST' && pathname === '/api/registry/sync') {
      const body = await requestJson(request);
      const current = await loadRegistry();
      const updated: RegistryData = {
        ...current,
        gifts: body.gifts !== undefined ? body.gifts : current.gifts,
        guests: body.guests !== undefined ? body.guests : current.guests,
        donations: body.donations !== undefined ? body.donations : current.donations,
        settings: body.settings !== undefined ? body.settings : current.settings,
      };
      const saved = await saveRegistry(updated);
      // Mail delivery is awaited: Vercel pauses work that remains after a
      // Function has returned its response.
      await notifyNewDonations(current, body.donations, configuredAppUrl(request));
      return json({ success: true, version: saved.version, lastModified: saved.lastModified });
    }

    if (request.method === 'GET' && pathname === '/api/stripe-connect/registry-status') {
      const data = await loadRegistry();
      return json(stripeConnectionSettings(data.settings as Record<string, any>));
    }
    if (request.method === 'POST' && pathname === '/api/stripe-connect/onboard') return await onboard(request);
    if (request.method === 'POST' && pathname === '/api/stripe-connect/checkout') return await createCheckout(request);
    if (request.method === 'GET' && pathname === '/api/stripe-connect/return') return await finishOnboarding(request);
    if (request.method === 'GET' && pathname === '/api/stripe-connect/refresh') return await finishOnboarding(request);
    if (request.method === 'GET' && pathname === '/api/stripe-connect/dashboard') {
      const accountId = (await loadRegistry()).settings.stripeAccountId;
      if (typeof accountId !== 'string' || !accountId.startsWith('acct_')) {
        return json({ error: 'Non è collegato alcun account Stripe per questa lista.' }, 409);
      }
      const loginLink = await stripeClient().accounts.createLoginLink(accountId);
      return Response.redirect(loginLink.url, 302);
    }

    if (request.method === 'POST' && pathname === '/api/stripe-webhook') {
      const signature = request.headers.get('stripe-signature');
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!signature || !secret) return json({ error: 'Webhook Stripe non configurato.' }, 503);
      const event = stripeClient().webhooks.constructEvent(await request.text(), signature, secret);
      if (event.type === 'checkout.session.completed') {
        await saveStripeDonation(event.data.object as Stripe.Checkout.Session, configuredAppUrl(request));
      }
      return json({ received: true });
    }

    if (request.method === 'GET' && pathname === '/api/stripe/status') {
      const settings = (await loadRegistry()).settings as Record<string, any>;
      const isConnected = Boolean(settings.stripeEnabled && (settings.stripePublishableKey || settings.stripeAccountId));
      return json({
        connected: isConnected,
        stripeEnabled: settings.stripeEnabled ?? false,
        stripeAccountId: settings.stripeAccountId || null,
        stripeAccountName: settings.stripeAccountName || null,
        stripePublishableKey: settings.stripePublishableKey || null,
        stripeMode: settings.stripeMode || 'test',
        applePayEnabled: settings.applePayEnabled !== false && settings.stripeEnabled !== false,
        hasServerSecretKey: Boolean(process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey),
      });
    }
    if (request.method === 'POST' && pathname === '/api/stripe/disconnect') {
      const current = await loadRegistry();
      const settings = current.settings as Record<string, any>;
      const updatedSettings = {
        ...settings,
        stripeEnabled: false,
        stripeStatus: 'disconnected',
        stripePublishableKey: '',
        stripeSecretKey: '',
        stripeAccountId: '',
        stripeAccountName: '',
        stripeEmail: '',
        applePayThroughStripe: false,
      };
      const saved = await saveRegistry({ ...current, settings: updatedSettings });
      return json({ success: true, settings: saved.settings });
    }
    if (request.method === 'POST' && pathname === '/api/stripe/create-payment-intent') return await createPaymentIntent(request);

    return json({ error: 'Endpoint API non trovato.' }, 404);
  } catch (error) {
    if (error instanceof RegistryStoreConfigurationError) return json({ error: error.message }, 503);
    console.error('Vercel API error:', error);
    return json({ error: errorMessage(error) }, 400);
  }
}
