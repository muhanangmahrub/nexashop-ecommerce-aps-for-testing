import type { OrderStatus } from '@prisma/client';
import { prisma } from './prisma';

export const ORDER_FLOW: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/** Allowed status transitions for admins. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function generateOrderNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NX-${date}-${rand}`;
}

/** Restores stock for all items of an order (used on cancellation). */
export async function restockOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  await prisma.$transaction(
    items.flatMap((i) => [
      prisma.product.update({
        where: { id: i.productId },
        data: { stock: { increment: i.quantity }, soldCount: { decrement: i.quantity } },
      }),
      ...(i.variantId
        ? [prisma.productVariant.update({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } })]
        : []),
    ]),
  );
}

export const orderDetailInclude = {
  items: { include: { product: { select: { slug: true } } } },
  statusHistory: { orderBy: { createdAt: 'asc' as const } },
  user: { select: { id: true, name: true, email: true } },
};
