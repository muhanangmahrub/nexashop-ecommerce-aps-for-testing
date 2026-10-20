const bool = (v: string | undefined, fallback = false) => (v === undefined ? fallback : v === 'true' || v === '1');

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  // TEST_MODE is read at runtime; NEXT_PUBLIC_TEST_MODE is inlined at build time.
  testMode: bool(process.env.TEST_MODE ?? process.env.NEXT_PUBLIC_TEST_MODE),
  maintenanceMode: bool(process.env.MAINTENANCE_MODE),
  rateLimitEnabled: bool(process.env.RATE_LIMIT_ENABLED, true),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-please-32chars',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me-please-32chars',
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900),
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
  maxLoginAttempts: 5,
  lockoutMinutes: Number(process.env.LOCKOUT_MINUTES ?? 15),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 1025),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'NexaShop <no-reply@nexashop.test>',
  },
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxUploadBytes: 2 * 1024 * 1024,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  taxRate: 0.1,
  freeShippingThreshold: 100,
};

export const isProd = process.env.NODE_ENV === 'production';
