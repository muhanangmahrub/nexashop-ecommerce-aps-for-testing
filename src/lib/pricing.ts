import type { Coupon, ShippingMethod } from '@prisma/client';
import { prisma } from './prisma';
import { config } from './config';
import { ApiError, errors } from './api';
import { round2 } from './utils';

export const SHIPPING_OPTIONS: Record<ShippingMethod, { label: string; price: number; eta: string }> = {
  STANDARD: { label: 'Standard Shipping', price: 5.99, eta: '5-7 business days' },
  EXPRESS: { label: 'Express Shipping', price: 14.99, eta: '2-3 business days' },
  SAME_DAY: { label: 'Same-Day Delivery', price: 24.99, eta: 'Today, before 9 PM' },
};

export function shippingCost(method: ShippingMethod, subtotal: number) {
  if (subtotal === 0) return 0;
  if (method === 'STANDARD' && subtotal >= config.freeShippingThreshold) return 0;
  return SHIPPING_OPTIONS[method].price;
}

export function couponDiscount(coupon: Pick<Coupon, 'type' | 'value' | 'maxDiscount'>, subtotal: number) {
  const value = Number(coupon.value);
  let discount = coupon.type === 'PERCENTAGE' ? (subtotal * value) / 100 : value;
  if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  return round2(Math.min(discount, subtotal));
}

export function computeTotals(subtotal: number, method: ShippingMethod, discount = 0) {
  const shipping = shippingCost(method, subtotal);
  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * config.taxRate);
  return {
    subtotal: round2(subtotal),
    shipping,
    discount: round2(discount),
    tax,
    total: round2(taxable + tax + shipping),
  };
}

/** Validates a coupon for a user + subtotal; throws 404/422 with a field-level message on failure. */
export async function validateCoupon(code: string, userId: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  const fail = (msg: string) => errors.unprocessable(msg, { couponCode: msg });
  if (!coupon) throw new ApiError(404, 'Coupon code not found', { couponCode: 'Coupon code not found' });
  if (!coupon.isActive) throw fail('This coupon is no longer active');
  const now = new Date();
  if (coupon.startsAt > now) throw fail('This coupon is not yet valid');
  if (coupon.expiresAt && coupon.expiresAt < now) throw fail('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw fail('This coupon has reached its usage limit');
  const userUses = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
  if (userUses >= coupon.perUserLimit) throw fail('You have already used this coupon');
  if (subtotal < Number(coupon.minOrderAmount))
    throw fail(`Minimum order amount for this coupon is $${Number(coupon.minOrderAmount).toFixed(2)}`);
  return { coupon, discount: couponDiscount(coupon, subtotal) };
}
