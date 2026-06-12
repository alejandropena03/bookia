---
task_id: TASK-008
status: ON_HOLD
owner: opencode
created_by: claude
depends_on: TASK-007
hold_reason: "Alejandro va a REDISEÑAR el front antes de conectarlo (el diseño actual no le gusta). NO tomar esta tarea automáticamente al terminar TASK-007. El front se rediseña primero (Claude + Alejandro), LUEGO se conecta el front nuevo al backend. Cuando termines TASK-007, deja status WAITING_FOR_CLAUDE y NO avances a la 008."
---

## ⛔ EN PAUSA — NO TOMAR
Esta tarea conecta el front al backend, PERO Alejandro va a rediseñar el front primero porque el diseño actual no le gusta. Conectar ahora el diseño viejo sería doble trabajo. **Espera a que Claude reescriba esta tarea apuntando al front rediseñado.** Al terminar TASK-007, NO encadenes a esta: deja `WAITING_FOR_CLAUDE`.

## Misión (se actualizará tras el rediseño)
Conectar el **frontend Next.js existente** al backend real, reemplazando los datos simulados (JSON en `data/`) por llamadas a la API (TASK-007) y el stream SSE en vivo. Al terminar, el dashboard, la bandeja de conversaciones y el detalle de conversación muestran datos REALES del backend, y se puede ver el agente respondiendo en vivo desde la UI.

## Contexto
- El front ya existe en la raíz: `app/(dashboard)/dashboard`, `app/(dashboard)/conversations`, `app/(dashboard)/conversations/[id]`, `app/(dashboard)/settings`, componentes en `components/dashboard` y `components/conversations`.
- Hoy lee de `data/metrics.json`, `data/conversations.json` vía `lib/data.ts`. Hay API routes en `app/api/` que sirven esos JSON.
- Backend corre en `localhost:8787` (Hono). Endpoints disponibles tras TASK-007: `/api/conversations`, `/api/conversations/:id`, `/api/metrics`, `/api/catalog`, `/api/profile`, `/reply`, `/takeover`, `/handback`, `/api/sim/*`, SSE `/api/sim/stream`.
- TanStack Query v5 ya está en el front.

## Entregable
1. **Cliente de API** en el front (`lib/api.ts`): funciones tipadas que llaman al backend (base URL por env `NEXT_PUBLIC_API_URL`, default `http://localhost:8787`). Reusar tipos de `shared/` si existen.
2. **Reemplazar `lib/data.ts`**: las páginas de dashboard/conversaciones consumen la API real vía TanStack Query (no los JSON). Mantén los JSON como fallback de desarrollo solo si el backend no responde (opcional).
3. **Dashboard** (`app/(dashboard)/dashboard`): los `MetricCard`, charts (`ConversionChart`, `ChannelBreakdown`, `StatusDonut`) consumen `GET /api/metrics`.
4. **Conversaciones** (`app/(dashboard)/conversations` y `[id]`): lista desde `GET /api/conversations`, detalle desde `GET /api/conversations/:id`. Botones de takeover/handback/reply cableados a sus endpoints.
5. **Demo en vivo:** un panel o la propia vista de conversación se suscribe al SSE `/api/sim/stream` y muestra los mensajes llegando en tiempo real. Idealmente un botón "enviar mensaje simulado" que postea a `/api/sim/message` para demostrar el agente respondiendo solo (esto es la demo de venta).
6. Manejar auth: pasar el JWT/sesión de Auth.js o, en dev, el header `x-tenant-slug=santa-maria` (según lo que TASK-007 implementó).

## Criterio de completación (pega outputs / evidencia)
1. `docker compose up` (backend) + `npm run dev` (front) corriendo juntos.
2. El dashboard muestra métricas reales del backend (no los JSON). Screenshot o descripción de los datos mostrados.
3. La bandeja muestra conversaciones reales; abrir una muestra el hilo real.
4. Enviar un mensaje simulado desde la UI → se ve la respuesta del agente llegando en vivo (SSE). Describe/captura el flujo.
5. Takeover/handback desde la UI cambian el estado y se reflejan.
6. `npm run build` del front compila; tests del front (si aplica) pasan.

## Fuera de alcance
- Rediseño visual del front (eso es otra conversación; aquí solo cableado a datos reales).
- Panel self-service editable (CRUD de catálogo/flujos).
- Adapters reales de canal.

## Notas
- NO rompas el auth existente del front (Auth.js v5). Si el wiring del JWT con el backend es complejo, usa el modo dev `x-tenant-slug` y déjalo documentado como deuda para producción.
- Este es el entregable donde Alejandro VE todo junto funcionando — cuida que la demo en vivo (mensaje simulado → respuesta del agente en pantalla) se vea fluida.
- Este es un HITO visible: al terminar, `status: WAITING_FOR_CLAUDE` para que Claude revise antes de seguir. Commit `task(TASK-008): conectar front al backend real`, push, HANDOFF_LOG.
