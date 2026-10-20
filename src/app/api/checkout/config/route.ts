import { ok } from '@/lib/api';
import { config } from '@/lib/config';
import { stripeEnabled } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export function GET() {
  return ok({
    paymentProvider: stripeEnabled() ? 'stripe' : 'test_card',
    stripePublishableKey: stripeEnabled() ? (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '') : '',
    testMode: config.testMode,
    taxRate: config.taxRate,
    freeShippingThreshold: config.freeShippingThreshold,
    testCards: stripeEnabled()
      ? []
      : [
          { number: '4242 4242 4242 4242', result: 'Success' },
          { number: '4000 0000 0000 0002', result: 'Declined' },
          { number: '4000 0000 0000 9995', result: 'Insufficient funds' },
        ],
  });
}
