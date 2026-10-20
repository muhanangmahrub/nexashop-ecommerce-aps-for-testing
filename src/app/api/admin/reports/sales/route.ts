import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const schema = z
  .object({
    period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine((d) => !d.from || !d.to || d.from <= d.to, { path: ['to'], message: 'End date must be after start date' });

export const GET = handler(async (req) => {
  await requireAdmin();
  const q = parseQuery(req, schema);
  const defaultsDays = { daily: 30, weekly: 84, monthly: 365 }[q.period];
  const to = q.to ?? new Date();
  const from = q.from ?? new Date(to.getTime() - defaultsDays * 86400_000);
  const trunc = { daily: 'day', weekly: 'week', monthly: 'month' }[q.period];

  // generate_series zero-fills periods with no orders so charts show a continuous timeline.
  // `trunc` comes from a fixed whitelist above, so interpolating it is safe.
  const rows = await prisma.$queryRawUnsafe<{ bucket: Date; orders: bigint; revenue: string | null }[]>(
    `SELECT gs AS bucket, COUNT(o.id) AS orders, COALESCE(SUM(o.total), 0) AS revenue
     FROM generate_series(date_trunc('${trunc}', $1::timestamp), date_trunc('${trunc}', $2::timestamp), interval '1 ${trunc}') AS gs
     LEFT JOIN "Order" o ON date_trunc('${trunc}', o."createdAt") = gs AND o.status <> 'CANCELLED'
     GROUP BY gs ORDER BY gs ASC`,
    from,
    to,
  );
  const series = rows.map((r) => ({
    period: r.bucket.toISOString().slice(0, 10),
    orders: Number(r.orders),
    revenue: Math.round(Number(r.revenue ?? 0) * 100) / 100,
  }));
  const totals = series.reduce((a, s) => ({ orders: a.orders + s.orders, revenue: a.revenue + s.revenue }), { orders: 0, revenue: 0 });
  return ok({
    period: q.period,
    from: from.toISOString(),
    to: to.toISOString(),
    series,
    totals: { ...totals, revenue: Math.round(totals.revenue * 100) / 100, averageOrderValue: totals.orders ? Math.round((totals.revenue / totals.orders) * 100) / 100 : 0 },
  });
});
