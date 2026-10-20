'use client';

import { Fragment, useState } from 'react';
import { AlertTriangle, PackageX, Save } from 'lucide-react';
import type { PageMeta, StockStatus } from '@/types';
import { useApi } from '@/hooks/use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { api, errorMessage } from '@/lib/client';
import { toast } from '@/store/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StockBadge } from '@/components/ui/stock-badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';
import { inputClass } from '@/components/ui/input';

type Row = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  variants: { id: string; sku: string; size: string | null; color: string | null; stock: number }[];
};
type Resp = { items: Row[]; meta: PageMeta; alerts: { lowStock: number; outOfStock: number } };

const key = (productId: string, variantId?: string) => `${productId}:${variantId ?? ''}`;

export default function AdminInventoryPage() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dq = useDebounce(q, 350);
  const { data, loading, error, reload } = useApi<Resp>(`/api/admin/inventory?page=${page}&filter=${filter}${dq ? `&q=${encodeURIComponent(dq)}` : ''}`);

  const invalid = Object.entries(edits).filter(([, v]) => v === '' || !/^\d+$/.test(v) || Number(v) > 100000);
  const dirty = Object.keys(edits).length;

  const save = async () => {
    if (invalid.length) return toast.error('Stock values must be whole numbers between 0 and 100,000');
    setSaving(true);
    try {
      const updates = Object.entries(edits).map(([k, v]) => {
        const [productId, variantId] = k.split(':');
        return { productId, variantId: variantId || null, stock: Number(v) };
      });
      const res = await api<{ updated: number }>('/api/admin/inventory/bulk', { method: 'POST', body: { updates } });
      toast.success(`${res.updated} stock level(s) updated`);
      setEdits({});
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const stockInput = (productId: string, value: number, variantId?: string) => {
    const k = key(productId, variantId);
    const v = edits[k] ?? String(value);
    const bad = edits[k] !== undefined && (v === '' || !/^\d+$/.test(v));
    return (
      <input
        type="number"
        min={0}
        value={v}
        onChange={(e) => setEdits((prev) => (e.target.value === String(value) ? Object.fromEntries(Object.entries(prev).filter(([x]) => x !== k)) : { ...prev, [k]: e.target.value }))}
        className={`h-8 w-24 rounded border bg-background px-2 text-right text-sm ${bad ? 'border-destructive' : 'border-input'} ${edits[k] !== undefined ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
        aria-label={`Stock for ${variantId ?? productId}`}
        aria-invalid={bad || undefined}
        data-testid={variantId ? `inventory-variant-stock-input-${variantId}` : `inventory-stock-input-${productId}`}
      />
    );
  };

  return (
    <div className="space-y-4" data-testid="admin-inventory-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={save} disabled={!dirty} loading={saving} data-testid="inventory-save-btn">
          <Save className="h-4 w-4" /> Save {dirty > 0 && `(${dirty})`}
        </Button>
      </div>
      {data && (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="inventory-alerts">
          <Card>
            <CardContent className="flex items-center gap-3 pt-5">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold" data-testid="inventory-low-stock-count">{data.alerts.lowStock}</p>
                <p className="text-sm text-muted-foreground">Low stock products</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-5">
              <PackageX className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold" data-testid="inventory-out-of-stock-count">{data.alerts.outOfStock}</p>
                <p className="text-sm text-muted-foreground">Out of stock products</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={q} onChange={(e) => (setQ(e.target.value), setPage(1))} placeholder="Search name or SKU" className={inputClass} data-testid="inventory-search" aria-label="Search inventory" />
        <select value={filter} onChange={(e) => (setFilter(e.target.value), setPage(1))} className={inputClass} data-testid="inventory-filter" aria-label="Filter">
          <option value="all">All products</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState title="No products match" testId="inventory-empty" />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="inventory-table">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Product / Variant</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <Fragment key={p.id}>
                  <tr className="border-t" data-testid="inventory-row" data-product-id={p.id}>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 font-mono text-xs">{p.sku}</td>
                    <td className="p-3">
                      <StockBadge status={p.stockStatus} testId="inventory-stock-status" />
                    </td>
                    <td className="p-3 text-right">{p.variants.length ? <span className="text-muted-foreground">{p.stock} (sum)</span> : stockInput(p.id, p.stock)}</td>
                  </tr>
                  {p.variants.map((v) => (
                    <tr key={v.id} className="border-t bg-muted/20" data-testid="inventory-variant-row">
                      <td className="p-2 pl-8 text-muted-foreground">{[v.size, v.color].filter(Boolean).join(' / ')}</td>
                      <td className="p-2 font-mono text-xs">{v.sku}</td>
                      <td className="p-2" />
                      <td className="p-2 text-right">
                        {stockInput(p.id, v.stock, v.id)}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.meta.totalPages} onChange={setPage} testId="inventory-pagination" />}
    </div>
  );
}
