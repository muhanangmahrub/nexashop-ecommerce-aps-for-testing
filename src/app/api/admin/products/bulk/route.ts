import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { bulkProductActionSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  await requireAdmin();
  const { ids, action } = await parseBody(req, bulkProductActionSchema);
  let affected = 0;
  if (action === 'delete') {
    const withOrders = await prisma.orderItem.findMany({ where: { productId: { in: ids } }, distinct: ['productId'], select: { productId: true } });
    const keep = new Set(withOrders.map((o) => o.productId));
    const deletable = ids.filter((id) => !keep.has(id));
    const del = await prisma.product.deleteMany({ where: { id: { in: deletable } } });
    const soft = await prisma.product.updateMany({ where: { id: { in: Array.from(keep) } }, data: { isActive: false } });
    affected = del.count + soft.count;
    return ok({ action, affected, deleted: del.count, deactivated: soft.count });
  }
  const data =
    action === 'activate' ? { isActive: true } : action === 'deactivate' ? { isActive: false } : { isFeatured: action === 'feature' };
  affected = (await prisma.product.updateMany({ where: { id: { in: ids } }, data })).count;
  return ok({ action, affected });
});
