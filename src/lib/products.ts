import type { Prisma } from '@prisma/client';
import type { z } from 'zod';
import { prisma } from './prisma';
import { paginate, pageMeta } from './api';
import { stockStatus } from './utils';
import type { productQuerySchema } from './validation';

export const productCardInclude = {
  images: { orderBy: { position: 'asc' as const }, take: 2 },
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { variants: true } },
} satisfies Prisma.ProductInclude;

type CardSource = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export function toProductCard(p: CardSource) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: Number(p.price),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    image: p.images[0]?.url ?? null,
    hoverImage: p.images[1]?.url ?? null,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    stock: p.stock,
    stockStatus: stockStatus(p.stock, p.lowStockThreshold),
    category: p.category,
    hasVariants: p._count.variants > 0,
    isFeatured: p.isFeatured,
    soldCount: p.soldCount,
  };
}

export type ProductCard = ReturnType<typeof toProductCard>;

async function categoryIdsWithDescendants(slug: string) {
  const all = await prisma.category.findMany({ select: { id: true, slug: true, parentId: true } });
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];
  const ids = [root.id];
  for (let i = 0; i < ids.length; i++) all.filter((c) => c.parentId === ids[i]).forEach((c) => ids.push(c.id));
  return ids;
}

export async function listProducts(q: z.infer<typeof productQuerySchema>) {
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q.q) {
    const term = q.q.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { brand: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { category: { name: { contains: term, mode: 'insensitive' } } },
    ];
  }
  if (q.category) where.categoryId = { in: await categoryIdsWithDescendants(q.category) };
  if (q.brand) where.brand = { in: q.brand.split(','), mode: 'insensitive' };
  if (q.minPrice !== undefined || q.maxPrice !== undefined)
    where.price = { ...(q.minPrice !== undefined && { gte: q.minPrice }), ...(q.maxPrice !== undefined && { lte: q.maxPrice }) };
  if (q.rating) where.ratingAvg = { gte: q.rating };
  if (q.availability === 'in_stock') where.stock = { gt: 0 };
  if (q.availability === 'out_of_stock') where.stock = { lte: 0 };
  if (q.featured === 'true') where.isFeatured = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
    switch (q.sort) {
      case 'price_asc':
        return [{ price: 'asc' }];
      case 'price_desc':
        return [{ price: 'desc' }];
      case 'best_seller':
        return [{ soldCount: 'desc' }];
      case 'rating':
        return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
      default:
        return [{ createdAt: 'desc' }];
    }
  })();
  orderBy.push({ id: 'asc' });

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, include: productCardInclude, ...paginate(q.page, q.pageSize) }),
  ]);
  return { items: rows.map(toProductCard), meta: pageMeta(total, q.page, q.pageSize) };
}

/** Recomputes a product's cached rating average/count from its reviews. */
export async function refreshProductRating(productId: string) {
  const agg = await prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id: productId },
    data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
  });
}
