# PLAN 10/10 — Bookia MVP a Producción Real

**Objetivo**: Cerrar el gap entre demo funcional y algo que Carlos (cliente piloto) pueda usar sin supervisión.

**Filosofía**: Cero features nuevas. Solo estabilidad, precisión, y experiencia pulida.

---

## 📊 Progreso

| Fase | Estado | % |
|------|--------|---|
| Fase 0 — Incendios | 🟢 Completada | 100% |
| Fase 1 — Estabilidad | 🟢 Completada | 100% |
| Fase 2 — Experiencia Carlos | 🔴 Pendiente | 0% |
| Fase 3 — Frontend completo | 🔴 Pendiente | 0% |
| Fase 4 — Seguridad | 🔴 Pendiente | 0% |
| Fase 5 — Tests 100% | 🔴 Pendiente | 0% |
| Fase 6 — Deploy & Demo | 🔴 Pendiente | 0% |

---

## Fase 0 🔥 — Apagar incendios (día 1)

### 0.1 Mover escalación ANTES de first_contact flow
- **Archivo**: `server/src/agent/orchestrator.ts`
- **Problema**: Cliente dice "emergencia" o "humano" como primer mensaje → ignorado por first_contact flow
- **Fix**: Mover `evaluateEscalation()` ANTES del check `isFirstMessage()`
- **Validación**: Test: keyword escalable como primer mensaje → `route: escalated`
- [x] Done

### 0.2 seed-demo usa DATABASE_URL env var
- **Archivo**: `server/src/db/seed-demo.ts` línea 14
- **Problema**: Hardcodea `localhost:5432`. Dentro de Docker, postgres está en `postgres:5432`
- **Fix**: Usar `process.env.DATABASE_URL` con fallback a localhost
- **Validación**: Entrypoint del container ejecuta seed-demo y puebla datos
- [x] Done

### 0.3 Test suite no borrar tenants ajenos
- **Archivos**: `server/tests/intelligence.test.ts`, `server/tests/dashboard.test.ts`, `server/tests/rls.test.ts`
- **Problema**: `DELETE FROM tenants` sin WHERE mata santa-maria. API se cae post-tests.
- **Fix**: Usar slugs únicos por test, no borrar todo
- **Validación**: Tests pasan → API sigue respondiendo con santa-maria
- [x] Done

### 0.4 Agregar tzdata a Dockerfile + TZ env
- **Archivos**: `server/Dockerfile`, `docker-compose.yml`
- **Problema**: Alpine sin tzdata. TZ=America/Bogota ignora. UTC vs Colombia rompe hours + heatmap
- **Fix**: `apk add --no-cache tzdata` en Dockerfile + `TZ: America/Bogota` en compose
- **Validación**: `docker exec date` → hora Colombia
- [x] Done

---

## Fase 1 🧱 — Estabilidad (días 2-3)

### 1.1 Normalizar input usuario en templates
- **Archivo**: `server/src/flows/engine.ts` — `buildTemplateContext()`
- **Problema**: "Quiero el Full Face de ácido hialurónico" se guarda raw. Template renderiza: "Tu cita de Quiero el Full Face..."
- **Fix**: Fuzzy match contra catálogo para resolver `service_name` y `service_price`
- **Validación**: Flow confirma "Full Face — Ácido Hialurónico", no el input raw
- [x] Done

### 1.2 Seed: upsert business_profile
- **Archivo**: `server/src/db/seed.ts`
- **Problema**: Si se borra profile (test suite), seed skip porque tenant existe. Profile perdido.
- **Fix**: Usar `INSERT ... ON CONFLICT DO UPDATE` para business_profile
- **Validación**: Test suite corre → seed re-aplica profile
- [x] Done

### 1.3 Heatmap: convertir a Colombia timezone
- **Archivo**: `server/src/metrics/intelligence.ts` línea 446
- **Problema**: `EXTRACT(HOUR FROM m.created_at)` usa UTC. HEATMAP_HOURS en hora Colombia.
- **Fix**: `EXTRACT(HOUR FROM m.created_at AT TIME ZONE 'America/Bogota')`
- **Validación**: Test heatmap pasa (slot count > 0)
- [x] Done

### 1.4 Health endpoint con más detalle
- **Archivo**: `server/src/index.ts`
- **Problema**: Solo dice ok/degraded
- **Fix**: Agregar seed version, tenant count, uptime
- **Validación**: `GET /health` muestra info útil
- [x] Done

