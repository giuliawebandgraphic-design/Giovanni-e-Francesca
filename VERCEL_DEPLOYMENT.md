# Deploy su Vercel con Turso

Il frontend continua a essere pubblicato da Vite. Tutte le chiamate a `/api/*`
vengono gestite dalla Vercel Function in `api/[...route].ts`; i dati sono salvati
in un database Turso remoto, compatibile con SQLite.

## Configurazione iniziale

1. Nel progetto Vercel, apri **Marketplace** e installa **Turso Cloud**.
2. Crea un database e collega l'integrazione a questo progetto. Vercel inserisce
   normalmente `giuliaspd_TURSO_DATABASE_URL` e `giuliaspd_TURSO_AUTH_TOKEN` tra le variabili d'ambiente.
3. In **Settings → Environment Variables**, per l'ambiente **Production**, aggiungi:

   ```text
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   APP_URL=https://il-tuo-dominio.it
   giuliaspd_TURSO_DATABASE_URL=libsql://...
   giuliaspd_TURSO_AUTH_TOKEN=...
   SMTP_HOST=<host indicato da SiteGround>
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=notifiche@il-tuo-dominio.it
   SMTP_PASSWORD=<password della casella>
   SMTP_FROM=Lista Nozze <notifiche@il-tuo-dominio.it>
   WEDDING_NOTIFICATION_EMAILS=sposo@example.com,sposa@example.com
   ```

4. Pubblica prima un Preview deployment, verifica `https://<preview>/api/health`,
   quindi distribuisci in produzione.
5. In Stripe Dashboard registra il webhook
   `https://il-tuo-dominio.it/api/stripe-webhook` per l'evento
   `checkout.session.completed`.

## Notifiche email agli sposi

Il progetto invia una notifica a ogni nuovo contributo registrato, inclusi i
pagamenti Stripe confermati dal webhook. Il destinatario non viene salvato nel
database né inviato al browser: configurarlo esclusivamente nelle variabili
d'ambiente elencate sopra.

Usa la casella SMTP di SiteGround. Da **Site Tools → Email → Accounts**, apri
il menu della casella mittente e scegli **Mail Configuration → Manual
Settings**: copia l'host indicato in `SMTP_HOST`. Per la configurazione standard
SiteGround usa la porta `465` con `SMTP_SECURE=true`; username e password sono
quelli della casella, non dell'account SiteGround. Imposta le variabili sia in
**Production** sia in **Preview** se vuoi testare gli invii. Lasciandone una
vuota le notifiche restano disabilitate, senza interrompere la registrazione
della donazione.

## Database nuovo e pulito

Alla prima richiesta, la Function crea la tabella `registry_state` e una lista
vuota. Non importa né `data/registry.sqlite` né `data/registry.json`; eventuali
dati di test locali non vengono quindi pubblicati.

## Sincronizzazione

Le modifiche della lista vengono scritte su Turso. Le schede aperte nello stesso
browser continuano a sincronizzarsi subito; le altre controllano la versione del
registro ogni 15 secondi. Questo evita di mantenere una connessione SSE aperta
in una Vercel Function.
