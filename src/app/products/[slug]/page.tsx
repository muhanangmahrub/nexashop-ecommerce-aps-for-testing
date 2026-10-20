import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/lib/product-detail';
import type { ProductDetail } from '@/types';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ProductGallery } from '@/components/product/gallery';
import { ProductPurchase } from '@/components/product/product-purchase';
import { ProductTabs } from '@/components/product/product-tabs';
import { RelatedProducts } from '@/components/product/related-products';
import { ReviewsSection } from '@/components/reviews/reviews-section';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'Product not found' };
  return { title: product.name, description: product.description.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const raw = await getProductBySlug(params.slug);
  if (!raw) notFound();
  const product = raw as unknown as ProductDetail;
  const crumbs = [
    { label: 'Products', href: '/products' },
    ...(product.category.parent ? [{ label: product.category.parent.name, href: `/products?category=${product.category.parent.slug}` }] : []),
    { label: product.category.name, href: `/products?category=${product.category.slug}` },
    { label: product.name },
  ];
  return (
    <div className="container py-6" data-testid="product-detail-page" data-product-id={product.id}>
      <Breadcrumbs items={crumbs} />
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <ProductPurchase product={product} />
      </div>
      <ProductTabs description={product.description} specs={product.specs} />
      <ErrorBoundary>
        <ReviewsSection slug={product.slug} />
      </ErrorBoundary>
      <ErrorBoundary>
        <RelatedProducts slug={product.slug} />
      </ErrorBoundary>
    </div>
  );
}
