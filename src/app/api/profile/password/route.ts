import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { changePasswordSchema } from '@/lib/validation';
import { hashPassword, requireUser, verifyPassword } from '@/lib/auth';
import { notify } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req) => {
  const session = await requireUser();
  const body = await parseBody(req, changePasswordSchema);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
  if (!user.passwordHash || !(await verifyPassword(body.currentPassword, user.passwordHash)))
    throw errors.badRequest('Validation failed', { currentPassword: 'Current password is incorrect' });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(body.newPassword) } });
  await notify(user.id, 'ACCOUNT', 'Password changed', 'Your password was changed successfully.');
  return ok({ message: 'Password updated successfully' });
});
