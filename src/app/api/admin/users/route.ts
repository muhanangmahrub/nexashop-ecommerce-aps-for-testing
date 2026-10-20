import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handler, ok, pageMeta, paginate, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { paginationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  status: z.enum(['active', 'banned', 'locked', 'unverified']).optional(),
});

export const GET = handler(async (req) => {
  await requireAdmin();
  const q = parseQuery(req, schema);
  const where: Prisma.UserWhereInput = {};
  if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { email: { contains: q.q, mode: 'insensitive' } }];
  if (q.role) where.role = q.role;
  if (q.status === 'banned') where.isBanned = true;
  if (q.status === 'active') where.isBanned = false;
  if (q.status === 'locked') where.lockedUntil = { gt: new Date() };
  if (q.status === 'unverified') where.emailVerified = null;
  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...paginate(q.page, q.pageSize),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isBanned: true,
        bannedReason: true,
        emailVerified: true,
        lockedUntil: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
  ]);
  return ok({ items, meta: pageMeta(total, q.page, q.pageSize) });
});
