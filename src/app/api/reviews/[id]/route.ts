import { prisma } from '@/lib/prisma';
import { errors, handler, noContent, ok, parseBody } from '@/lib/api';
import { reviewSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { refreshProductRating } from '@/lib/products';

export const dynamic = 'force-dynamic';

async function ownReview(id: string, userId: string, allowAdmin = false, role?: string) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw errors.notFound('Review not found');
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  if (review.userId !== userId && !(allowAdmin && isAdmin)) throw errors.forbidden('You can only modify your own reviews');
  return review;
}

export const PATCH = handler(async (req, { params }) => {
  const user = await requireUser();
  const review = await ownReview(params.id, user.id);
  const body = await parseBody(req, reviewSchema);
  const updated = await prisma.review.update({
    where: { id: review.id },
    data: body,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  await refreshProductRating(review.productId);
  return ok(updated);
});

export const DELETE = handler(async (_req, { params }) => {
  const user = await requireUser();
  const review = await ownReview(params.id, user.id, true, user.role);
  await prisma.review.delete({ where: { id: review.id } });
  await refreshProductRating(review.productId);
  return noContent();
});
