import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { addToCart, getCartView } from '@/lib/cart';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req, { params }) => {
  const user = await requireUser();
  const { variantId } = await parseBody(req, z.object({ variantId: z.string().optional().nullable() }));
  const item = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: params.productId } } });
  if (!item) throw errors.notFound('Product is not in your wishlist');
  await addToCart(user.id, params.productId, variantId, 1);
  await prisma.wishlistItem.delete({ where: { id: item.id } });
  const count = await prisma.wishlistItem.count({ where: { userId: user.id } });
  return ok({ cart: await getCartView(user.id), wishlistCount: count });
});
