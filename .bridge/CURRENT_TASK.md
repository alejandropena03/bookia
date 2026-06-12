---
task_id: TASK-003
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T03:00:00Z
updated_at: 2026-06-12T03:00:00Z
batch: "TASK-003..005 emitidas juntas. Encadena según el protocolo de cola del README §Cola."
---

## Misión
Implementar la abstracción **Channel-Adapter** con el **MockAdapter**, los endpoints de simulación y el stream en vivo (SSE), de modo que se pueda inyectar un mensaje simulado y verlo fluir por el pipeline y persistirse, emitiéndose en tiempo real. Esto es el núcleo del modelo de venta ("conversación simulada en vivo sin credenciales").

## Contexto
- Fuente de verdad: `docs/TDD-BACKEND-MVP.md` §4 (Channel-Adapter, NormalizedInboundMessage) y §6 (endpoints `/api/sim/*`, `/webhooks/:channel`).
- Ya existe: schema completo, seed de Santa María (tenant con channel_account mock), RLS con rol `bookia_app`.
- Multi-tenant: cada operación debe setear `app.current_tenant` (usa el helper que crees; ver abajo).

## Entregable
1. **`server/src/channels/types.ts`** — interfaces `NormalizedInboundMessage`, `NormalizedOutboundMessage`, `ChannelAdapter` (tal cual §4 del TDD: `verifyWebhook`, `parseInbound`, `sendMessage`, `canSendFreeForm`).
2. **`server/src/channels/mock.ts`** — `MockAdapter`: `verifyWebhook→true`, `parseInbound` toma un payload simple `{ from, text, name? }` y lo normaliza, `sendMessage` persiste el outbound + emite por el bus de eventos, `canSendFreeForm→true`.
3. **`server/src/channels/registry.ts`** — factory que devuelve el adapter por `channel`/`mode` (de `channel_accounts`). Por ahora solo mock; deja el patrón listo para whatsapp/instagram.
4. **`server/src/lib/tenant-db.ts`** — helper `withTenant(tenantId, fn)` que abre conexión con rol `bookia_app`, setea `app.current_tenant` y corre `fn`. Toda escritura de negocio pasa por aquí.
5. **`server/src/lib/event-bus.ts`** — bus simple en memoria (EventEmitter) para publicar mensajes nuevos por conversación/tenant.
6. **`server/src/conversations/service.ts`** — `ingestInbound(normalized)`: upsert contact, find-or-create conversation, insert message (idempotente por provider_message_id), actualiza last_message_at, emite evento. Por ahora NO llama al agente (eso es TASK-005); solo persiste y emite.
7. **Endpoints (Hono, en `server/src/api/`):**
   - `POST /api/sim/message` body `{ tenantSlug, from, text, name? }` → resuelve tenant, normaliza vía MockAdapter, llama `ingestInbound`, responde el message persistido.
   - `GET /api/sim/stream?tenantSlug=...` → SSE que emite los mensajes nuevos del tenant en vivo.
   - `GET /webhooks/:channel` y `POST /webhooks/:channel` → estructura genérica (verify + parse + ingest); para `mock` funciona, para whatsapp/instagram deja el adapter no implementado aún (501 o TODO claro).

## Criterio de completación (pega outputs)
1. `docker compose up -d` + migrate + seed OK.
2. `curl -X POST localhost:8787/api/sim/message -H 'content-type: application/json' -d '{"tenantSlug":"santa-maria","from":"57300111","text":"Hola, quiero info"}'` → 200 con el mensaje persistido.
3. Reenviar el MISMO mensaje (mismo provider id) → no duplica (idempotencia).
4. Conectar a `GET /api/sim/stream?tenantSlug=santa-maria` y ver que al postear un mensaje llega por el stream.
5. `npm test` (añade tests de: normalización mock, idempotencia, ingest) + `npm run build` pasan.

## Fuera de alcance
- Lógica del agente / LLM (TASK-005). Aquí el inbound solo se persiste y emite.
- Adapters reales de WhatsApp/Instagram (TASK posterior).

## Notas
- Genera `provider_message_id` determinístico para el mock (ej `mock_<hash(from+text+ts)>`), pero permite pasarlo explícito para probar idempotencia.
- Mantén los tipos en `shared/` si crees que el front los va a consumir; si no, en `server/src`.
- Al terminar: `status: WAITING_FOR_CLAUDE`, llena Resultado, línea en HANDOFF_LOG, commit `task(TASK-003): channel-adapter + mock + sim + SSE`, push. **Luego, según el protocolo de cola, toma TASK-004 de `.bridge/queue/` y continúa sin esperar a Claude, SALVO que TASK-003 tenga bloqueos.**

## Resultado de OpenCode
_(llenar)_
