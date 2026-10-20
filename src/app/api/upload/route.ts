import { errors, handler, created } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { saveImageUpload } from '@/lib/upload';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  await requireAdmin();
  const form = await req.formData().catch(() => {
    throw errors.badRequest('Expected multipart/form-data');
  });
  const url = await saveImageUpload(form.get('file'));
  return created({ url });
});
