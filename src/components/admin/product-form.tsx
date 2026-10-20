'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type { Category } from '@/types';
import { api, errorMessage, fieldErrors } from '@/lib/client';
import { validate } from '@/lib/form';
import { productInputSchema } from '@/lib/validation';
import { useApi } from '@/hooks/use-api';
import { toast } from '@/store/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormError } from '@/components/ui/states';

type VariantRow = { id?: string; sku: string; size: string; color: string; priceDelta: string; stock: string };
export type ProductFormValues = {
  name: string;
  slug: string;
  description: string;
  brand: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  lowStockThreshold: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  images: { url: string; alt?: string | null }[];
  specs: { key: string; value: string }[];
  variants: VariantRow[];
};

export const emptyProduct: ProductFormValues = {
  name: '',
  slug: '',
  description: '',
  brand: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  stock: '0',
  lowStockThreshold: '5',
  categoryId: '',
  isActive: true,
  isFeatured: false,
  images: [],
  specs: [],
  variants: [],
};

const MAX_IMAGE = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ProductForm({ initial, productId }: { initial: ProductFormValues; productId?: string }) {
  const router = useRouter();
  const cats = useApi<Category[]>('/api/admin/categories');
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const upload = async (files: FileList | null) => {
    setImageError(undefined);
    if (!files?.length) return;
    if (v.images.length + files.length > 10) return setImageError('A product can have at most 10 images');
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (!TYPES.includes(f.type)) throw new Error(`${f.name}: only JPG, PNG, WEBP and GIF images are allowed`);
        if (f.size > MAX_IMAGE) throw new Error(`${f.name}: image must be 2MB or smaller`);
        const fd = new FormData();
        fd.append('file', f);
        const { url } = await api<{ url: string }>('/api/upload', { method: 'POST', body: fd });
        setV((p) => ({ ...p, images: [...p.images, { url, alt: p.name }] }));
      }
    } catch (e) {
      setImageError(fieldErrors(e).file ?? errorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = {
      ...v,
      compareAtPrice: v.compareAtPrice === '' ? null : v.compareAtPrice,
      specs: Object.fromEntries(v.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value])),
      variants: v.variants.map((r) => ({ ...r, size: r.size || null, color: r.color || null, priceDelta: r.priceDelta || 0 })),
    };
    const res = validate(productInputSchema, payload);
    if (res.errors) {
      setErrors(res.errors);
      setFormError('Please fix the highlighted fields');
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (productId) await api(`/api/admin/products/${productId}`, { method: 'PATCH', body: res.data });
      else await api('/api/admin/products', { method: 'POST', body: res.data });
      toast.success(productId ? 'Product updated' : 'Product created');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setErrors(fieldErrors(err));
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateVariant = (i: number, patch: Partial<VariantRow>) => set('variants', v.variants.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <form onSubmit={submit} noValidate className="space-y-6" data-testid="product-form">
      <FormError message={formError} testId="product-form-error" />
      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Product name" required value={v.name} onChange={(e) => set('name', e.target.value)} error={errors.name} testId="product-name-input" />
          </div>
          <Input label="Slug" value={v.slug} onChange={(e) => set('slug', e.target.value)} error={errors.slug} hint="Leave empty to generate from name" testId="product-slug-input" />
          <Input label="SKU" required value={v.sku} onChange={(e) => set('sku', e.target.value)} error={errors.sku} testId="product-sku-input" />
          <Input label="Brand" required value={v.brand} onChange={(e) => set('brand', e.target.value)} error={errors.brand} testId="product-brand-input" />
          <Select
            label="Category"
            required
            value={v.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            error={errors.categoryId}
            placeholder="Select a category"
            options={(cats.data ?? []).map((c) => ({ value: c.id, label: c.parent ? `${c.parent.name} › ${c.name}` : c.name }))}
            testId="product-category-select"
          />
          <div className="sm:col-span-2">
            <Textarea label="Description" required rows={5} maxLength={5000} showCount value={v.description} onChange={(e) => set('description', e.target.value)} error={errors.description} testId="product-description-input" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; inventory</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <Input label="Price ($)" required type="number" step="0.01" min="0" value={v.price} onChange={(e) => set('price', e.target.value)} error={errors.price} testId="product-price-input" />
          <Input label="Compare-at price ($)" type="number" step="0.01" min="0" value={v.compareAtPrice} onChange={(e) => set('compareAtPrice', e.target.value)} error={errors.compareAtPrice} testId="product-compare-price-input" />
          <Input
            label="Stock"
            required
            type="number"
            min="0"
            value={v.variants.length ? String(v.variants.reduce((s, r) => s + (Number(r.stock) || 0), 0)) : v.stock}
            disabled={v.variants.length > 0}
            hint={v.variants.length ? 'Sum of variant stock' : undefined}
            onChange={(e) => set('stock', e.target.value)}
            error={errors.stock}
            testId="product-stock-input"
          />
          <Input label="Low stock threshold" type="number" min="0" value={v.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} error={errors.lowStockThreshold} testId="product-low-stock-input" />
          <div className="flex gap-6 sm:col-span-4">
            <Checkbox label="Active (visible in store)" checked={v.isActive} onChange={(e) => set('isActive', e.target.checked)} testId="product-active-checkbox" />
            <Checkbox label="Featured" checked={v.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} testId="product-featured-checkbox" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3" data-testid="product-images">
            {v.images.map((img, i) => (
              <div key={img.url + i} className="relative h-24 w-24 overflow-hidden rounded border" data-testid="product-image-item">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-center text-[10px] text-white">Main</span>}
                <button type="button" onClick={() => set('images', v.images.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5" aria-label="Remove image" data-testid="product-image-remove-btn">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex h-24 w-24 flex-col items-center justify-center rounded border-2 border-dashed text-xs text-muted-foreground hover:border-primary" data-testid="product-image-upload-btn">
              <ImagePlus className="h-6 w-6" />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files)} data-testid="product-image-file-input" />
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or GIF up to 2MB each. Max 10 images.</p>
          {(imageError || errors.images) && (
            <p className="text-xs text-destructive" role="alert" data-testid="product-image-error">
              {imageError ?? errors.images}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => set('variants', [...v.variants, { sku: `${v.sku || 'SKU'}-${v.variants.length + 1}`, size: '', color: '', priceDelta: '0', stock: '0' }])} data-testid="add-variant-btn">
            <Plus className="h-4 w-4" /> Add variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-2" data-testid="variant-rows">
          {v.variants.length === 0 && <p className="text-sm text-muted-foreground">No variants. Stock is tracked at product level.</p>}
          {errors.variants && <p className="text-xs text-destructive" role="alert">{errors.variants}</p>}
          {v.variants.map((r, i) => (
            <div key={i} className="grid grid-cols-2 items-end gap-2 rounded border p-2 sm:grid-cols-6" data-testid="variant-row">
              <Input label="SKU" value={r.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} error={errors[`variants.${i}.sku`]} testId={`variant-${i}-sku-input`} />
              <Input label="Size" value={r.size} onChange={(e) => updateVariant(i, { size: e.target.value })} error={errors[`variants.${i}.size`]} testId={`variant-${i}-size-input`} />
              <Input label="Color" value={r.color} onChange={(e) => updateVariant(i, { color: e.target.value })} error={errors[`variants.${i}.color`]} testId={`variant-${i}-color-input`} />
              <Input label="Price +/-" type="number" step="0.01" value={r.priceDelta} onChange={(e) => updateVariant(i, { priceDelta: e.target.value })} testId={`variant-${i}-price-input`} />
              <Input label="Stock" type="number" min="0" value={r.stock} onChange={(e) => updateVariant(i, { stock: e.target.value })} error={errors[`variants.${i}.stock`]} testId={`variant-${i}-stock-input`} />
              <Button type="button" variant="ghost" onClick={() => set('variants', v.variants.filter((_, idx) => idx !== i))} aria-label="Remove variant" data-testid={`variant-${i}-remove-btn`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Specifications</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={() => set('specs', [...v.specs, { key: '', value: '' }])} data-testid="add-spec-btn">
            <Plus className="h-4 w-4" /> Add spec
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {v.specs.map((s, i) => (
            <div key={i} className="flex gap-2" data-testid="spec-row">
              <input value={s.key} onChange={(e) => set('specs', v.specs.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)))} placeholder="Name (e.g. Weight)" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" data-testid={`spec-${i}-key-input`} />
              <input value={s.value} onChange={(e) => set('specs', v.specs.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} placeholder="Value (e.g. 250g)" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" data-testid={`spec-${i}-value-input`} />
              <Button type="button" variant="ghost" onClick={() => set('specs', v.specs.filter((_, idx) => idx !== i))} aria-label="Remove spec" data-testid={`spec-${i}-remove-btn`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" size="lg" loading={saving} data-testid="product-save-btn">
          {productId ? 'Save changes' : 'Create product'}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={() => router.push('/admin/products')} data-testid="product-cancel-btn">
          Cancel
        </Button>
      </div>
    </form>
  );
}
