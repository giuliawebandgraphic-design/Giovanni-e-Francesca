import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

type ApiHandler = (request: Request) => Promise<Response>;

let testDirectory = '';
let handleVercelApi: ApiHandler;
let dashboardCookie = '';

function request(pathname: string, init?: RequestInit): Request {
  return new Request(`https://registry.example${pathname}`, init);
}

async function json(response: Response): Promise<Record<string, unknown>> {
  assert.match(response.headers.get('content-type') || '', /^application\/json/);
  return response.json() as Promise<Record<string, unknown>>;
}

before(async () => {
  testDirectory = await mkdtemp(path.join(tmpdir(), 'wedding-registry-vercel-test-'));
  // The invalid fallback makes this test fail if the deployment-specific
  // Marketplace variable ever takes precedence over the primary database.
  process.env.REGISTRY_TURSO_DATABASE_URL = `file:${path.join(testDirectory, 'registry.sqlite')}`;
  process.env.REGISTRY_TURSO_AUTH_TOKEN = '';
  process.env.giuliaspd_TURSO_DATABASE_URL = 'http://127.0.0.1:1';
  process.env.giuliaspd_TURSO_AUTH_TOKEN = '';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  process.env.DASHBOARD_PASSWORD = 'password-di-test';
  ({ handleVercelApi } = await import('../src/server/vercel-api.ts'));
});

after(async () => {
  await rm(testDirectory, { recursive: true, force: true });
  delete process.env.REGISTRY_TURSO_DATABASE_URL;
  delete process.env.REGISTRY_TURSO_AUTH_TOKEN;
  delete process.env.DASHBOARD_PASSWORD;
});

test('la dashboard richiede una password verificata dal server', async () => {
  const initialSession = await handleVercelApi(request('/api/dashboard/session'));
  assert.equal(initialSession.status, 200);
  assert.deepEqual(await json(initialSession), { configured: true, authenticated: false });

  const denied = await handleVercelApi(request('/api/dashboard/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'errata' }),
  }));
  assert.equal(denied.status, 401);

  const accepted = await handleVercelApi(request('/api/dashboard/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: 'password-di-test' }),
  }));
  assert.equal(accepted.status, 200);
  const cookie = accepted.headers.get('set-cookie');
  assert.ok(cookie);
  assert.match(cookie, /HttpOnly/);
  dashboardCookie = cookie.split(';')[0];

  const authenticatedSession = await handleVercelApi(request('/api/dashboard/session', {
    headers: { cookie: cookie.split(';')[0] },
  }));
  assert.deepEqual(await json(authenticatedSession), { configured: true, authenticated: true });
});

test('la Function Vercel inizializza un registro vuoto e risponde al controllo salute', async () => {
  const health = await handleVercelApi(request('/api/health'));
  assert.equal(health.status, 200);
  assert.deepEqual(await json(health), { status: 'ok', storage: 'turso' });

  const registry = await handleVercelApi(request('/api/registry'));
  const data = await json(registry);
  assert.deepEqual(data.gifts, []);
  assert.deepEqual(data.guests, []);
  assert.deepEqual(data.donations, []);
  assert.equal((data.settings as Record<string, unknown>).stripeEmail, '');
});

test('il salvataggio POST persiste e restituisce JSON', async () => {
  const saved = await handleVercelApi(request('/api/registry/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      settings: {
        coupleNames: 'Test Vercel',
        eventTitle: 'Lista test',
        currency: '€',
        stripeEmail: '',
        stripeEnabled: false,
      },
    }),
  }));
  assert.equal(saved.status, 200);
  const savedBody = await json(saved);
  assert.equal(savedBody.success, true);
  assert.equal(typeof savedBody.version, 'number');

  const registry = await handleVercelApi(request('/api/registry'));
  const data = await json(registry);
  assert.equal((data.settings as Record<string, unknown>).coupleNames, 'Test Vercel');
});

test('gli accessi amministrativi Stripe richiedono la sessione anche senza password configurata', async () => {
  for (const [pathname, method] of [
    ['/api/stripe-connect/dashboard', 'GET'],
    ['/api/stripe-connect/onboard', 'POST'],
    ['/api/stripe/disconnect', 'POST'],
  ]) {
    assert.equal((await handleVercelApi(request(pathname, { method }))).status, 401);
  }
  delete process.env.DASHBOARD_PASSWORD;
  try {
    assert.deepEqual(await json(await handleVercelApi(request('/api/dashboard/session', {
      headers: { cookie: dashboardCookie },
    }))), { configured: false, authenticated: false });
    assert.equal((await handleVercelApi(request('/api/stripe-connect/dashboard', {
      headers: { cookie: dashboardCookie },
    }))).status, 401);
  } finally {
    process.env.DASHBOARD_PASSWORD = 'password-di-test';
  }
});

test('onboarding Stripe senza chiave risponde in JSON e non con una pagina 404', async () => {
  const response = await handleVercelApi(request('/api/stripe-connect/onboard', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: dashboardCookie },
    body: JSON.stringify({ email: 'test@example.com' }),
  }));
  assert.equal(response.status, 400);
  assert.match(String((await json(response)).error), /STRIPE_SECRET_KEY/);
});

test('un corpo JSON non valido riceve un errore JSON gestito', async () => {
  const response = await handleVercelApi(request('/api/registry/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  }));
  assert.equal(response.status, 400);
  assert.equal((await json(response)).error, 'Il corpo della richiesta deve essere JSON valido.');
});

test('vercel.json inoltra ogni metodo API alla Function catch-all', async () => {
  const config = await import('../vercel.json', { with: { type: 'json' } });
  assert.deepEqual(config.default.rewrites[0], {
    source: '/api/(.*)',
    destination: '/api/[...route]',
  });
  assert.ok(config.default.rewrites.some((rewrite) =>
    rewrite.source === '/registry' && rewrite.destination === '/index.html'
  ));
});
