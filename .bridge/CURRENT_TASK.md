---
task_id: TASK-013
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
depends_on: TASK-012
created_at: 2026-06-12T20:00:00Z
updated_at: 2026-06-12T21:00:00Z
priority: ALTA
batch: "TASK-012..014 — conectar producto end-to-end. TASK-012 DONE. TASK-013 DONE. TASK-014 en queue."
---

## Misión
**Conectar TODO el front al backend real**, reemplazando los datos mock por la API, e implementar el **panel de demo en vivo** (mensaje simulado → agente responde por SSE en tiempo real). Al terminar, el dashboard, las conversaciones y el inbox muestran datos REALES del backend.

## Resultado de OpenCode

### Archivos creados/modificados
```
A  lib/api.ts                     — cliente backend tipado (147 líneas, 13 funciones)
A  app/providers.tsx              — QueryClientProvider wrapper
A  components/dashboard/DemoLive.tsx — demo en vivo con SSE (botón flotante + modal chat)
M  .env                          — +NEXT_PUBLIC_API_URL
M  app/(dashboard)/layout.tsx     — QueryProvider + DemoLive
M  app/(dashboard)/dashboard/page.tsx — useQuery con fallback mock
M  app/(dashboard)/conversations/page.tsx — useQuery a backend real
M  app/(dashboard)/conversations/[id]/page.tsx — use(list params) + useQuery detail
M  app/(dashboard)/settings/page.tsx — +profile/catalog desde backend + sección servicios
```

### Conexiones implementadas

| Página | Antes (mock) | Ahora (backend) |
|---|---|---|
| **Dashboard** | `getDashboardData()` (mock) | `GET /api/metrics/intelligence` con fallback mock si backend no responde. Refetch cada 30s. Indicador de carga. |
| **Conversaciones** | `getConversations()` (JSON file) | `GET /api/conversations` con refetch cada 15s. Adapta shape del backend al formato ConversationsInbox. |
| **Conversación detalle** | `getConversationById()` (JSON file) | `GET /api/conversations/:id` + list combinados. Usa `use()` de React porque params es Promise en Next.js 16. |
| **Settings** | useState estático | `GET /api/profile` + `GET /api/catalog`. Muestra persona/booking_mode del backend y servicios con precios. |
| **Demo en vivo** | No existía | Componente `DemoLive` con botón flotante (esquina inf-der). Modal chat: input → `POST /api/sim/message` → respuesta SSE en tiempo real con typing indicator. |

### Demo en vivo (el corazón del pitch)
- Botón flotante violeta con ícono `Bot` en todas las páginas del dashboard
- Modal tipo chat con header gradient-brand, fondo con gradiente sutil
- Envía mensaje → `POST /api/sim/message` al backend real
- Recibe respuesta del agente vía `EventSource` en `/api/sim/stream`
- Typing indicator animado (3 puntitos rebotando)
- Mensajes de usuario a la derecha (brand-bg), bot a la izquierda (card)

### TanStack Query
- `QueryProvider` creado en `app/providers.tsx` con staleTime 30s, retry 1
- Envuelve TODO el dashboard layout (no afecta landing oscura)
- Queries: `["intelligence"]`, `["conversations"]`, `["conversation", id]`, `["profile"]`, `["catalog"]`

### API Client (`lib/api.ts`)
- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:8787`)
- Header `x-tenant-slug: santa-maria` modo dev
- 13 funciones: getIntelligence, listConversations, getConversation, replyConversation, takeover, handback, getCatalog, getProfile, sendSimMessage, subscribeToSSE
- Tipado estricto con interfaces de backend

### Build
- `npm run build` (frontend): Next.js ✅
- `npm run build` (server): tsc ✅

### Notas
- Demo en vivo es el momento clave del pitch: muestra el backend real respondiendo
- AUTH: se usa modo dev (x-tenant-slug) — deuda JWT documentada
- Settings PUT no implementado en backend — solo lectura (documentado en UI)
- Las rutas API mock de Next.js (`app/api/conversations`, `app/api/metrics`) siguen existiendo pero no se usan desde el front
