import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, parseQuery } from '@/lib/api';

export const dynamic = 'force-dynamic';

const schema = z.object({ q: z.string().trim().min(1, 'Query is required').max(100) });

export const GET = handler(async (req) => {
  const { q } = parseQuery(req, schema);
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true, price: true, images: { take: 1, orderBy: { position: 'asc' }, select: { url: true } } },
      orderBy: { soldCount: 'desc' },
      take: 6,
    }),
    prisma.category.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
    prisma.product.groupBy({
      by: ['brand'],
      where: { isActive: true, brand: { contains: q, mode: 'insensitive' } },
      take: 3,
      orderBy: { brand: 'asc' },
    }),
  ]);
  return ok({
    products: products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, price: Number(p.price), image: p.images[0]?.url ?? null })),
    categories,
    brands: brands.map((b) => b.brand),
  });
});
