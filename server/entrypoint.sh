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

# Run SQL migrations before seeds (idempotent, tracked in bookia_migrations)
echo "  Running migrations..."
node dist/db/run-sql-migrations.js
if [ $? -ne 0 ]; then
  echo "  ❌ Migration failed — aborting startup"
  exit 1
fi
echo "  Migrations OK"

# Always ensure seed data exists (seed is idempotent)
echo "  Running seed..."
node dist/db/seed.js 2>/dev/null || echo "  (seed skipped — already exists)"
echo "  Running seed-demo..."
node dist/db/seed-demo.js 2>/dev/null || echo "  (seed-demo done)"
echo "  DB ready ✅"

echo "  Starting API server..."
exec node dist/index.js
