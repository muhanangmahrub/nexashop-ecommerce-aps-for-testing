'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download } from 'lucide-react';
import type { Order } from '@/types';
import { useApi } from '@/hooks/use-api';
import { formatPrice } from '@/lib/utils';
import { Stepper } from '@/components/checkout/stepper';
import { Button } from '@/components/ui/button';
import { ErrorState, Spinner } from '@/components/ui/states';
import { AddressBlock } from '@/components/account/address-form';

function Success() {
  const id = useSearchParams().get('order');
  const { data: order, loading, error } = useApi<Order>(id ? `/api/orders/${id}` : null);
  if (!id) return <ErrorState message="No order specified." />;
  if (loading) return <Spinner label="Loading your order…" />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} />;
  return (
    <div className="mx-auto max-w-2xl text-center" data-testid="order-confirmation">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
      <h1 className="mt-4 text-3xl font-bold" data-testid="order-confirmation-title">
        Thank you for your order!
      </h1>
      <p className="mt-2 text-muted-foreground">A confirmation email has been sent to your inbox.</p>
      <p className="mt-4 text-lg">
        Order number: <span className="font-mono font-bold" data-testid="order-confirmation-number">{order.orderNumber}</span>
      </p>
      <div className="mt-6 grid gap-4 rounded-lg border p-5 text-left sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase">Shipping to</p>
          <AddressBlock a={order.shippingAddress} />
        </div>
        <div className="space-y-1 text-sm">
          <p>
            Items: <b>{order.items.reduce((s, i) => s + i.quantity, 0)}</b>
          </p>
          <p>
            Payment: <b>{order.paymentMethod}</b>
          </p>
          <p>
            Total: <b data-testid="order-confirmation-total">{formatPrice(order.total)}</b>
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/account/orders/${order.id}`}>
          <Button data-testid="order-confirmation-view-order-btn">View order</Button>
        </Link>
        <a href={`/api/orders/${order.id}/invoice`}>
          <Button variant="outline" data-testid="order-confirmation-invoice-btn">
            <Download className="h-4 w-4" /> Invoice
          </Button>
        </a>
        <Link href="/products">
          <Button variant="outline" data-testid="order-confirmation-continue-btn">
            Continue shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container py-6" data-testid="checkout-success-page">
      <Stepper current={4} />
      <Suspense fallback={<Spinner />}>
        <Success />
      </Suspense>
    </div>
  );
}
