---
task_id: TASK-013
status: QUEUED
owner: opencode
created_by: claude
depends_on: TASK-012
---

## Misión
**Conectar TODO el front al backend real**, reemplazando los datos mock por la API, e implementar el **panel de demo en vivo** (mensaje simulado → agente responde por SSE en tiempo real). Al terminar, el dashboard, las conversaciones y el inbox muestran datos REALES del backend.

## Contexto
- Backend corre en `localhost:8787` (Hono). Endpoints: `/api/conversations`, `/api/conversations/:id`, `/reply`, `/takeover`, `/handback`, `/api/metrics`, `/api/metrics/intelligence` (TASK-012), `/api/catalog`, `/api/profile`, `/api/flows`, `/api/sim/message`, SSE `/api/sim/stream`.
- Front: Next.js, TanStack Query v5 ya instalado. Auth middleware del backend acepta `x-tenant-slug` en modo dev (DEV_AUTH=true).
- El dashboard de inteligencia (TASK-011) consume `DashboardData`; ahora vendrá de `/api/metrics/intelligence` en vez del mock.

## Entregable
1. **`lib/api.ts`** — cliente tipado del backend (base `NEXT_PUBLIC_API_URL`, default `http://localhost:8787`). Incluye header de tenant en dev. Funciones: getIntelligence, listConversations, getConversation, replyConversation, takeover, handback, getCatalog, getProfile, sendSimMessage, y un helper para suscribirse al SSE.
2. **Dashboard** → consume `/api/metrics/intelligence` vía TanStack Query (reemplaza `getDashboardData()` mock). Mantener el mock como fallback solo si el backend no responde (opcional, con aviso en consola).
3. **Conversaciones lista + detalle** → `/api/conversations` y `/:id`. Acciones takeover/handback/reply cableadas.
4. **Panel de demo en vivo** (lo más importante para vender): una vista o sección donde:
   - Hay un input para enviar un mensaje simulado (POST `/api/sim/message` con tenantSlug santa-maria).
   - Se ve la conversación actualizarse EN VIVO vía SSE (`/api/sim/stream`): llega el mensaje del cliente y aparece la respuesta del agente. Esto demuestra "míralo responder solo" con el backend REAL.
   - Puede vivir en `/conversations` (abrir una conversación y escribir como si fueras el cliente) o una ruta dedicada `/demo`. Tú eliges lo más limpio; documenta.
5. **Settings** → leer profile/catalog reales (GET). Edición puede quedar de solo-lectura por ahora si el backend no tiene PUT (documenta).
6. Manejo de loading/error states decentes (skeletons del tema claro, no pantallas en blanco).

## Criterio de completación (pega evidencia)
1. `docker compose up` (backend) + `npm run dev` (front) corriendo juntos.
2. Dashboard muestra los insights calculados por el backend (no el mock). Screenshot/descripción.
3. Bandeja muestra conversaciones reales; abrir una muestra el hilo real.
4. **Demo en vivo:** enviar un mensaje simulado → se ve la respuesta del agente llegando por SSE. Describe/captura el flujo. ESTE es el momento clave.
5. Takeover/handback desde la UI cambian estado y se reflejan.
6. `npm run build` del front compila.

## Fuera de alcance
- Rediseño visual (ya aprobado). Solo cablear datos.
- Adapters reales de canal (después).

## Notas
- NO rompas el auth de Auth.js del front. Si el wiring JWT↔backend es complejo, usa el modo dev x-tenant-slug y documéntalo como deuda.
- Cuida que la demo en vivo se sienta fluida — es el corazón del pitch.
- HITO → al terminar `status: WAITING_FOR_CLAUDE` (no encadenes a 014 automáticamente; Claude revisa la conexión completa primero). Commit `task(TASK-013): conectar front al backend + demo en vivo`, push, HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
