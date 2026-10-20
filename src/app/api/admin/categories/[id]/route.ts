import { prisma } from '@/lib/prisma';
import { errors, handler, noContent, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { categoryInputSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const PATCH = handler(async (req, { params }) => {
  await requireAdmin();
  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) throw errors.notFound('Category not found');
  const body = await parseBody(req, categoryInputSchema);
  const slug = body.slug || slugify(body.name);
  if (await prisma.category.findFirst({ where: { slug, id: { not: existing.id } } }))
    throw errors.conflict('Category already exists', { slug: 'A category with this slug already exists' });
  if (body.parentId) {
    if (body.parentId === existing.id) throw errors.badRequest('Validation failed', { parentId: 'A category cannot be its own parent' });
    // Prevent cycles: walk up from the proposed parent.
    let cursor: string | null = body.parentId;
    while (cursor) {
      if (cursor === existing.id) throw errors.badRequest('Validation failed', { parentId: 'Cannot move a category under its own descendant' });
      const parent: { parentId: string | null } | null = await prisma.category.findUnique({ where: { id: cursor }, select: { parentId: true } });
      if (!parent) throw errors.badRequest('Validation failed', { parentId: 'Parent category does not exist' });
      cursor = parent.parentId;
    }
  }
  const category = await prisma.category.update({
    where: { id: existing.id },
    data: { name: body.name, slug, description: body.description, image: body.image, parentId: body.parentId || null },
  });
  return ok(category);
});

export const DELETE = handler(async (_req, { params }) => {
  await requireAdmin();
  const category = await prisma.category.findUnique({ where: { id: params.id }, include: { _count: { select: { products: true } } } });
  if (!category) throw errors.notFound('Category not found');
  if (category._count.products > 0)
    throw errors.conflict(`Cannot delete category with ${category._count.products} product(s). Reassign them first.`);
  await prisma.category.updateMany({ where: { parentId: category.id }, data: { parentId: category.parentId } });
  await prisma.category.delete({ where: { id: category.id } });
  return noContent();
});
