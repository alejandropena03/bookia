#!/bin/sh
# API startup: auto-seed if DB is empty
echo "⚡ Bookia API starting..."

# Wait for postgres
until node -e "
  const postgres = require('postgres');
  const sql = postgres(process.env.DATABASE_URL, { connect_timeout: 3 });
  sql\`SELECT 1\`.then(() => process.exit(0)).catch(() => process.exit(1))
" 2>/dev/null; do
  echo "  Waiting for postgres..."
  sleep 2
done

echo "  Postgres ready"

# Check if seed needed
HAS_TENANT=$(node -e "
  const postgres = require('postgres');
  const sql = postgres(process.env.DATABASE_URL);
  sql\`SELECT id FROM tenants WHERE slug = 'santa-maria' LIMIT 1\`
    .then(r => process.exit(r.length > 0 ? 0 : 1))
    .catch(() => process.exit(1))
" 2>/dev/null && echo "yes" || echo "no")

if [ "$HAS_TENANT" = "no" ]; then
  echo "  No tenant found — running seed..."
  node dist/db/seed.js 2>/dev/null
  echo "  Seed done — running seed-demo..."
  node dist/db/seed-demo.js 2>/dev/null
  echo "  DB populated ✅"
else
  echo "  Tenant exists — skipping seed ✅"
fi

echo "  Starting API server..."
exec node dist/index.js
