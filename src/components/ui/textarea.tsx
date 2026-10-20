import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  testId?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ label, error, testId, className, id, showCount, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const len = typeof props.value === 'string' ? props.value.length : 0;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {props.required && <span className="text-destructive"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        data-testid={testId}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          'flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          error && 'border-destructive',
          className,
        )}
        {...props}
      />
      <div className="flex justify-between">
        {error ? (
          <p role="alert" className="text-xs text-destructive" data-testid={testId ? `${testId}-error` : undefined}>
            {error}
          </p>
        ) : (
          <span />
        )}
        {showCount && props.maxLength && (
          <span className="text-xs text-muted-foreground" data-testid={testId ? `${testId}-count` : undefined}>
            {len}/{props.maxLength}
          </span>
        )}
      </div>
    </div>
  );
});
Textarea.displayName = 'Textarea';
