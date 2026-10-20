import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  testId?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, Props>(({ label, testId, error, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 text-sm">
        <input ref={ref} id={inputId} type="checkbox" data-testid={testId} className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]" {...props} />
        <span>{label}</span>
      </label>
      {error && (
        <p role="alert" className="text-xs text-destructive" data-testid={testId ? `${testId}-error` : undefined}>
          {error}
        </p>
      )}
    </div>
  );
});
Checkbox.displayName = 'Checkbox';
