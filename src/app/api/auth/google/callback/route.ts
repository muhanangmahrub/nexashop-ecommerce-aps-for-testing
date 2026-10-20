import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';
import { createSession } from '@/lib/auth';
import { publicUrl } from '@/lib/url';

export const dynamic = 'force-dynamic';

type GoogleProfile = { sub: string; email: string; email_verified: boolean; name: string; picture?: string };

export async function GET(req: NextRequest) {
  const fail = (code: string) => NextResponse.redirect(publicUrl(req, `/login?error=${code}`));
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code || !state || state !== req.cookies.get('nx_oauth_state')?.value) return fail('oauth_state_mismatch');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: `${config.appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail('oauth_token_failed');
    const { access_token } = (await tokenRes.json()) as { access_token: string };
    const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!profileRes.ok) return fail('oauth_profile_failed');
    const profile = (await profileRes.json()) as GoogleProfile;
    if (!profile.email_verified) return fail('oauth_email_unverified');

    const email = profile.email.toLowerCase();
    let user = await prisma.user.findFirst({ where: { OR: [{ googleId: profile.sub }, { email }] } });
    if (user?.isBanned) return fail('account_banned');
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.sub, emailVerified: user.emailVerified ?? new Date(), lastLoginAt: new Date() },
      });
    } else {
      user = await prisma.user.create({
        data: { email, name: profile.name, googleId: profile.sub, avatar: profile.picture, emailVerified: new Date() },
      });
    }
    const res = NextResponse.redirect(publicUrl(req, '/?login=google'));
    res.cookies.set('nx_oauth_state', '', { maxAge: 0, path: '/' });
    await createSession(res, user, req.headers.get('user-agent'));
    return res;
  } catch (err) {
    console.error('[oauth] google callback failed', err);
    return fail('oauth_failed');
  }
}
