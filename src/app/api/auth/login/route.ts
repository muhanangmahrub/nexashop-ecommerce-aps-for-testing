import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, errors, handler, parseBody } from '@/lib/api';
import { loginSchema } from '@/lib/validation';
import { createSession, sessionUserSelect, verifyPassword } from '@/lib/auth';
import { config } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  rateLimit(req, 'login', 20, 60_000);
  const { email, password, rememberMe } = await parseBody(req, loginSchema);
  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for unknown email and wrong password, and account status is only
  // revealed after the password checks out, so responses don't leak which emails exist.
  const invalid = () => new ApiError(401, 'Invalid email or password', undefined, 'INVALID_CREDENTIALS');

  if (!user || !user.passwordHash) throw invalid();
  const locked = Boolean(user.lockedUntil && user.lockedUntil > new Date());

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    if (locked) throw invalid();
    const attempts = user.failedLoginAttempts + 1;
    const lock = attempts >= config.maxLoginAttempts;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + config.lockoutMinutes * 60_000) : null,
      },
    });
    if (lock)
      throw new ApiError(
        403,
        `Account locked due to too many failed login attempts. Try again in ${config.lockoutMinutes} minute(s).`,
        undefined,
        'ACCOUNT_LOCKED',
      );
    throw invalid();
  }

  if (locked) {
    const mins = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 60_000);
    throw new ApiError(
      403,
      `Account locked due to too many failed login attempts. Try again in ${mins} minute(s).`,
      undefined,
      'ACCOUNT_LOCKED',
    );
  }
  if (user.isBanned)
    throw new ApiError(403, `Your account has been suspended${user.bannedReason ? `: ${user.bannedReason}` : ''}`, undefined, 'ACCOUNT_BANNED');

  if (!user.emailVerified && !config.testMode)
    throw new ApiError(403, 'Please verify your email address before logging in', undefined, 'EMAIL_NOT_VERIFIED');

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  const sessionUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: sessionUserSelect });
  const res = NextResponse.json({ success: true, data: { user: sessionUser }, message: 'Logged in successfully' });
  await createSession(res, user, req.headers.get('user-agent'), rememberMe ?? true);
  return res;
});

export const GET = handler(async () => {
  throw errors.badRequest('Use POST to log in');
});
