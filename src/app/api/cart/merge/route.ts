import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getCartView } from '@/lib/cart';
import { mergeCartSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Merges a guest (localStorage) cart into the user's DB cart, capping quantities at available stock. */
export const POST = handler(async (req) => {
  const user = await requireUser();
  const { items } = await parseBody(req, mergeCartSchema);
  const cart = await prisma.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  const skipped: string[] = [];
  for (const i of items) {
    const product = await prisma.product.findUnique({ where: { id: i.productId }, include: { variants: true } });
    const variant = i.variantId ? product?.variants.find((v) => v.id === i.variantId) : null;
    if (!product || !product.isActive || (i.variantId && !variant) || (product.variants.length && !variant)) {
      skipped.push(i.productId);
      continue;
    }
    const stock = variant ? variant.stock : product.stock;
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: i.productId, variantId: i.variantId ?? null },
    });
    const qty = Math.min(stock, 99, (existing?.quantity ?? 0) + i.quantity);
    if (qty <= 0) {
      skipped.push(i.productId);
      continue;
    }
    if (existing) await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: qty } });
    else await prisma.cartItem.create({ data: { cartId: cart.id, productId: i.productId, variantId: i.variantId ?? null, quantity: qty } });
  }
  return ok({ cart: await getCartView(user.id), skipped });
});
