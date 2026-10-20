import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { inputClass } from './input';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  testId?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, testId, options, placeholder, className, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {props.required && <span className="text-destructive"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          data-testid={testId}
          aria-invalid={Boolean(error) || undefined}
          className={cn(inputClass, error && 'border-destructive', className)}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="text-xs text-destructive" data-testid={testId ? `${testId}-error` : undefined}>
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
