import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handler, ok, pageMeta, paginate, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { paginationSchema } from '@/lib/validation';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const schema = paginationSchema
  .extend({
    q: z.string().trim().max(100).optional(),
    status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((d) => !d.from || !d.to || d.from <= d.to, { path: ['to'], message: 'End date must be after start date' });

export const GET = handler(async (req) => {
  await requireAdmin();
  const q = parseQuery(req, schema);
  const where: Prisma.OrderWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.q)
    where.OR = [
      { orderNumber: { contains: q.q, mode: 'insensitive' } },
      { user: { email: { contains: q.q, mode: 'insensitive' } } },
      { user: { name: { contains: q.q, mode: 'insensitive' } } },
    ];
  if (q.from || q.to)
    where.createdAt = { ...(q.from && { gte: q.from }), ...(q.to && { lte: new Date(q.to.getTime() + 86400_000 - 1) }) };
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...paginate(q.page, q.pageSize),
      include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
    }),
  ]);
  return ok({ items: serialize(items), meta: pageMeta(total, q.page, q.pageSize) });
});
