import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody } from '@/lib/api';
import { resetPasswordSchema } from '@/lib/validation';
import { consumeVerificationToken, hashPassword } from '@/lib/auth';
import { notify } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const { token, password } = await parseBody(req, resetPasswordSchema);
  const userId = await consumeVerificationToken(token, 'PASSWORD_RESET');
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(password), failedLoginAttempts: 0, lockedUntil: null },
    }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await notify(userId, 'ACCOUNT', 'Password changed', 'Your password was reset. If this was not you, contact support.');
  return ok({ message: 'Password has been reset. You can now log in.' });
});
