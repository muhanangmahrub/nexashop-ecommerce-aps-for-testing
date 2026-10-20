import { prisma } from '@/lib/prisma';
import { created, errors, handler, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { couponInputSchema } from '@/lib/validation';
import { serialize } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireAdmin();
  const items = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return ok(serialize(items));
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, couponInputSchema);
  if (await prisma.coupon.findUnique({ where: { code: body.code } }))
    throw errors.conflict('Coupon code already exists', { code: 'Coupon code already exists' });
  const coupon = await prisma.coupon.create({ data: { ...body, startsAt: body.startsAt ?? new Date() } });
  return created(serialize(coupon));
});
