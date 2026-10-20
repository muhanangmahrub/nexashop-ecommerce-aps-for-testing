import { prisma } from '@/lib/prisma';
import { created, errors, handler, ok, parseBody } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { categoryInputSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  await requireAdmin();
  const items = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { parent: { select: { id: true, name: true } }, _count: { select: { products: true, children: true } } },
  });
  return ok(items);
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, categoryInputSchema);
  const slug = body.slug || slugify(body.name);
  if (await prisma.category.findUnique({ where: { slug } }))
    throw errors.conflict('Category already exists', { slug: 'A category with this slug already exists' });
  if (body.parentId && !(await prisma.category.findUnique({ where: { id: body.parentId } })))
    throw errors.badRequest('Validation failed', { parentId: 'Parent category does not exist' });
  const category = await prisma.category.create({
    data: { name: body.name, slug, description: body.description, image: body.image, parentId: body.parentId || null },
  });
  return created(category);
});
