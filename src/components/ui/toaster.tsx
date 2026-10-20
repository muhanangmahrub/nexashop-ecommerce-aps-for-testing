'use client';

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';

const styles = {
  success: { icon: CheckCircle2, cls: 'border-emerald-500/50 text-emerald-700 dark:text-emerald-300' },
  error: { icon: XCircle, cls: 'border-red-500/50 text-red-700 dark:text-red-300' },
  warning: { icon: AlertTriangle, cls: 'border-amber-500/50 text-amber-700 dark:text-amber-300' },
  info: { icon: Info, cls: 'border-sky-500/50 text-sky-700 dark:text-sky-300' },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2" aria-live="polite" data-testid="toast-container">
      {toasts.map((t) => {
        const { icon: Icon, cls } = styles[t.type];
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            data-testid={`toast-${t.type}`}
            className={cn('pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 bg-card p-4 shadow-lg animate-slide-in', cls)}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm text-foreground" data-testid="toast-message">
              {t.message}
            </p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" data-testid="toast-close" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
