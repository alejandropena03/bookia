#!/bin/bash
# start-dev.sh — Levanta Bookia completo para desarrollo
set -e

# LLM_PROVIDER parametrizable. deepseek (default, requiere API key) o mock.
# Para eval de UI determinístico: LLM_PROVIDER=mock bash start-dev.sh
export LLM_PROVIDER="${LLM_PROVIDER:-deepseek}"

echo ""
echo "🚀 Iniciando Bookia... (LLM_PROVIDER=$LLM_PROVIDER)"
echo ""

echo "0. Preparando volumen de datos..."
docker volume create bookia_pgdata 2>/dev/null || true
echo ""

# 1. Levantar Postgres
echo "1. Levantando PostgreSQL..."
docker compose up -d postgres
echo "   Esperando que Postgres esté listo..."
sleep 5

# 2. Levantar API (Hono :8787) — reconoce LLM_PROVIDER vía docker-compose
echo "2. Levantando API (Hono :8787)..."
docker compose up -d api
echo "   Esperando que la API esté lista..."
sleep 5

# 3. Verificar health
echo "3. Verificando health..."
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/health 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "   ✅ API responde"
    break
  fi
  echo "   Intento $i/10..."
  sleep 3
done

# 4. Correr migraciones + seeds
echo "4. Corriendo migraciones..."
cd server && npm run db:migrate 2>/dev/null || true

echo "5. Corriendo seed base..."
npm run seed 2>/dev/null || echo "   (seed ya aplicado)"

echo "6. Corriendo seed-demo..."
npm run seed:demo 2>/dev/null || echo "   (seed-demo ya aplicado)"
cd ..

# 5. Smoke test
echo ""
echo "7. Smoke test..."
cd server && npm run smoke-test
cd ..

echo ""
echo "✅ Backend listo en http://localhost:8787"
echo ""
echo "8. Para levantar el frontend:"
echo "   npm run dev"
echo ""
echo "   Luego abrir: http://localhost:3001"
echo "   Login: cualquier email + /register primero"
echo ""
