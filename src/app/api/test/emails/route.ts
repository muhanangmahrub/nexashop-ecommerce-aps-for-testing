import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, noContent, ok, parseQuery } from '@/lib/api';
import { requireTestMode } from '@/lib/test-mode';

export const dynamic = 'force-dynamic';

/** TEST MODE ONLY: inspect sent emails (e.g. to grab verification/reset tokens). */
export const GET = handler(async (req) => {
  requireTestMode();
  const q = parseQuery(req, z.object({ to: z.string().optional(), type: z.string().optional(), limit: z.coerce.number().max(50).default(10) }));
  const items = await prisma.emailLog.findMany({
    where: { ...(q.to ? { to: q.to.toLowerCase() } : {}), ...(q.type ? { meta: { path: ['type'], equals: q.type } } : {}) },
    orderBy: { createdAt: 'desc' },
    take: q.limit,
  });
  return ok(items);
});

export const DELETE = handler(async () => {
  requireTestMode();
  await prisma.emailLog.deleteMany();
  return noContent();
});
