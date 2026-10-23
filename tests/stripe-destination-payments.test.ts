import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateApplicationFeeAmount,
  createDestinationPaymentIntent,
  platformMarkupCentsFromEnvironment,
} from '../src/server/stripe-destination-payments.ts';
import Stripe from 'stripe';

test('calcola e arrotonda per eccesso commissione Stripe e markup in centesimi', () => {
  // ceil(999 * 1.5% + 25 + 0) = ceil(39.985) = 40
  assert.equal(calculateApplicationFeeAmount(999), 40);
  // ceil(10_000 * 1.5% + 25 + 75) = 250
  assert.equal(calculateApplicationFeeAmount(10_000, 75), 250);
});

test('rifiuta importi e markup non interi per evitare valori non validi per Stripe', () => {
  assert.throws(() => calculateApplicationFeeAmount(100.5), /numero intero/i);
  assert.throws(() => calculateApplicationFeeAmount(1_000, 0.5), /numero intero/i);
  assert.throws(() => calculateApplicationFeeAmount(25), /inferiori all’importo/i);
});

test('il markup di piattaforma è zero per impostazione predefinita', () => {
  assert.equal(platformMarkupCentsFromEnvironment({}), 0);
  assert.equal(platformMarkupCentsFromEnvironment({ STRIPE_PLATFORM_MARKUP_CENTS: '90' }), 90);
});

test('crea un PaymentIntent destination charge con soli importi interi', async () => {
  const requests: Record<string, unknown>[] = [];
  const stripe = {
    paymentIntents: {
      create: async (params: Record<string, unknown>) => {
        requests.push(params);
        return { id: 'pi_test_destination' };
      },
    },
  } as unknown as Stripe;

  await createDestinationPaymentIntent(stripe, {
    amount: 10_000,
    currency: 'EUR',
    destinationAccountId: 'acct_express123',
    platformMarkupCents: 75,
  });

  assert.deepEqual(requests, [{
    amount: 10_000,
    currency: 'eur',
    application_fee_amount: 250,
    transfer_data: { destination: 'acct_express123' },
    automatic_payment_methods: { enabled: true },
  }]);
});
