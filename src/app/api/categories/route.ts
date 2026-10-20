import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  const tree = categories
    .filter((c) => !c.parentId)
    .map((c) => ({ ...c, children: categories.filter((ch) => ch.parentId === c.id) }));
  return ok({ items: categories, tree }, 200, { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' });
});
