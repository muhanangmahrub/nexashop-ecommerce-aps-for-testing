import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handler } from '@/lib/api';
import { clearSessionCookies, revokeRefreshToken } from '@/lib/auth';
import { REFRESH_COOKIE } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export const POST = handler(async () => {
  await revokeRefreshToken(cookies().get(REFRESH_COOKIE)?.value);
  const res = NextResponse.json({ success: true, data: null, message: 'Logged out successfully' });
  clearSessionCookies(res);
  return res;
});
