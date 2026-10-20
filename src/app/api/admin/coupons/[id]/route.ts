import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errors, handler, noContent, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { couponInputSchema } from '@/lib/validation';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

const patchSchema = z.union([z.object({ isActive: z.boolean() }).strict(), couponInputSchema]);

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();
  const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!existing) throw errors.notFound('Coupon not found');
  const body = await parseBody(req, patchSchema);
  if ('code' in body && body.code !== existing.code && (await prisma.coupon.findUnique({ where: { code: body.code } })))
    throw errors.conflict('Coupon code already exists', { code: 'Coupon code already exists' });
  const coupon = await prisma.coupon.update({ where: { id: existing.id }, data: body });
  return ok(serialize(coupon));
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin();
  const existing = await prisma.coupon.findUnique({ where: { id: params.id }, include: { _count: { select: { usages: true } } } });
  if (!existing) throw errors.notFound('Coupon not found');
  if (existing._count.usages > 0) throw errors.conflict('Coupon has been used and cannot be deleted. Deactivate it instead.');
  await prisma.coupon.delete({ where: { id: existing.id } });
  return noContent();
});
