import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody } from '@/lib/api';
import { verifyEmailSchema } from '@/lib/validation';
import { consumeVerificationToken } from '@/lib/auth';
import { notify } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const { token } = await parseBody(req, verifyEmailSchema);
  const userId = await consumeVerificationToken(token, 'EMAIL_VERIFICATION');
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
  await notify(userId, 'ACCOUNT', 'Email verified', 'Your email address has been verified.');
  return ok({ verified: true });
});
