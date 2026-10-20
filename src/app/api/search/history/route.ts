import { prisma } from '@/lib/prisma';
import { handler, noContent, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await prisma.searchHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, query: true, createdAt: true },
  });
  return ok(items);
});

export const DELETE = handler(async () => {
  const user = await requireUser();
  await prisma.searchHistory.deleteMany({ where: { userId: user.id } });
  return noContent();
});
