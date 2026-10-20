import { z } from 'zod';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { buildQuote } from '@/lib/checkout';
import { getStripe, stripeEnabled } from '@/lib/stripe';
import { couponCodeSchema, shippingMethodSchema } from '@/lib/validation';
import { validateCart } from '@/lib/cart';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const user = await requireUser();
  if (!stripeEnabled()) throw errors.badRequest('Stripe payments are not enabled');
  const body = await parseBody(
    req,
    z.object({ shippingMethod: shippingMethodSchema, couponCode: couponCodeSchema.optional().nullable() }),
  );
  const { valid, issues } = await validateCart(user.id);
  if (!valid) throw errors.unprocessable(issues[0].message);
  const { totals } = await buildQuote(user.id, body.shippingMethod, body.couponCode);
  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(totals.total * 100),
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: { userId: user.id, shippingMethod: body.shippingMethod, couponCode: body.couponCode ?? '' },
  });
  return ok({ clientSecret: intent.client_secret, paymentIntentId: intent.id, amount: totals.total });
});
