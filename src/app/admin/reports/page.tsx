'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/use-api';
import { formatPrice, cn } from '@/lib/utils';
import { SalesChart } from '@/components/admin/sales-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { inputClass } from '@/components/ui/input';

type Report = {
  period: string;
  series: { period: string; orders: number; revenue: number }[];
  totals: { orders: number; revenue: number; averageOrderValue: number };
};

const PERIODS = ['daily', 'weekly', 'monthly'] as const;

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dateError = from && to && from > to ? 'End date must be after start date' : null;
  const qs = new URLSearchParams({ period, ...(!dateError && from && { from }), ...(!dateError && to && { to }) });
  const { data, loading, error, reload } = useApi<Report>(`/api/admin/reports/sales?${qs}`);

  return (
    <div className="space-y-6" data-testid="admin-reports-page">
      <h1 className="text-2xl font-bold">Sales report</h1>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex rounded-md border p-1" role="tablist" data-testid="report-period-tabs">
          {PERIODS.map((p) => (
            <button key={p} role="tab" aria-selected={period === p} onClick={() => setPeriod(p)} className={cn('rounded px-3 py-1.5 text-sm capitalize', period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')} data-testid={`report-period-${p}`}>
              {p}
            </button>
          ))}
        </div>
        <label className="text-sm">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} data-testid="report-from-date" />
        </label>
        <label className="text-sm">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputClass} data-testid="report-to-date" />
        </label>
      </div>
      {dateError && (
        <p className="text-sm text-destructive" role="alert" data-testid="report-date-error">
          {dateError}
        </p>
      )}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <Skeleton className="h-80 w-full" />
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3" data-testid="report-totals">
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold" data-testid="report-total-revenue">{formatPrice(data.totals.revenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold" data-testid="report-total-orders">{data.totals.orders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">Avg. order value</p>
                <p className="text-2xl font-bold" data-testid="report-aov">{formatPrice(data.totals.averageOrderValue)}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>{data.series.length ? <SalesChart data={data.series} metric="revenue" /> : <p className="py-10 text-center text-sm text-muted-foreground" data-testid="report-no-data">No sales in this period.</p>}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>{data.series.length > 0 && <SalesChart data={data.series} metric="orders" height={240} />}</CardContent>
          </Card>
          <Card>
            <CardContent className="overflow-x-auto pt-5">
              <table className="w-full text-sm" data-testid="report-table">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Period</th>
                    <th className="text-right">Orders</th>
                    <th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((s) => (
                    <tr key={s.period} className="border-t">
                      <td className="py-2">{s.period}</td>
                      <td className="text-right">{s.orders}</td>
                      <td className="text-right">{formatPrice(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
