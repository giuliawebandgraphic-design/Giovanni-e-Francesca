import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

type ApiHandler = (request: Request) => Promise<Response>;

let testDirectory = '';
let handleVercelApi: ApiHandler;

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
  ({ handleVercelApi } = await import('../src/server/vercel-api.ts'));
});

after(async () => {
  await rm(testDirectory, { recursive: true, force: true });
  delete process.env.REGISTRY_TURSO_DATABASE_URL;
  delete process.env.REGISTRY_TURSO_AUTH_TOKEN;
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

test('onboarding Stripe senza chiave risponde in JSON e non con una pagina 404', async () => {
  const response = await handleVercelApi(request('/api/stripe-connect/onboard', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
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
  assert.deepEqual(config.default.rewrites, [{
    source: '/api/(.*)',
    destination: '/api/[...route]',
  }]);
});
