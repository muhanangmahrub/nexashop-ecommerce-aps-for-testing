import type { NotificationType } from '@prisma/client';
import { prisma } from './prisma';

export function notify(userId: string, type: NotificationType, title: string, message: string, link?: string) {
  return prisma.notification.create({ data: { userId, type, title, message, link } });
}
