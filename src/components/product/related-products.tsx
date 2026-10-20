'use client';

import type { ProductCard } from '@/types';
import { useApi } from '@/hooks/use-api';
import { ProductGrid } from './product-card';
import { ProductGridSkeleton } from '@/components/ui/skeleton';

export function RelatedProducts({ slug }: { slug: string }) {
  const { data, loading } = useApi<ProductCard[]>(`/api/products/${slug}/related`);
  if (!loading && !data?.length) return null;
  return (
    <section className="mt-12" data-testid="related-products">
      <h2 className="mb-4 text-xl font-bold">You may also like</h2>
      {loading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={data!} testId="related-products-grid" />}
    </section>
  );
}
