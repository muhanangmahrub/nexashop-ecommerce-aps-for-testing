import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" data-testid="breadcrumb" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-foreground" data-testid="breadcrumb-home">
            Home
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="hover:text-foreground" data-testid={`breadcrumb-item-${i}`}>
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground" aria-current="page" data-testid="breadcrumb-current">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
