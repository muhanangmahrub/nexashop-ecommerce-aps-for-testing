'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ value, size = 16, className, testId }: { value: number; size?: number; className?: string; testId?: string }) {
  return (
    <span className={cn('inline-flex items-center', className)} aria-label={`Rated ${value} out of 5`} data-testid={testId} data-rating={value}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')}
        />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, testId = 'rating-input' }: { value: number; onChange: (v: number) => void; testId?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" data-testid={testId}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          data-testid={`${testId}-star-${i}`}
        >
          <Star className={cn('h-7 w-7 transition-colors', i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
        </button>
      ))}
    </div>
  );
}
