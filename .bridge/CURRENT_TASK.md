---
task_id: TASK-013
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
depends_on: TASK-012
created_at: 2026-06-12T20:00:00Z
updated_at: 2026-06-12T20:00:00Z
priority: ALTA
batch: "TASK-012..014 — conectar producto end-to-end. TASK-012 DONE. TASK-013 activa. TASK-014 en queue."
---

## Misión
**Conectar TODO el front al backend real**, reemplazando los datos mock por la API, e implementar el **panel de demo en vivo** (mensaje simulado → agente responde por SSE en tiempo real). Al terminar, el dashboard, las conversaciones y el inbox muestran datos REALES del backend.

## Contexto
- TASK-012 COMPLETADA: `GET /api/metrics/intelligence` existe y retorna shape `DashboardData` real desde DB (7 tests pasan).
- Backend corre en `localhost:8787` (Hono). Endpoints disponibles: `/api/conversations`, `/api/conversations/:id`, `/reply`, `/takeover`, `/handback`, `/api/metrics`, `/api/metrics/intelligence`, `/api/catalog`, `/api/profile`, `/api/flows`, `/api/sim/message`, SSE `/api/sim/stream`.
- Front: Next.js, TanStack Query v5 ya instalado. Auth middleware del backend acepta `x-tenant-slug` en modo dev (DEV_AUTH=true).
- El dashboard de inteligencia (TASK-011) consume `DashboardData` de `lib/dashboard-mock.ts` → reemplazar con llamada real.

## Entregable
1. **`app/lib/api.ts`** — cliente tipado del backend (base `NEXT_PUBLIC_API_URL`, default `http://localhost:8787`). Incluye header `x-tenant-slug: santa-maria` en dev. Funciones: `getIntelligence`, `listConversations`, `getConversation`, `replyConversation`, `takeover`, `handback`, `getCatalog`, `getProfile`, `sendSimMessage`, y helper para SSE.
2. **Dashboard de inteligencia** → consume `/api/metrics/intelligence` vía TanStack Query (reemplaza `getDashboardData()` del mock). Si el backend no responde → fallback al mock con `console.warn`.
3. **Conversaciones lista + detalle** → `/api/conversations` y `/:id`. Acciones takeover/handback/reply cableadas a sus endpoints.
4. **Panel de demo en vivo** (lo más importante para vender):
   - Un input para enviar mensaje simulado (POST `/api/sim/message` con tenantSlug `santa-maria`).
   - La conversación se actualiza EN VIVO vía SSE (`/api/sim/stream`): llega el mensaje del cliente y aparece la respuesta del agente en tiempo real.
   - Puede vivir en `/conversations` (abrir conversación como cliente) o en ruta dedicada `/demo`. Elige lo más limpio, documéntalo.
5. **Settings** → leer profile/catalog reales (GET). Solo-lectura si el backend no tiene PUT (documenta la deuda).
6. Loading/error states decentes (skeletons o spinners del tema claro, no pantallas en blanco).

## Criterio de completación
1. `docker compose up` (backend) + `npm run dev` (front) corriendo juntos sin errores.
2. Dashboard muestra insights calculados por backend (no el mock). Describe qué datos aparecen.
3. Bandeja muestra conversaciones reales; abrir una muestra el hilo real.
4. **Demo en vivo:** enviar mensaje simulado → respuesta del agente llega por SSE. Describe el flujo. ESTE es el momento clave del pitch.
5. Takeover/handback desde UI cambian estado y se reflejan.
6. `npm run build` del front compila sin errores.

## Fuera de alcance
- Rediseño visual (ya aprobado).
- Adapters reales de canal (después).

## Notas
- NO rompas el auth de Auth.js del front. Usa modo dev `x-tenant-slug` y documéntalo como deuda JWT.
- La demo en vivo debe sentirse fluida — es el corazón del pitch.
- **HITO:** al terminar → status `WAITING_FOR_CLAUDE` (NO encadenar a 014 automáticamente; Claude revisa la conexión completa primero).
- Commit: `task(TASK-013): conectar front al backend + demo en vivo`, push, actualizar HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
