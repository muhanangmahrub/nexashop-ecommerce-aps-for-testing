import { errors, handler, ok } from '@/lib/api';
import { getProductBySlug } from '@/lib/product-detail';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { params }) => {
  const product = await getProductBySlug(params.slug);
  if (!product) throw errors.notFound('Product not found');
  return ok(product);
});
