import Stripe from 'stripe';

/** Italian/EU card pricing used until the platform is configured with its exact Stripe rate. */
export const STRIPE_PROCESSING_RATE_BPS = 150;
export const STRIPE_PROCESSING_FIXED_FEE_CENTS = 25;

export interface DestinationPaymentIntentInput {
  /** Total charged to the guest, expressed in the smallest currency unit. */
  amount: number;
  currency: string;
  /** The Express account that receives the destination transfer. */
  destinationAccountId: string;
  /** Net amount the platform retains in addition to Stripe processing costs. */
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
 * Returns the application fee in cents for a destination charge.
 *
 * The application fee repays the platform for Stripe's processing cost and
 * optionally includes a net platform markup. The connected account therefore
 * bears both amounts, while the guest is charged exactly `amountTotalCents`.
 */
export function calculateApplicationFeeAmount(
  amountTotalCents: number,
  platformMarkupCents = 0,
): number {
  const amount = positiveInteger(amountTotalCents, 'amount_total');
  const markup = nonNegativeInteger(platformMarkupCents, 'platform_markup');

  // Equivalent to ceil(amount * 0.015 + 25 + platformMarkup), but expressed
  // with basis points to avoid floating-point rounding errors on money.
  const processingFee = (amount * STRIPE_PROCESSING_RATE_BPS) / 10_000
    + STRIPE_PROCESSING_FIXED_FEE_CENTS;
  const applicationFeeAmount = Math.ceil(processingFee + markup);

  if (!Number.isSafeInteger(applicationFeeAmount) || applicationFeeAmount >= amount) {
    throw new Error('Commissione Stripe e markup devono essere inferiori all’importo totale.');
  }
  return applicationFeeAmount;
}

/** Reads an optional fixed platform markup from the server environment. */
export function platformMarkupCentsFromEnvironment(environment = process.env): number {
  const raw = environment.STRIPE_PLATFORM_MARKUP_CENTS;
  if (raw === undefined || raw === '') return 0;
  const markup = Number(raw);
  return nonNegativeInteger(markup, 'STRIPE_PLATFORM_MARKUP_CENTS');
}

/**
 * Creates a Stripe destination-charge PaymentIntent for an Express account.
 * All Stripe amount fields are validated integer cents before the SDK call.
 */
export async function createDestinationPaymentIntent(
  stripe: Stripe,
  input: DestinationPaymentIntentInput,
): Promise<Stripe.PaymentIntent> {
  const amount = positiveInteger(input.amount, 'amount');
  const currency = input.currency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(currency)) throw new Error('Valuta Stripe non valida.');
  if (!input.destinationAccountId.startsWith('acct_')) {
    throw new Error('Account Stripe Connect di destinazione non valido.');
  }

  const applicationFeeAmount = calculateApplicationFeeAmount(
    amount,
    input.platformMarkupCents ?? 0,
  );

  return stripe.paymentIntents.create({
    amount,
    currency,
    application_fee_amount: applicationFeeAmount,
    transfer_data: { destination: input.destinationAccountId },
    automatic_payment_methods: { enabled: true },
    ...(input.description ? { description: input.description } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  });
}
