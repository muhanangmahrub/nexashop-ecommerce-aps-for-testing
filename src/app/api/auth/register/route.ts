import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errors, handler, parseBody } from '@/lib/api';
import { registerSchema } from '@/lib/validation';
import { createSession, createVerificationToken, hashPassword, sessionUserSelect } from '@/lib/auth';
import { emails } from '@/lib/email';
import { config } from '@/lib/config';
import { rateLimit } from '@/lib/rate-limit';
import { notify } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export const POST = handler(async (req) => {
  rateLimit(req, 'register', 10, 60_000);
  const body = await parseBody(req, registerSchema);
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw errors.conflict('Email already exists', { email: 'Email already exists' });

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash: await hashPassword(body.password),
      emailVerified: config.testMode ? new Date() : null,
    },
    select: sessionUserSelect,
  });
  await notify(user.id, 'ACCOUNT', 'Welcome to NexaShop!', 'Your account has been created. Happy shopping!', '/products');

  if (config.testMode) {
    const res = NextResponse.json(
      { success: true, data: { user, requiresVerification: false }, message: 'Account created successfully' },
      { status: 201 },
    );
    await createSession(res, user, req.headers.get('user-agent'));
    return res;
  }

  const token = await createVerificationToken(user.id, 'EMAIL_VERIFICATION');
  await emails.verification(user.email, user.name, token);
  return NextResponse.json(
    {
      success: true,
      data: { user, requiresVerification: true },
      message: 'Account created. Please check your email to verify your account.',
    },
    { status: 201 },
  );
});
