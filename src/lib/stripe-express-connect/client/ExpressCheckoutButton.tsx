import { useState } from 'react';
import type { CheckoutRequest } from './types.js';

export interface ExpressCheckoutButtonProps extends CheckoutRequest {
  /** API endpoint that creates a Stripe Checkout Session. */
  endpoint?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onError?: (error: Error) => void;
  loadingLabel?: string;
}

/** Opens Stripe Checkout for a direct charge on an Express connected account. */
export function ExpressCheckoutButton({ endpoint = '/api/stripe-connect/checkout', children = 'Paga in sicurezza', className, disabled, onError, loadingLabel = 'Reindirizzamento…', ...checkout }: ExpressCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const checkoutNow = async () => {
    // Open synchronously on the click so browsers do not block the new tab.
    const checkoutTab = window.open('', '_blank');
    if (!checkoutTab) {
      onError?.(new Error('Impossibile aprire la nuova scheda. Consenti i popup e riprova.'));
      return;
    }
    checkoutTab.opener = null;
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(checkout),
      });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Impossibile creare il pagamento.');
      if (checkoutTab.closed) throw new Error('La scheda del pagamento è stata chiusa. Riprova.');
      checkoutTab.location.assign(result.url);
    } catch (cause) {
      checkoutTab.close();
      onError?.(cause instanceof Error ? cause : new Error('Impossibile creare il pagamento.'));
    } finally {
      setLoading(false);
    }
  };

  return <button type="button" className={className} disabled={disabled || loading} onClick={checkoutNow}>{loading ? loadingLabel : children}</button>;
}