### 1.5 Arreglar Jest vs Vitest conflicto
- **Archivo**: `bookia-code/jest.config.ts`
- **Problema**: Jest incluye `server/tests/` en su patrón → Vitest imports fallan en CommonJS
- **Fix**: Excluir `server/` del jest config
- **Validación**: `npm test` (raíz) → solo frontend tests (8/8)
- [x] Done

---

## Fase 2 🎯 — Experiencia Carlos (días 3-4)

### 2.1 Template rendering: limpiar dobles artículos
- **Archivo**: `server/src/flows/template.ts`
- **Problema**: "el El viernes", "de De Medellín" — input raw tiene artículos
- **Fix**: Strip artículos/pronombres del inicio del slot value antes de renderizar
- **Validación**: Flow output: "el viernes", "de Medellín"
- [x] Done

### 2.2 Canned responses inyectar precios reales
- **Archivo**: `server/src/flows/santa-maria/canned-responses.ts`
- **Problema**: Las canned tienen texto fijo. No incluyen precios reales del catálogo.
- **Fix**: Templates con `{precio_botox}`, `{precio_acido}` que se resuelven del catálogo
- **Validación**: Canned "precio" incluye cifras reales
- [x] Done

### 2.3 DeepSeek system prompt pulir tono
- **Archivo**: `server/src/agent/responder.ts`
- **Problema**: DeepSeek suena más formal que Carlos real. Usa frases como "Qué alegría" que Carlos no usa.
- **Fix**: System prompt más específico: "Habla como Carlos habla, no como un call center. Usa frases cortas. Nada de 'Qué alegría' o 'con gusto'. Sé directo pero cálido."
- **Validación**: Respuestas menos formales, más naturales
- [x] Done

### 2.4 Handoff booking notificar a Elkin
- **Archivo**: `server/src/booking/handoff.ts` + `server/src/agent/orchestrator.ts`
- **Problema**: Handoff booking solo responde "te contactaremos". No notifica a Elkin.
- **Fix**: Agregar notificación (al menos log + worker_logs)
- **Validación**: Handoff booking crea worker_log entry
- [x] Done

### 2.5 Validar todas las escalaciones custom
- **Archivo**: `server/src/agent/orchestrator.ts` + `server/src/agent/escalation.ts`
- **Problema**: Solo "emergencia" escala. "insatisfecho", "queja", "descuento", "técnico", "médico" no.
- **Fix**: Asegurar que evaluateEscalation corre con las custom rules de Santa María
- **Validación**: Test: cada keyword custom → escalated
- [x] Done

---

## Fase 3 🖥️ — Frontend completo (días 4-5)

### 3.1 Settings: PUT profile + catalog
- **Archivo**: `app/(dashboard)/settings/page.tsx` + `server/src/api/dashboard.ts`
- **Problema**: Settings UI es local-only. "Los cambios requieren endpoint PUT del backend (Fase 2)"
- **Fix**: Endpoint PUT /api/profile + conectar frontend
- **Validación**: Editar settings → recargar → cambios persisten
- [x] Done

### 3.2 Register crear tenant real
- **Archivo**: `app/(auth)/register/page.tsx` + nueva API route
- **Problema**: Placeholder de 800ms, no crea nada
- **Fix**: Endpoint POST /api/auth/register que crea tenant + admin user
- **Validación**: Register → login funciona con nuevas credenciales
- [x] Done

### 3.3 Dashboard mensaje sin datos
- **Archivo**: `app/(dashboard)/dashboard/page.tsx`
- **Problema**: Si inteligencia devuelve 0s, muestra KPIs rotos
- **Fix**: Estado vacío con mensaje amigable
- **Validación**: Tenant sin datos → "No hay suficientes datos aún"
- [x] Done

### 3.4 DemoLive mejor UX de conexión
- **Archivo**: `components/dashboard/DemoLive.tsx`
- **Problema**: Si SSE falla, no muestra error claro
- **Fix**: Estado de conexión (conectando/conectado/error) + botón reconectar
- **Validación**: Error SSE → mensaje legible, no silencio
- [x] Done

### 3.6 Fix environment configs
- **Archivo**: `.env.local`, `.env`
- **Problema**: Múltiples .env con configs inconsistentes
- **Fix**: Unificar, documentar
- **Validación**: Frontend conecta a backend sin configuración manual
- [x] Done

