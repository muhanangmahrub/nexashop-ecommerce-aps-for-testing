import { NextResponse, type NextRequest } from 'next/server';
import { handler } from '@/lib/api';
import { clearSessionCookies, rotateRefreshToken, sessionUserSelect } from '@/lib/auth';
import { REFRESH_COOKIE } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { publicUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

/** POST: rotate tokens (used by the client fetch wrapper). */
export const POST = handler(async (req) => {
  const res = NextResponse.json({ success: true, data: null });
  const user = await rotateRefreshToken(res, req.cookies.get(REFRESH_COOKIE)?.value, req.headers.get('user-agent'));
  if (!user) {
    const fail = NextResponse.json(
      { success: false, message: 'Session expired, please log in again', code: 'SESSION_EXPIRED' },
      { status: 401 },
    );
    clearSessionCookies(fail);
    return fail;
  }
  const sessionUser = await prisma.user.findUnique({ where: { id: user.id }, select: sessionUserSelect });
  const out = NextResponse.json({ success: true, data: { user: sessionUser } });
  res.cookies.getAll().forEach((c) => out.cookies.set(c));
  return out;
});

/** GET: rotate tokens then redirect (used by middleware for page navigations). */
export async function GET(req: NextRequest) {
  const redirectTo = req.nextUrl.searchParams.get('redirect') || '/';
  const safe = redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/';
  const res = NextResponse.redirect(publicUrl(req, safe));
  const user = await rotateRefreshToken(res, req.cookies.get(REFRESH_COOKIE)?.value, req.headers.get('user-agent'));
  if (!user) {
    const login = NextResponse.redirect(publicUrl(req, `/login?redirect=${encodeURIComponent(safe)}&reason=session_expired`));
    clearSessionCookies(login);
    return login;
  }
  return res;
}
