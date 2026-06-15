---
title: TDD — Backend MVP (Completado)
collection: f8db5a5c-53ed-406a-9a8d-4e6de6d0c487
---

# TDD — Backend MVP de Bookia

> **Documento de Diseño Técnico (Technical Design Document)**
> Versión: 2.0 · Fecha: 2026-06-15 · Autor: Claude + OpenCode
> Estado: COMPLETADO — MVP funcional
> Stack actual: Node 22 + Hono + Drizzle + PostgreSQL 16 + DeepSeek API
> Tests: 58/58 pasando

---

## 0. Resumen Ejecutivo

Bookia es un SaaS donde un **agente de IA responde conversaciones de WhatsApp/Instagram** de forma autónoma para clínicas estéticas, con el catálogo y la personalidad del negocio cargados. El modelo de venta es **"producto terminado esperando credenciales"**.

Este TDD cubre el **backend del MVP** que corre en **Docker en una Mac** (entorno del socio ejecutor). El sistema está **100% construido** con datos placeholder estructurados; al llegar la plantilla de Carlos, solo se **rellena la capa de configuración** sin reconstruir nada.

**Lo que se construyó (TASK-001 a TASK-020):**
- Backend scaffold (Hono + Docker + Postgres)
- Schema completo (10 tablas, 8 enums, RLS multi-tenant)
- Channel adapter + Mock + SSE streaming
- LLM layer (DeepSeek + Mock + eval harness)
- Cerebro híbrido (router, flow engine, responder, escalation, orchestrator)
- Dashboard API + Inbox humano (takeover/handback)
- Landing premium (tech-luxe, GSAP)
- Dashboard inteligencia comercial (6 bloques, datos reales)
- Front conectado a backend (lib/api.ts, TanStack Query)
- Datos de muestra realistas (18 conversaciones, 224 mensajes)
- Motor hiperpersonalización (6 fixes, import-tenant)
- Workers: recordatorios, Wompi pagos, re-engagement, CRM, handoff LLM

---

## 1. Principios de Diseño

1. **Provider-agnostic en el LLM.** DeepSeek v4-flash (3x más barato). Intercambiable por config.
2. **Estabilidad sobre improvisación.** Flujos críticos determinísticos (máquina de estados + respuestas predefinidas).
3. **El hueco de hiperpersonalización es configuración, no código.** Motor genérico; flujos/catálogo/tono se cargan como datos.
4. **Mock ⇄ Real intercambiables.** MockAdapter para demostrar sin credenciales.
5. **Multi-tenant desde el día 1.** RLS con GUC `app.current_tenant`.
6. **Un solo lenguaje (TypeScript)** compartido con el front.
7. **No sobre-ingenierizar.** Sin Redis, sin vector DB, sin LangGraph.

---

## 2. Stack Tecnológico

| Capa | Elección | Justificación |
|---|---|---|
| Runtime | Node.js 22 + TypeScript 5 | Comparte tipos con el front Next.js |
| API framework | Hono | Typesafe (Zod), liviano, edge-ready |
| Validación | Zod | Esquemas compartidos front/back |
| ORM | Drizzle ORM | Sin codegen, tipos al instante |
| DB | PostgreSQL 16 | Multi-tenant shared-schema + RLS |
| Driver raw SQL | postgres.js | SQL tagged templates para queries complejas |
| LLM | DeepSeek API (deepseek-v4-flash) | 3x más barato, OpenAI-compatible |
| Agente | Híbrido propio (router + state-machine + LLM) | Estable, sin LangChain |
| Tests | Vitest | Velocidad + compatibilidad TS/ESM |
| Frontend | Next.js 16 + React 19 + Tailwind v4 + shadcn/ui | App Router, Server Components |
| Estado front | TanStack Query + Zustand | Cache + estado local |
| Animaciones | GSAP + ScrollTrigger | Premium feel |
| Charts | Recharts | Métricas en dashboard |
| Contenedor | Docker + docker-compose | api + postgres |

---

## 3. Estructura de Repo

