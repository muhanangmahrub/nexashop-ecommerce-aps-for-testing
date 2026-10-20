import { prisma } from '@/lib/prisma';
import { created, errors, handler, parseBody } from '@/lib/api';
import { newsletterSchema } from '@/lib/validation';
import { emails } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  rateLimit(req, 'newsletter', 5, 60_000);
  const { email } = await parseBody(req, newsletterSchema);
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) throw errors.conflict('This email is already subscribed', { email: 'This email is already subscribed' });
  await prisma.newsletterSubscriber.create({ data: { email } });
  await emails.newsletter(email);
  return created({ email, message: 'Thanks for subscribing!' });
});
