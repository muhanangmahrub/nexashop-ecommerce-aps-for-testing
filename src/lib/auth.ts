import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from './prisma';
import { config, isProd } from './config';
import { errors } from './api';
import { ACCESS_COOKIE, REFRESH_COOKIE, signAccessToken, verifyAccessToken, type Role } from './jwt';
import { generateToken, hashToken } from './tokens';

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export type SessionUser = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'avatar' | 'phone' | 'emailVerified' | 'createdAt' | 'googleId'
>;

export const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  phone: true,
  emailVerified: true,
  createdAt: true,
  googleId: true,
} as const;

const cookieBase = { httpOnly: true, sameSite: 'lax' as const, secure: isProd && config.appUrl.startsWith('https'), path: '/' };

/** Issues an access token + rotating refresh token and sets both as httpOnly cookies. */
export async function createSession(
  res: NextResponse,
  user: Pick<User, 'id' | 'role' | 'email' | 'name'>,
  userAgent?: string | null,
  rememberMe = true,
) {
  const accessToken = await signAccessToken(
    { sub: user.id, role: user.role as Role, email: user.email, name: user.name },
    config.accessTokenTtlSeconds,
  );
  const refreshToken = generateToken(48);
  const days = rememberMe ? config.refreshTokenTtlDays : 1;
  const expiresAt = new Date(Date.now() + days * 86400_000);
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt, userAgent: userAgent?.slice(0, 250) },
  });
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: config.accessTokenTtlSeconds });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: days * 86400 });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...cookieBase, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...cookieBase, maxAge: 0 });
}

/** Validates & rotates a refresh token. Returns the user or null when invalid. */
export async function rotateRefreshToken(res: NextResponse, refreshToken: string | undefined, userAgent?: string | null) {
  if (!refreshToken) return null;
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    // Reuse of a revoked token indicates theft: revoke all of the user's sessions.
    if (record?.revokedAt) await prisma.refreshToken.updateMany({ where: { userId: record.userId }, data: { revokedAt: new Date() } });
    return null;
  }
  if (record.user.isBanned) return null;
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date() } });
  const remainingDays = Math.max(1, Math.round((record.expiresAt.getTime() - Date.now()) / 86400_000));
  await createSession(res, record.user, userAgent, remainingDays > 1);
  return record.user;
}

export async function revokeRefreshToken(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Returns the authenticated user from the access token cookie, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { ...sessionUserSelect, isBanned: true } });
  if (!user || user.isBanned) return null;
  const { isBanned: _b, ...rest } = user;
  return rest;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw errors.unauthorized();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') throw errors.forbidden('Admin access required');
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN') throw errors.forbidden('Super admin access required');
  return user;
}

export async function createVerificationToken(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') {
  const token = generateToken(32);
  const ttl = type === 'PASSWORD_RESET' ? 60 * 60_000 : 24 * 60 * 60_000;
  await prisma.verificationToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } });
  await prisma.verificationToken.create({
    data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttl) },
  });
  return token;
}

export async function consumeVerificationToken(token: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET') {
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.type !== type) throw errors.badRequest('Invalid or unknown token', { token: 'This link is invalid' });
  if (record.usedAt) throw errors.badRequest('Token has already been used', { token: 'This link has already been used' });
  if (record.expiresAt < new Date()) throw errors.badRequest('Token has expired', { token: 'This link has expired' });
  await prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
