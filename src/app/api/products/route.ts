import { handler, ok, parseQuery } from '@/lib/api';
import { productQuerySchema } from '@/lib/validation';
import { listProducts } from '@/lib/products';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const GET = handler(async (req) => {
  const query = parseQuery(req, productQuerySchema);
  const result = await listProducts(query);
  if (query.q && query.q.length >= 2 && query.page === 1) {
    const user = await getCurrentUser();
    if (user) {
      await prisma.searchHistory.deleteMany({ where: { userId: user.id, query: { equals: query.q, mode: 'insensitive' } } });
      await prisma.searchHistory.create({ data: { userId: user.id, query: query.q } });
    }
  }
  return ok(result, 200, { 'Cache-Control': 'private, max-age=0, must-revalidate' });
});
