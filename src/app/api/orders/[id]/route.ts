import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { orderDetailInclude } from '@/lib/orders';
import { serialize } from '@/lib/serialize';
import { isAdminRole } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

/** Accepts either the order id or order number. */
export const GET = handler(async (_req, { params }) => {
  const user = await requireUser();
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: params.id }, { orderNumber: params.id }] },
    include: orderDetailInclude,
  });
  if (!order || (order.userId !== user.id && !isAdminRole(user.role))) throw errors.notFound('Order not found');
  return ok(serialize(order));
});
