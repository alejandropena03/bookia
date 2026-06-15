---
task_id: TASK-022
status: WAITING_FOR_CLAUDE
owner: claude
created_by: opencode
priority: ALTA
created_at: 2026-06-15T14:15:00Z
title: "Auditoría completa MVP + fixes pendientes"
---

## Contexto

Alejandro probó el MVP y reportó:

1. **DemoLive chat dice "Error conectando al backend"** ← **YA FIXED** (seed no estaba corrido → tenant santa-maria no existía)
2. **No aparecen conversaciones** ← **YA FIXED** (seed-demo pobló 18 conversaciones)
3. **No deja entrar a "Agenda" ni "Analítica"** ← **NUNCA IMPLEMENTADAS** (son placeholders "Próximamente" en el sidebar)
4. **Pidió auditoría real** (no pruebas superficiales) y handoff a Claude

## Estado actual del MVP tras fixes de OpenCode

### ✅ Endpoints funcionales (probados con curl contra Docker)

| Endpoint | Status | Datos |
|----------|--------|-------|
| `GET /api/conversations` | 200 ✅ | 18 conversaciones con datos reales |
| `GET /api/conversations/:id` | 200 ✅ | Detalle + mensajes |
| `POST /api/conversations/:id/reply` | 201 ✅ | Solo si `human_active` |
| `POST /api/conversations/:id/takeover` | 200 ✅ | |
| `POST /api/conversations/:id/handback` | 200 ✅ | |
| `GET /api/metrics/intelligence` | 200 ✅ | $1.8M potencial, $400K agendado, embudo 5 etapas |
| `GET /api/catalog` | 200 ✅ | 5 servicios |
| `GET /api/profile` | 200 ✅ | Business profile Santa María |
| `POST /api/sim/message` | 201 ✅ | Flujo agendamiento E2E funcional |
| `GET /api/sim/stream` | 200 ✅ | SSE streaming |
| `POST /api/workers/reminders/run` | 200 ✅ | |
| `POST /api/workers/reengagement/run` | 200 ✅ | |
| `Health` | 200 ✅ | DB connected |

### 🐛 Bugs conocidos (no resueltos)

#### Bug 1: `POST /api/workers/crm/run` — 500 error
- **Causa:** `bookings.datetime` es `text` en schema (schema.ts:160) pero el worker CRM compara con timestamps (`NOW() - INTERVAL '8 days'`)
- **Archivo:** `server/src/workers/crm.ts:24`
- **Impacto:** Worker CRM (post-servicio + recompra) no funciona
- **Fix posible:** Convertir `datetime` a `timestamp` en schema, o usar `b.datetime::timestamp` en queries

#### Bug 2: `POST /webhooks/:channel` — 500 error
- **Causa:** Usa `tenantId: "resolve-later"` (string literal) como UUID en queries PostgreSQL
- **Archivo:** `server/src/api/webhooks.ts:94`
- **Impacto:** Webhooks no procesan mensajes
- **Nota:** Los webhooks NO pasan por middleware `resolveTenant` (están fuera de `/api/*`)

#### Bug 3: Volumen Postgres no persiste datos entre rebuilds
- **Causa:** No identificada. El volumen `bookia-code_pgdata` existe pero los datos se pierden al hacer `docker compose build/up`
- **Impacto:** Cada vez que se reconstruye el API container, hay que re-ejecutar seed + seed-demo

### 🚧 Lo que NO está implementado (desde diseño original)

| Feature | Estado | Notas |
|---------|--------|-------|
| `/agenda` page | ❌ Placeholder "Próximamente" | Tabla `bookings` existe en DB, endpoints de workers OK, pero no hay UI de agenda |
| `/analytics` page | ❌ Placeholder "Próximamente" | Los datos de inteligencia YA se muestran en `/dashboard` |
| Reply/takeover/handback buttons | ❌ Disabled en UI | APIs existen y funcionan, pero `ConversationsInbox.tsx` tiene los botones `disabled` |
| Login real contra DB | ❌ Mock | Usa `data/users.json` local. Auth real con JWT pendiente |
| Settings guardar cambios | ❌ Solo lectura | Botón "Guardar" solo cambia estado local, no persiste |
| Agenda Pro integration | ❌ Pendiente API key | BookingProvider con modo `handoff` listo. Falta API key del cliente |
| Plantilla Carlos (hiperpersonalización) | ❌ Pendiente | Motor listo (TASK-015). `npm run import:tenant -- --slug=[x]` cuando llegue |

### 🔧 Fixes aplicados por OpenCode en esta sesión

1. **Seed ejecutado:** `seed.ts` + `seed-demo.ts` → tenant santa-maria + 18 conversaciones demo
2. **Docker reconstruido:** `docker compose build api && docker compose up -d api`
3. **lib/api.ts:** `sendSimMessage()` corregido: `contactName`→`name`, agregado `from`, `channel: "mock"`
4. **service.ts:** Auto-crea `channel_account` si no existe (evita TypeError por `ca.id` undefined)
5. **MockLlmProvider:** Separada lógica router (JSON) vs responder (texto natural)
6. **Tests actualizados:** MockLlmProvider tests usan router prompt para JSON, verifican texto natural en responder

### Tests: 58/58 pasando
### Server build (tsc): OK
### Frontend build (next build): OK

## Preguntas abiertas para Claude

1. **¿Cómo resolver las páginas de Agenda y Analítica?** ¿Se construyen ahora o se dejan para fase 2? Son placeholders visuales pero el modelo de datos ya soporta ambas.

2. **¿Priorizamos fix del worker CRM o lo dejamos para cuando haya datos reales?**

3. **¿Los botones reply/takeover/handback en ConversationsInbox deben habilitarse?** Las APIs existen, es conectar UI.

4. **¿El bug del volumen Postgres es preocupante o aceptable para MVP dev?**

5. **Alejandro quiere saber:** ¿qué definiste exactamente para Agenda y Analítica? Porque en el sidebar aparecen como "Próximamente" pero nunca se especificó qué deberían contener vs lo que ya está en Dashboard.
