import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const POST = handler(async (_req, { params }) => {
  const user = await requireUser();
  const address = await prisma.address.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== user.id) throw errors.notFound('Address not found');
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id: address.id }, data: { isDefault: true } }),
  ]);
  return ok({ id: address.id, isDefault: true });
});
