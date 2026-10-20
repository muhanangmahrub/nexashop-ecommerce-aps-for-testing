'use client';

import { useState } from 'react';
import { MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import type { Address } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage } from '@/lib/client';
import { toast } from '@/store/toast';
import { AddressBlock, AddressForm } from '@/components/account/address-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export default function AddressesPage() {
  const { data, loading, error, reload } = useApi<Address[]>('/api/addresses');
  const [editing, setEditing] = useState<Address | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);

  const setDefault = async (a: Address) => {
    try {
      await api(`/api/addresses/${a.id}/default`, { method: 'POST' });
      toast.success(`${a.label} set as default address`);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/addresses/${deleting.id}`, { method: 'DELETE' });
      toast.success('Address deleted');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="addresses-page">
      <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Addresses' }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My addresses</h1>
        <Button onClick={() => setEditing('new')} data-testid="add-address-btn">
          <Plus className="h-4 w-4" /> Add address
        </Button>
      </div>
      {loading && !data ? (
        <Skeleton className="h-40 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={<MapPin className="h-10 w-10" />} title="No saved addresses" description="Add an address for faster checkout." testId="addresses-empty" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="address-list">
          {data.map((a) => (
            <Card key={a.id} data-testid="address-card" data-address-id={a.id} data-default={a.isDefault}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" data-testid="address-card-label">{a.label}</span>
                  {a.isDefault && <Badge data-testid="address-default-badge">Default</Badge>}
                </div>
                <AddressBlock a={a} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(a)} data-testid="address-edit-btn">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {!a.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(a)} data-testid="address-set-default-btn">
                      <Star className="h-3.5 w-3.5" /> Set default
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(a)} data-testid="address-delete-btn">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add address' : 'Edit address'} testId="address-modal" className="max-w-2xl">
        {editing !== null && (
          <AddressForm
            address={editing === 'new' ? null : editing}
            onSaved={() => {
              toast.success(editing === 'new' ? 'Address added' : 'Address updated');
              setEditing(null);
              reload();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete address?"
        message={`Are you sure you want to delete "${deleting?.label}"?`}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
        testId="delete-address-dialog"
      />
    </div>
  );
}
