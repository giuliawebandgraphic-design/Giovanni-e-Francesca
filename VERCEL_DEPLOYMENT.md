# Deploy su Vercel con Turso

Il frontend continua a essere pubblicato da Vite. Tutte le chiamate a `/api/*`
vengono gestite dalla Vercel Function in `api/[...route].ts`; i dati sono salvati
in un database Turso remoto, compatibile con SQLite.

## Configurazione iniziale

1. Nel progetto Vercel, apri **Marketplace** e installa **Turso Cloud**.
2. Crea un database e collega l'integrazione a questo progetto. Vercel inserisce
   normalmente `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` tra le variabili d'ambiente.
3. In **Settings → Environment Variables**, per l'ambiente **Production**, aggiungi:

   ```text
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   APP_URL=https://il-tuo-dominio.it
   TURSO_DATABASE_URL=libsql://...
   TURSO_AUTH_TOKEN=...
   ```

4. Pubblica prima un Preview deployment, verifica `https://<preview>/api/health`,
   quindi distribuisci in produzione.
5. In Stripe Dashboard registra il webhook
   `https://il-tuo-dominio.it/api/stripe-webhook` per l'evento
   `checkout.session.completed`.

## Database nuovo e pulito

Alla prima richiesta, la Function crea la tabella `registry_state` e una lista
vuota. Non importa né `data/registry.sqlite` né `data/registry.json`; eventuali
dati di test locali non vengono quindi pubblicati.

## Sincronizzazione

Le modifiche della lista vengono scritte su Turso. Le schede aperte nello stesso
browser continuano a sincronizzarsi subito; le altre controllano la versione del
registro ogni 15 secondi. Questo evita di mantenere una connessione SSE aperta
in una Vercel Function.
