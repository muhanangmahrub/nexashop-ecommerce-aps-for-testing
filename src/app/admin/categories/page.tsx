'use client';

import { useState } from 'react';
import { CornerDownRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Category } from '@/types';
import { useApi } from '@/hooks/use-api';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { categoryInputSchema } from '@/lib/validation';
import { toast } from '@/store/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal, ConfirmDialog } from '@/components/ui/modal';
import { ErrorState, FormError } from '@/components/ui/states';
import { TableSkeleton } from '@/components/ui/skeleton';

type Cat = Category & { _count: { products: number; children: number } };

function CategoryForm({ category, all, onDone }: { category: Cat | null; all: Cat[]; onDone: () => void }) {
  const [v, setV] = useState({ name: category?.name ?? '', slug: category?.slug ?? '', description: category?.description ?? '', parentId: category?.parentId ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const r = validate(categoryInputSchema, { ...v, parentId: v.parentId || null });
    if (r.errors) return setErrors(r.errors);
    setErrors({});
    setSaving(true);
    try {
      if (category) await api(`/api/admin/categories/${category.id}`, { method: 'PATCH', body: r.data });
      else await api('/api/admin/categories', { method: 'POST', body: r.data });
      toast.success(category ? 'Category updated' : 'Category created');
      onDone();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="category-form">
      <FormError message={formError} testId="category-form-error" />
      <Input label="Name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} testId="category-name-input" />
      <Input label="Slug" value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} error={errors.slug} hint="Leave empty to generate from name" testId="category-slug-input" />
      <Select
        label="Parent category"
        value={v.parentId}
        onChange={(e) => setV({ ...v, parentId: e.target.value })}
        error={errors.parentId}
        placeholder="None (top level)"
        options={all.filter((c) => c.id !== category?.id).map((c) => ({ value: c.id, label: c.name }))}
        testId="category-parent-select"
      />
      <Textarea label="Description" value={v.description} maxLength={500} showCount onChange={(e) => setV({ ...v, description: e.target.value })} error={errors.description} testId="category-description-input" />
      <Button type="submit" loading={saving} data-testid="category-save-btn">
        {category ? 'Save changes' : 'Create category'}
      </Button>
    </form>
  );
}

export default function AdminCategoriesPage() {
  const { data, loading, error, reload } = useApi<Cat[]>('/api/admin/categories');
  const [editing, setEditing] = useState<Cat | null | 'new'>(null);
  const [deleting, setDeleting] = useState<Cat | null>(null);
  const [busy, setBusy] = useState(false);

  const roots = data?.filter((c) => !c.parentId) ?? [];
  const childrenOf = (id: string) => data?.filter((c) => c.parentId === id) ?? [];

  const doDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/api/admin/categories/${deleting.id}`, { method: 'DELETE' });
      toast.success('Category deleted');
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ c, depth }: { c: Cat; depth: number }) => (
    <>
      <tr className="border-t" data-testid="admin-category-row" data-category-id={c.id}>
        <td className="p-3" style={{ paddingLeft: 12 + depth * 24 }}>
          <span className="flex items-center gap-1 font-medium">
            {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />}
            <span data-testid="admin-category-name">{c.name}</span>
          </span>
        </td>
        <td className="p-3 font-mono text-xs">{c.slug}</td>
        <td className="p-3 text-right">{c._count.products}</td>
        <td className="p-3">
          <div className="flex justify-end gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditing(c)} aria-label="Edit" data-testid="admin-category-edit-btn">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setDeleting(c)} aria-label="Delete" data-testid="admin-category-delete-btn">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </td>
      </tr>
      {childrenOf(c.id).map((ch) => (
        <Row key={ch.id} c={ch} depth={depth + 1} />
      ))}
    </>
  );

  return (
    <div className="space-y-4" data-testid="admin-categories-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setEditing('new')} data-testid="admin-add-category-btn">
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>
      {loading && !data ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" data-testid="admin-categories-table">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3 text-right">Products</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {roots.map((c) => (
                <Row key={c.id} c={c} depth={0} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add category' : 'Edit category'} testId="category-modal">
        {editing !== null && (
          <CategoryForm
            category={editing === 'new' ? null : editing}
            all={data ?? []}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category?"
        message={deleting?._count.products ? `"${deleting.name}" has ${deleting._count.products} product(s) and cannot be deleted until they are reassigned.` : `Delete "${deleting?.name}"? Subcategories will move up one level.`}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setDeleting(null)}
        testId="delete-category-dialog"
      />
    </div>
  );
}
