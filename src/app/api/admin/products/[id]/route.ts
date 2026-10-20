import { prisma } from '@/lib/prisma';
import { errors, handler, noContent, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { productInputSchema } from '@/lib/validation';
import { serialize } from '@/lib/serialize';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const GET = handler(async (_req, { params }) => {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { position: 'asc' } }, variants: true, category: true },
  });
  if (!product) throw errors.notFound('Product not found');
  return ok(serialize(product));
});

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();
  const existing = await prisma.product.findUnique({ where: { id: params.id }, include: { variants: true } });
  if (!existing) throw errors.notFound('Product not found');
  const body = await parseBody(req, productInputSchema);
  const slug = body.slug || slugify(body.name);
  const [slugTaken, skuTaken] = await Promise.all([
    prisma.product.findFirst({ where: { slug, id: { not: existing.id } } }),
    prisma.product.findFirst({ where: { sku: body.sku, id: { not: existing.id } } }),
  ]);
  const fieldErrors: Record<string, string> = {};
  if (slugTaken) fieldErrors.slug = 'Slug is already in use';
  if (skuTaken) fieldErrors.sku = 'SKU already exists';
  if (Object.keys(fieldErrors).length) throw errors.conflict('Duplicate product', fieldErrors);

  const keepIds = body.variants.filter((v) => v.id).map((v) => v.id!);
  const stock = body.variants.length ? body.variants.reduce((s, v) => s + v.stock, 0) : body.stock;
  const product = await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: existing.id, id: { notIn: keepIds } } });
    for (const v of body.variants) {
      const data = { sku: v.sku, size: v.size, color: v.color, priceDelta: v.priceDelta, stock: v.stock };
      if (v.id && existing.variants.some((ev) => ev.id === v.id)) await tx.productVariant.update({ where: { id: v.id }, data });
      else await tx.productVariant.create({ data: { ...data, productId: existing.id } });
    }
    await tx.productImage.deleteMany({ where: { productId: existing.id } });
    return tx.product.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        slug,
        description: body.description,
        brand: body.brand,
        sku: body.sku,
        price: body.price,
        compareAtPrice: body.compareAtPrice || null,
        stock,
        lowStockThreshold: body.lowStockThreshold,
        categoryId: body.categoryId,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        specs: body.specs,
        images: { create: body.images.map((img, i) => ({ url: img.url, alt: img.alt ?? body.name, position: i })) },
      },
      include: { images: true, variants: true },
    });
  });
  return ok(serialize(product));
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id: params.id }, include: { _count: { select: { orderItems: true } } } });
  if (!product) throw errors.notFound('Product not found');
  if (product._count.orderItems > 0) {
    // Preserve order history: soft-delete instead.
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return ok({ id: product.id, softDeleted: true, message: 'Product has orders and was deactivated instead of deleted' });
  }
  await prisma.product.delete({ where: { id: product.id } });
  return noContent();
});
