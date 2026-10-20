'use client';

import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import type { ProductCard as ProductCardType } from '@/types';
import { useAddToCart } from '@/hooks/use-cart-actions';
import { useWishlistToggle } from '@/hooks/use-wishlist-toggle';
import { Price } from '@/components/ui/price';
import { StarRating } from '@/components/ui/star-rating';
import { StockBadge } from '@/components/ui/stock-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ProductCard({ product }: { product: ProductCardType }) {
  const { addToCart, pending } = useAddToCart();
  const { toggle, has } = useWishlistToggle();
  const wished = has(product.id);
  const out = product.stockStatus === 'OUT_OF_STOCK';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md" data-testid="product-card" data-product-id={product.id} data-product-slug={product.slug}>
      <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted" data-testid="product-card-link">
        <img src={product.image ?? '/favicon.svg'} alt={product.name} loading="lazy" className={cn('h-full w-full object-cover transition-transform duration-300 group-hover:scale-105', out && 'opacity-60')} />
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white" data-testid="product-card-sale-badge">
            SALE
          </span>
        )}
      </Link>
      <button
        onClick={() => toggle(product.id, product.name)}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={wished}
        className="absolute right-2 top-2 rounded-full bg-background/90 p-2 shadow hover:scale-110"
        data-testid="product-card-wishlist-btn"
      >
        <Heart className={cn('h-4 w-4', wished && 'fill-red-500 text-red-500')} />
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground" data-testid="product-card-brand">
          {product.brand}
        </p>
        <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-primary" data-testid="product-card-name">
          {product.name}
        </Link>
        <div className="flex items-center gap-1">
          <StarRating value={product.ratingAvg} size={14} testId="product-card-rating" />
          <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
        </div>
        <Price price={product.price} compareAt={product.compareAtPrice} testId="product-card-price" />
        <div>
          <StockBadge status={product.stockStatus} testId="product-card-stock" />
        </div>
        <div className="mt-auto pt-2">
          {product.hasVariants ? (
            <Link href={`/products/${product.slug}`}>
              <Button variant="outline" size="sm" className="w-full" disabled={out} data-testid="product-card-select-options-btn">
                Select options
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              className="w-full"
              disabled={out}
              loading={pending}
              data-testid="product-card-add-to-cart-btn"
              onClick={() =>
                addToCart({
                  productId: product.id,
                  variantId: null,
                  quantity: 1,
                  name: product.name,
                  slug: product.slug,
                  image: product.image,
                  variantName: null,
                  unitPrice: product.price,
                  availableStock: product.stock,
                })
              }
            >
              <ShoppingCart className="h-4 w-4" /> {out ? 'Out of stock' : 'Add to cart'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({ products, testId = 'product-grid' }: { products: ProductCardType[]; testId?: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid={testId}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
