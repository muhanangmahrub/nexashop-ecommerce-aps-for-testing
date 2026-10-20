'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category, PageMeta } from '@/types';
import { useApi } from '@/hooks/use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { api, errorMessage } from '@/lib/client';
import { toast } from '@/store/toast';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDialog } from '@/components/ui/modal';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';
import { inputClass } from '@/components/ui/input';

type Row = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { name: string };
  images: { url: string }[];
  _count: { variants: number };
};

export default function AdminProductsPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [stock, setStock] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [confirm, setConfirm] = useState<{ ids: string[]; action: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const dq = useDebounce(q, 350);
  const qs = new URLSearchParams({ page: String(page), pageSize: '20', status, stock, ...(dq && { q: dq }), ...(category && { category }) });
  const { data, loading, error, reload } = useApi<{ items: Row[]; meta: PageMeta }>(`/api/admin/products?${qs}`);
  const cats = useApi<Category[]>('/api/admin/categories');

  const toggleAll = () => {
    if (!data) return;
    const all = data.items.every((r) => selected.has(r.id));
    setSelected(all ? new Set() : new Set(data.items.map((r) => r.id)));
  };
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.action === 'delete-one') {
        const res = await api<{ softDeleted?: boolean; message?: string } | undefined>(`/api/admin/products/${confirm.ids[0]}`, { method: 'DELETE' });
        toast.success(res?.softDeleted ? res.message! : 'Product deleted');
      } else {
        const res = await api<{ affected: number }>('/api/admin/products/bulk', { method: 'POST', body: { ids: confirm.ids, action: confirm.action } });
        toast.success(`${res.affected} product(s) updated`);
      }
      setSelected(new Set());
      setBulkAction('');
      setConfirm(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="admin-products-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button data-testid="admin-add-product-btn">
            <Plus className="h-4 w-4" /> Add product
          </Button>
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <input value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="Search name or SKU…" className={inputClass} data-testid="admin-products-search" aria-label="Search products" />
        <select value={category} onChange={(e) => (setCategory(e.target.value), setPage(1))} className={inputClass} data-testid="admin-products-category-filter" aria-label="Category">
          <option value="">All categories</option>
          {cats.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent ? `${c.parent.name} › ` : ''}
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className={inputClass} data-testid="admin-products-status-filter" aria-label="Status">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={stock} onChange={(e) => (setStock(e.target.value), setPage(1))} className={inputClass} data-testid="admin-products-stock-filter" aria-label="Stock">
          <option value="all">All stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2" data-testid="bulk-actions-bar">
          <span className="text-sm" data-testid="bulk-selected-count">{selected.size} selected</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm" data-testid="bulk-action-select" aria-label="Bulk action">
            <option value="">Choose action…</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="feature">Mark featured</option>
            <option value="unfeature">Remove featured</option>
            <option value="delete">Delete</option>
          </select>
          <Button size="sm" disabled={!bulkAction} onClick={() => setConfirm({ ids: Array.from(selected), action: bulkAction })} data-testid="bulk-apply-btn">
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())} data-testid="bulk-clear-btn">
            Clear
          </Button>
        </div>
      )}
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState title="No products found" testId="admin-products-empty" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="admin-products-table">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">
                  <input type="checkbox" checked={data.items.every((r) => selected.has(r.id))} onChange={toggleAll} aria-label="Select all" data-testid="select-all-checkbox" />
                </th>
                <th className="p-3">Product</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t" data-testid="admin-product-row" data-product-id={p.id}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} data-testid="row-checkbox" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={p.images[0]?.url ?? '/favicon.svg'} alt="" className="h-10 w-10 rounded object-cover" />
                      <span className="font-medium" data-testid="admin-product-name">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs">{p.sku}</td>
                  <td className="p-3">{p.category.name}</td>
                  <td className="p-3 text-right">{formatPrice(p.price)}</td>
                  <td className={`p-3 text-right ${p.stock === 0 ? 'text-destructive' : p.stock <= 5 ? 'text-amber-600' : ''}`}>{p.stock}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Badge variant={p.isActive ? 'success' : 'secondary'} data-testid="admin-product-status">{p.isActive ? 'Active' : 'Inactive'}</Badge>
                      {p.isFeatured && <Badge variant="info">Featured</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/products/${p.id}`}>
                        <Button size="icon" variant="ghost" aria-label="Edit" data-testid="admin-product-edit-btn">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setConfirm({ ids: [p.id], action: 'delete-one' })} data-testid="admin-product-delete-btn">
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
      {data && <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="admin-products-pagination" />}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action.startsWith('delete') ? 'Delete products?' : 'Apply bulk action?'}
        message={confirm?.action.startsWith('delete') ? `This will delete ${confirm.ids.length} product(s). Products with orders will be deactivated instead.` : `Apply "${confirm?.action}" to ${confirm?.ids.length} product(s)?`}
        confirmLabel="Confirm"
        destructive={confirm?.action.startsWith('delete')}
        loading={busy}
        onConfirm={run}
        onCancel={() => setConfirm(null)}
        testId="admin-product-confirm-dialog"
      />
    </div>
  );
}
