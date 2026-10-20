import { Suspense } from 'react';
import { ProductListing } from '@/components/product/product-listing';
import { ProductGridSkeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Products' };

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-6"><ProductGridSkeleton /></div>}>
      <ProductListing mode="catalog" />
    </Suspense>
  );
}
