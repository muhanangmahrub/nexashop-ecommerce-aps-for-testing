'use client';

import { useMemo, useState } from 'react';
import { Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { ProductDetail } from '@/types';
import { useAddToCart } from '@/hooks/use-cart-actions';
import { useWishlistToggle } from '@/hooks/use-wishlist-toggle';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { StockBadge } from '@/components/ui/stock-badge';
import { StarRating } from '@/components/ui/star-rating';
import { cn, stockStatus } from '@/lib/utils';
import { ShareButtons } from './share-buttons';

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { addToCart, pending } = useAddToCart();
  const { toggle, has } = useWishlistToggle();
  const colors = useMemo(() => Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[], [product.variants]);
  const sizes = useMemo(() => Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[], [product.variants]);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0] : null);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0] : null);
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState<string>();
  const [variantError, setVariantError] = useState<string>();

  const hasVariants = product.variants.length > 0;
  const variant = hasVariants
    ? product.variants.find((v) => (colors.length ? v.color === color : true) && (sizes.length ? v.size === size : true)) ?? null
    : null;
  const available = hasVariants ? (variant?.stock ?? 0) : product.stock;
  const status = hasVariants && !variant ? product.stockStatus : stockStatus(available, product.lowStockThreshold);
  const price = product.price + (variant?.priceDelta ?? 0);

  const sizeAvailable = (s: string) => product.variants.some((v) => v.size === s && (!color || v.color === color) && v.stock > 0);
  const colorAvailable = (c: string) => product.variants.some((v) => v.color === c && (!size || v.size === size) && v.stock > 0);

  const changeQty = (n: number) => {
    setQtyError(undefined);
    if (Number.isNaN(n)) return setQty(1);
    setQty(n);
    if (n < 1) setQtyError('Quantity must be at least 1');
    else if (n > 99) setQtyError('Quantity cannot exceed 99');
    else if ((!hasVariants || variant) && n > available) setQtyError(`Only ${available} item(s) available`);
  };

  const onAdd = async () => {
    if (hasVariants && !variant) {
      setVariantError(`Please select ${[colors.length && !color ? 'a color' : '', sizes.length && !size ? 'a size' : ''].filter(Boolean).join(' and ')}`);
      return;
    }
    setVariantError(undefined);
    if (qty < 1 || qty > 99 || qty > available) return changeQty(qty);
    const ok = await addToCart({
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: qty,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url ?? null,
      variantName: variant ? [variant.size, variant.color].filter(Boolean).join(' / ') : null,
      unitPrice: price,
      availableStock: available,
    });
    if (ok) setQty(1);
  };

  const chip = (selected: boolean, disabled: boolean) =>
    cn('min-w-12 rounded-md border px-3 py-1.5 text-sm transition-colors', selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary', disabled && 'cursor-not-allowed opacity-40 line-through');

  return (
    <div className="space-y-5" data-testid="product-purchase">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground" data-testid="product-brand">
          {product.brand}
        </p>
        <h1 className="text-2xl font-bold md:text-3xl" data-testid="product-title">
          {product.name}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <StarRating value={product.ratingAvg} testId="product-rating" />
          <a href="#reviews" className="text-sm text-muted-foreground hover:underline" data-testid="product-review-count">
            {product.ratingAvg.toFixed(1)} ({product.ratingCount} reviews)
          </a>
          <span className="text-sm text-muted-foreground">· {product.soldCount} sold</span>
        </div>
      </div>
      <Price price={price} compareAt={product.compareAtPrice ? product.compareAtPrice + (variant?.priceDelta ?? 0) : null} className="text-2xl" testId="product-detail-price" />
      <div className="flex items-center gap-2">
        <StockBadge status={status} stock={available} testId="stock-indicator" />
        <span className="text-xs text-muted-foreground" data-testid="product-sku">
          SKU: {variant?.sku ?? product.sku}
        </span>
      </div>

      {colors.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Color: <span className="text-muted-foreground" data-testid="selected-color">{color ?? 'Select'}</span>
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color" data-testid="variant-color-options">
            {colors.map((c) => (
              <button key={c} role="radio" aria-checked={color === c} className={chip(color === c, !colorAvailable(c))} onClick={() => (setColor(color === c ? null : c), setVariantError(undefined), setQtyError(undefined))} data-testid={`variant-color-${c.toLowerCase().replace(/\s+/g, '-')}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">
            Size: <span className="text-muted-foreground" data-testid="selected-size">{size ?? 'Select'}</span>
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size" data-testid="variant-size-options">
            {sizes.map((s) => (
              <button key={s} role="radio" aria-checked={size === s} className={chip(size === s, !sizeAvailable(s))} onClick={() => (setSize(size === s ? null : s), setVariantError(undefined), setQtyError(undefined))} data-testid={`variant-size-${s.toLowerCase().replace(/\s+/g, '-')}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {variantError && (
        <p className="text-sm text-destructive" role="alert" data-testid="variant-error">
          {variantError}
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Quantity</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <button className="p-2 disabled:opacity-40" onClick={() => changeQty(qty - 1)} disabled={qty <= 1} aria-label="Decrease quantity" data-testid="quantity-decrease-btn">
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={qty}
              min={1}
              max={99}
              onChange={(e) => changeQty(parseInt(e.target.value, 10))}
              className="h-10 w-14 border-x bg-background text-center text-sm [appearance:textfield]"
              aria-label="Quantity"
              data-testid="quantity-input"
            />
            <button className="p-2 disabled:opacity-40" onClick={() => changeQty(qty + 1)} disabled={qty >= 99} aria-label="Increase quantity" data-testid="quantity-increase-btn">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        {qtyError && (
          <p className="mt-1 text-sm text-destructive" role="alert" data-testid="quantity-error">
            {qtyError}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={onAdd} loading={pending} disabled={status === 'OUT_OF_STOCK' && (!hasVariants || Boolean(variant))} data-testid="add-to-cart-btn">
          <ShoppingCart className="h-5 w-5" />
          {status === 'OUT_OF_STOCK' && (!hasVariants || variant) ? 'Out of stock' : 'Add to cart'}
        </Button>
        <Button size="lg" variant="outline" onClick={() => toggle(product.id, product.name)} aria-pressed={has(product.id)} data-testid="add-to-wishlist-btn">
          <Heart className={cn('h-5 w-5', has(product.id) && 'fill-red-500 text-red-500')} />
          <span className="hidden sm:inline">{has(product.id) ? 'Wishlisted' : 'Wishlist'}</span>
        </Button>
      </div>
      <ShareButtons name={product.name} slug={product.slug} />
    </div>
  );
}
