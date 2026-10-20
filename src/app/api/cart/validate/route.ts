import { handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { validateCart } from '@/lib/cart';

export const dynamic = 'force-dynamic';

export const POST = handler(async () => {
  const user = await requireUser();
  const { valid, issues, cart } = await validateCart(user.id);
  return ok({ valid, issues, cart }, valid ? 200 : 422);
});
