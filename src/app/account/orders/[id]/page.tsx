'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, XCircle } from 'lucide-react';
import type { Order } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { toast } from '@/store/toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/account/order-status-badge';
import { OrderTimeline } from '@/components/account/order-timeline';
import { AddressBlock } from '@/components/account/address-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { ErrorState, Spinner } from '@/components/ui/states';
import { Textarea } from '@/components/ui/textarea';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const SHIPPING_LABEL = { STANDARD: 'Standard', EXPRESS: 'Express', SAME_DAY: 'Same-day' };

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order, loading, error, reload, setData } = useApi<Order>(`/api/orders/${params.id}`);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();
  const [cancelling, setCancelling] = useState(false);

  if (loading && !order) return <Spinner label="Loading order…" />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} testId="order-detail-error" />;

  const cancel = async () => {
    setReasonError(undefined);
    if (reason.trim().length < 3) return setReasonError('Please provide a reason (at least 3 characters)');
    setCancelling(true);
    try {
      await api(`/api/orders/${order.id}/cancel`, { method: 'POST', body: { reason } });
      toast.success('Order cancelled');
      setCancelOpen(false);
      setData(null);
      reload();
    } catch (e) {
      setReasonError(fieldErrors(e).reason ?? errorMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="order-detail-page">
      <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Orders', href: '/account/orders' }, { label: order.orderNumber }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Order <span className="font-mono" data-testid="order-detail-number">{order.orderNumber}</span>
          </h1>
          <p className="text-sm text-muted-foreground">Placed on {formatDate(order.createdAt, true)}</p>
          <div className="mt-2 flex gap-2">
            <OrderStatusBadge status={order.status} testId="order-detail-status" />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          {order.status !== 'CANCELLED' && (
            <a href={`/api/orders/${order.id}/invoice`} download>
              <Button variant="outline" data-testid="download-invoice-btn">
                <Download className="h-4 w-4" /> Download invoice
              </Button>
            </a>
          )}
          {order.status === 'PENDING' && (
            <Button variant="destructive" onClick={() => setCancelOpen(true)} data-testid="cancel-order-btn">
              <XCircle className="h-4 w-4" /> Cancel order
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y" data-testid="order-items">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3" data-testid="order-item">
                    <img src={i.image ?? '/favicon.svg'} alt="" className="h-14 w-14 rounded object-cover" />
                    <div className="flex-1">
                      {i.product ? (
                        <Link href={`/products/${i.product.slug}`} className="text-sm font-medium hover:text-primary" data-testid="order-item-product-link">
                          {i.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium">{i.name}</p>
                      )}
                      {i.variantName && <p className="text-xs text-muted-foreground">{i.variantName}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(i.unitPrice)} × {i.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{formatPrice(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span data-testid="order-subtotal">{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping ({SHIPPING_LABEL[order.shippingMethod]})</span><span data-testid="order-shipping">{formatPrice(order.shippingCost)}</span></div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span data-testid="order-discount">-{formatPrice(order.discount)}</span></div>
                )}
                <div className="flex justify-between"><span>Tax</span><span data-testid="order-tax">{formatPrice(order.tax)}</span></div>
                <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span data-testid="order-total">{formatPrice(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Order tracking</CardTitle>
              {order.trackingNumber && (
                <p className="text-sm">
                  Tracking number: <span className="font-mono" data-testid="order-tracking-number">{order.trackingNumber}</span>
                </p>
              )}
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressBlock a={order.shippingAddress} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm" data-testid="order-payment-method">
              {order.paymentMethod}
            </CardContent>
          </Card>
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{order.notes}</CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this order?"
        testId="cancel-order-dialog"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)} data-testid="cancel-order-dialog-dismiss">
              Keep order
            </Button>
            <Button variant="destructive" onClick={cancel} loading={cancelling} data-testid="cancel-order-dialog-confirm">
              Cancel order
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">Only pending orders can be cancelled. Any payment will be refunded.</p>
        <Textarea label="Reason for cancellation" required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} showCount error={reasonError} testId="cancel-reason-input" />
      </Modal>
    </div>
  );
}
