import { NextResponse } from 'next/server';
import { getCurrentUser, rotateRefreshToken, sessionUserSelect, type SessionUser } from '@/lib/auth';
import { handler } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { REFRESH_COOKIE } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

const EMPTY = { cart: 0, wishlist: 0, notifications: 0 };

/**
 * Returns the current session. Guests get 200 with `user: null` (no console 401 noise);
 * an expired access token is transparently renewed from a valid refresh token.
 */
export const GET = handler(async (req) => {
  const res = NextResponse.json({});
  let user: SessionUser | null = await getCurrentUser();
  if (!user && req.cookies.get(REFRESH_COOKIE)?.value) {
    const rotated = await rotateRefreshToken(res, req.cookies.get(REFRESH_COOKIE)?.value, req.headers.get('user-agent'));
    if (rotated) user = await prisma.user.findUnique({ where: { id: rotated.id }, select: sessionUserSelect });
  }
  let counts = EMPTY;
  if (user) {
    const [cart, wishlist, notifications] = await Promise.all([
      prisma.cartItem.aggregate({ where: { cart: { userId: user.id } }, _sum: { quantity: true } }),
      prisma.wishlistItem.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);
    counts = { cart: cart._sum.quantity ?? 0, wishlist, notifications };
  }
  const out = NextResponse.json({ success: true, data: { user, counts } });
  res.cookies.getAll().forEach((c) => out.cookies.set(c));
  return out;
});
