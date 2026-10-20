import { prisma } from '@/lib/prisma';
import { errors, handler, ok } from '@/lib/api';
import { requireUser, sessionUserSelect } from '@/lib/auth';
import { saveImageUpload } from '@/lib/upload';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  const user = await requireUser();
  const form = await req.formData().catch(() => {
    throw errors.badRequest('Expected multipart/form-data');
  });
  const url = await saveImageUpload(form.get('avatar'), 'avatar');
  const updated = await prisma.user.update({ where: { id: user.id }, data: { avatar: url }, select: sessionUserSelect });
  return ok(updated);
});

export const DELETE = handler(async () => {
  const user = await requireUser();
  const updated = await prisma.user.update({ where: { id: user.id }, data: { avatar: null }, select: sessionUserSelect });
  return ok(updated);
});
