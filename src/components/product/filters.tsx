'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';

export type FilterValues = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  availability?: string;
  brand?: string;
};

export function Filters({ values: urlValues, onApply: applyToUrl, onReset }: { values: FilterValues; onApply: (v: FilterValues) => void; onReset: () => void }) {
  // Optimistic local copy so inputs reflect a change immediately, before the URL navigation settles.
  const [values, setValues] = useState(urlValues);
  const urlKey = JSON.stringify(urlValues);
  useEffect(() => setValues(JSON.parse(urlKey)), [urlKey]);
  const onApply = (v: FilterValues) => {
    setValues(v);
    applyToUrl(v);
  };
  const [tree, setTree] = useState<Category[]>([]);
  const [brands, setBrands] = useState<{ name: string; count: number }[]>([]);
  const [min, setMin] = useState(values.minPrice ?? '');
  const [max, setMax] = useState(values.maxPrice ?? '');
  const [priceError, setPriceError] = useState<string>();

  useEffect(() => {
    api<{ tree: Category[] }>('/api/categories').then((d) => setTree(d.tree)).catch(() => undefined);
    api<{ name: string; count: number }[]>('/api/brands').then(setBrands).catch(() => undefined);
  }, []);
  useEffect(() => {
    setMin(values.minPrice ?? '');
    setMax(values.maxPrice ?? '');
  }, [values.minPrice, values.maxPrice]);

  const applyPrice = () => {
    const lo = min === '' ? undefined : Number(min);
    const hi = max === '' ? undefined : Number(max);
    if ((lo !== undefined && (isNaN(lo) || lo < 0)) || (hi !== undefined && (isNaN(hi) || hi < 0)))
      return setPriceError('Prices must be positive numbers');
    if (lo !== undefined && hi !== undefined && lo > hi) return setPriceError('Min price cannot be greater than max price');
    setPriceError(undefined);
    onApply({ ...values, minPrice: min || undefined, maxPrice: max || undefined });
  };

  const radio = 'flex cursor-pointer items-center gap-2 py-1 text-sm';
  const selectedBrands = values.brand?.split(',').filter(Boolean) ?? [];

  return (
    <aside className="space-y-6" data-testid="product-filters">
      <section>
        <h3 className="mb-2 font-semibold">Category</h3>
        <label className={radio}>
          <input type="radio" name="category" checked={!values.category} onChange={() => onApply({ ...values, category: undefined })} data-testid="filter-category-all" />
          All categories
        </label>
        {tree.map((c) => (
          <div key={c.id}>
            <label className={radio}>
              <input type="radio" name="category" checked={values.category === c.slug} onChange={() => onApply({ ...values, category: c.slug })} data-testid={`filter-category-${c.slug}`} />
              {c.name} <span className="text-xs text-muted-foreground">({c._count?.products ?? 0})</span>
            </label>
            {c.children?.map((ch) => (
              <label key={ch.id} className={`${radio} pl-5`}>
                <input type="radio" name="category" checked={values.category === ch.slug} onChange={() => onApply({ ...values, category: ch.slug })} data-testid={`filter-category-${ch.slug}`} />
                {ch.name}
              </label>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Price range</h3>
        <div className="flex items-center gap-2">
          <input type="number" min={0} placeholder="Min" value={min} onChange={(e) => setMin(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" aria-label="Minimum price" data-testid="filter-price-min" />
          <span>–</span>
          <input type="number" min={0} placeholder="Max" value={max} onChange={(e) => setMax(e.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" aria-label="Maximum price" data-testid="filter-price-max" />
        </div>
        {priceError && (
          <p className="mt-1 text-xs text-destructive" role="alert" data-testid="filter-price-error">
            {priceError}
          </p>
        )}
        <Button size="sm" variant="outline" className="mt-2 w-full" onClick={applyPrice} data-testid="filter-price-apply">
          Apply price
        </Button>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Customer rating</h3>
        {[4, 3, 2, 1].map((r) => (
          <label key={r} className={radio}>
            <input type="radio" name="rating" checked={values.rating === String(r)} onChange={() => onApply({ ...values, rating: String(r) })} data-testid={`filter-rating-${r}`} />
            <StarRating value={r} size={14} /> & up
          </label>
        ))}
        {values.rating && (
          <button className="text-xs text-primary hover:underline" onClick={() => onApply({ ...values, rating: undefined })} data-testid="filter-rating-clear">
            Clear rating
          </button>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Availability</h3>
        {[
          { v: undefined, l: 'All', id: 'all' },
          { v: 'in_stock', l: 'In stock', id: 'in-stock' },
          { v: 'out_of_stock', l: 'Out of stock', id: 'out-of-stock' },
        ].map((o) => (
          <label key={o.id} className={radio}>
            <input type="radio" name="availability" checked={values.availability === o.v} onChange={() => onApply({ ...values, availability: o.v })} data-testid={`filter-availability-${o.id}`} />
            {o.l}
          </label>
        ))}
      </section>

      {brands.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold">Brand</h3>
          <div className="max-h-48 overflow-y-auto">
            {brands.map((b) => {
              const checked = selectedBrands.includes(b.name);
              return (
                <label key={b.name} className={radio}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked ? selectedBrands.filter((x) => x !== b.name) : [...selectedBrands, b.name];
                      onApply({ ...values, brand: next.length ? next.join(',') : undefined });
                    }}
                    data-testid={`filter-brand-${b.name.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  {b.name} <span className="text-xs text-muted-foreground">({b.count})</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <Button variant="ghost" className="w-full" onClick={onReset} data-testid="filter-reset-btn">
        Reset all filters
      </Button>
    </aside>
  );
}
