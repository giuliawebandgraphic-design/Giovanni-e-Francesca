import Stripe from 'stripe';

export interface DirectPaymentIntentInput {
  /** Total charged to the guest, expressed in the smallest currency unit. */
  amount: number;
  currency: string;
  /** The Express account on which Stripe creates the charge. */
  connectedAccountId: string;
  /** Optional platform profit, in integer cents. It never includes Stripe fees. */
  platformMarkupCents?: number;
  description?: string;
  metadata?: Stripe.MetadataParam;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${field} deve essere un numero intero positivo di centesimi.`);
  }
  return value;
}

function nonNegativeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${field} deve essere un numero intero non negativo di centesimi.`);
  }
  return value;
}

/**
 * Creates a direct charge on the Express account.
 *
 * Stripe charges its processing fees directly to the connected account. An
 * optional `application_fee_amount` transfers only the platform's own markup
 * to the platform account; it is deliberately not used to reimburse Stripe
 * fees, because that would make the platform the fee payer.
 */
export async function createDirectPaymentIntent(
  stripe: Stripe,
  input: DirectPaymentIntentInput,
): Promise<Stripe.PaymentIntent> {
  const amount = positiveInteger(input.amount, 'amount');
  const currency = input.currency.trim().toLowerCase();
  const platformMarkupCents = nonNegativeInteger(input.platformMarkupCents ?? 0, 'platform_markup');

  if (!/^[a-z]{3}$/.test(currency)) throw new Error('Valuta Stripe non valida.');
  if (!input.connectedAccountId.startsWith('acct_')) {
    throw new Error('Account Stripe Connect non valido.');
  }
  if (platformMarkupCents >= amount) {
    throw new Error('Il markup della piattaforma deve essere inferiore all’importo totale.');
  }

  return stripe.paymentIntents.create({
    amount,
    currency,
    ...(platformMarkupCents ? { application_fee_amount: platformMarkupCents } : {}),
    automatic_payment_methods: { enabled: true },
    ...(input.description ? { description: input.description } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  }, {
    stripeAccount: input.connectedAccountId,
  });
}
