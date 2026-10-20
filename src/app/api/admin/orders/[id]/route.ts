import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { orderStatusSchema } from '@/lib/validation';
import { ALLOWED_TRANSITIONS, orderDetailInclude, restockOrder } from '@/lib/orders';
import { notify } from '@/lib/notifications';
import { emails } from '@/lib/email';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { params }) => {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: orderDetailInclude });
  if (!order) throw errors.notFound('Order not found');
  return ok(serialize({ ...order, allowedTransitions: ALLOWED_TRANSITIONS[order.status] }));
});

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();
  const body = await parseBody(req, orderStatusSchema);
  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { user: true } });
  if (!order) throw errors.notFound('Order not found');
  if (!ALLOWED_TRANSITIONS[order.status].includes(body.status))
    throw errors.unprocessable(`Cannot change status from ${order.status} to ${body.status}`, {
      status: `Allowed: ${ALLOWED_TRANSITIONS[order.status].join(', ') || 'none'}`,
    });
  if (body.status === 'SHIPPED' && !body.trackingNumber && !order.trackingNumber)
    throw errors.badRequest('Validation failed', { trackingNumber: 'Tracking number is required when shipping' });
  if (body.status === 'CANCELLED') await restockOrder(order.id);

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: body.status,
      trackingNumber: body.trackingNumber ?? order.trackingNumber,
      ...(body.status === 'CANCELLED'
        ? { cancelledAt: new Date(), paymentStatus: order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus }
        : {}),
      ...(body.status === 'DELIVERED' && order.paymentStatus === 'UNPAID' ? { paymentStatus: 'PAID' } : {}),
      statusHistory: { create: { status: body.status, note: body.note ?? `Status updated to ${body.status}` } },
    },
    include: orderDetailInclude,
  });
  await notify(
    order.userId,
    'ORDER',
    `Order ${body.status.toLowerCase()}`,
    `Your order ${order.orderNumber} is now ${body.status.toLowerCase()}.`,
    `/account/orders/${order.id}`,
  );
  await emails.orderStatus(order.user.email, order.user.name, order.orderNumber, body.status, updated.trackingNumber);
  return ok(serialize({ ...updated, allowedTransitions: ALLOWED_TRANSITIONS[updated.status] }));
});
