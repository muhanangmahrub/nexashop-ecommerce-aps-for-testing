import { prisma } from './prisma';
import { errors } from './api';
import { round2, stockStatus } from './utils';

const cartInclude = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      product: { include: { images: { orderBy: { position: 'asc' as const }, take: 1 } } },
      variant: true,
    },
  },
};

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({ where: { userId }, create: { userId }, update: {}, include: cartInclude });
}

export type CartView = Awaited<ReturnType<typeof getCartView>>;

/** Returns a normalized cart view with computed unit prices, availability and subtotal. */
export async function getCartView(userId: string) {
  const cart = await getOrCreateCart(userId);
  const items = cart.items.map((item) => {
    const unitPrice = round2(Number(item.product.price) + Number(item.variant?.priceDelta ?? 0));
    const available = item.variant ? item.variant.stock : item.product.stock;
    const variantName = item.variant ? [item.variant.size, item.variant.color].filter(Boolean).join(' / ') : null;
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      name: item.product.name,
      slug: item.product.slug,
      image: item.product.images[0]?.url ?? null,
      variantName,
      unitPrice,
      lineTotal: round2(unitPrice * item.quantity),
      availableStock: available,
      stockStatus: stockStatus(available, item.product.lowStockThreshold),
      isActive: item.product.isActive,
    };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { id: cart.id, items, subtotal, itemCount };
}

/** Resolves the product/variant pair and returns the purchasable stock. */
export async function resolvePurchasable(productId: string, variantId?: string | null) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
  if (!product || !product.isActive) throw errors.notFound('Product not found');
  if (product.variants.length > 0 && !variantId)
    throw errors.badRequest('Please select a variant', { variantId: 'Please select a size/color option' });
  const variant = variantId ? product.variants.find((v) => v.id === variantId) : null;
  if (variantId && !variant) throw errors.notFound('Variant not found');
  const stock = variant ? variant.stock : product.stock;
  return { product, variant, stock };
}

export async function addToCart(userId: string, productId: string, variantId: string | null | undefined, quantity: number) {
  const { stock } = await resolvePurchasable(productId, variantId);
  if (stock <= 0) throw errors.unprocessable('This product is out of stock', { quantity: 'Out of stock' });
  const cart = await prisma.cart.upsert({ where: { userId }, create: { userId }, update: {} });
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });
  const newQty = (existing?.quantity ?? 0) + quantity;
  if (newQty > stock)
    throw errors.unprocessable(`Only ${stock} item(s) available in stock`, {
      quantity: `Only ${stock} item(s) available${existing ? ` (you have ${existing.quantity} in cart)` : ''}`,
    });
  if (newQty > 99) throw errors.unprocessable('Maximum quantity per item is 99', { quantity: 'Maximum quantity per item is 99' });
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity } });
  }
}

/** Validates every cart line against current stock and active status. */
export async function validateCart(userId: string) {
  const cart = await getCartView(userId);
  const issues: { itemId: string; name: string; message: string }[] = [];
  if (cart.items.length === 0) issues.push({ itemId: '', name: '', message: 'Your cart is empty' });
  for (const i of cart.items) {
    if (!i.isActive) issues.push({ itemId: i.id, name: i.name, message: `${i.name} is no longer available` });
    else if (i.availableStock <= 0) issues.push({ itemId: i.id, name: i.name, message: `${i.name} is out of stock` });
    else if (i.quantity > i.availableStock)
      issues.push({ itemId: i.id, name: i.name, message: `Only ${i.availableStock} of ${i.name} available` });
  }
  return { cart, issues, valid: issues.length === 0 };
}
