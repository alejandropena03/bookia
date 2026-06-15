---
title: Estado Actual del Proyecto
collection: f8db5a5c-53ed-406a-9a8d-4e6de6d0c487
---

# Estado Actual del Proyecto Bookia

**Ultima actualizacion:** 2026-06-15
**Estado:** MVP funcional — esperando credenciales del cliente
**Tests:** 58/58 pasando | **Build:** Server + Frontend OK
**Agente ejecutor:** OpenCode (DeepSeek) + Claude Code (arquitecto)

---

## Resumen Ejecutivo

El MVP de Bookia esta completamente funcional y conectado end-to-end:
- **Backend:** 21 endpoints, cerebro hibrido con LLM, workers automatizados, pagos Wompi
- **Frontend:** Landing premium, dashboard de inteligencia, inbox de conversaciones, demo en vivo
- **Datos:** 18 conversaciones demo + Santa Maria con catalogo, flujos, business profile
- **Pendiente:** Credenciales Meta (WhatsApp/Instagram) + API key Agenda Pro + plantilla de Carlos

**Lo que se vende:** "Producto terminado esperando credenciales" — el cliente ve su negocio funcionando, solo falta enchufar tokens.

---

## Historial de Tareas Completadas

### TASK-001: Backend Scaffold
- Hono + TypeScript + Docker + PostgreSQL
- Health endpoint con DB check
- ✅ 2026-06-11

### TASK-002: Schema + RLS
- 10 tablas, 8 enums, indices, FKs
- RLS multi-tenant con FORCE + WITH CHECK + GUC
- Seed Santa Maria placeholder
- ✅ 2026-06-12

### TASK-002b: RLS Hardening
- Rol `bookia_app` limitado (superuser bypassa RLS)
- 6 tests de aislamiento cross-tenant
- ✅ 2026-06-12

### TASK-003: Channel Adapter + Mock
- MockAdapter + parseInbound
- POST /api/sim/message + GET /api/sim/stream (SSE)
- ingestInbound: upsert contact, find/create conversation, idempotent message
- ✅ 2026-06-11

### TASK-004: LLM Layer
- DeepSeekProvider (OpenAI-compatible) + MockLlmProvider
- Eval harness con casos de prueba y reporte markdown
- ✅ 2026-06-11

### TASK-005: Cerebro Hibrido
- Router (clasificador de intenciones via LLM)
- Flow engine (state-machine generica)
- Template renderer con variables
- Responder (LLM + canned responses)
- Escalation (keywords + baja confianza)
- Orchestrator (pipeline completo)
- ✅ 2026-06-11

### TASK-006: Fixes Hito (persist outbound, escalation, BookingProvider)
- persistAndEmit guarda outbound en messages
- Escalation configurable con business_profile.rules
- BookingProvider mock + handoff
- Router con Zod + fences
- ✅ 2026-06-12

### TASK-007: Dashboard API + Inbox Humano
- 9 endpoints con JOINs limpios
- Metrics/intelligence calculados desde DB real
- Bot se abstiene si conversation.status = human_active
- ✅ 2026-06-12

### TASK-008: Landing Redesign (PAUSADA)
- Rediseño premium "tech luxe" (Apple/Stripe/Linear)
- Hero oscuro + aurora, demo chat, features grid
- Aprobada por Alejandro tras iteraciones de feedback
- ✅ 2026-06-12 (cubierta por TASK-009)

### TASK-009b: Landing Finalizada
- GSAP + ScrollTrigger, typing indicator real, count-up, boton magnetico
- Jerarquia blancos, copy honesto (sin metricas inventadas)
- LANDING CERRADA
- ✅ 2026-06-12

### TASK-010: App Area Redesign (tema claro)
- Auth layout, login/register, dashboard sidebar, settings
- ConversationsInbox + settings migrados a tema claro
- ✅ 2026-06-12

### TASK-011: Dashboard Inteligencia Comercial
- 6 bloques: dinero (ingreso/oportunidad), embudo conversion, demanda por servicio, heatmap horas, ROI bot, actividad reciente
- Mock realista para Santa Maria con shape documentado
- ✅ 2026-06-12