```
bookia/
├── app/                    # Front Next.js (App Router)
│   ├── (dashboard)/        # Layout dashboard + pages
│   ├── api/                # Next.js API routes (auth, proxy)
│   ├── login/              # Auth pages
│   └── page.tsx            # Landing (premium)
├── components/             # React components
│   ├── landing/              # Landing sections (GSAP)
│   └── dashboard/            # Dashboard + DemoLive
├── lib/                    # Client utilities
│   ├── api.ts                # API client (13 funciones)
│   └── dashboard-mock.ts     # Mock fallback
├── server/
│   ├── src/
│   │   ├── index.ts          # Hono entrypoint
│   │   ├── api/
│   │   │   ├── sim.ts        # POST /message + GET /stream
│   │   │   ├── dashboard.ts  # 12 endpoints
│   │   │   ├── workers.ts    # 3 workers + status
│   │   │   └── webhooks.ts   # Webhook stubs
│   │   ├── agent/
│   │   │   ├── router.ts     # LLM intent classifier
│   │   │   ├── responder.ts  # LLM + canned responses
│   │   │   ├── orchestrator.ts # Pipeline completo
│   │   │   ├── escalation.ts # Rules + low confidence
│   │   │   ├── summarizer.ts # LLM handoff summary
│   │   │   └── llm/          # DeepSeekProvider + Mock
│   │   ├── flows/
│   │   │   ├── engine.ts       # State-machine
│   │   │   └── template.ts     # Variable renderer
│   │   ├── channels/
│   │   │   ├── types.ts        # ChannelAdapter interface
│   │   │   ├── registry.ts     # getAdapter()
│   │   │   └── mock.ts         # MockAdapter
│   │   ├── conversations/
│   │   │   └── service.ts      # ingestInbound
│   │   ├── workers/
│   │   │   ├── reminder.ts     # TASK-016
│   │   │   ├── reengagement.ts # TASK-018
│   │   │   └── crm.ts          # TASK-019
│   │   ├── payment/
│   │   │   ├── types.ts        # PaymentProvider interface
│   │   │   ├── wompi.ts        # WompiProvider (TASK-017)
│   │   │   └── manual.ts       # ManualPaymentProvider
│   │   ├── booking/
│   │   │   ├── types.ts        # BookingProvider interface
│   │   │   ├── mock.ts         # MockBookingProvider
│   │   │   └── handoff.ts      # HandoffBookingProvider
│   │   ├── db/
│   │   │   ├── schema.ts       # 10 tablas, 8 enums
│   │   │   ├── client.ts       # postgres.js connection
│   │   │   ├── seed.ts         # Santa Maria placeholder
│   │   │   └── seed-demo.ts    # Realistic demo data
│   │   ├── lib/
│   │   │   ├── tenant-db.ts    # withTenant helper
│   │   │   ├── event-bus.ts    # SSE EventEmitter
│   │   │   └── hours.ts        # Out-of-hours check
│   │   └── env.ts              # Environment config
│   ├── tests/                # 7 suites, 58 tests
│   ├── drizzle/              # 9 migrations (0000-0008)
│   └── docker-compose.yml    # api + postgres
├── docs/
│   ├── TDD-BACKEND-MVP.md    # Este documento
│   └── ESTADO-ACTUAL.md      # Estado actual del proyecto
└── .bridge/                  # Bridge Protocol
    ├── CURRENT_TASK.md
    ├── HANDOFF_LOG.md
    ├── queue/                  # Task specs
    └── tasks/                  # Archived tasks
```

---

## 4. Arquitectura del Cerebro

```
Mensaje entrante
  → ingestInbound
    - Upsert contact (tenant_id + channel + external_id)
    - Find/create conversation (open + bot_active)
    - Insert message (idempotent)
    - Emit SSE event
  → processMessage (orchestrator)
    1. Load business context (persona, catalog, rules, hours)
    2. Check if human_active → abort
    3. Check out-of-hours → canned response
    4. Load catalog items
    5. isFirstMessage? → trigger first_contact flow
    6. Resume active flow (evaluateFlow)
       - If completed with service → completeBooking
       - Else → injectPaymentLink → respond
    7. Classify intent (router → LLM)
    8. Check escalation (evaluateEscalation)
       - If escalate → summarizeConversation → persist summary → handoff
    9. Try start new flow (tryStartFlow)
    10. Try canned response (getCannedResponse)
    11. LLM responder (generateLlmResponse)
  → persistAndEmit
    - INSERT outbound message
    - Emit SSE event
```

---

## 5. Schema de Base de Datos

### Tablas (10)

| Tabla | Proposito |
|---|---|
| tenants | Multi-tenant root |
| channel_accounts | Cuentas de canal (WhatsApp, IG, FB, mock) |
| business_profile | Persona, reglas, horarios, canned responses |
| catalog_items | Servicios + precios |
| flows | Definiciones de flujos (state-machine JSON) |
| users | Operadores humanos |
| contacts | Clientes (único por tenant + channel + external_id) |
| conversations | Threads de conversación |
| messages | Mensajes (inbound/outbound) |
| bookings | Citas agendadas |
| conversation_state | Estado activo del flow (current_state, slots) |
| worker_logs | Logs de ejecución de workers |

### Enums (8)

- channel_type: whatsapp, instagram, messenger, mock
- conversation_status: bot_active, human_active, escalated, closed
- message_direction: inbound, outbound
- sender_type: contact, bot, human
- booking_status: pending, scheduled, confirmed, cancelled, no_show, reminder_no_response
- reminder_status: none, sent
- reengagement_step: 0, 1, 7, 30
- payment_status: pending, paid, failed

