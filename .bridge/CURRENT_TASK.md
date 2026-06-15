---
task_id: TASK-023
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
priority: CRITICA
created_at: 2026-06-15T15:00:00Z
---

## Misión
**Smoke test radical + fixes bloqueantes.** Alejandro probó el producto y encontró:
- DemoLive: "Error conectando al backend"
- Conversaciones: "Sin conversaciones"
- El sidebar muestra "Estética Santa María" duplicado (arriba y abajo)

El objetivo de esta tarea es **dejar el producto completamente funcional** — que Alejandro pueda abrir el browser y todo funcione sin tocar nada más.

---

## PARTE 1: Fixes bloqueantes (hacer PRIMERO, en orden)

### FIX-A: Bug CRM worker — datetime como text
**Archivo:** `server/src/workers/crm.ts` líneas 24-25
**Bug:** `bookings.datetime` es tipo `text` en el schema pero la query compara con timestamps PostgreSQL (`NOW() - INTERVAL '8 days'`). Esto hace crashear `POST /api/workers/crm/run` con 500.
**Fix:** Cambiar las comparaciones para castear:
```sql
-- Antes:
AND b.datetime >= NOW() - INTERVAL '8 days'
-- Después:
AND b.datetime::timestamptz >= NOW() - INTERVAL '8 days'
```
Aplicar el mismo cast en todas las comparaciones de datetime en crm.ts.

### FIX-B: Bug webhook — tenantId "resolve-later"
**Archivo:** `server/src/api/webhooks.ts` línea ~94
**Bug:** El webhook de canales usa `tenantId: "resolve-later"` como string literal al llamar `ingestInbound`. Esto hace crashear los webhooks porque "resolve-later" no es un UUID válido para PostgreSQL.
**Fix:** Los webhooks de canal deben resolver el tenant desde el payload (cada adapter debe exponer un método `resolveTenant(body)` que retorne el tenantId real, o buscar por `external_account_id`). Por ahora, para no romper la arquitectura: hacer que el adapter MockAdapter resuelva el tenant desde el body antes de llamar a `ingestInbound`.

### FIX-C: Volumen Postgres — datos no persisten entre rebuilds
**Archivo:** `docker-compose.yml`
**Bug:** El volumen `pgdata` pierde datos cuando se hace `docker compose build`. 
**Fix:** Agregar `external: false` explícito al volumen y asegurarse que el volumen se llama igual en `services.postgres.volumes` y en la sección `volumes:`. El nombre actual `pgdata` puede estar colisionando con otros proyectos Docker.
**Cambio:**
```yaml
volumes:
  pgdata:
    name: bookia_pgdata  # nombre único explícito
```
Y en services.postgres:
```yaml
volumes:
  - bookia_pgdata:/var/lib/postgresql/data
```

### FIX-D: NEXT_PUBLIC_API_URL faltante en .env.local
**Archivo:** `.env.local` (raíz del proyecto)
**Bug:** El front no tiene `NEXT_PUBLIC_API_URL` — usa el default `http://localhost:8787`. Esto funciona si el backend corre localmente, pero hay que hacerlo explícito para que sea claro.
**Fix:** Agregar al `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```
Y crear `.env.local.example` con todas las variables necesarias del front documentadas.

### FIX-E: "Estética Santa María" duplicado en sidebar
**Archivo:** `app/(dashboard)/layout.tsx`
**Bug:** El nombre del negocio aparece en el sidebar abajo (perfil del usuario) Y en el topbar arriba a la derecha — duplicado visualmente, se ve poco profesional.
**Fix:** En el topbar, cambiar a mostrar solo el nombre del usuario autenticado (de la sesión de Auth.js), no el nombre del negocio. El nombre del negocio queda solo en el sidebar inferior.

---

## PARTE 2: Smoke test automatizado

Crear `server/scripts/smoke-test.sh` (bash) que pruebe TODOS los endpoints críticos contra el servidor corriendo. Se ejecuta con `npm run smoke-test` desde `server/`.

El script debe:
1. Verificar que el backend responde (`GET /health`)
2. Verificar todos los endpoints con tenant header
3. Hacer un flujo E2E completo: sim/message → esperar respuesta SSE → verificar mensaje en DB
4. Imprimir un reporte claro de PASS/FAIL por cada check
5. Salir con código 1 si cualquier check falla

```bash
#!/bin/bash
# smoke-test.sh — Bookia E2E smoke test
# Uso: ./smoke-test.sh [API_BASE] 
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

# ── 2. Endpoints con tenant ──
echo ""
echo "2. API endpoints"
H="-H 'x-tenant-slug: $TENANT' -H 'Content-Type: application/json'"

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

# ── 3. Workers ──
echo ""
echo "3. Workers"
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
  -d '{"text":"Hola, quiero info","tenantSlug":"santa-maria","channel":"mock","name":"Smoke Test User"}' \
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
    -d '{"text":"Quiero agendar una cita","tenantSlug":"santa-maria","channel":"mock","name":"Smoke Test User"}' \
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
```

Agregar a `server/package.json`:
```json
"smoke-test": "bash scripts/smoke-test.sh"
```

---

## PARTE 3: Script de arranque completo

Crear `start-dev.sh` en la raíz del proyecto. El objetivo: Alejandro ejecuta UN solo comando y todo queda levantado y con datos. Sin tener que recordar el orden de comandos.

```bash
#!/bin/bash
# start-dev.sh — Levanta Bookia completo para desarrollo
set -e

echo ""
echo "🚀 Iniciando Bookia..."
echo ""

# 1. Levantar Postgres
echo "1. Levantando PostgreSQL..."
docker compose up -d postgres
echo "   Esperando que Postgres esté listo..."
sleep 5

# 2. Levantar API
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
```

---

## PARTE 4: README-DEV actualizado

Actualizar `README-DEMO.md` (o crear `README-DEV.md`) con:
1. Requisitos exactos (Node 22+, Docker Desktop)
2. **Arranque en un comando:** `bash start-dev.sh`
3. **Troubleshooting** para los 3 errores más comunes:
   - "Sin conversaciones" → correr seed-demo
   - "Error conectando al backend" → verificar Docker con `docker compose ps`
   - "Datos se pierden al rebuild" → usar `docker compose up` sin `--build`, o correr seed-demo después

---

## Criterio de completación

1. `bash start-dev.sh` → levanta todo sin errores.
2. `npm run smoke-test` (desde `server/`) → **todos los checks PASS**.
3. Abrir `http://localhost:3001` → conversaciones cargadas, DemoLive funciona, agente responde.
4. "Estética Santa María" aparece solo una vez (sidebar inferior), no duplicado.
5. `POST /api/workers/crm/run` → 200 (no 500).
6. `npm test` + `npm run build` pasan.

## HITO → WAITING_FOR_CLAUDE al terminar.

## Resultado de OpenCode
_(llenar)_
