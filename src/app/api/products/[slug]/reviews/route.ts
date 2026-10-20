import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { created, errors, handler, ok, pageMeta, paginate, parseBody, parseQuery } from '@/lib/api';
import { paginationSchema, reviewSchema } from '@/lib/validation';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { refreshProductRating } from '@/lib/products';

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  pageSize: z.coerce.number().int().min(1).max(50).default(5),
  sort: z.enum(['newest', 'helpful', 'rating_high', 'rating_low']).default('newest'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const GET = handler(async (req, { params }) => {
  const q = parseQuery(req, querySchema);
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!product) throw errors.notFound('Product not found');
  const user = await getCurrentUser();
  const where = { productId: product.id, ...(q.rating ? { rating: q.rating } : {}) };
  const orderBy =
    q.sort === 'helpful'
      ? [{ helpfulCount: 'desc' as const }]
      : q.sort === 'rating_high'
        ? [{ rating: 'desc' as const }]
        : q.sort === 'rating_low'
          ? [{ rating: 'asc' as const }]
          : [{ createdAt: 'desc' as const }];

  const [total, reviews, groups, myReview, purchased] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: [...orderBy, { id: 'asc' }],
      ...paginate(q.page, q.pageSize),
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        votes: user ? { where: { userId: user.id }, select: { id: true } } : false,
      },
    }),
    prisma.review.groupBy({ by: ['rating'], where: { productId: product.id }, _count: true }),
    user ? prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } }) : null,
    user
      ? prisma.orderItem.count({ where: { productId: product.id, order: { userId: user.id, status: 'DELIVERED' } } })
      : 0,
  ]);

  const totalAll = groups.reduce((s, g) => s + g._count, 0);
  const breakdown = [5, 4, 3, 2, 1].map((r) => {
    const count = groups.find((g) => g.rating === r)?._count ?? 0;
    return { rating: r, count, percent: totalAll ? Math.round((count / totalAll) * 100) : 0 };
  });
  const average = totalAll ? groups.reduce((s, g) => s + g.rating * g._count, 0) / totalAll : 0;

  return ok({
    items: reviews.map(({ votes, ...r }) => ({ ...r, votedHelpful: Array.isArray(votes) && votes.length > 0 })),
    meta: pageMeta(total, q.page, q.pageSize),
    summary: { average: Math.round(average * 10) / 10, total: totalAll, breakdown },
    viewer: { canReview: Boolean(user && purchased > 0 && !myReview), hasPurchased: purchased > 0, myReviewId: myReview?.id ?? null },
  });
});

export const POST = handler(async (req, { params }) => {
  const user = await requireUser();
  const body = await parseBody(req, reviewSchema);
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { id: true } });
  if (!product) throw errors.notFound('Product not found');
  const purchased = await prisma.orderItem.count({
    where: { productId: product.id, order: { userId: user.id, status: 'DELIVERED' } },
  });
  if (!purchased) throw errors.forbidden('Only verified purchasers with a delivered order can review this product');
  const existing = await prisma.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } });
  if (existing) throw errors.conflict('You have already reviewed this product');
  const review = await prisma.review.create({
    data: { ...body, productId: product.id, userId: user.id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  await refreshProductRating(product.id);
  return created(review);
});