### RLS

- FORCE RLS en todas las tablas de negocio
- `current_setting('app.current_tenant', true)` con fallback
- Rol `bookia_app` (limited) para runtime
- Superuser `bookia` solo para migraciones/seed

---

## 6. Endpoints del Backend

### API Pública (/api/*)

| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/conversations | Lista con paginación + filtros |
| GET | /api/conversations/:id | Detalle + mensajes |
| POST | /api/conversations/:id/reply | Responder (solo human_active) |
| POST | /api/conversations/:id/takeover | Tomar control humano |
| POST | /api/conversations/:id/handback | Devolver a bot |
| GET | /api/metrics | Métricas agregadas |
| GET | /api/metrics/intelligence | Dashboard data (KPIs, funnel, heatmap, ROI) |
| GET | /api/catalog | Catálogo de servicios |
| GET | /api/profile | Business profile |
| GET | /api/flows | Flujos configurados |

### Simulador (/api/sim)

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/sim/message | Enviar mensaje simulado |
| GET | /api/sim/stream | SSE stream de eventos |

### Workers (/api/workers)

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/workers/reminders/run | Ejecutar worker de recordatorios |
| GET | /api/workers/reminders/status | Status de últimas ejecuciones |
| POST | /api/workers/reengagement/run | Ejecutar worker de re-engagement |
| POST | /api/workers/crm/run | Ejecutar worker CRM |

### Webhooks (/webhooks)

| Método | Ruta | Descripción |
|---|---|---|
| GET | /webhooks/:channel | Webhook verification (challenge) |
| POST | /webhooks/:channel | Recibir mensaje de canal |
| POST | /webhooks/wompi | Webhook de pagos Wompi |

### Público

| Método | Ruta | Descripción |
|---|---|---|
| GET | / | Info API |
| GET | /health | Health check + DB status |

---

## 7. Workers Automatizados

### Recordatorios (TASK-016)
- Busca bookings `confirmed/scheduled` con datetime `NOW()+24h`
- Envia recordatorio via pipeline del agente
- Marca `reminder_status = sent`

### Wompi Pagos (TASK-017)
- `pending_activation`: solo activa si hay `WOMPI_PUBLIC_KEY`
- Sin key → fallback a instrucciones manuales
- Webhook confirma pago → booking confirmed

### Re-engagement (TASK-018)
- Busca leads en estado `precio` sin booking
- Secuencia: día 1, 7, 30
- Idempotente por `reengagement_step`

### CRM (TASK-019)
- Post-servicio (7 días): pide reseña Google Maps
- Recompra (90 días): recordar seguimiento
- Idempotente por timestamps

### Handoff Summary (TASK-020)
- Cuando escalación → LLM resume últimos 20 mensajes
- Persiste en `conversations.handoff_summary`
- Costo: ~$0.001 por resumen

---

## 8. Estado Actual (2026-06-15)

### Funciona ✅
- 58/58 tests pasando
- Server build (tsc) OK
- Frontend build (next build) OK
- 18 conversaciones demo con datos reales
- Chat E2E funcional (flujo de agendamiento completo)
- Dashboard inteligencia con datos reales
- SSE streaming
- Workers: recordatorios, re-engagement OK

### Bugs conocidos ❌
- **CRM worker:** `bookings.datetime` es text, comparado con timestamp
- **Webhooks:** no resuelven tenant ("resolve-later")
- **Postgres volumen:** no persistente entre rebuilds
- **UI botones:** reply/takeover/handback disabled
- **Settings:** solo lectura (no persiste)

### Pendientes 🔴
- Credenciales Meta (WhatsApp/Instagram)
- API key Agenda Pro
- Plantilla de flujos de Carlos
- JWT Auth real
- Páginas /agenda y /analytics

---

## 9. Decisiones Técnicas

- **LLM:** DeepSeek API (deepseek-v4-flash) — 3x más barato que OpenRouter
- **Booking:** Modo `handoff` para Agenda Pro (pendiente API key)
- **Pagos:** Wompi modo `pending_activation` (sin key = manual)
- **Auth:** NextAuth mock con `data/users.json` — JWT real en Fase 2
- **RLS:** GUC `app.current_tenant` con FORCE RLS + bookia_app rol
- **Docker:** `bookia_app` pool `max: 1` para consistencia de sesión
- **CORS:** `app.use("*", cors())` — permite todo en dev

---

## 10. Próximos Pasos

1. **TASK-022:** Revisión de Claude con auditoría completa
2. **Fase 2:** JWT Auth, settings guardar, /agenda, /analytics
3. **Fase 3:** Agenda Pro integration, Meta credentials, producción

---

> **Nota:** Este documento es la fuente de verdad técnica del backend. Toda decisión de implementación debe trazar a una sección de aquí.
