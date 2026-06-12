---
task_id: TASK-007
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T09:00:00Z
updated_at: 2026-06-12T09:00:00Z
batch: "TASK-007..008 emitidas juntas. Encadena según protocolo de cola (README §Cola)."
---

## Misión
Construir la **API del dashboard y métricas** + el **inbox humano** (escalación operable): endpoints que el front Next.js ya existente va a consumir, y la capacidad de que un operador humano tome/devuelva una conversación. El cerebro (TASK-006) ya quedó sólido; ahora exponemos los datos y el control humano.

## Contexto
- Fuente de verdad: `docs/TDD-BACKEND-MVP.md` §6 (endpoints) y §5.3.ter (escalación a humano).
- Ya existe: conversaciones/mensajes/bookings persistidos, conversación se marca `human_active`/`escalated` al escalar, SSE por tenant, RLS con rol bookia_app, auth del front es Auth.js v5 (JWT).
- Multi-tenant: todo endpoint resuelve `tenant_id` y usa `withTenant`.

## Entregable
### 1. Auth/tenant middleware
- `server/src/api/middleware.ts` — middleware Hono que valida la sesión (JWT de Auth.js v5 que ya usa el front; comparte el secret por env `AUTH_SECRET`) y resuelve `tenantId` del usuario. Para MVP, si integrar el JWT real es complejo, acepta también un header `x-tenant-slug` en modo dev (documentado y gateado por env `DEV_AUTH=true`). Toda ruta `/api/*` (excepto `/api/sim/*` que ya existe) pasa por aquí.

### 2. Endpoints de conversaciones / inbox
- `GET /api/conversations?status=&channel=&page=` — lista paginada (id, contacto, canal, status, last_message_at, último mensaje preview). Filtros opcionales.
- `GET /api/conversations/:id` — hilo completo (mensajes ordenados) + datos del contacto + estado.
- `POST /api/conversations/:id/reply` — el operador humano envía un mensaje (persiste outbound sender_type='human', emite SSE, y si hay adapter live lo enviaría — en mock solo persiste/emite).
- `POST /api/conversations/:id/takeover` — operador toma el control: status → `human_active`, assigned_user_id = usuario actual. El bot deja de responder esa conversación.
- `POST /api/conversations/:id/handback` — devuelve al bot: status → `bot_active`, assigned_user_id = null.
- **Importante:** el orchestrator (processMessage) debe RESPETAR el estado: si la conversación está `human_active`/`escalated`, el bot NO responde automáticamente (el inbound se persiste y emite, pero el agente se abstiene). Ajusta `processMessage` para chequear el status al inicio y salir temprano si es humano.

### 3. Endpoints de métricas (para el dashboard del front)
- `GET /api/metrics?from=&to=` — agregados del tenant: total conversaciones, mensajes inbound/outbound, conversaciones por status, por canal, tasa de respuesta del bot, nº de bookings creadas (conversión a cita), nº de escalaciones, tendencia diaria (serie temporal simple). Usa SQL con agregaciones (Drizzle permite raw). Devuelve shape JSON listo para el dashboard.
- `GET /api/catalog`, `GET /api/profile`, `GET /api/flows` — lectura de la config del tenant (para el panel). CRUD completo NO es necesario aún (eso es panel self-service, tarea posterior); con GET basta para que el front muestre.

## Criterio de completación (pega outputs)
1. `docker compose up` + seed. Generar conversaciones de prueba vía `/api/sim/message` (varias, incluyendo una que escale y una que agende).
2. `GET /api/conversations` → lista con las conversaciones, filtrable por status. Pega salida.
3. `GET /api/conversations/:id` → hilo completo con inbound+outbound. Pega salida.
4. `POST /takeover` luego un `/api/sim/message` a esa conversación → el bot NO responde (solo persiste). Luego `/reply` del humano funciona. Luego `/handback` → el bot vuelve a responder. Pega evidencia.
5. `GET /api/metrics` → JSON con los agregados. Pega salida.
6. `npm test` (añade tests de métricas, listado, takeover/handback, y que el bot se abstiene si human_active) + `npm run build` pasan.

## Fuera de alcance
- Adapters reales WhatsApp/Instagram (lote posterior).
- CRUD de catálogo/perfil (panel self-service editable, posterior).
- Notificación real al operador por WhatsApp/email (por ahora el evento SSE + el status basta).

## Notas
- Nota menor heredada de TASK-006: el mensaje automático de escalación se persiste como sender_type='human'; cámbialo a 'bot' (lo escribe el sistema, no un humano). Trivial.
- Las métricas: si una agregación es pesada, está bien on-the-fly para el MVP (volumen bajo). No crees materialized views todavía.
- ⛔ CAMBIO: al terminar TASK-007, NO tomes la TASK-008 (está EN PAUSA — Alejandro va a rediseñar el front antes de conectarlo). Deja `status: WAITING_FOR_CLAUDE` y espera. Commit de TASK-007, push, HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
