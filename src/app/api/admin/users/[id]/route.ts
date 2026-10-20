import { prisma } from '@/lib/prisma';
import { errors, handler, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { adminUserUpdateSchema } from '@/lib/validation';
import { notify } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req, { params }) => {
  const admin = await requireAdmin();
  const body = await parseBody(req, adminUserUpdateSchema);
  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) throw errors.notFound('User not found');
  if (target.id === admin.id) throw errors.forbidden('You cannot modify your own account here');
  if (body.role !== undefined && admin.role !== 'SUPER_ADMIN') throw errors.forbidden('Only super admins can change roles');
  if (target.role === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') throw errors.forbidden('Only super admins can modify super admins');
  if (body.isBanned && target.role !== 'CUSTOMER' && admin.role !== 'SUPER_ADMIN')
    throw errors.forbidden('Only super admins can ban administrators');

  const user = await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(body.role !== undefined && { role: body.role }),
      ...(body.isBanned !== undefined && { isBanned: body.isBanned, bannedReason: body.isBanned ? body.bannedReason : null }),
      ...(body.unlock && { failedLoginAttempts: 0, lockedUntil: null }),
    },
    select: { id: true, name: true, email: true, role: true, isBanned: true, bannedReason: true, lockedUntil: true },
  });
  if (body.isBanned) await prisma.refreshToken.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: new Date() } });
  if (body.role !== undefined && body.role !== target.role)
    await notify(target.id, 'ACCOUNT', 'Role updated', `Your account role is now ${body.role.replace('_', ' ').toLowerCase()}.`);
  return ok(user);
});
