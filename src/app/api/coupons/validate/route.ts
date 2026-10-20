import { z } from 'zod';
import { handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getCartView } from '@/lib/cart';
import { validateCoupon } from '@/lib/pricing';
import { couponCodeSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { couponCode } = await parseBody(req, z.object({ couponCode: couponCodeSchema }));
  const cart = await getCartView(user.id);
  const { coupon, discount } = await validateCoupon(couponCode, user.id, cart.subtotal);
  return ok({
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
    message: `Coupon ${coupon.code} applied`,
  });
});
