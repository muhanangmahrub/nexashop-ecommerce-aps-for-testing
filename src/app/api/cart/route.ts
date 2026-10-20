import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { getCartView } from '@/lib/cart';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser();
  return ok(await getCartView(user.id));
});

export const DELETE = handler(async () => {
  const user = await requireUser();
  await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
  return ok(await getCartView(user.id));
});
