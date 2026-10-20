'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Pencil, ThumbsUp, Trash2 } from 'lucide-react';
import type { PageMeta, Review } from '@/types';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { reviewSchema } from '@/lib/validation';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { formatDate, cn } from '@/lib/utils';
import { StarInput, StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/modal';
import { EmptyState, ErrorState, FormError } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/layout/avatar';

type ReviewsResponse = {
  items: Review[];
  meta: PageMeta;
  summary: { average: number; total: number; breakdown: { rating: number; count: number; percent: number }[] };
  viewer: { canReview: boolean; hasPurchased: boolean; myReviewId: string | null };
};

function ReviewForm({
  slug,
  initial,
  reviewId,
  onDone,
  onCancel,
}: {
  slug: string;
  initial?: { rating: number; title: string; comment: string };
  reviewId?: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial ?? { rating: 0, title: '', comment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const v = validate(reviewSchema, values);
    if (v.errors) return setErrors(v.errors);
    setErrors({});
    setLoading(true);
    try {
      if (reviewId) await api(`/api/reviews/${reviewId}`, { method: 'PATCH', body: v.data });
      else await api(`/api/products/${slug}/reviews`, { method: 'POST', body: v.data });
      toast.success(reviewId ? 'Review updated' : 'Thank you for your review!');
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-lg border p-4" data-testid="review-form">
      <FormError message={formError} testId="review-form-error" />
      <div>
        <p className="mb-1 text-sm font-medium">Your rating *</p>
        <StarInput value={values.rating} onChange={(rating) => setValues({ ...values, rating })} testId="review-rating-input" />
        {errors.rating && (
          <p className="mt-1 text-xs text-destructive" role="alert" data-testid="review-rating-input-error">
            {errors.rating}
          </p>
        )}
      </div>
      <Input label="Title" required value={values.title} maxLength={100} onChange={(e) => setValues({ ...values, title: e.target.value })} error={errors.title} testId="review-title-input" />
      <Textarea
        label="Comment"
        required
        rows={4}
        maxLength={1000}
        showCount
        value={values.comment}
        onChange={(e) => setValues({ ...values, comment: e.target.value })}
        error={errors.comment}
        testId="review-comment-input"
      />
      <div className="flex gap-2">
        <Button type="submit" loading={loading} data-testid="review-submit-btn">
          {reviewId ? 'Update review' : 'Submit review'}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} data-testid="review-cancel-btn">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function ReviewsSection({ slug }: { slug: string }) {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), sort, ...(ratingFilter ? { rating: String(ratingFilter) } : {}) });
      setData(await api<ReviewsResponse>(`/api/products/${slug}/reviews?${qs}`));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [slug, page, sort, ratingFilter]);

  useEffect(() => {
    load();
  }, [load, user?.id]);

  const vote = async (r: Review) => {
    if (!user) return toast.warning('Please log in to vote');
    setData((d) => d && { ...d, items: d.items.map((i) => (i.id === r.id ? { ...i, votedHelpful: !i.votedHelpful, helpfulCount: i.helpfulCount + (i.votedHelpful ? -1 : 1) } : i)) });
    try {
      const res = await api<{ voted: boolean; helpfulCount: number }>(`/api/reviews/${r.id}/helpful`, { method: 'POST' });
      setData((d) => d && { ...d, items: d.items.map((i) => (i.id === r.id ? { ...i, votedHelpful: res.voted, helpfulCount: res.helpfulCount } : i)) });
    } catch (e) {
      toast.error(errorMessage(e));
      load();
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/reviews/${deleting}`, { method: 'DELETE' });
      toast.success('Review deleted');
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <section id="reviews" className="mt-12 scroll-mt-24" data-testid="reviews-section">
      <h2 className="mb-6 text-xl font-bold">Customer Reviews</h2>
      {error && <ErrorState message={error} onRetry={load} testId="reviews-error" />}
      {!data && loading && <Skeleton className="h-40 w-full" />}
      {data && (
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <div className="space-y-4" data-testid="rating-summary">
            <div className="text-center">
              <p className="text-5xl font-bold" data-testid="rating-average">
                {data.summary.average.toFixed(1)}
              </p>
              <StarRating value={data.summary.average} size={20} />
              <p className="text-sm text-muted-foreground" data-testid="rating-total">
                Based on {data.summary.total} review{data.summary.total === 1 ? '' : 's'}
              </p>
            </div>
            <div className="space-y-1.5" data-testid="rating-breakdown">
              {data.summary.breakdown.map((b) => (
                <button
                  key={b.rating}
                  onClick={() => (setRatingFilter(ratingFilter === b.rating ? null : b.rating), setPage(1))}
                  className={cn('flex w-full items-center gap-2 rounded px-1 text-sm hover:bg-accent', ratingFilter === b.rating && 'bg-accent')}
                  data-testid={`rating-breakdown-${b.rating}`}
                  data-percent={b.percent}
                >
                  <span className="w-8">{b.rating}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded bg-muted">
                    <span className="block h-full bg-amber-400" style={{ width: `${b.percent}%` }} />
                  </span>
                  <span className="w-10 text-right text-xs text-muted-foreground">{b.percent}%</span>
                </button>
              ))}
            </div>
            {user ? (
              data.viewer.canReview ? (
                !writing && (
                  <Button className="w-full" onClick={() => setWriting(true)} data-testid="write-review-btn">
                    Write a review
                  </Button>
                )
              ) : data.viewer.myReviewId ? (
                <p className="text-center text-xs text-muted-foreground" data-testid="review-already-submitted">
                  You have already reviewed this product.
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground" data-testid="review-not-eligible">
                  Only verified purchasers with a delivered order can write a review.
                </p>
              )
            ) : (
              <p className="text-center text-sm" data-testid="review-login-prompt">
                <Link href={`/login?redirect=/products/${slug}`} className="text-primary underline" data-testid="review-login-link">
                  Log in
                </Link>{' '}
                to write a review.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {writing && (
              <ReviewForm
                slug={slug}
                onDone={() => {
                  setWriting(false);
                  load();
                }}
                onCancel={() => setWriting(false)}
              />
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {ratingFilter ? `Showing ${ratingFilter}★ reviews` : `${data.meta.total} reviews`}
              </span>
              <select value={sort} onChange={(e) => (setSort(e.target.value), setPage(1))} className="h-9 rounded-md border border-input bg-background px-2 text-sm" data-testid="reviews-sort-select" aria-label="Sort reviews">
                <option value="newest">Newest</option>
                <option value="helpful">Most helpful</option>
                <option value="rating_high">Highest rating</option>
                <option value="rating_low">Lowest rating</option>
              </select>
            </div>
            {data.items.length === 0 ? (
              <EmptyState title="No reviews yet" description="Be the first to share your thoughts." testId="reviews-empty" />
            ) : (
              <ul className={cn('space-y-4', loading && 'opacity-60')} data-testid="review-list">
                {data.items.map((r) =>
                  editing === r.id ? (
                    <li key={r.id}>
                      <ReviewForm
                        slug={slug}
                        reviewId={r.id}
                        initial={{ rating: r.rating, title: r.title, comment: r.comment }}
                        onDone={() => {
                          setEditing(null);
                          load();
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    </li>
                  ) : (
                    <li key={r.id} className="rounded-lg border p-4" data-testid="review-item" data-review-id={r.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.user.name} src={r.user.avatar} size={36} />
                          <div>
                            <p className="text-sm font-medium" data-testid="review-author">
                              {r.user.name}
                              <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700" data-testid="review-verified-badge">
                                Verified Purchase
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                          </div>
                        </div>
                        <StarRating value={r.rating} size={14} testId="review-rating" />
                      </div>
                      <h4 className="mt-3 font-semibold" data-testid="review-title">
                        {r.title}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground" data-testid="review-comment">
                        {r.comment}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        {user?.id !== r.user.id && (
                          <button onClick={() => vote(r)} className={cn('inline-flex items-center gap-1 text-xs hover:text-primary', r.votedHelpful ? 'text-primary' : 'text-muted-foreground')} aria-pressed={r.votedHelpful} data-testid="review-helpful-btn">
                            <ThumbsUp className={cn('h-3.5 w-3.5', r.votedHelpful && 'fill-current')} /> Helpful (<span data-testid="review-helpful-count">{r.helpfulCount}</span>)
                          </button>
                        )}
                        {user?.id === r.user.id && (
                          <>
                            <span className="text-xs text-muted-foreground">{r.helpfulCount} found this helpful</span>
                            <button onClick={() => setEditing(r.id)} className="inline-flex items-center gap-1 text-xs text-primary" data-testid="review-edit-btn">
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button onClick={() => setDeleting(r.id)} className="inline-flex items-center gap-1 text-xs text-destructive" data-testid="review-delete-btn">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
            <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="reviews-pagination" />
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete review?"
        message="This will permanently delete your review."
        confirmLabel="Delete"
        destructive
        loading={deleteLoading}
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
        testId="delete-review-dialog"
      />
    </section>
  );
}
