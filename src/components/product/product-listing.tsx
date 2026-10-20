'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import type { Paginated, ProductCard } from '@/types';
import { useApi } from '@/hooks/use-api';
import { ProductGrid } from './product-card';
import { Filters, type FilterValues } from './filters';
import { Pagination } from '@/components/ui/pagination';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_seller', label: 'Best sellers' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const FILTER_KEYS = ['category', 'minPrice', 'maxPrice', 'rating', 'availability', 'brand'] as const;
const SUGGESTED = ['headphones', 'shoes', 'coffee', 'novel', 'yoga'];

export function ProductListing({ mode }: { mode: 'catalog' | 'search' }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? 1) || 1;
  const sort = params.get('sort') ?? 'newest';

  const apiPath = useMemo(() => {
    const p = new URLSearchParams(params.toString());
    p.set('pageSize', '20');
    return `/api/products?${p}`;
  }, [params]);
  const { data, loading, error, reload } = useApi<Paginated<ProductCard>>(mode === 'search' && !q ? null : apiPath);

  const filters: FilterValues = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined]));

  const update = (patch: Record<string, string | undefined>, resetPage = true) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (resetPage) p.delete('page');
    router.push(`${pathname}?${p}`, { scroll: false });
  };

  const activeChips = FILTER_KEYS.filter((k) => params.get(k)).map((k) => ({ key: k, value: params.get(k)! }));

  const title = mode === 'search' ? (q ? `Search results for “${q}”` : 'Search') : filters.category ? filters.category.replace(/-/g, ' ') : 'All Products';

  return (
    <div className="container py-6" data-testid={mode === 'search' ? 'search-page' : 'products-page'}>
      <Breadcrumbs items={mode === 'search' ? [{ label: 'Search' }] : filters.category ? [{ label: 'Products', href: '/products' }, { label: title }] : [{ label: 'Products' }]} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold capitalize" data-testid="listing-title">
            {title}
          </h1>
          {data && (
            <p className="text-sm text-muted-foreground" data-testid="listing-result-count">
              {data.meta.total} product{data.meta.total === 1 ? '' : 's'} found
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters((s) => !s)} data-testid="toggle-filters-btn">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <label className="text-sm text-muted-foreground" htmlFor="sort-select">
            Sort by
          </label>
          <select id="sort-select" value={sort} onChange={(e) => update({ sort: e.target.value })} className="h-9 rounded-md border border-input bg-background px-2 text-sm" data-testid="sort-select">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" data-testid="active-filters">
          {activeChips.map((c) => (
            <button key={c.key} onClick={() => update({ [c.key]: undefined })} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs" data-testid={`active-filter-${c.key}`}>
              {c.key}: {c.value} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className={showFilters ? 'block' : 'hidden lg:block'}>
          <Filters
            values={filters}
            onApply={(v) => update(v as Record<string, string | undefined>)}
            onReset={() => router.push(mode === 'search' ? `${pathname}?q=${encodeURIComponent(q)}` : pathname)}
          />
        </div>
        <div>
          {mode === 'search' && !q ? (
            <EmptyState title="Start searching" description="Type a product name, brand or category in the search bar." testId="search-empty-query" />
          ) : loading && !data ? (
            <ProductGridSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} testId="listing-error" />
          ) : data && data.items.length === 0 ? (
            <EmptyState
              icon={<SearchX className="h-10 w-10" />}
              title={mode === 'search' ? `No results for “${q}”` : 'No products match your filters'}
              description="Try adjusting your search or filters. Here are some popular searches:"
              testId="no-results"
              action={
                <div className="flex flex-wrap justify-center gap-2" data-testid="no-results-suggestions">
                  {SUGGESTED.map((s) => (
                    <Link key={s} href={`/search?q=${s}`} className="rounded-full border px-3 py-1 text-sm hover:bg-accent" data-testid={`no-results-suggestion-${s}`}>
                      {s}
                    </Link>
                  ))}
                  <Link href="/products" className="rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground" data-testid="no-results-browse-all">
                    Browse all
                  </Link>
                </div>
              }
            />
          ) : data ? (
            <div className={loading ? 'opacity-60 transition-opacity' : ''}>
              <ProductGrid products={data.items} />
              <div className="mt-8">
                <Pagination page={page} totalPages={data.meta.totalPages} onChange={(p) => update({ page: String(p) }, false)} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
