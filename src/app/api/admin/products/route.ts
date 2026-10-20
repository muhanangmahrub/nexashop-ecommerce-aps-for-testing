import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { created, errors, handler, ok, pageMeta, paginate, parseBody, parseQuery } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { paginationSchema, productInputSchema } from '@/lib/validation';
import { serialize } from '@/lib/serialize';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const querySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  stock: z.enum(['low', 'out', 'all']).default('all'),
  sort: z.enum(['newest', 'name', 'price_asc', 'price_desc', 'stock']).default('newest'),
});

export const GET = handler(async (req) => {
  await requireAdmin();
  const q = parseQuery(req, querySchema);
  const where: Prisma.ProductWhereInput = {};
  if (q.q) where.OR = [{ name: { contains: q.q, mode: 'insensitive' } }, { sku: { contains: q.q, mode: 'insensitive' } }];
  if (q.category) where.categoryId = q.category;
  if (q.status !== 'all') where.isActive = q.status === 'active';
  if (q.stock === 'low') where.AND = [{ stock: { gt: 0 } }, { stock: { lte: 5 } }];
  if (q.stock === 'out') where.stock = { lte: 0 };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    q.sort === 'name' ? { name: 'asc' } : q.sort === 'price_asc' ? { price: 'asc' } : q.sort === 'price_desc' ? { price: 'desc' } : q.sort === 'stock' ? { stock: 'asc' } : { createdAt: 'desc' };
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [orderBy, { id: 'asc' }],
      ...paginate(q.page, q.pageSize),
      include: { category: { select: { name: true } }, images: { take: 1, orderBy: { position: 'asc' } }, _count: { select: { variants: true } } },
    }),
  ]);
  return ok({ items: serialize(items), meta: pageMeta(total, q.page, q.pageSize) });
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, productInputSchema);
  const slug = body.slug || slugify(body.name);
  const [slugTaken, skuTaken, category] = await Promise.all([
    prisma.product.findUnique({ where: { slug } }),
    prisma.product.findUnique({ where: { sku: body.sku } }),
    prisma.category.findUnique({ where: { id: body.categoryId } }),
  ]);
  const fieldErrors: Record<string, string> = {};
  if (slugTaken) fieldErrors.slug = 'Slug is already in use';
  if (skuTaken) fieldErrors.sku = 'SKU already exists';
  if (Object.keys(fieldErrors).length) throw errors.conflict('Duplicate product', fieldErrors);
  if (!category) throw errors.badRequest('Validation failed', { categoryId: 'Category does not exist' });
  const variantSkus = body.variants.map((v) => v.sku);
  if (new Set(variantSkus).size !== variantSkus.length)
    throw errors.badRequest('Validation failed', { variants: 'Variant SKUs must be unique' });

  const stock = body.variants.length ? body.variants.reduce((s, v) => s + v.stock, 0) : body.stock;
  const product = await prisma.product.create({
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
      variants: {
        create: body.variants.map((v) => ({ sku: v.sku, size: v.size, color: v.color, priceDelta: v.priceDelta, stock: v.stock })),
      },
    },
    include: { images: true, variants: true },
  });
  return created(serialize(product));
});
