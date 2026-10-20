#!/bin/sh
set -e

echo "⏳ Syncing database schema…"
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss

case "${SEED_MODE:-if-empty}" in
  always)
    echo "🌱 Seeding database (SEED_MODE=always)…"
    node prisma/seed.js
    ;;
  if-empty)
    USERS=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{console.log(c);return p.\$disconnect()}).catch(()=>{console.log(0)})")
    if [ "$USERS" = "0" ]; then
      echo "🌱 Empty database detected — seeding…"
      node prisma/seed.js
    else
      echo "✅ Database already has $USERS users — skipping seed."
    fi
    ;;
  *)
    echo "⏭  Skipping seed (SEED_MODE=${SEED_MODE})."
    ;;
esac

exec "$@"
