import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Toggles the current user's "helpful" vote on a review. */
export const POST = handler(async (_req, { params }) => {
  const user = await requireUser();
  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) throw errors.notFound('Review not found');
  if (review.userId === user.id) throw errors.forbidden('You cannot vote on your own review');
  const existing = await prisma.reviewVote.findUnique({ where: { reviewId_userId: { reviewId: review.id, userId: user.id } } });
  if (existing) {
    await prisma.$transaction([
      prisma.reviewVote.delete({ where: { id: existing.id } }),
      prisma.review.update({ where: { id: review.id }, data: { helpfulCount: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.reviewVote.create({ data: { reviewId: review.id, userId: user.id } }),
      prisma.review.update({ where: { id: review.id }, data: { helpfulCount: { increment: 1 } } }),
    ]);
  }
  const fresh = await prisma.review.findUniqueOrThrow({ where: { id: review.id }, select: { helpfulCount: true } });
  return ok({ voted: !existing, helpfulCount: fresh.helpfulCount });
});
