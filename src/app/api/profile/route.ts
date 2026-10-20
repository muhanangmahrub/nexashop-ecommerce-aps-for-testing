import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { profileSchema } from '@/lib/validation';
import { requireUser, sessionUserSelect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => ok(await requireUser()));

export const PATCH = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, profileSchema);
  if (body.email !== user.email) {
    const taken = await prisma.user.findUnique({ where: { email: body.email } });
    if (taken) throw errors.conflict('Email already exists', { email: 'Email already exists' });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: body.name, email: body.email, phone: body.phone },
    select: sessionUserSelect,
  });
  return ok(updated);
});
