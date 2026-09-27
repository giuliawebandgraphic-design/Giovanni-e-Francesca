import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.resolve(__dirname, 'data', 'registry.json');

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
      eventDate: '2026-07-19',
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
