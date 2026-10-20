import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, isAdminRole, verifyAccessToken } from '@/lib/jwt';
import { publicUrl } from '@/lib/url';

const PROTECTED = ['/account', '/checkout', '/admin', '/wishlist'];
const GUEST_ONLY = ['/login', '/register', '/forgot-password'];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
  const hasRefresh = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);

  // ---- Maintenance mode (admins bypass) ----
  if (process.env.MAINTENANCE_MODE === 'true' && !isAdminRole(session?.role)) {
    const allowed =
      pathname === '/maintenance' || pathname.startsWith('/api/health') || pathname.startsWith('/api/auth') || pathname === '/login';
    if (!allowed) {
      if (pathname.startsWith('/api/'))
        return NextResponse.json({ success: false, message: 'Service is under maintenance', code: 'MAINTENANCE' }, { status: 503 });
      return NextResponse.rewrite(new URL('/maintenance', req.url), { status: 503 });
    }
  }
  if (pathname.startsWith('/api/')) return withCors(req);

  const target = pathname + search;
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !session) {
    if (hasRefresh) return NextResponse.redirect(publicUrl(req, `/api/auth/refresh?redirect=${encodeURIComponent(target)}`));
    return NextResponse.redirect(publicUrl(req, `/login?redirect=${encodeURIComponent(target)}`));
  }
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && !isAdminRole(session?.role)) {
    return NextResponse.rewrite(new URL('/forbidden', req.url), { status: 403 });
  }
  if (GUEST_ONLY.includes(pathname) && session) {
    const redirect = req.nextUrl.searchParams.get('redirect');
    return NextResponse.redirect(publicUrl(req, redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'));
  }
  return NextResponse.next();
}

/** CORS: same-origin always allowed; extra origins via CORS_ALLOWED_ORIGINS (comma-separated, or *). */
function withCors(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin : null;
  const ok = origin && (origin === req.nextUrl.origin || origin === appOrigin || allowed.includes('*') || allowed.includes(origin));
  const headers = new Headers();
  if (ok) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Stripe-Signature');
    headers.set('Access-Control-Max-Age', '600');
    headers.set('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return new NextResponse(null, { status: ok ? 204 : 403, headers });
  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
};
