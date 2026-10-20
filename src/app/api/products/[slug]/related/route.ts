import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { productCardInclude, toProductCard } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { params }) => {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { id: true, categoryId: true } });
  if (!product) throw errors.notFound('Product not found');
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
    orderBy: [{ soldCount: 'desc' }, { id: 'asc' }],
    take: 4,
    include: productCardInclude,
  });
  return ok(related.map(toProductCard));
});
