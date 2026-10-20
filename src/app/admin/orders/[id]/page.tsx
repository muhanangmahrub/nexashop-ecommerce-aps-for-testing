'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import type { Order, OrderStatus } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { toast } from '@/store/toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/account/order-status-badge';
import { OrderTimeline } from '@/components/account/order-timeline';
import { AddressBlock } from '@/components/account/address-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ErrorState, FormError, Spinner } from '@/components/ui/states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order, loading, error, reload, setData } = useApi<Order>(`/api/admin/orders/${params.id}`);
  const [status, setStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading && !order) return <Spinner />;
  if (error || !order) return <ErrorState message={error ?? 'Order not found'} onRetry={reload} />;

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setErrors({});
    if (!status) return setErrors({ status: 'Please select a new status' });
    if (status === 'SHIPPED' && !tracking.trim() && !order.trackingNumber) return setErrors({ trackingNumber: 'Tracking number is required when shipping' });
    setSaving(true);
    try {
      const updated = await api<Order>(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { status, trackingNumber: tracking || null, note: note || null } });
      setData(updated);
      setStatus('');
      setNote('');
      toast.success(`Order status updated to ${updated.status}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const allowed = order.allowedTransitions ?? [];
  return (
    <div className="space-y-6" data-testid="admin-order-detail-page">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Orders', href: '/admin/orders' }, { label: order.orderNumber }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold" data-testid="admin-order-number">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt, true)}</p>
          <div className="mt-2 flex gap-2">
            <OrderStatusBadge status={order.status} testId="admin-order-detail-status" />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <a href={`/api/orders/${order.id}/invoice`}>
          <Button variant="outline" disabled={order.status === 'CANCELLED'} data-testid="admin-order-invoice-btn">
            <Download className="h-4 w-4" /> Invoice
          </Button>
        </a>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id} className="border-b" data-testid="admin-order-item">
                      <td className="py-2">
                        {i.name}
                        {i.variantName && <span className="text-xs text-muted-foreground"> ({i.variantName})</span>}
                      </td>
                      <td className="py-2 text-right">
                        {formatPrice(i.unitPrice)} × {i.quantity}
                      </td>
                      <td className="py-2 text-right font-medium">{formatPrice(i.unitPrice * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between"><span>Shipping ({order.shippingMethod})</span><span>{formatPrice(order.shippingCost)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({order.couponCode})</span><span>-{formatPrice(order.discount)}</span></div>}
                <div className="flex justify-between"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
                <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span data-testid="admin-order-total">{formatPrice(order.total)}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update status</CardTitle>
            </CardHeader>
            <CardContent>
              {allowed.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="admin-order-final-status">
                  This order is {order.status.toLowerCase()} and can no longer be updated.
                </p>
              ) : (
                <form onSubmit={update} noValidate className="space-y-3" data-testid="admin-order-status-form">
                  <FormError message={formError} testId="admin-order-status-error" />
                  <Select label="New status" value={status} onChange={(e) => setStatus(e.target.value)} error={errors.status} placeholder="Select status" options={allowed.map((s: OrderStatus) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))} testId="admin-order-status-select" />
                  {(status === 'SHIPPED' || order.trackingNumber) && (
                    <Input label="Tracking number" value={tracking} placeholder={order.trackingNumber ?? ''} onChange={(e) => setTracking(e.target.value)} error={errors.trackingNumber} testId="admin-order-tracking-input" />
                  )}
                  <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} error={errors.note} testId="admin-order-note-input" />
                  <Button type="submit" className="w-full" loading={saving} data-testid="admin-order-update-btn">
                    Update status
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.user?.name}</p>
              <p className="text-muted-foreground">{order.user?.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AddressBlock a={order.shippingAddress} />
              {order.trackingNumber && <p className="text-sm">Tracking: <span className="font-mono">{order.trackingNumber}</span></p>}
              <p className="text-sm">Payment: {order.paymentMethod}</p>
              {order.notes && <p className="text-sm text-muted-foreground">Note: {order.notes}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
