'use client';

import type { Variant } from '@/types';
import { useApi } from '@/hooks/use-api';
import { ProductForm, type ProductFormValues } from '@/components/admin/product-form';
import { ErrorState, Spinner } from '@/components/ui/states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  specs: Record<string, string>;
  images: { url: string; alt: string | null }[];
  variants: Variant[];
};

function toForm(p: Product): ProductFormValues {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand,
    sku: p.sku,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
    stock: String(p.stock),
    lowStockThreshold: String(p.lowStockThreshold),
    categoryId: p.categoryId,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    specs: Object.entries(p.specs ?? {}).map(([key, value]) => ({ key, value: String(value) })),
    variants: p.variants.map((x) => ({ id: x.id, sku: x.sku, size: x.size ?? '', color: x.color ?? '', priceDelta: String(x.priceDelta), stock: String(x.stock) })),
  };
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { data, loading, error, reload } = useApi<Product>(`/api/admin/products/${params.id}`);
  return (
    <div data-testid="admin-edit-product-page">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Products', href: '/admin/products' }, { label: data?.name ?? 'Edit' }]} />
      <h1 className="mb-6 text-2xl font-bold">Edit product</h1>
      {loading && !data ? <Spinner /> : error || !data ? <ErrorState message={error ?? 'Not found'} onRetry={reload} /> : <ProductForm initial={toForm(data)} productId={data.id} />}
    </div>
  );
}
