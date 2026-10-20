import { prisma } from '@/lib/prisma';
import { handler, ok, parseBody } from '@/lib/api';
import { forgotPasswordSchema } from '@/lib/validation';
import { createVerificationToken } from '@/lib/auth';
import { emails } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** Always responds 200 to avoid leaking which emails are registered. */
export const POST = handler(async (req) => {
  rateLimit(req, 'forgot-password', 5, 60_000);
  const { email } = await parseBody(req, forgotPasswordSchema);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.isBanned) {
    const token = await createVerificationToken(user.id, 'PASSWORD_RESET');
    await emails.passwordReset(user.email, user.name, token);
  }
  return ok({ message: 'If an account exists for that email, a password reset link has been sent.' });
});
