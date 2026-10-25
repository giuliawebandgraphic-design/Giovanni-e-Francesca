import assert from 'node:assert/strict';
import test from 'node:test';
import {
  sendDonationNotification,
  setSmtpTransportFactoryForTesting,
  type MailTransport,
  type SmtpTransportOptions,
} from '../src/server/email-notifications.ts';

const emailEnvironment = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM',
  'WEDDING_NOTIFICATION_EMAILS',
] as const;

function restoreEnvironment(values: Record<string, string | undefined>) {
  for (const variable of emailEnvironment) {
    if (values[variable] === undefined) delete process.env[variable];
    else process.env[variable] = values[variable];
  }
}

test('invia agli sposi una notifica SMTP SiteGround con dati della quota', async () => {
  const previousEnvironment = Object.fromEntries(emailEnvironment.map((variable) => [variable, process.env[variable]]));
  try {
    process.env.SMTP_HOST = 'mail.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'notifiche@example.com';
    process.env.SMTP_PASSWORD = 'password-test';
    process.env.SMTP_FROM = 'Lista Nozze <notifiche@example.com>';
    process.env.WEDDING_NOTIFICATION_EMAILS = 'sposo@example.com; sposa@example.com';

    let options: SmtpTransportOptions | undefined;
    let sentEmail: Record<string, unknown> | undefined;
    setSmtpTransportFactoryForTesting((smtpOptions) => {
      options = smtpOptions;
      return {
        sendMail: async (message) => {
          sentEmail = message as Record<string, unknown>;
          return { messageId: 'smtp_123' };
        },
      } as MailTransport;
    });

    const result = await sendDonationNotification({
      id: 'don_123',
      guestName: 'Ada <Rossi>',
      guestEmail: 'ada@example.com',
      giftTitle: 'Viaggio di nozze',
      amount: 75,
      paymentMethod: 'stripe',
      status: 'completed',
      message: 'Tanti auguri <3',
      createdAt: '2026-10-25T10:30:00.000Z',
    }, { coupleNames: 'Giovanni e Francesca', currency: '€' }, 'https://lista.example/');

    assert.deepEqual(result, { status: 'sent', messageId: 'smtp_123' });
    assert.deepEqual(options, {
      host: 'mail.example.com',
      port: 465,
      secure: true,
      auth: { user: 'notifiche@example.com', pass: 'password-test' },
    });
    assert.ok(sentEmail);
    assert.deepEqual(sentEmail.to, ['sposo@example.com', 'sposa@example.com']);
    assert.equal(sentEmail.from, 'Lista Nozze <notifiche@example.com>');
    assert.match(String(sentEmail.subject), /Ada <Rossi>/);
    assert.match(String(sentEmail.html), /Ada &lt;Rossi&gt;/);
    assert.match(String(sentEmail.text), /Carta \/ Stripe/);
  } finally {
    setSmtpTransportFactoryForTesting();
    restoreEnvironment(previousEnvironment);
  }
});

test('non prova a inviare quando la configurazione SMTP non è completa', async () => {
  const previousEnvironment = Object.fromEntries(emailEnvironment.map((variable) => [variable, process.env[variable]]));
  try {
    for (const variable of emailEnvironment) delete process.env[variable];

    const result = await sendDonationNotification({ id: 'don_disabled' }, {}, 'https://lista.example');
    assert.deepEqual(result, { status: 'disabled' });
  } finally {
    setSmtpTransportFactoryForTesting();
    restoreEnvironment(previousEnvironment);
  }
});
