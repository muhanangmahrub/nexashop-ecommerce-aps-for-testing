import { readFile } from 'fs/promises';
import path from 'path';
import { config } from '@/lib/config';
import { fail } from '@/lib/api';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export async function GET(_req: Request, { params }: { params: { name: string } }) {
  if (!/^[\w-]+\.(jpg|png|webp|gif)$/.test(params.name)) return fail(404, 'File not found');
  try {
    const data = await readFile(path.join(path.resolve(config.uploadDir), params.name));
    const ext = params.name.split('.').pop()!;
    return new Response(data, {
      headers: { 'Content-Type': TYPES[ext], 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return fail(404, 'File not found');
  }
}