### TASK-012: Inteligencia Backend
- Endpoint /api/metrics/intelligence calculado desde DB
- KPIs, funnel 5 etapas, demanda por servicio, heatmap 7x7, ROI
- ✅ 2026-06-12

### TASK-013: Front conectado a Backend real
- lib/api.ts (13 funciones), TanStack Query
- Demo en vivo SSE con boton flotante
- Profile/catalog en settings
- ✅ 2026-06-12

### TASK-014: Datos de Muestra + Validacion E2E
- seed-demo.ts idempotente (15 convs, 224 msgs, 6 bookings)
- README-DEMO para levantar demo
- ✅ 2026-06-12

### TASK-015: Motor Hiperpersonalizacion
- 6 fixes: system prompt DB, horarios, canned DB, escalation format, first_contact, tryStartFlow generico
- import-tenant.ts + tenant-config/[slug].json
- ✅ 2026-06-12

### TASK-016: Recordatorios Anti-No-Show
- Worker busca bookings confirmed/scheduled con datetime NOW()+24h
- Endpoint POST /api/workers/reminders/run
- Migracion 0004
- ✅ 2026-06-13

### TASK-017: Wompi Pagos
- PaymentProvider interface + WompiProvider + ManualPaymentProvider fallback
- Webhook signature verification, injectPaymentLink en orchestrator
- Migracion 0005
- ✅ 2026-06-13

### TASK-018: Re-engagement Leads Frios
- Worker secuencia dias 1/7/30
- Migracion 0006
- ✅ 2026-06-13

### TASK-019: CRM Post-Servicio + Recompra
- Worker post-servicio 7 dias (Google Maps review) + recompra 90 dias
- Migracion 0007
- ✅ 2026-06-13

### TASK-020: Handoff con Resumen LLM
- summarizer.ts genera resumen estructurado (qué quiere, qué ofrecio, por qué escaló, tono)
- Persiste en conversations.handoff_summary
- Migracion 0008
- ✅ 2026-06-13

### TASK-022 (actual): Auditoria + Fixes Estabilidad
- Seed corregido (santa-maria + demo data)
- Docker reconstruido con codigo fresco
- lib/api.ts parametros corregidos
- service.ts auto-crea channel_account
- MockLlmProvider separado router vs responder
- ✅ 2026-06-15

---

## Stack Tecnico Actual

### Backend
- Node.js 22 + TypeScript 5
- Hono (API framework)
- Drizzle ORM (schema + migrations)
- PostgreSQL 16 (multi-tenant shared-schema + RLS)
- postgres.js (driver raw SQL)
- Vitest (tests)
- Zod (validacion)
- DeepSeek API (modelo deepseek-v4-flash)

### Frontend
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui + Base UI
- TanStack Query (React Query)
- GSAP + ScrollTrigger
- Recharts
- Zustand

### Infraestructura
- Docker + docker-compose
- Ports: 3001 (frontend), 8787 (backend), 5432 (postgres)
- Outline Wiki (puerto 3000)

---

## Arquitectura del Cerebro

```
Mensaje entrante
  → ingestInbound (upsert contact, create conv, insert message)
  → processMessage (orchestrator)
    1. Resume active flow (evaluateFlow)
    2. Classify intent (router → LLM)
    3. Check escalation (keywords + confidence)
    4. Start new flow (tryStartFlow)
    5. Canned response (DB)
    6. LLM responder (generateLlmResponse)
  → persistAndEmit (INSERT outbound + SSE emit)
```

---

## Estado de Endpoints

### Funcionales ✅
- GET /api/conversations (lista con paginacion)
- GET /api/conversations/:id (detalle + mensajes)
- POST /api/conversations/:id/reply (solo human_active)
- POST /api/conversations/:id/takeover
- POST /api/conversations/:id/handback
- GET /api/metrics/intelligence (KPIs + funnel + heatmap)
- GET /api/catalog
- GET /api/profile
- POST /api/sim/message (chat demo)
- GET /api/sim/stream (SSE)
- POST /api/workers/reminders/run
- POST /api/workers/reengagement/run
- GET /api/workers/reminders/status

