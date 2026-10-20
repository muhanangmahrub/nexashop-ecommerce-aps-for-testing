import { Check, X } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { cn, formatDate } from '@/lib/utils';

const FLOW: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export function OrderTimeline({ order }: { order: Order }) {
  const history = order.statusHistory ?? [];
  const cancelled = order.status === 'CANCELLED';
  const reachedIdx = FLOW.indexOf(order.status);
  const steps: OrderStatus[] = cancelled ? [...FLOW.filter((s) => history.some((h) => h.status === s)), 'CANCELLED'] : FLOW;
  return (
    <ol className="space-y-4" data-testid="order-timeline">
      {steps.map((s, i) => {
        const entry = [...history].reverse().find((h) => h.status === s);
        const done = cancelled ? true : i <= reachedIdx;
        return (
          <li key={s} className="flex gap-3" data-testid={`order-timeline-${s.toLowerCase()}`} data-complete={done}>
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2', s === 'CANCELLED' ? 'border-destructive bg-destructive text-white' : done ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>
              {s === 'CANCELLED' ? <X className="h-4 w-4" /> : done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
            </span>
            <div>
              <p className={cn('text-sm font-medium', !done && 'text-muted-foreground')}>{s.charAt(0) + s.slice(1).toLowerCase()}</p>
              {entry && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.createdAt, true)}
                  {entry.note ? ` — ${entry.note}` : ''}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
