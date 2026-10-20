import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './button';

export function EmptyState({
  title,
  description,
  action,
  icon,
  testId = 'empty-state',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center" data-testid={testId}>
      <div className="mb-3 text-muted-foreground">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <h3 className="text-lg font-semibold" data-testid={`${testId}-title`}>
        {title}
      </h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, testId = 'error-state' }: { message: string; onRetry?: () => void; testId?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center" role="alert" data-testid={testId}>
      <AlertTriangle className="mb-2 h-8 w-8 text-destructive" />
      <p className="text-sm" data-testid={`${testId}-message`}>
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry} data-testid={`${testId}-retry`}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground" role="status" data-testid="loading-spinner">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function FormError({ message, testId = 'form-error' }: { message?: string | null; testId?: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid={testId}>
      {message}
    </div>
  );
}
