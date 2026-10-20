import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const POST = handler(async () => {
  const user = await requireUser();
  const { count } = await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  return ok({ updated: count, unread: 0 });
});
