import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const DELETE = handler(async (_req, { params }) => {
  const user = await requireUser();
  const { count: removed } = await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId: params.productId } });
  if (!removed) throw errors.notFound('Product is not in your wishlist');
  const count = await prisma.wishlistItem.count({ where: { userId: user.id } });
  return ok({ productId: params.productId, count });
});
