import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const STEPS = ['Cart', 'Address', 'Shipping', 'Payment', 'Confirmation'] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2 overflow-x-auto" data-testid="checkout-stepper">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2" data-testid={`checkout-step-${s.toLowerCase()}`} data-active={active} data-complete={done}>
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold', done && 'border-primary bg-primary text-primary-foreground', active && 'border-primary text-primary', !done && !active && 'text-muted-foreground')}>
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={cn('whitespace-nowrap text-sm', active ? 'font-semibold' : 'text-muted-foreground')}>{s}</span>
            {i < STEPS.length - 1 && <span className={cn('h-0.5 min-w-4 flex-1', done ? 'bg-primary' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}
