import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const rows = await prisma.product.groupBy({ by: ['brand'], where: { isActive: true }, _count: true, orderBy: { brand: 'asc' } });
  return ok(rows.map((r) => ({ name: r.brand, count: r._count })));
});
