import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handler, ok, pageMeta, paginate, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { paginationSchema } from '@/lib/validation';
import { serialize } from '@/lib/serialize';
import { stockStatus } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const schema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  filter: z.enum(['all', 'low', 'out']).default('all'),
});

export const GET = handler(async (req) => {
  await requireAdmin();
  const q = parseQuery(req, schema);
  const where: Prisma.ProductWhereInput = {};
  if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { sku: { contains: q.q, mode: 'insensitive' } }];
  if (q.filter === 'out') where.stock = { lte: 0 };
  const all = q.filter === 'low' ? await prisma.product.findMany({ where, select: { id: true, stock: true, lowStockThreshold: true } }) : null;
  if (all) where.id = { in: all.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).map((p) => p.id) };

  const [total, items, alerts] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ stock: 'asc' }, { id: 'asc' }],
      ...paginate(q.page, q.pageSize),
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStockThreshold: true,
        isActive: true,
        variants: { select: { id: true, sku: true, size: true, color: true, stock: true } },
      },
    }),
    prisma.$queryRaw<{ low: bigint; out: bigint }[]>`
      SELECT COUNT(*) FILTER (WHERE stock > 0 AND stock <= "lowStockThreshold") AS low,
             COUNT(*) FILTER (WHERE stock <= 0) AS out FROM "Product"`,
  ]);
  return ok({
    items: serialize(items.map((p) => ({ ...p, stockStatus: stockStatus(p.stock, p.lowStockThreshold) }))),
    meta: pageMeta(total, q.page, q.pageSize),
    alerts: { lowStock: Number(alerts[0]?.low ?? 0), outOfStock: Number(alerts[0]?.out ?? 0) },
  });
});
