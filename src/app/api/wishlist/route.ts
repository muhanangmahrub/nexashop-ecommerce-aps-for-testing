import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { productCardInclude, toProductCard } from '@/lib/products';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { product: { include: productCardInclude } },
  });
  return ok(items.map((i) => ({ id: i.id, addedAt: i.createdAt, product: toProductCard(i.product) })));
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { productId } = await parseBody(req, z.object({ productId: z.string().min(1, 'Product is required') }));
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw errors.notFound('Product not found');
  const exists = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (exists) throw errors.conflict('Product is already in your wishlist');
  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  const count = await prisma.wishlistItem.count({ where: { userId: user.id } });
  return ok({ productId, count }, 201);
});
