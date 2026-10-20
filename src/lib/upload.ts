import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { config } from './config';
import { errors } from './api';
import { generateToken } from './tokens';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

// Magic-byte signatures to reject files whose content does not match the declared type.
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 3).toString() === 'GIF') return 'image/gif';
  return null;
}

/** Validates and stores an uploaded image, returning its public URL. */
export async function saveImageUpload(file: unknown, field = 'file') {
  if (!file || typeof file === 'string' || !(file instanceof Blob))
    throw errors.badRequest('Validation failed', { [field]: 'Please select an image to upload' });
  if (file.size === 0) throw errors.badRequest('Validation failed', { [field]: 'File is empty' });
  if (file.size > config.maxUploadBytes)
    throw errors.unprocessable('File too large', { [field]: 'Image must be 2MB or smaller' });
  if (!config.allowedImageTypes.includes(file.type))
    throw errors.unprocessable('Unsupported file type', { [field]: 'Only JPG, PNG, WEBP and GIF images are allowed' });
  const buf = Buffer.from(await file.arrayBuffer());
  if (sniff(buf) !== file.type)
    throw errors.unprocessable('Invalid image', { [field]: 'File content does not match an allowed image type' });
  const dir = path.resolve(config.uploadDir);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${generateToken(8)}.${EXT[file.type]}`;
  await writeFile(path.join(dir, name), buf);
  return `/api/uploads/${name}`;
}
