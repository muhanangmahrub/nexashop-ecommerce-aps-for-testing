'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification, PageMeta } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/client';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

type Resp = { items: Notification[]; unread: number; meta: PageMeta };

export default function NotificationsPage() {
  const router = useRouter();
  const setCounts = useAuthStore((s) => s.setCounts);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload, setData } = useApi<Resp>(`/api/notifications?page=${page}&filter=${filter}${type ? `&type=${type}` : ''}`);

  const markRead = async (n: Notification) => {
    if (!n.isRead) {
      setData((d) => d && { ...d, unread: Math.max(0, d.unread - 1), items: d.items.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)) });
      try {
        const res = await api<{ unread: number }>(`/api/notifications/${n.id}/read`, { method: 'POST' });
        setCounts({ notifications: res.unread });
      } catch (e) {
        toast.error(errorMessage(e));
        reload();
      }
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
      setCounts({ notifications: 0 });
      toast.success('All notifications marked as read');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Notifications' }]} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          Notifications {data && data.unread > 0 && <Badge data-testid="notifications-unread-count">{data.unread} unread</Badge>}
        </h1>
        <Button variant="outline" onClick={markAll} disabled={!data?.unread} data-testid="mark-all-read-btn">
          <CheckCheck className="h-4 w-4" /> Mark all as read
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => (setFilter(f), setPage(1))} data-testid={`notifications-filter-${f}`}>
            {f === 'all' ? 'All' : 'Unread'}
          </Button>
        ))}
        <select value={type} onChange={(e) => (setType(e.target.value), setPage(1))} className="h-9 rounded-md border border-input bg-background px-2 text-sm" data-testid="notifications-type-filter" aria-label="Filter by type">
          <option value="">All types</option>
          <option value="ORDER">Orders</option>
          <option value="PROMOTION">Promotions</option>
          <option value="ACCOUNT">Account</option>
          <option value="SYSTEM">System</option>
        </select>
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState icon={<Bell className="h-10 w-10" />} title="No notifications" description={filter === 'unread' ? 'You have no unread notifications.' : 'You will see order updates and promotions here.'} testId="notifications-empty" />
      ) : (
        <>
          <ul className="divide-y rounded-lg border" data-testid="notification-list">
            {data.items.map((n) => (
              <li key={n.id}>
                <button onClick={() => markRead(n)} className={cn('flex w-full items-start gap-3 p-4 text-left hover:bg-accent', !n.isRead && 'bg-primary/5')} data-testid="notification-row" data-read={n.isRead}>
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.isRead ? 'bg-transparent' : 'bg-primary')} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium" data-testid="notification-row-title">{n.title}</p>
                      <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt, true)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="notifications-pagination" />
        </>
      )}
    </div>
  );
}
