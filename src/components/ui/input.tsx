import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  testId?: string;
}

/** Labelled input with inline error + data-testid conventions: `${testId}` and `${testId}-error`. */
export const Input = forwardRef<HTMLInputElement, FieldProps>(({ label, error, hint, testId, className, id, type, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
          {props.required && <span className="text-destructive"> *</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && show ? 'text' : type}
          data-testid={testId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(inputClass, error && 'border-destructive focus-visible:ring-destructive', isPassword && 'pr-10', className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label={show ? 'Hide password' : 'Show password'}
            data-testid={testId ? `${testId}-toggle-visibility` : undefined}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-destructive" data-testid={testId ? `${testId}-error` : undefined}>
          {error}
        </p>
      )}
    </div>
  );
});
Input.displayName = 'Input';
