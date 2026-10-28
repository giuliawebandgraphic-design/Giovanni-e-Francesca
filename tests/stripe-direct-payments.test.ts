import assert from 'node:assert/strict';
import test from 'node:test';
import Stripe from 'stripe';
import { createDirectPaymentIntent } from '../src/server/stripe-direct-payments.ts';

test('crea un PaymentIntent come addebito diretto sull’account Express', async () => {
  const requests: Array<{ params: Record<string, unknown>; options?: Record<string, unknown> }> = [];
  const stripe = {
    paymentIntents: {
      create: async (params: Record<string, unknown>, options?: Record<string, unknown>) => {
        requests.push({ params, options });
        return { id: 'pi_test_direct' };
      },
    },
  } as unknown as Stripe;

  await createDirectPaymentIntent(stripe, {
    amount: 10_000,
    currency: 'EUR',
    connectedAccountId: 'acct_express123',
    platformMarkupCents: 75,
  });

  assert.deepEqual(requests, [{
    params: {
      amount: 10_000,
      currency: 'eur',
      application_fee_amount: 75,
      automatic_payment_methods: { enabled: true },
    },
    options: { stripeAccount: 'acct_express123' },
  }]);
});

test('non invia application_fee_amount se la piattaforma non trattiene markup', async () => {
  let params: Record<string, unknown> | undefined;
  const stripe = {
    paymentIntents: {
      create: async (value: Record<string, unknown>) => {
        params = value;
        return { id: 'pi_test_direct_no_markup' };
      },
    },
  } as unknown as Stripe;

  await createDirectPaymentIntent(stripe, {
    amount: 10_000,
    currency: 'eur',
    connectedAccountId: 'acct_express123',
  });

  assert.equal('application_fee_amount' in (params || {}), false);
  assert.equal('transfer_data' in (params || {}), false);
});
