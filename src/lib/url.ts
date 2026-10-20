import type { NextRequest } from 'next/server';

/**
 * Absolute URL on the host the client actually used. `req.url` carries the server
 * bind address (e.g. 0.0.0.0 in Docker), which browsers cannot reach.
 */
export function publicUrl(req: NextRequest, path: string): URL {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host;
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(/:$/, '');
  return new URL(path, `${proto}://${host}`);
}
