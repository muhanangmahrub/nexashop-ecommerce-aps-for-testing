import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { forgotPasswordSchema } from '@/lib/validation';
import { createVerificationToken } from '@/lib/auth';
import { emails } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  rateLimit(req, 'resend-verification', 5, 60_000);
  const { email } = await parseBody(req, forgotPasswordSchema);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user?.emailVerified) throw errors.conflict('Email is already verified', { email: 'Email is already verified' });
  if (user) {
    const token = await createVerificationToken(user.id, 'EMAIL_VERIFICATION');
    await emails.verification(user.email, user.name, token);
  }
  return ok({ sent: true }, 200);
});
