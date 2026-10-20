import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { restockOrder } from '@/lib/orders';
import { notify } from '@/lib/notifications';
import { emails } from '@/lib/email';
import { getStripe, stripeEnabled } from '@/lib/stripe';
import { serialize } from '@/lib/serialize';
import { sanitizeText } from '@/lib/sanitize';

export const dynamic = 'force-dynamic';

const schema = z.object({
  reason: z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().min(3, 'Please provide a reason (at least 3 characters)').max(300, 'Reason must be at most 300 characters')),
});

export const POST = handler(async (req, { params }) => {
  const user = await requireUser();
  const { reason } = await parseBody(req, schema);
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== user.id) throw errors.notFound('Order not found');
  if (order.status !== 'PENDING')
    throw errors.unprocessable(`Only pending orders can be cancelled. This order is ${order.status.toLowerCase()}.`);

  if (order.paymentIntentId && stripeEnabled()) {
    await getStripe().refunds.create({ payment_intent: order.paymentIntentId });
  }
  await restockOrder(order.id);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
      statusHistory: { create: { status: 'CANCELLED', note: `Cancelled by customer: ${reason}` } },
    },
  });
  await notify(user.id, 'ORDER', 'Order cancelled', `Your order ${order.orderNumber} has been cancelled.`, `/account/orders/${order.id}`);
  await emails.orderStatus(user.email, user.name, order.orderNumber, 'CANCELLED');
  return ok(serialize(updated));
});
