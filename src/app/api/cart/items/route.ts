import { handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { addToCart, getCartView } from '@/lib/cart';
import { addToCartSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, addToCartSchema);
  await addToCart(user.id, body.productId, body.variantId, body.quantity);
  return ok(await getCartView(user.id), 201);
});
