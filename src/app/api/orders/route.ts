import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ApiError, created, errors, handler, ok, pageMeta, paginate, parseBody, parseQuery } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { createOrderSchema, paginationSchema } from '@/lib/validation';
import { validateCart } from '@/lib/cart';
import { buildQuote } from '@/lib/checkout';
import { generateOrderNumber } from '@/lib/orders';
import { getStripe, stripeEnabled } from '@/lib/stripe';
import { emails } from '@/lib/email';
import { notify } from '@/lib/notifications';
import { config } from '@/lib/config';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const listSchema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
});

export const GET = handler(async (req) => {
  const user = await requireUser();
  const q = parseQuery(req, listSchema);
  const where: Prisma.OrderWhereInput = { userId: user.id, ...(q.status ? { status: q.status } : {}) };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...paginate(q.page, q.pageSize),
      include: { items: { select: { id: true, name: true, image: true, quantity: true } } },
    }),
  ]);
  return ok({ items: serialize(orders), meta: pageMeta(total, q.page, q.pageSize) });
});

const DECLINES: Record<string, string> = {
  '4000000000000002': 'Your card was declined',
  '4000000000009995': 'Your card has insufficient funds',
  '4000000000000069': 'Your card has expired',
  '4000000000000127': 'Your card security code is incorrect',
};

export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, createOrderSchema);

  const address = await prisma.address.findUnique({ where: { id: body.addressId } });
  if (!address || address.userId !== user.id)
    throw errors.badRequest('Validation failed', { addressId: 'Please select a valid shipping address' });

  const { valid, issues } = await validateCart(user.id);
  if (!valid) throw new ApiError(422, issues[0].message, { cart: issues.map((i) => i.message).join('; ') }, 'CART_INVALID');

  const { cart, coupon, totals } = await buildQuote(user.id, body.shippingMethod, body.couponCode);

  // ---- Payment ----
  let paymentStatus: 'PAID' | 'UNPAID' = 'UNPAID';
  let paymentMethod = 'Cash on Delivery';
  let paymentIntentId: string | null = null;
  if (body.payment.method === 'test_card') {
    if (stripeEnabled()) throw errors.badRequest('Test card payments are disabled when Stripe is enabled');
    const decline = DECLINES[body.payment.card.cardNumber];
    if (decline) throw new ApiError(402, decline, { cardNumber: decline }, 'PAYMENT_DECLINED');
    paymentStatus = 'PAID';
    paymentMethod = `Card ending ${body.payment.card.cardNumber.slice(-4)}`;
  } else if (body.payment.method === 'stripe') {
    if (!stripeEnabled()) throw errors.badRequest('Stripe payments are not enabled');
    const intent = await getStripe().paymentIntents.retrieve(body.payment.paymentIntentId);
    if (intent.status !== 'succeeded')
      throw new ApiError(402, 'Payment has not been completed', undefined, 'PAYMENT_INCOMPLETE');
    if (intent.amount !== Math.round(totals.total * 100) || intent.metadata.userId !== user.id)
      throw errors.unprocessable('Payment amount does not match order total');
    const reused = await prisma.order.findUnique({ where: { paymentIntentId: intent.id } });
    if (reused) throw errors.conflict('This payment has already been used for an order');
    paymentStatus = 'PAID';
    paymentIntentId = intent.id;
    paymentMethod = 'Stripe';
  } else if (!config.testMode && totals.total > 500) {
    throw errors.unprocessable('Cash on delivery is only available for orders up to $500', { payment: 'Not available for this order' });
  }

  const shippingAddress = {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };

  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock atomically, guarding against oversell.
    for (const item of cart.items) {
      if (item.variantId) {
        const r = await tx.productVariant.updateMany({
          where: { id: item.variantId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (r.count === 0) throw errors.unprocessable(`${item.name} no longer has enough stock`);
        await tx.product.update({ where: { id: item.productId }, data: { soldCount: { increment: item.quantity } } });
      } else {
        const r = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity }, soldCount: { increment: item.quantity } },
        });
        if (r.count === 0) throw errors.unprocessable(`${item.name} no longer has enough stock`);
      }
    }
    // Keep aggregate product stock in sync with variant stock.
    const variantProductIds = Array.from(new Set(cart.items.filter((i) => i.variantId).map((i) => i.productId)));
    for (const pid of variantProductIds) {
      const sum = await tx.productVariant.aggregate({ where: { productId: pid }, _sum: { stock: true } });
      await tx.product.update({ where: { id: pid }, data: { stock: sum._sum.stock ?? 0 } });
    }

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: user.id,
        status: 'PENDING',
        paymentStatus,
        paymentMethod,
        paymentIntentId,
        shippingMethod: body.shippingMethod,
        shippingAddress,
        subtotal: totals.subtotal,
        shippingCost: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        notes: body.notes,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            variantName: i.variantName,
            image: i.image,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
          })),
        },
        statusHistory: { create: { status: 'PENDING', note: 'Order placed' } },
      },
    });
    if (coupon) {
      await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      await tx.couponUsage.create({ data: { couponId: coupon.id, userId: user.id, orderId: created.id } });
    }
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  await notify(user.id, 'ORDER', 'Order placed', `Your order ${order.orderNumber} has been placed successfully.`, `/account/orders/${order.id}`);
  await emails.orderConfirmation(user.email, user.name, order.orderNumber, Number(order.total));
  return created(serialize(order));
});
