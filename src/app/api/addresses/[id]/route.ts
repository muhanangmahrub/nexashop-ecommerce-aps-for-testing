import { prisma } from '@/lib/prisma';
import { errors, handler, noContent, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { addressSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

async function ownAddress(id: string, userId: string) {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== userId) throw errors.notFound('Address not found');
  return address;
}

export const GET = handler(async (_req, { params }) => {
  const user = await requireUser();
  return ok(await ownAddress(params.id, user.id));
});

export const PATCH = handler(async (req, { params }) => {
  const user = await requireUser();
  const existing = await ownAddress(params.id, user.id);
  const body = await parseBody(req, addressSchema);
  const address = await prisma.$transaction(async (tx) => {
    if (body.isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return tx.address.update({ where: { id: existing.id }, data: { ...body, isDefault: body.isDefault || existing.isDefault } });
  });
  return ok(address);
});

export const DELETE = handler(async (_req, { params }) => {
  const user = await requireUser();
  const existing = await ownAddress(params.id, user.id);
  await prisma.address.delete({ where: { id: existing.id } });
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return noContent();
});
