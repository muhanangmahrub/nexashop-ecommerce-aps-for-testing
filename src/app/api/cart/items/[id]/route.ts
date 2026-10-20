import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getCartView } from '@/lib/cart';
import { updateCartItemSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function ownItem(id: string, userId: string) {
  const item = await prisma.cartItem.findUnique({ where: { id }, include: { cart: true, product: true, variant: true } });
  if (!item || item.cart.userId !== userId) throw errors.notFound('Cart item not found');
  return item;
}

export const PATCH = handler(async (req, { params }) => {
  const user = await requireUser();
  const item = await ownItem(params.id, user.id);
  const { quantity } = await parseBody(req, updateCartItemSchema);
  const stock = item.variant ? item.variant.stock : item.product.stock;
  if (quantity > stock)
    throw errors.unprocessable(`Only ${stock} item(s) available in stock`, { quantity: `Only ${stock} item(s) available` });
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  return ok(await getCartView(user.id));
});

export const DELETE = handler(async (_req, { params }) => {
  const user = await requireUser();
  const item = await ownItem(params.id, user.id);
  await prisma.cartItem.delete({ where: { id: item.id } });
  return ok(await getCartView(user.id));
});
