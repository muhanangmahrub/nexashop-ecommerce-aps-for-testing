'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  testId?: string;
}

function range(page: number, total: number) {
  const pages: (number | '...')[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }
  return pages;
}

export function Pagination({ page, totalPages, onChange, testId = 'pagination' }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination" data-testid={testId}>
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} data-testid={`${testId}-prev`} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {range(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            size="sm"
            variant={p === page ? 'default' : 'outline'}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            data-testid={`${testId}-page-${p}`}
            className={cn('min-w-9')}
          >
            {p}
          </Button>
        ),
      )}
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} data-testid={`${testId}-next`} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
