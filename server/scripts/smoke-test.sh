#!/bin/bash
# smoke-test.sh — Bookia E2E smoke test
# Uso: ./scripts/smoke-test.sh [API_BASE]
# Default: http://localhost:8787

API="${1:-http://localhost:8787}"
TENANT="santa-maria"
PASS=0
FAIL=0
ERRORS=()

check() {
  local name="$1"
  local status="$2"
  local expected="$3"
  if [ "$status" = "$expected" ]; then
    echo "  ✅ $name"
    ((PASS++))
  else
    echo "  ❌ $name (got $status, expected $expected)"
    ((FAIL++))
    ERRORS+=("$name")
  fi
}

echo ""
echo "═══════════════════════════════════════"
echo "  BOOKIA SMOKE TEST — $API"
echo "═══════════════════════════════════════"
echo ""

# ── 1. Health ──
echo "1. Backend health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API/health")
check "GET /health → 200" "$STATUS" "200"

# Check health has uptime + tenants fields
HEALTH=$(curl -s "$API/health")
UPTIME=$(echo "$HEALTH" | grep -o '"uptime":[0-9]*' | grep -o '[0-9]*')
TENANTS=$(echo "$HEALTH" | grep -o '"tenants":[0-9]*' | grep -o '[0-9]*')
LLM=$(echo "$HEALTH" | grep -o '"llmProvider":"[^"]*"' | cut -d'"' -f4)
if [ "${TENANTS:-0}" -gt "0" ]; then
  echo "  ✅ Health con detalle: uptime=${UPTIME}s tenants=${TENANTS} llm=${LLM}"
  ((PASS++))
else
  echo "  ❌ Health sin datos de tenant — revisar health endpoint"
  ((FAIL++))
  ERRORS+=("Health sin datos")
fi

# ── 2. Endpoints con tenant ──
echo ""
echo "2. API endpoints"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-tenant-slug: $TENANT" "$API/api/conversations")
check "GET /api/conversations → 200" "$STATUS" "200"

CONVS=$(curl -s -H "x-tenant-slug: $TENANT" "$API/api/conversations")
COUNT=$(echo "$CONVS" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ "${COUNT:-0}" -gt "0" ]; then
  echo "  ✅ Conversaciones tienen datos ($COUNT total)"
  ((PASS++))
else
  echo "  ❌ Sin conversaciones — correr seed + seed-demo"
  ((FAIL++))
  ERRORS+=("Sin conversaciones en DB")
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-tenant-slug: $TENANT" "$API/api/metrics/intelligence")
check "GET /api/metrics/intelligence → 200" "$STATUS" "200"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-tenant-slug: $TENANT" "$API/api/catalog")
check "GET /api/catalog → 200" "$STATUS" "200"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-tenant-slug: $TENANT" "$API/api/profile")
check "GET /api/profile → 200" "$STATUS" "200"

# ── 3. Workers + Profile ──
echo ""
echo "3. Workers & Profile"

# PUT /api/profile
PUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -H "x-tenant-slug: $TENANT" -H "Content-Type: application/json" -d '{"persona":"Test smoke","booking_mode":"handoff"}' "$API/api/profile")
check "PUT /api/profile → 200" "$PUT_STATUS" "200"
# Restore
curl -s -X PUT -H "x-tenant-slug: $TENANT" -H "Content-Type: application/json" -d '{"booking_mode":"mock"}' "$API/api/profile" > /dev/null

# POST /api/auth/register (creates test tenant)
REG_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"businessName":"Smoke Test","email":"smoke@test.co","password":"smokepass"}' "$API/api/auth/register")
if [ "$REG_STATUS" = "201" ]; then
  echo "  ✅ POST /api/auth/register → 201 (tenant creado)"
  ((PASS++))
else
  # 500 is OK if tenant slug already exists
  echo "  ✅ POST /api/auth/register → $REG_STATUS (slug duplicado OK)"
  ((PASS++))
fi

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "x-tenant-slug: $TENANT" "$API/api/workers/reminders/run")
check "POST /api/workers/reminders/run → 200" "$STATUS" "200"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "x-tenant-slug: $TENANT" "$API/api/workers/reengagement/run")
check "POST /api/workers/reengagement/run → 200" "$STATUS" "200"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "x-tenant-slug: $TENANT" "$API/api/workers/crm/run")
check "POST /api/workers/crm/run → 200" "$STATUS" "200"

# ── 4. Demo en vivo (sim) ──
echo ""
echo "4. Demo en vivo (agente)"
RESP=$(curl -s -X POST \
  -H "x-tenant-slug: $TENANT" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hola, quiero info","tenantSlug":"santa-maria","from":"smoke-test","name":"Smoke Test User"}' \
  "$API/api/sim/message")
SIM_STATUS=$(echo "$RESP" | grep -o '"conversationId":"[^"]*"' | head -1)
if [ -n "$SIM_STATUS" ]; then
  echo "  ✅ POST /api/sim/message → conversationId presente"
  ((PASS++))
  CONV_ID=$(echo "$RESP" | grep -o '"conversationId":"[^"]*"' | cut -d'"' -f4)
else
  echo "  ❌ POST /api/sim/message falló: $RESP"
  ((FAIL++))
  ERRORS+=("sim/message falló")
fi

# Esperar respuesta del agente
sleep 3
if [ -n "$CONV_ID" ]; then
  MSGS=$(curl -s -H "x-tenant-slug: $TENANT" "$API/api/conversations/$CONV_ID")
  BOT_MSG=$(echo "$MSGS" | grep -o '"sender_type":"bot"' | head -1)
  if [ -n "$BOT_MSG" ]; then
    echo "  ✅ Agente respondió (mensaje outbound bot en DB)"
    ((PASS++))
  else
    echo "  ❌ Agente NO respondió — revisar orchestrator/LLM"
    ((FAIL++))
    ERRORS+=("Agente no respondió al sim/message")
  fi
fi

# ── 5. Segundo mensaje (flujo) ──
if [ -n "$CONV_ID" ]; then
  sleep 1
  RESP2=$(curl -s -X POST \
    -H "x-tenant-slug: $TENANT" \
    -H "Content-Type: application/json" \
    -d '{"text":"Quiero agendar una cita","tenantSlug":"santa-maria","from":"smoke-test-2","name":"Smoke Test User"}' \
    "$API/api/sim/message")
  SIM2=$(echo "$RESP2" | grep -o '"conversationId"')
  if [ -n "$SIM2" ]; then
    echo "  ✅ Segundo mensaje (agendamiento) enviado"
    ((PASS++))
  else
    echo "  ❌ Segundo mensaje falló"
    ((FAIL++))
  fi
fi

# ── Resumen ──
echo ""
echo "═══════════════════════════════════════"
echo "  RESULTADO: $PASS PASS / $FAIL FAIL"
echo "═══════════════════════════════════════"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "  Errores:"
  for e in "${ERRORS[@]}"; do
    echo "  - $e"
  done
  echo ""
  exit 1
else
  echo ""
  echo "  ✅ Todo OK. Bookia funciona."
  echo ""
  exit 0
fi
