'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

export interface StripeHandle {
  confirm: () => Promise<{ paymentIntentId?: string; error?: string }>;
}

const Inner = forwardRef<StripeHandle>(function Inner(_props, ref) {
  const stripe = useStripe();
  const elements = useElements();
  useImperativeHandle(ref, () => ({
    confirm: async () => {
      if (!stripe || !elements) return { error: 'Payment form is still loading' };
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: 'if_required' });
      if (error) return { error: error.message ?? 'Payment failed' };
      if (paymentIntent?.status !== 'succeeded') return { error: 'Payment was not completed' };
      return { paymentIntentId: paymentIntent.id };
    },
  }));
  return <PaymentElement />;
});

export const StripePayment = forwardRef<StripeHandle, { publishableKey: string; clientSecret: string }>(function StripePayment({ publishableKey, clientSecret }, ref) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);
  return (
    <div data-testid="stripe-payment-element">
      <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
        <Inner ref={ref} />
      </Elements>
    </div>
  );
});
