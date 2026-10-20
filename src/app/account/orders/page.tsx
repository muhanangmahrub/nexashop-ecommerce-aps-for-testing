'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import type { Order, Paginated } from '@/types';
import { useApi } from '@/hooks/use-api';
import { formatDate, formatPrice, cn } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const TABS = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export default function OrdersPage() {
  const [status, setStatus] = useState<(typeof TABS)[number]>('ALL');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Paginated<Order>>(`/api/orders?page=${page}${status !== 'ALL' ? `&status=${status}` : ''}`);

  return (
    <div className="space-y-6" data-testid="orders-page">
      <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Orders' }]} />
      <h1 className="text-2xl font-bold">Order history</h1>
      <div className="flex gap-1 overflow-x-auto border-b" role="tablist" data-testid="order-status-tabs">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={status === t} onClick={() => (setStatus(t), setPage(1))} className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm', status === t ? 'border-primary font-semibold text-primary' : 'border-transparent text-muted-foreground')} data-testid={`order-tab-${t.toLowerCase()}`}>
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={<Package className="h-10 w-10" />}
          title="No orders found"
          description={status === 'ALL' ? "You haven't placed any orders yet." : `You have no ${status.toLowerCase()} orders.`}
          testId="orders-empty"
          action={
            <Link href="/products">
              <Button data-testid="orders-shop-btn">Start shopping</Button>
            </Link>
          }
        />
      ) : (
        <>
          <ul className="space-y-3" data-testid="order-list">
            {data.items.map((o) => (
              <li key={o.id} className="rounded-lg border p-4" data-testid="order-row" data-order-id={o.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono font-semibold" data-testid="order-row-number">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">Placed {formatDate(o.createdAt, true)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} testId="order-row-status" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {o.items.slice(0, 4).map((i) => (
                    <img key={i.id} src={i.image ?? '/favicon.svg'} alt={i.name} title={i.name} className="h-12 w-12 rounded object-cover" />
                  ))}
                  {o.items.length > 4 && <span className="text-xs text-muted-foreground">+{o.items.length - 4} more</span>}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm">
                    Total: <b data-testid="order-row-total">{formatPrice(o.total)}</b>
                  </span>
                  <Link href={`/account/orders/${o.id}`}>
                    <Button size="sm" variant="outline" data-testid="order-row-view-btn">
                      View details
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="orders-pagination" />
        </>
      )}
    </div>
  );
}