---

## Fase 4 🔐 — Seguridad (día 5)

### 4.1 Auth middleware JWT real
- **Archivo**: `middleware.ts`
- **Problema**: Cookie check no valida el JWT
- **Fix**: Usar `jose` o `next-auth` middleware para verificar token
- **Validación**: Token manipulado → redirect a login
- [x] Done

### 4.2 resolveTenant con JWT
- **Archivo**: `server/src/api/middleware.ts`
- **Problema**: `DEV_AUTH=true` bypassa todo
- **Fix**: Extraer tenant del JWT, no del header
- **Validación**: Sin token válido → 401
- [x] Done

### 4.3 Rate limiting en /api/sim
- **Archivo**: `server/src/api/sim.ts`
- **Problema**: Sin rate limit, cualquiera puede spamear
- **Fix**: `@hono/rate-limiter` o implementación simple in-memory
- **Validación**: >10 requests/segundo → 429
- [x] Done

### 4.4 DeepSeek key segura
- **Problema**: Key hardcodeada en `.env` del server
- **Fix**: Usar secrets de Docker/K8s, o al menos .gitignore bien configurado
- **Validación**: Key no aparece en logs ni en código
- [x] Done

---

## Fase 5 🧪 — Tests 100% verdes (día 6)

### 5.1 Fix heatmap test
- **Archivo**: `server/tests/intelligence.test.ts`
- **Fix**: + timezone handling + usar `NOW() AT TIME ZONE 'America/Bogota'`
- [x] Done

### 5.2 Test escalación prioridad
- **Archivo**: `server/tests/agent.test.ts`
- **Fix**: Verificar que keywords escalables en primer msg → route: escalated
- [x] Done

### 5.3 Test seed-demo idempotencia
- **Archivo**: Nuevo `server/tests/seed-demo.test.ts`
- **Fix**: Que seed-demo no reviente si ya hay datos
- [x] Done

### 5.4 Test template rendering
- **Archivo**: `server/tests/agent.test.ts`
- **Fix**: Verificar normalización de input
- [x] Done

### 5.5 Jest 8/8 pasando
- **Archivo**: `jest.config.ts`
- **Fix**: Excluir server tests
- [x] Done

### 5.6 E2E Playwright funcional
- **Archivo**: `e2e/bookia.spec.ts`
- **Fix**: Login → dashboard → conversaciones
- [x] Done

---

## Fase 6 🚀 — Deploy & Demo (día 7)

### 6.1 Smoke test 20/20
- **Archivo**: `server/scripts/smoke-test.sh`
- **Fix**: Agregar checks: escalación, booking, workers, handoff
- [x] Done

### 6.2 start-dev.sh impecable
- **Archivo**: `start-dev.sh`
- **Fix**: Sin errores visibles, logs claros
- [x] Done

### 6.3 README-DEMO actualizado
- **Archivo**: `README-DEMO.md`
- **Fix**: Pasos exactos para mostrar a Carlos
- [x] Done

### 6.4 Docker healthcheck + restart
- **Archivo**: `docker-compose.yml`
- **Fix**: Que se recupere solo si cae
- [x] Done

### 6.5 Backup pgdata
- **Archivo**: Nuevo script `scripts/backup.sh`
- **Fix**: Backup automático de base de datos
- [x] Done

---

## Métrica 10/10 — Criterios de Éxito

| Dimensión | Hoy | Target | 
|-----------|-----|--------|
| Smoke test | 12/12 | **20/20** |
| Tests server | 57/58 | **58/58** |
| Tests frontend | 8/8 (conflige) | **8/8** |
| E2E Playwright | 0/9 | **9/9** |
| Bugs críticos | 1 | **0** |
| Bugs altos | 3 | **0** |
| Bugs medios | 3 | **0** |
| DeepSeek tono Carlos | 85% | **95%+** |
| start-dev.sh | funcional | **sin errores visibles** |
| Demo con Carlos | posible | **"esto es lo mío"** |

---

## Workflow de trabajo

```
1. Leer PLAN-10-10-MVP.md → ver qué fase está en progreso
2. Ejecutar tarea de la fase
3. Marcar [ ] → [x] 
4. Validar (tests + smoke)
5. Commit
6. Repetir
```
