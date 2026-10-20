import { handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { buildQuote } from '@/lib/checkout';
import { SHIPPING_OPTIONS, shippingCost } from '@/lib/pricing';
import { quoteSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, quoteSchema);
  const { cart, coupon, totals } = await buildQuote(user.id, body.shippingMethod, body.couponCode);
  const shippingOptions = (Object.keys(SHIPPING_OPTIONS) as (keyof typeof SHIPPING_OPTIONS)[]).map((k) => ({
    method: k,
    ...SHIPPING_OPTIONS[k],
    price: shippingCost(k, cart.subtotal),
  }));
  return ok({ totals, coupon: coupon ? { code: coupon.code, type: coupon.type } : null, shippingOptions, itemCount: cart.itemCount });
});
