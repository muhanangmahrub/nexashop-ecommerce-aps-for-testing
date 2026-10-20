import { NextResponse, type NextRequest } from 'next/server';
import { config } from '@/lib/config';
import { generateToken } from '@/lib/tokens';
import { publicUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!config.googleClientId || !config.googleClientSecret)
    return NextResponse.redirect(publicUrl(req, '/login?error=google_not_configured'));
  const state = generateToken(16);
  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: `${config.appUrl}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set('nx_oauth_state', state, { httpOnly: true, sameSite: 'lax', maxAge: 600, path: '/' });
  return res;
}
