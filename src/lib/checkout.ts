import type { ShippingMethod } from '@prisma/client';
import { getCartView } from './cart';
import { computeTotals, validateCoupon } from './pricing';

export async function buildQuote(userId: string, shippingMethod: ShippingMethod, couponCode?: string | null) {
  const cart = await getCartView(userId);
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    const res = await validateCoupon(couponCode, userId, cart.subtotal);
    discount = res.discount;
    coupon = res.coupon;
  }
  return { cart, coupon, totals: computeTotals(cart.subtotal, shippingMethod, discount) };
}
