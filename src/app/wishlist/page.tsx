'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import type { ProductCard } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/client';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ProductGridSkeleton } from '@/components/ui/skeleton';
import { Price } from '@/components/ui/price';
import { StockBadge } from '@/components/ui/stock-badge';
import type { Cart } from '@/types';

type Item = { id: string; addedAt: string; product: ProductCard };

export default function WishlistPage() {
  const { data, loading, error, reload, setData } = useApi<Item[]>('/api/wishlist');
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (item: Item) => {
    const prev = data;
    setData((d) => d?.filter((i) => i.id !== item.id) ?? null);
    try {
      await api(`/api/wishlist/${item.product.id}`, { method: 'DELETE' });
      useWishlistStore.getState().remove(item.product.id);
      toast.success(`${item.product.name} removed from wishlist`);
    } catch (e) {
      setData(prev);
      toast.error(errorMessage(e));
    }
  };

  const moveToCart = async (item: Item) => {
    setBusy(item.id);
    try {
      const res = await api<{ cart: Cart; wishlistCount: number }>(`/api/wishlist/${item.product.id}/move-to-cart`, { method: 'POST', body: {} });
      useCartStore.getState().setServer(res.cart);
      useWishlistStore.getState().remove(item.product.id);
      useAuthStore.getState().setCounts({ wishlist: res.wishlistCount });
      setData((d) => d?.filter((i) => i.id !== item.id) ?? null);
      toast.success(`${item.product.name} moved to cart`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container py-6" data-testid="wishlist-page">
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <h1 className="mb-6 text-2xl font-bold">
        My wishlist {data && <span className="text-base font-normal text-muted-foreground" data-testid="wishlist-item-count">({data.length})</span>}
      </h1>
      {loading && !data ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState
          icon={<Heart className="h-12 w-12" />}
          title="Your wishlist is empty"
          description="Save items you love by tapping the heart icon."
          testId="wishlist-empty"
          action={
            <Link href="/products">
              <Button data-testid="wishlist-browse-btn">Browse products</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="wishlist-grid">
          {data.map((item) => (
            <div key={item.id} className="flex flex-col overflow-hidden rounded-lg border" data-testid="wishlist-item" data-product-id={item.product.id}>
              <Link href={`/products/${item.product.slug}`} className="aspect-square bg-muted" data-testid="wishlist-item-image-link">
                <img src={item.product.image ?? '/favicon.svg'} alt={item.product.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Link href={`/products/${item.product.slug}`} className="line-clamp-2 text-sm font-medium" data-testid="wishlist-item-name">
                  {item.product.name}
                </Link>
                <Price price={item.product.price} compareAt={item.product.compareAtPrice} testId="wishlist-item-price" />
                <StockBadge status={item.product.stockStatus} testId="wishlist-item-stock" />
                <p className="text-xs text-muted-foreground">Added {formatDate(item.addedAt)}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  {item.product.hasVariants ? (
                    <Link href={`/products/${item.product.slug}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full" data-testid="wishlist-select-options-btn">
                        Select options
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" className="flex-1" disabled={item.product.stockStatus === 'OUT_OF_STOCK'} loading={busy === item.id} onClick={() => moveToCart(item)} data-testid="wishlist-move-to-cart-btn">
                      <ShoppingCart className="h-4 w-4" /> Move to cart
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => remove(item)} aria-label="Remove from wishlist" data-testid="wishlist-remove-btn">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
