import { createClient, type Client } from '@libsql/client';

export type RegistryData = {
  version?: number;
  lastModified?: number;
  settings: Record<string, unknown>;
  gifts: unknown[];
  guests: unknown[];
  donations: unknown[];
};

export class RegistryStoreConfigurationError extends Error {}

let client: Client | undefined;
let initialization: Promise<void> | undefined;

/**
 * New Turso databases deliberately start without sample payments, personal
 * contact details, or a Stripe account. Demo gifts remain an explicit UI action.
 */
export function createInitialRegistry(): RegistryData {
  return {
    version: 1,
    lastModified: Date.now(),
    settings: {
      coupleNames: '',
      eventTitle: 'La nostra lista nozze',
      eventLocation: '',
      welcomeMessage: '',
      currency: '€',
      paypalEmail: '',
      paypalMeUsername: '',
      bankIban: '',
      bankAccountHolder: '',
      bankName: '',
      bankBic: '',
      heroImage: '',
      applePayEnabled: false,
      applePayRecipient: '',
      stripeEnabled: false,
      stripeAccountId: '',
      stripeAccountName: '',
      stripeEmail: '',
      stripePublishableKey: '',
      stripeSecretKey: '',
      stripeMode: 'test',
      stripeStatus: 'disconnected',
      applePayThroughStripe: false,
    },
    gifts: [],
    guests: [],
    donations: [],
  };
}

export function normaliseRegistry(value: Partial<RegistryData>): RegistryData {
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

function getClient(): Client {
  if (client) return client;

  // REGISTRY_TURSO_* are deliberately project-owned variables. The Turso
  // Marketplace integration supplies giuliaspd_TURSO_* per deployment branch;
  // using the project-owned connection first keeps production data in the
  // configured primary database across deployments.
  const url = process.env.REGISTRY_TURSO_DATABASE_URL ?? process.env.giuliaspd_TURSO_DATABASE_URL;
  if (!url) {
    throw new RegistryStoreConfigurationError(
      'REGISTRY_TURSO_DATABASE_URL non è configurata. Configura il database Turso principale su Vercel.',
    );
  }

  client = createClient({
    url,
    authToken: process.env.REGISTRY_TURSO_AUTH_TOKEN ?? process.env.giuliaspd_TURSO_AUTH_TOKEN,
  });
  return client;
}

async function initialise(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      const db = getClient();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS registry_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL,
          version INTEGER NOT NULL,
          last_modified INTEGER NOT NULL
        )
      `);

      const existing = await db.execute('SELECT id FROM registry_state WHERE id = 1');
      if (existing.rows.length > 0) return;

      const initial = createInitialRegistry();
      await db.execute({
        sql: 'INSERT OR IGNORE INTO registry_state (id, data, version, last_modified) VALUES (1, ?, ?, ?)',
        args: [JSON.stringify(initial), initial.version ?? 1, initial.lastModified ?? Date.now()],
      });
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }

  await initialization;
}

export async function loadRegistry(): Promise<RegistryData> {
  await initialise();
  const db = getClient();
  const result = await db.execute(
    'SELECT data, version, last_modified AS lastModified FROM registry_state WHERE id = 1',
  );
  const row = result.rows[0];
  if (!row) throw new Error('Il database Turso non è stato inizializzato.');

  try {
    const data = normaliseRegistry(JSON.parse(String(row.data)) as RegistryData);
    data.version = Number(row.version);
    data.lastModified = Number(row.lastModified);
    return data;
  } catch (error) {
    console.error('Unable to read Turso registry state:', error);
    throw new Error('Il database Turso contiene dati non validi.');
  }
}

export async function saveRegistry(data: RegistryData): Promise<RegistryData> {
  await initialise();
  const db = getClient();
  const current = await db.execute('SELECT version FROM registry_state WHERE id = 1');
  const saved = normaliseRegistry(JSON.parse(JSON.stringify(data)) as RegistryData);
  saved.version = Number(current.rows[0]?.version ?? 0) + 1;
  saved.lastModified = Date.now();

  await db.execute({
    sql: 'UPDATE registry_state SET data = ?, version = ?, last_modified = ? WHERE id = 1',
    args: [JSON.stringify(saved), saved.version, saved.lastModified],
  });
  return saved;
}
