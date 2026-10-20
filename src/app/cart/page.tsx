'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/store/toast';
import { ApiClientError, errorMessage } from '@/lib/client';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { EmptyState } from '@/components/ui/states';
import { StockBadge } from '@/components/ui/stock-badge';
import { ConfirmDialog } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';

const TAX_RATE = 0.1;
const FREE_SHIPPING = 100;
const STANDARD_SHIPPING = 5.99;

function CartRow({ item }: { item: CartItem }) {
  const { update, remove } = useCartStore();
  const [qty, setQty] = useState(String(item.quantity));
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  useEffect(() => setQty(String(item.quantity)), [item.quantity]);

  const commit = async (n: number) => {
    setError(undefined);
    if (!Number.isInteger(n) || n < 1) return setError('Quantity must be at least 1');
    if (n > 99) return setError('Quantity cannot exceed 99');
    if (n > item.availableStock) return setError(`Only ${item.availableStock} available`);
    setBusy(true);
    try {
      await update(item.id, n);
    } catch (e) {
      setError(errorMessage(e));
      setQty(String(item.quantity));
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    try {
      await remove(item.id);
      toast.success(`${item.name} removed from cart`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <li className="flex gap-4 border-b py-4" data-testid="cart-item" data-item-id={item.id}>
      <Link href={`/products/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted" data-testid="cart-item-image-link">
        <img src={item.image ?? '/favicon.svg'} alt={item.name} className="h-full w-full object-cover" />
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex justify-between gap-2">
          <div>
            <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary" data-testid="cart-item-name">
              {item.name}
            </Link>
            {item.variantName && (
              <p className="text-xs text-muted-foreground" data-testid="cart-item-variant">
                {item.variantName}
              </p>
            )}
          </div>
          <p className="font-semibold" data-testid="cart-item-line-total">
            {formatPrice(item.unitPrice * item.quantity)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground" data-testid="cart-item-unit-price">
          {formatPrice(item.unitPrice)} each
        </p>
        {item.stockStatus !== 'IN_STOCK' && <StockBadge status={item.stockStatus} stock={item.availableStock} testId="cart-item-stock" />}
        <div className="mt-1 flex items-center gap-3">
          <div className="flex items-center rounded-md border">
            <button className="p-1.5 disabled:opacity-40" disabled={busy || item.quantity <= 1} onClick={() => commit(item.quantity - 1)} aria-label="Decrease quantity" data-testid="cart-item-decrease-btn">
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={qty}
              min={1}
              max={99}
              onChange={(e) => setQty(e.target.value)}
              onBlur={() => Number(qty) !== item.quantity && commit(Number(qty))}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="h-8 w-12 border-x bg-background text-center text-sm [appearance:textfield]"
              aria-label={`Quantity for ${item.name}`}
              data-testid="cart-item-quantity-input"
            />
            <button className="p-1.5 disabled:opacity-40" disabled={busy || item.quantity >= Math.min(99, item.availableStock)} onClick={() => commit(item.quantity + 1)} aria-label="Increase quantity" data-testid="cart-item-increase-btn">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button onClick={onRemove} className="inline-flex items-center gap-1 text-sm text-destructive hover:underline" data-testid="cart-item-remove-btn">
            <Trash2 className="h-4 w-4" /> Remove
          </button>
        </div>
        {error && (
          <p className="text-xs text-destructive" role="alert" data-testid="cart-item-error">
            {error}
          </p>
        )}
      </div>
    </li>
  );
}

export default function CartPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const { server, guestItems, loading, load, clear } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [checking, setChecking] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (user) load().catch(() => undefined);
  }, [user, load]);

  const items = user ? (server?.items ?? []) : guestItems;
  const subtotal = Math.round(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) * 100) / 100;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : STANDARD_SHIPPING;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  const count = items.reduce((s, i) => s + i.quantity, 0);

  const checkout = async () => {
    if (!user) {
      toast.info('Please log in to checkout. Your cart will be saved.');
      router.push('/login?redirect=/checkout');
      return;
    }
    setChecking(true);
    setIssues([]);
    try {
      // 422 carries the issue list in the body, so read it directly instead of via api().
      const res = await fetch('/api/cart/validate', { method: 'POST', credentials: 'same-origin' });
      const json = await res.json();
      if (res.ok) router.push('/checkout');
      else if (res.status === 422) {
        setIssues((json.data?.issues ?? []).map((i: { message: string }) => i.message));
        toast.error('Please fix the issues in your cart before checkout');
      } else throw new ApiClientError(res.status, json.message ?? 'Unable to validate cart');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  if (!mounted || authStatus !== 'ready' || (user && !server && loading))
    return (
      <div className="container py-8" data-testid="cart-loading">
        <Skeleton className="mb-4 h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  return (
    <div className="container py-6" data-testid="cart-page">
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <h1 className="mb-6 text-2xl font-bold">
        Shopping cart <span className="text-base font-normal text-muted-foreground" data-testid="cart-item-count">({count} item{count === 1 ? '' : 's'})</span>
      </h1>
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          testId="cart-empty"
          action={
            <Link href="/products">
              <Button data-testid="cart-continue-shopping-btn">Continue shopping</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {issues.length > 0 && (
              <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert" data-testid="cart-validation-errors">
                <ul className="list-inside list-disc">
                  {issues.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <ul data-testid="cart-items">
              {items.map((i) => (
                <CartRow key={i.id} item={i} />
              ))}
            </ul>
            <div className="mt-4 flex justify-between">
              <Link href="/products" className="text-sm text-primary hover:underline" data-testid="cart-continue-shopping-link">
                ← Continue shopping
              </Link>
              <button onClick={() => setConfirmClear(true)} className="text-sm text-destructive hover:underline" data-testid="cart-clear-btn">
                Clear cart
              </button>
            </div>
          </div>
          <aside className="h-fit space-y-3 rounded-lg border p-5" data-testid="cart-summary">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated shipping</span>
              <span data-testid="cart-shipping">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Estimated tax (10%)</span>
              <span data-testid="cart-tax">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Discount</span>
              <span data-testid="cart-discount">Apply at checkout</span>
            </div>
            {subtotal < FREE_SHIPPING && (
              <p className="rounded bg-primary/10 p-2 text-xs text-primary" data-testid="cart-free-shipping-hint">
                Add {formatPrice(FREE_SHIPPING - subtotal)} more for free standard shipping!
              </p>
            )}
            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>Total</span>
              <span data-testid="cart-total">{formatPrice(total)}</span>
            </div>
            <Button className="w-full" size="lg" onClick={checkout} loading={checking} data-testid="checkout-btn">
              Proceed to checkout
            </Button>
          </aside>
        </div>
      )}
      <ConfirmDialog
        open={confirmClear}
        title="Clear cart?"
        message="All items will be removed from your cart."
        confirmLabel="Clear cart"
        destructive
        onConfirm={async () => {
          await clear().catch((e) => toast.error(errorMessage(e)));
          setConfirmClear(false);
          toast.success('Cart cleared');
        }}
        onCancel={() => setConfirmClear(false)}
        testId="clear-cart-dialog"
      />
    </div>
  );
}
