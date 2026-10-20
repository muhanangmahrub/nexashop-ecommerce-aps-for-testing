import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const POST = handler(async (_req, { params }) => {
  const user = await requireUser();
  const { count } = await prisma.notification.updateMany({ where: { id: params.id, userId: user.id }, data: { isRead: true } });
  if (!count) throw errors.notFound('Notification not found');
  const unread = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  return ok({ id: params.id, unread });
});
