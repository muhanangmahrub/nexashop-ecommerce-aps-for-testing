'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Coupon } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { couponInputSchema } from '@/lib/validation';
import { toast } from '@/store/toast';
import { formatDate, formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyState, ErrorState, FormError } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';

const toDateInput = (d?: string | null) => (d ? d.slice(0, 10) : '');

function CouponForm({ coupon, onDone }: { coupon: Coupon | null; onDone: () => void }) {
  const [v, setV] = useState({
    code: coupon?.code ?? '',
    description: coupon?.description ?? '',
    type: coupon?.type ?? 'PERCENTAGE',
    value: coupon ? String(coupon.value) : '',
    minOrderAmount: coupon ? String(coupon.minOrderAmount) : '0',
    maxDiscount: coupon?.maxDiscount ? String(coupon.maxDiscount) : '',
    usageLimit: coupon?.usageLimit ? String(coupon.usageLimit) : '',
    perUserLimit: coupon ? String(coupon.perUserLimit) : '1',
    isActive: coupon?.isActive ?? true,
    startsAt: toDateInput(coupon?.startsAt) || new Date().toISOString().slice(0, 10),
    expiresAt: toDateInput(coupon?.expiresAt),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV({ ...v, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = { ...v, maxDiscount: v.maxDiscount || null, usageLimit: v.usageLimit || null, expiresAt: v.expiresAt || null, startsAt: v.startsAt || undefined };
    const r = validate(couponInputSchema, payload);
    if (r.errors) return setErrors(r.errors);
    setErrors({});
    setSaving(true);
    try {
      if (coupon) await api(`/api/admin/coupons/${coupon.id}`, { method: 'PATCH', body: r.data });
      else await api('/api/admin/coupons', { method: 'POST', body: r.data });
      toast.success(coupon ? 'Coupon updated' : 'Coupon created');
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="coupon-form">
      <FormError message={formError} testId="coupon-form-error" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Code" required value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} error={errors.code} testId="coupon-code-input" />
        <Select label="Type" required value={v.type} onChange={set('type')} error={errors.type} options={[{ value: 'PERCENTAGE', label: 'Percentage (%)' }, { value: 'FIXED', label: 'Fixed amount ($)' }]} testId="coupon-type-select" />
        <Input label="Value" required type="number" step="0.01" value={v.value} onChange={set('value')} error={errors.value} testId="coupon-value-input" />
        <Input label="Min order ($)" type="number" step="0.01" value={v.minOrderAmount} onChange={set('minOrderAmount')} error={errors.minOrderAmount} testId="coupon-min-order-input" />
        <Input label="Max discount ($)" type="number" step="0.01" value={v.maxDiscount} onChange={set('maxDiscount')} error={errors.maxDiscount} testId="coupon-max-discount-input" />
        <Input label="Total usage limit" type="number" value={v.usageLimit} onChange={set('usageLimit')} error={errors.usageLimit} testId="coupon-usage-limit-input" />
        <Input label="Per-user limit" type="number" value={v.perUserLimit} onChange={set('perUserLimit')} error={errors.perUserLimit} testId="coupon-per-user-input" />
        <div />
        <Input label="Starts" type="date" value={v.startsAt} onChange={set('startsAt')} error={errors.startsAt} testId="coupon-starts-input" />
        <Input label="Expires" type="date" value={v.expiresAt} onChange={set('expiresAt')} error={errors.expiresAt} testId="coupon-expires-input" />
      </div>
      <Input label="Description" value={v.description} onChange={set('description')} error={errors.description} maxLength={200} testId="coupon-description-input" />
      <Checkbox label="Active" checked={v.isActive} onChange={set('isActive')} testId="coupon-active-checkbox" />
      <Button type="submit" loading={saving} data-testid="coupon-save-btn">
        {coupon ? 'Save changes' : 'Create coupon'}
      </Button>
    </form>
  );
}

export default function AdminCouponsPage() {
  const { data, loading, error, reload, setData } = useApi<Coupon[]>('/api/admin/coupons');
  const [editing, setEditing] = useState<Coupon | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);

  const toggleActive = async (c: Coupon) => {
    setData((d) => d?.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)) ?? null);
    try {
      await api(`/api/admin/coupons/${c.id}`, { method: 'PATCH', body: { isActive: !c.isActive } });
      toast.success(`Coupon ${c.code} ${c.isActive ? 'deactivated' : 'activated'}`);
    } catch (e) {
      toast.error(errorMessage(e));
      reload();
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/coupons/${deleting.id}`, { method: 'DELETE' });
      toast.success('Coupon deleted');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  const expired = (c: Coupon) => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div className="space-y-4" data-testid="admin-coupons-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => setEditing('new')} data-testid="admin-add-coupon-btn">
          <Plus className="h-4 w-4" /> Create coupon
        </Button>
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title="No coupons yet" testId="admin-coupons-empty" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="admin-coupons-table">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min order</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Active</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-t" data-testid="admin-coupon-row" data-coupon-code={c.code}>
                  <td className="p-3">
                    <p className="font-mono font-semibold">{c.code}</p>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                  </td>
                  <td className="p-3">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value)}
                    {c.maxDiscount && <span className="text-xs text-muted-foreground"> (max {formatPrice(c.maxDiscount)})</span>}
                  </td>
                  <td className="p-3">{formatPrice(c.minOrderAmount)}</td>
                  <td className="p-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="p-3">{c.expiresAt ? <span className={expired(c) ? 'text-destructive' : ''}>{formatDate(c.expiresAt)}{expired(c) && ' (expired)'}</span> : 'Never'}</td>
                  <td className="p-3">
                    <button role="switch" aria-checked={c.isActive} onClick={() => toggleActive(c)} className={`relative h-6 w-11 rounded-full transition-colors ${c.isActive ? 'bg-primary' : 'bg-muted'}`} data-testid="admin-coupon-active-toggle" aria-label={`Toggle ${c.code}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${c.isActive ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(c)} aria-label="Edit" data-testid="admin-coupon-edit-btn">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(c)} aria-label="Delete" data-testid="admin-coupon-delete-btn">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Create coupon' : 'Edit coupon'} testId="coupon-modal" className="max-w-2xl">
        {editing !== null && (
          <CouponForm
            coupon={editing === 'new' ? null : editing}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete coupon?"
        message={<>Delete coupon <b>{deleting?.code}</b>? Used coupons cannot be deleted — deactivate them instead.</>}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
        testId="delete-coupon-dialog"
      />
    </div>
  );
}
