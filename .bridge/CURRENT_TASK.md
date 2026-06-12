---
task_id: TASK-002
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T00:00:00Z
updated_at: 2026-06-12T00:00:00Z
---

## Misión
Implementar el **schema completo de la base de datos** con Drizzle (todas las tablas de §3 y §3.bis del TDD), generar la migración, aplicar **Row-Level Security (RLS)** como red de seguridad multi-tenant, y crear un **seed del tenant Santa María con datos PLACEHOLDER** (estructura real, contenido genérico) para que el sistema arranque con un negocio cargado.

Esto reemplaza el `schema.ts` placeholder de TASK-001 (que solo tenía `tenants`).

## Contexto relevante
- **Fuente de verdad:** `docs/TDD-BACKEND-MVP.md` §3 (modelo de datos) y §3.bis (el "hueco" de hiperpersonalización = plantilla de Carlos). LÉELOS COMPLETOS antes de empezar.
- TASK-001 ya dejó: Drizzle configurado, `db/client.ts`, `drizzle.config.ts`, docker-compose con Postgres 16. Construye sobre eso.
- Multi-tenant **shared-schema**: TODA tabla de negocio lleva `tenant_id` con FK a `tenants`.
- El contenido real (textos, precios, flujos) NO existe aún (lo trae Carlos). Por eso el seed es PLACEHOLDER con shape correcto.

## Entregable esperado

### 1. Tablas (en `server/src/db/schema.ts`, una por sección de §3 del TDD)
- `tenants` (ya existe de TASK-001, mantener)
- `channel_accounts` — channel (enum whatsapp/instagram/messenger/mock), mode (enum mock/live), external_account_id, credentials (jsonb, nullable), status (enum connected/disconnected/error)
- `contacts` — tenant_id, channel, external_id, name, phone
- `conversations` — tenant_id, contact_id, channel_account_id, status (enum bot_active/human_active/escalated/closed), assigned_user_id (nullable), reply_window_expires_at, last_message_at
- `messages` — tenant_id, conversation_id, direction (enum inbound/outbound), sender_type (enum contact/bot/human), provider_message_id, content_type, text, media_url, raw (jsonb)
- `flows` — tenant_id, key, name, definition (jsonb), is_active, version
- `catalog_items` — tenant_id, name, description, price (numeric), currency, category, duration_minutes, image_url, is_active
- `business_profile` — tenant_id (PK/unique), persona (text), rules (jsonb), hours (jsonb), system_prompt_overrides (text)
- `users` — tenant_id, email, name, role (enum owner/agent)

### 2. Índices y constraints (críticos)
- Único `(tenant_id, provider_message_id)` en `messages` (idempotencia de webhooks de Meta).
- Índice `(tenant_id, conversation_id, created_at)` en `messages`.
- Índice `(tenant_id, status)` en `conversations`.
- FKs correctas con `tenant_id` en todas las tablas de negocio.

### 3. RLS (Row-Level Security)
- Habilitar RLS en las tablas de negocio (todas menos `tenants`).
- Política que filtra por un GUC de sesión, ej: `current_setting('app.current_tenant')::uuid = tenant_id`.
- Documenta en un comentario cómo la app debe setear el tenant por conexión/transacción (`SET app.current_tenant = '<uuid>'`). NO implementes la integración en la app todavía (eso es de tareas posteriores), solo deja las políticas creadas y documentadas. Si Drizzle no expresa RLS nativamente, ponlo en un archivo SQL de migración manual en `server/drizzle/` y aplícalo.

### 4. Seed placeholder de Santa María
Script `server/src/db/seed.ts` (corrible con `tsx`) que inserta:
- 1 tenant: "Santa María Clínica Estética" (slug `santa-maria`).
- 1 `channel_account` mode=mock, channel=mock (para demo sin credenciales).
- 1 `business_profile` placeholder: persona genérica ("asistente amable de clínica estética, tono cercano, usa el nombre del cliente"), rules placeholder (escalar si emergencia/molesto/pide humano), hours 9:00-22:30.
- ~5 `catalog_items` placeholder (ej: "Servicio A", precio 100000 COP, etc. — genéricos, NO inventes los reales de Santa María).
- 1 `flow` key=`agendamiento` con un `definition` jsonb placeholder que represente la máquina de estados del TDD §5.2: estados ask_city → show_service → payment_instructions → await_proof → collect_data → confirm_booking. Shape claro y comentado, contenido genérico.
- 1 `user` owner placeholder.

## Criterio de completación
Ejecuta y pega outputs:
1. `cd server && npm run db:generate` → genera migración sin errores.
2. `docker compose up -d` (usa `5433:5432` si 5432 está ocupado por oli-postgres — ver nota) y `npm run db:migrate` → migración aplica limpia.
3. `npx tsx src/db/seed.ts` → seed corre, inserta Santa María. Verifica con un `SELECT` que el tenant y sus filas existen (pega el conteo por tabla).
4. `npm test` y `npm run build` → siguen pasando.
5. Verifica que RLS está activo: `SELECT relrowsecurity FROM pg_class WHERE relname='messages';` → `t`.

## Fuera de alcance (NO hacer)
- Lógica de agente, adapters, endpoints de negocio (tareas posteriores).
- Contenido real de Santa María (lo trae Carlos; aquí solo placeholder).
- Cifrado de `credentials` (deuda de producción, documentada en TDD §7).
- Integrar el set del GUC de tenant en la app (solo crear las políticas).

## Notas del agente anterior (Claude)
- **Puerto Postgres:** tu entorno tenía 5432 ocupado por `oli-postgres` (lo reportaste en TASK-001). Cambia el mapeo del host a `5433:5432` en `docker-compose.yml` y ajusta `DATABASE_URL` del host, o detén el otro contenedor. Documenta qué hiciste.
- Usa el tipo `numeric` para `price` (no float) para evitar errores de redondeo en dinero.
- Para enums en Drizzle usa `pgEnum`.
- El `definition` del flow es el corazón del motor (§5.2); piensa el shape como: `{ initial: "ask_city", states: { ask_city: { prompt: "...", collects: "city", next: "show_service" }, ... } }`. Genérico pero usable.
- Si el TDD es ambiguo en algún campo, elige lo razonable y documéntalo en supuestos; si es una decisión de arquitectura, marca bloqueo y devuélvemelo.
- Al terminar: `status: WAITING_FOR_CLAUDE`, llena el "Resultado de OpenCode" abajo, agrega línea al `HANDOFF_LOG.md`, commit `task(TASK-002): schema + RLS + seed Santa María` y push a `origin main`.

## Resultado de OpenCode
_(OpenCode llena esto: archivos, comandos+outputs, conteos del seed, supuestos, bloqueos, próxima acción.)_
