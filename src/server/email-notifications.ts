import nodemailer, { type Transporter } from 'nodemailer';

type DonationForNotification = {
  id: string;
  guestName?: string;
  guestEmail?: string;
  giftTitle?: string;
  amount?: number;
  paymentMethod?: string;
  status?: string;
  message?: string;
  createdAt?: string;
};

type NotificationSettings = {
  coupleNames?: unknown;
  currency?: unknown;
};

export type DonationNotificationResult =
  | { status: 'sent'; messageId?: string }
  | { status: 'disabled' }
  | { status: 'failed'; error: string };

export type SmtpTransportOptions = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
};

export type MailTransport = Pick<Transporter, 'sendMail'>;
export type SmtpTransportFactory = (options: SmtpTransportOptions) => MailTransport;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultTransportFactory: SmtpTransportFactory = (options) => nodemailer.createTransport(options);
let transportFactory: SmtpTransportFactory = defaultTransportFactory;
let cachedTransport: MailTransport | undefined;
let cachedTransportKey: string | undefined;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function headerText(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function configuredRecipients(): string[] {
  return [...new Set((process.env.WEDDING_NOTIFICATION_EMAILS || '')
    .split(/[;,]/)
    .map((address) => address.trim())
    .filter((address) => emailPattern.test(address)))];
}

function smtpConfiguration(): { options: SmtpTransportOptions; from: string } | undefined {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  const port = Number.parseInt(process.env.SMTP_PORT || '465', 10);
  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) return undefined;

  const configuredSecure = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = configuredSecure === undefined || configuredSecure === ''
    ? port === 465
    : configuredSecure === 'true' || configuredSecure === '1' || configuredSecure === 'yes';
  return {
    options: { host, port, secure, auth: { user, pass } },
    from: process.env.SMTP_FROM?.trim() || user,
  };
}

function transportFor(options: SmtpTransportOptions): MailTransport {
  const key = JSON.stringify(options);
  if (cachedTransport && cachedTransportKey === key) return cachedTransport;
  cachedTransport = transportFactory(options);
  cachedTransportKey = key;
  return cachedTransport;
}

function paymentMethodLabel(paymentMethod: string | undefined): string {
  switch (paymentMethod) {
    case 'stripe': return 'Carta / Stripe';
    case 'apple_pay': return 'Apple Pay';
    case 'paypal': return 'PayPal';
    case 'bank_transfer': return 'Bonifico';
    default: return 'Non specificato';
  }
}

function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'pending_verification': return 'In attesa di verifica';
    case 'pledged': return 'Promesso';
    case 'completed': return 'Registrata';
    default: return 'Registrata';
  }
}

function formatAmount(amount: unknown, currency: unknown): string {
  const value = Number(amount);
  const formatted = Number.isFinite(value)
    ? new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    : '0,00';
  const symbol = typeof currency === 'string' && currency.trim() ? currency.trim() : '€';
  return `${symbol}${formatted}`;
}

function formatDate(value: string | undefined): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'Data non disponibile';
  return date.toLocaleString('it-IT', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Rome' });
}

/**
 * Sends an internal notification to the couple through their authenticated
 * SMTP account. Credentials live only in server-side environment variables.
 */
export async function sendDonationNotification(
  donation: DonationForNotification,
  settings: NotificationSettings,
  dashboardUrl: string,
): Promise<DonationNotificationResult> {
  const smtp = smtpConfiguration();
  const to = configuredRecipients();
  if (!smtp || to.length === 0) return { status: 'disabled' };

  const coupleNames = typeof settings.coupleNames === 'string' && settings.coupleNames.trim()
    ? settings.coupleNames.trim()
    : 'gli sposi';
  const guestName = donation.guestName?.trim() || 'Un invitato';
  const amount = formatAmount(donation.amount, settings.currency);
  const paymentMethod = paymentMethodLabel(donation.paymentMethod);
  const status = statusLabel(donation.status);
  const submittedAt = formatDate(donation.createdAt);
  const safeDashboardUrl = dashboardUrl.replace(/\/$/, '');
  const dedication = donation.message?.trim();

  const textLines = [
    `Ciao ${coupleNames},`,
    '',
    'È stata registrata una nuova quota nella vostra lista nozze.',
    '',
    `Invitato: ${guestName}`,
    `Email invitato: ${donation.guestEmail?.trim() || 'non disponibile'}`,
    `Regalo: ${donation.giftTitle?.trim() || 'Contributo libero'}`,
    `Importo: ${amount}`,
    `Metodo: ${paymentMethod}`,
    `Stato: ${status}`,
    `Data: ${submittedAt}`,
  ];
  if (dedication) textLines.push(`Messaggio: ${dedication}`);
  textLines.push('', `Apri la dashboard: ${safeDashboardUrl}`);

  const details = [
    ['Invitato', guestName],
    ['Email invitato', donation.guestEmail?.trim() || 'non disponibile'],
    ['Regalo', donation.giftTitle?.trim() || 'Contributo libero'],
    ['Importo', amount],
    ['Metodo', paymentMethod],
    ['Stato', status],
    ['Data', submittedAt],
  ].map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;color:#57534e;font-weight:600">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1c1917">${escapeHtml(value)}</td></tr>`).join('');
  const dedicationHtml = dedication
    ? `<p style="margin:20px 0 0;color:#44403c"><strong>Messaggio dell’invitato</strong><br>${escapeHtml(dedication).replace(/\n/g, '<br>')}</p>`
    : '';
  const html = `<main style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1c1917"><h1 style="font-size:22px;margin:0 0 12px">Nuova quota per ${escapeHtml(coupleNames)}</h1><p style="margin:0 0 18px;color:#44403c">È stata registrata una nuova quota nella vostra lista nozze.</p><table style="border-collapse:collapse">${details}</table>${dedicationHtml}<p style="margin:24px 0 0"><a href="${escapeHtml(safeDashboardUrl)}" style="display:inline-block;background:#636842;color:#fff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:600">Apri la dashboard</a></p></main>`;

  try {
    const info = await transportFor(smtp.options).sendMail({
      from: smtp.from,
      to,
      subject: headerText(`Nuova quota per ${coupleNames}: ${guestName}`),
      html,
      text: textLines.join('\n'),
    });
    return { status: 'sent', messageId: info.messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore SMTP durante l’invio email.';
    console.error('Unable to send donation notification:', message);
    return { status: 'failed', error: message };
  }
}

/** Test hook: production code always uses Nodemailer’s SMTP transport. */
export function setSmtpTransportFactoryForTesting(factory?: SmtpTransportFactory): void {
  transportFactory = factory || defaultTransportFactory;
  cachedTransport = undefined;
  cachedTransportKey = undefined;
}
