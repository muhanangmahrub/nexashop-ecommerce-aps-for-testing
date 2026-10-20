import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { inventoryBulkSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  await requireAdmin();
  const { updates } = await parseBody(req, inventoryBulkSchema);
  const productIds = Array.from(new Set(updates.map((u) => u.productId)));
  const found = await prisma.product.count({ where: { id: { in: productIds } } });
  if (found !== productIds.length) throw errors.notFound('One or more products were not found');

  await prisma.$transaction(async (tx) => {
    for (const u of updates) {
      if (u.variantId) {
        const r = await tx.productVariant.updateMany({ where: { id: u.variantId, productId: u.productId }, data: { stock: u.stock } });
        if (!r.count) throw errors.notFound(`Variant ${u.variantId} not found`);
      } else {
        const hasVariants = await tx.productVariant.count({ where: { productId: u.productId } });
        if (hasVariants) throw errors.unprocessable('Update variant stock for products with variants');
        await tx.product.update({ where: { id: u.productId }, data: { stock: u.stock } });
      }
    }
    for (const pid of productIds) {
      const agg = await tx.productVariant.aggregate({ where: { productId: pid }, _sum: { stock: true }, _count: true });
      if (agg._count > 0) await tx.product.update({ where: { id: pid }, data: { stock: agg._sum.stock ?? 0 } });
    }
  });
  return ok({ updated: updates.length });
});