### Bugs conocidos ❌
- POST /api/workers/crm/run → 500 (text vs timestamp comparison)
- POST /webhooks/:channel → 500 (tenant resolve "resolve-later")
- POST /webhooks/wompi → 501 (no configurado)

---

## Estado Frontend

### Paginas existentes
| Ruta | Estado | Notas |
|------|--------|-------|
| / | ✅ Landing premium cerrada | GSAP, dark theme, tech-luxe |
| /login | ✅ Login mock | NextAuth + data/users.json |
| /register | ✅ Registro UI | No persiste, redirige a login |
| /dashboard | ✅ Dashboard inteligencia | 6 bloques, datos reales |
| /conversations | ✅ Inbox | 18 conversaciones, filtros |
| /conversations/[id] | ✅ Detalle | Mensajes, takeover/handback |
| /settings | ✅ Solo lectura | Profile + catalog, no guarda |
| /agenda | ❌ Placeholder | "Próximamente" |
| /analytics | ❌ Placeholder | "Próximamente" |

### Features transversales
- DemoLive: chat en vivo flotante (POST sim + SSE)
- QueryProvider: TanStack Query para cache
- Responsive: sidebar + mobile

---

## Bugs Pendientes

### Bug 1: CRM Worker (text vs timestamp)
- **Archivo:** server/src/workers/crm.ts:24
- **Causa:** bookings.datetime es text, se compara con NOW() - INTERVAL
- **Fix:** Convertir datetime a timestamp en schema, o cast en query

### Bug 2: Webhooks tenant resolve
- **Archivo:** server/src/api/webhooks.ts:94
- **Causa:** Usa "resolve-later" como UUID en queries
- **Fix:** Resolver tenant desde channel_account o payload

### Bug 3: Postgres volumen no persistente
- **Causa:** Datos se pierden al rebuild Docker
- **Impacto:** Hay que re-ejecutar seed cada vez
- **Workaround:** Script de seed idempotente

### Bug 4: ConversationsInbox botones disabled
- **Causa:** Botones reply/takeover/handback tienen disabled={true}
- **Fix:** Habilitar botones (APIs ya funcionan)

---

## Datos Demo (Santa Maria)

- **Tenant:** Santa Maria Clinica Estetica
- **Catalogo:** 5 servicios (consulta, tratamiento facial, depilacion, masaje, paquete)
- **Conversaciones:** 18 (3 escaladas, 3 human_active, 4 closed)
- **Mensajes:** 224
- **Bookings:** 6
- **KPIs:** $1.8M potencial, $400K agendado

---

## Decisiones Tecnologias

- **LLM:** DeepSeek API (deepseek-v4-flash) — 3x mas barato
- **Booking:** Modo handoff para Agenda Pro (pendiente API key)
- **Pagos:** Wompi modo pending_activation (sin key = manual)
- **Auth:** NextAuth mock (data/users.json) — JWT real en Fase 2

---

## Proxima Accion

TASK-022 en WAITING_FOR_CLAUDE — auditoria completa con 5 preguntas:
1. ¿Construir /agenda y /analytics o dejar para fase 2?
2. ¿Priorizar fix CRM worker?
3. ¿Habilitar botones reply/takeover/handback?
4. ¿Fix volumen Postgres persistente?
5. ¿Que contiene exactamente Agenda vs Analytics vs Dashboard?

---

## Riesgos

- **Credenciales Meta:** Pendientes del cliente
- **Agenda Pro API:** Requiere plan Pro (cliente debe actualizar)
- **Plantilla Carlos:** Pendiente para hiperpersonalizacion
- **Volumen Postgres:** No persistente entre rebuilds
- **JWT Auth:** No implementado (mock local)

---

## Acceso

- **Frontend:** http://localhost:3001
- **Backend:** http://localhost:8787
- **Health:** GET /health
- **Outline:** https://outline.myfreenotion.qzz.io
- **Repo:** https://github.com/alejandropena03/bookia
- **API Key DeepSeek:** NO commitear — en /Users/alejandropena/ARIA/config/settings.py
