'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import type { Notification } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function NotificationBell() {
  const router = useRouter();
  const count = useAuthStore((s) => s.counts.notifications);
  const setCounts = useAuthStore((s) => s.setCounts);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    api<{ items: Notification[]; unread: number }>('/api/notifications?pageSize=6')
      .then((d) => {
        setItems(d.items);
        setCounts({ notifications: d.unread });
      })
      .catch((e) => toast.error(errorMessage(e)));
  }, [open, setCounts]);

  const markRead = async (n: Notification) => {
    if (!n.isRead) {
      setItems((prev) => prev?.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)) ?? null);
      const res = await api<{ unread: number }>(`/api/notifications/${n.id}/read`, { method: 'POST' }).catch(() => null);
      if (res) setCounts({ notifications: res.unread });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'POST' });
      setItems((prev) => prev?.map((i) => ({ ...i, isRead: true })) ?? null);
      setCounts({ notifications: 0 });
      toast.success('All notifications marked as read');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)} aria-label="Notifications" data-testid="notification-bell" className="relative">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white" data-testid="notification-count-badge">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-card shadow-lg" data-testid="notification-dropdown">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-semibold">Notifications</span>
            <button onClick={markAll} disabled={count === 0} className="text-xs text-primary hover:underline disabled:opacity-50" data-testid="notification-mark-all-read">
              Mark all as read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items === null && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
            {items?.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground" data-testid="notification-empty">
                You&apos;re all caught up!
              </p>
            )}
            {items?.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n)}
                className={cn('block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-accent', !n.isRead && 'bg-primary/5')}
                data-testid={`notification-item-${n.id}`}
                data-read={n.isRead}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" data-testid="notification-unread-dot" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(n.createdAt, true)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Link href="/account/notifications" onClick={() => setOpen(false)} className="block border-t px-4 py-2 text-center text-sm text-primary hover:bg-accent" data-testid="notification-view-all">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
