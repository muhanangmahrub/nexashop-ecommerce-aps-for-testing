import { config } from './config';
import { errors } from './api';

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export function clientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local';
}

/** Fixed-window in-memory rate limiter. Disabled when RATE_LIMIT_ENABLED=false. */
export function rateLimit(req: Request, key: string, limit: number, windowMs: number) {
  if (!config.rateLimitEnabled) return;
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = store.get(id);
  if (!bucket || bucket.resetAt < now) {
    store.set(id, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw errors.tooMany();
}
