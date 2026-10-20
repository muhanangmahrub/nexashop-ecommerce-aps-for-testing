# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM base AS builder
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_TEST_MODE=true
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_TEST_MODE=$NEXT_PUBLIC_TEST_MODE \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build
# Bundle the seed script to plain JS so the runtime image doesn't need tsx.
RUN npx esbuild prisma/seed.ts --bundle --platform=node --target=node20 \
      --external:@prisma/client --external:bcryptjs --outfile=prisma/seed.js

# ---------- runtime ----------
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/app/uploads
RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
