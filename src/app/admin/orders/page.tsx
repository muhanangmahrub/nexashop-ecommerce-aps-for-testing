'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Order, PageMeta } from '@/types';
import { useApi } from '@/hooks/use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate, formatPrice } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/account/order-status-badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';
import { inputClass } from '@/components/ui/input';

type Row = Order & { user: { name: string; email: string }; _count: { items: number } };

export default function AdminOrdersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounce(q, 350);
  const dateError = from && to && from > to ? 'End date must be after start date' : null;
  const qs = new URLSearchParams({ page: String(page), ...(dq && { q: dq }), ...(status && { status }), ...(!dateError && from && { from }), ...(!dateError && to && { to }) });
  const { data, loading, error, reload } = useApi<{ items: Row[]; meta: PageMeta }>(`/api/admin/orders?${qs}`);

  return (
    <div className="space-y-4" data-testid="admin-orders-page">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="grid gap-2 sm:grid-cols-4">
        <input value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="Order #, customer name or email" className={inputClass} data-testid="admin-orders-search" aria-label="Search orders" />
        <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className={inputClass} data-testid="admin-orders-status-filter" aria-label="Status">
          <option value="">All statuses</option>
          {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} className={inputClass} aria-label="From date" data-testid="admin-orders-from-date" />
        <input type="date" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} className={inputClass} aria-label="To date" data-testid="admin-orders-to-date" />
      </div>
      {dateError && (
        <p className="text-sm text-destructive" role="alert" data-testid="admin-orders-date-error">
          {dateError}
        </p>
      )}
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState title="No orders found" testId="admin-orders-empty" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="admin-orders-table">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Items</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/30" data-testid="admin-order-row" data-order-id={o.id}>
                  <td className="p-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-primary hover:underline" data-testid="admin-order-link">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="p-3">
                    <p>{o.user.name}</p>
                    <p className="text-xs text-muted-foreground">{o.user.email}</p>
                  </td>
                  <td className="p-3">{formatDate(o.createdAt)}</td>
                  <td className="p-3">{o._count.items}</td>
                  <td className="p-3">
                    <PaymentStatusBadge status={o.paymentStatus} />
                  </td>
                  <td className="p-3">
                    <OrderStatusBadge status={o.status} testId="admin-order-status" />
                  </td>
                  <td className="p-3 text-right font-medium">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="admin-orders-pagination" />}
    </div>
  );
}
