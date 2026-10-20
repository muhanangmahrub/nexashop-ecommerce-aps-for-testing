import { ProductForm, emptyProduct } from '@/components/admin/product-form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

export const metadata = { title: 'New Product' };

export default function NewProductPage() {
  return (
    <div data-testid="admin-new-product-page">
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Products', href: '/admin/products' }, { label: 'New' }]} />
      <h1 className="mb-6 text-2xl font-bold">Add product</h1>
      <ProductForm initial={emptyProduct} />
    </div>
  );
}
