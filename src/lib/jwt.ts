/** Edge-runtime-safe JWT helpers (used by middleware and server code). */
import { SignJWT, jwtVerify } from 'jose';

export const ACCESS_COOKIE = 'nx_access';
export const REFRESH_COOKIE = 'nx_refresh';

export type Role = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';
export type AccessPayload = { sub: string; role: Role; email: string; name: string };

const enc = (s: string) => new TextEncoder().encode(s);
const accessSecret = () => enc(process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-please-32chars');

export async function signAccessToken(payload: AccessPayload, ttlSeconds: number) {
  return new SignJWT({ role: payload.role, email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(accessSecret());
}

export async function verifyAccessToken(token: string | undefined): Promise<AccessPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    return {
      sub: payload.sub as string,
      role: payload.role as Role,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export const isAdminRole = (role?: Role | null) => role === 'ADMIN' || role === 'SUPER_ADMIN';
