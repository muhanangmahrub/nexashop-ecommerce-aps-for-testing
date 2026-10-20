import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireTestMode } from '@/lib/test-mode';
import { emailSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** TEST MODE ONLY: reset lockout state for a user so lockout tests are repeatable. */
export const POST = handler(async (req) => {
  requireTestMode();
  const { email } = await parseBody(req, z.object({ email: emailSchema }));
  const { count } = await prisma.user.updateMany({ where: { email }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  if (!count) throw errors.notFound('User not found');
  return ok({ email, unlocked: true });
});
