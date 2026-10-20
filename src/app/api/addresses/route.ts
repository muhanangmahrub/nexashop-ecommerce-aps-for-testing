import { prisma } from '@/lib/prisma';
import { created, errors, handler, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser();
  const items = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  });
  return ok(items);
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const body = await parseBody(req, addressSchema);
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) throw errors.unprocessable('You can save up to 10 addresses');
  const isDefault = body.isDefault || count === 0;
  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return tx.address.create({ data: { ...body, isDefault, userId: user.id } });
  });
  return created(address);
});
