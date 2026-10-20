import { prisma } from './prisma';
import { serialize } from './serialize';
import { stockStatus } from './utils';

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: { orderBy: [{ color: 'asc' }, { size: 'asc' }] },
      category: { include: { parent: { select: { name: true, slug: true } } } },
    },
  });
  if (!product) return null;
  return serialize({ ...product, stockStatus: stockStatus(product.stock, product.lowStockThreshold) });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
