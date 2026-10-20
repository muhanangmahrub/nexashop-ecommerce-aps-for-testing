import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, pageMeta, paginate, parseQuery } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { paginationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const schema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  filter: z.enum(['all', 'unread']).default('all'),
  type: z.enum(['ORDER', 'PROMOTION', 'SYSTEM', 'ACCOUNT']).optional(),
});

export const GET = handler(async (req) => {
  const user = await requireUser();
  const q = parseQuery(req, schema);
  const where = { userId: user.id, ...(q.filter === 'unread' ? { isRead: false } : {}), ...(q.type ? { type: q.type } : {}) };
  const [total, unread, items] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(q.page, q.pageSize) }),
  ]);
  return ok({ items, unread, meta: pageMeta(total, q.page, q.pageSize) });
});
