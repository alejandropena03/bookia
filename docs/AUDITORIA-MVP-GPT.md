# Bookia — Dossier de Auditoría del MVP para GPT-5

> **Documento único de contexto.** Generado el 2026-06-29 por OpenCode (agente principal) tras una auditoría a profundidad del codebase en disco. Todo lo que se afirma aquí está verificado con `file_path:line_number` en el repo real `/Users/alejandropena/Bookia/bookia-code/`. Donde hay discrepancias entre la documentación y el disco, se señala explícitamente.
>
> **Propósito:** servir como contexto único y autocontenido para que GPT-5 genere un **plan de implementación definitivo** que termine el MVP.

---

## §0 — Cómo usar este dossier (instrucciones para GPT-5)

**Tu rol:** Arquitecto de software Staff/Principal generando un plan de implementación para terminar el MVP de Bookia.

**Lo que se te pide:** Lee este dossier completo. Luego produce un **plan de implementación secuenciado** que lleve el proyecto de su estado actual al **north star definido en §2**. El plan debe ser accionable por un equipo de 1-2 ingenieros (principalmente Alejandro + asistencia de agentes tipo OpenCode/Claude Code) en ~4-6 semanas.

**Restricciones absolutas del plan (no las violentes):**
- **NO** implementar conexiones reales a Meta (WhatsApp/Instagram/Messenger) en este plan.
- **NO** implementar integración real con Agenda Pro en este plan.
- **NO** implementar pagos reales (Wompi live) en este plan.
- El plan entrega un **MVP Fase 1 completo y pulido + agente V2 terminado al 100%**, listo para que cuando lleguen credenciales de Meta sea solo "enchufar".

**Formato de output esperado (detallado en §10):** Plan por sprints de ~1 semana. Cada task con: descripción, archivos a tocar (`file:line`), dependencias, criterios de aceptación verificables (tests/eval/tsc), estimación, riesgos. Milestones con gates.

**Prioridad de streams:** Stream A (agente V2) **primero**, Stream B (dashboard/frontend) en paralelo donde no haya dependencia, cross-cutting (git, migraciones, secrets) intercalado.

---

## §1 — Qué es Bookia

**Bookia** es un SaaS AI-first de **gestión conversacional** para negocios de alto volumen de mensajes entrantes. Convierte conversaciones (WhatsApp + Instagram + Facebook vía Meta Business API; TikTok post-MVP) en **citas agendadas + inteligencia comercial en tiempo real**.

| Atributo | Valor |
|---|---|
| **Nicho inicial** | Clínicas de estética en Colombia |
| **Cliente piloto** | Santa María Clínica Estética (Bucaramanga). Tío de la esposa de Carlos. ~150-200 citas/mes, 3 personas en mensajería, usa Agenda Pro |
| **Marca** | Bookia · dominio `usebookia.com` (Cloudflare) |
| **Socios** | Alejandro Pena 60% · Carlos Acevedo 40% · Juan Pablo (marca, % a definir) |
| **LLM en producción** | DeepSeek v4-flash (API key en `/Users/alejandropena/ARIA/config/settings.py`, jamás commitear) |

### Los 4 componentes del producto
1. **Agente conversacional** con catálogo + persona cargados que responde solo (el núcleo).
2. **Dashboard en tiempo real** (conversión, canales, funnel, heatmap, ROI, money-on-the-table).
3. **Catálogo del negocio** (servicios, precios, descripciones, imágenes, persona, reglas de escalación, horarios).
4. **Panel de configuración** para que el cliente administre servicios/promos/persona sin tocar código.

### Las 3 fases definidas (de `bookia-repo/06. Producto/Alcance del MVP.md`)
- **Fase 1 — MVP autónomo** (Jun 2026): datos simulados, totalmente funcional.
- **Fase 2 — Conexión real** (Jul 2026): recibir plantilla de flujos del cliente, hiper-personalizar, conectar credenciales Meta, piloto supervisado.
- **Fase 3 — Automatización total** (Jul-Ago 2026): sin supervisión humana, integración Agenda Pro, reminders, TikTok.

### Filosofía MVP (del walkthrough Carlos×Alejo del 2026-06-06)
> "Producto terminado esperando credenciales." El cliente entra, ve su negocio funcionando con sus datos reales (servicios, precios, tono), paga, y entrega tokens de Meta. Tono = humano + premium, stress-free, "suelta el agendamiento". Integración con Agenda Pro **(no reemplazo)**. Pagos reales **post-MVP**. Pricing = suscripción por volumen de mensajes (~3.5M COP/mes piloto).

### Decision-makers del cliente
- **Tío (Carlos senior)** — operación diaria.
- **Alejandra/esposa** — estrategia, aprobación final. Presentar a ambos simultáneamente.

---

## §2 — North Star del plan

> **MVP Fase 1 completo y pulido + agente V2 terminado al 100%, todo listo para que cuando lleguen las credenciales de Meta sea solo enchufar.**

**Stream prioritario: A (agente V2).**

### Criterios de "terminado" verificables
1. **Agente V2 activado por defecto** (`AGENT_KERNEL_V2=true` en env, o V2 como único camino) con persistencia de mensajes outbound + SSE funcionando.
2. **tsc clean global** (0 errores, incluido el pre-existente en `v2-adapter.ts:10`).
3. **PR6.1 cerrado** — clinical policy enforcement single-source (no doble evaluación).
4. **PR9 cerrado** — flow de `precio` definido en `flows.ts` + mapeado en `flow-adapter.ts`.
5. **Auto-advance completo** — salta estados con datos conocidos también en `handleResume` (confirmación).
6. **Golden validators implementados** — memory/funnel/NBA ya no son "not yet implemented".
7. **Eval actualizado** — reporte sobre 411 casos, score documentado con honestidad.
8. **Dashboard totalmente funcional** — Settings persiste todos los campos (no solo persona), botón "Escalar" funcional, takeover/handback en UI, dead code limpiado, E2E Playwright verde.
9. **Auth real local** — password hashing + DB adapter + sesión con tenant (aunque sea para Fase 1, sin OAuth).
10. **Tests 100% verdes** — número real reconciliado entre docs y disco (ver §4).
11. **Cross-cutting:** git commit+push hecho, runner de migraciones, scheduler de workers, secrets management para DeepSeek key, docs sincronizados (root AGENTS + bridge).
12. **Adapter Meta spec diseñado** (no implementado) — para que enchufar sea trivial en Fase 2.

---

## §3 — Stack técnico exacto

| Capa | Tecnología |
|---|---|
| **Backend** | Node 22 + TypeScript 5.8 + Hono 4.7 + Drizzle ORM 0.40 + postgres-js 3.4 + Zod 3.24 + Vitest 3.1 (ESM, `"type": "module"`) |
| **Frontend** | Next.js 16.2.9 + React 19.2.4 + shadcn/ui + Base UI + Recharts 3 + Zustand 5 + TanStack Query 5 + NextAuth 5 beta + Tailwind v4 + GSAP |
| **DB** | PostgreSQL 16 + RLS (rol `bookia_app` NOINHERIT, FORCE RLS) |
| **LLM** | DeepSeek v4-flash (router + responder); toggle `LLM_PROVIDER=mock\|deepseek` |
| **Pagos** | Wompi (webhook real con verificación de firma; `WOMPI_SANDBOX=true`) |
| **Puertos** | 3001 (Next.js dev) · 8787 (Hono API) · 5432 (Postgres) · 3000 (Outline wiki, infra separada) |
| **Docker** | `docker-compose.yml` (api + postgres) · `server/Dockerfile` (multi-stage, `tzdata`, `TZ=America/Bogota`) |
| **CI/CD** | **NINGUNO** (no GitHub Actions, no Railway/Fly/Vercel config) |
| **Observabilidad** | **NINGUNA** (console + metric-emitter in-memory, no Sentry/PostHog) |

---

## §4 — Estado real verificado en disco

> **Aviso de discrepancia:** Hay múltiples `AGENTS.md` con estados contradictorios. La verdad en disco es la siguiente. Los `AGENTS.md` raíz y `bookia-code/AGENTS.md` están parcialmente stale.

### 4.1 Backend Hono — REAL y funcional

**App:** `server/src/index.ts:17`. CORS global `:20`. Tenant middleware montado en `app.use("/api/*", resolveTenant)` `:101`.

**21 endpoints HTTP** (tabla completa en §6.1). Highlights:
- `POST /api/sim/message` (`api/sim.ts:27`) — entrada principal, simula inbound WhatsApp, corre el agente completo, rate limiter 20/10s/sender (`:14-25`).
- `GET /api/sim/stream` (`api/sim.ts:69`) — SSE, **SIN auth ni tenant middleware** (cualquiera con el slug lee todo).
- `POST /api/auth/register` (`index.ts:58-77`) — crea tenant + owner user pero **NO guarda password**.
- Dashboard CRUD: conversations, reply, takeover, handback, metrics, intelligence, catalog, profile, flows.
- Workers: reminders/reengagement/crm — **solo trigger manual HTTP, no hay scheduler**.
- `POST /webhooks/:channel` (`webhooks.ts:33`) — `wompi` real con verificación de firma (`:37-85`); otros canales → 501 porque `getAdapter` solo conoce `"mock"`.

### 4.2 Multi-tenancy y RLS — REAL a nivel DB

- `drizzle/0001_rls_policies.sql`: rol `bookia_app` NOINHERIT con password (`:22-28`), `ENABLE` + `FORCE ROW LEVEL SECURITY` en 10+ tablas (`:35-54`), policy `tenant_isolation` `FOR ALL USING (tenant_id = current_setting('app.current_tenant', true)::uuid)` (`:69-117`).
- `current_setting(..., true)` devuelve NULL si GUC unset → 0 rows (fail-safe).
- `withTenant(tenantId, fn)` (`lib/tenant-db.ts:10-13`) abre conexión `appSql` y corre `SELECT set_config('app.current_tenant', ${tenantId}, false)` antes de cada query.
- **Concern:** pool `appSql` tiene `max:1` (`tenant-db.ts:5`) y `set_config(..., false)` es session-scoped → cuello de botella + posible leak cross-tenant bajo concurrencia si dos requests comparten conexión.

### 4.3 Schema Drizzle — REAL, 13 tablas (`server/src/db/schema.ts`, 190 líneas)

Enums (`:7-15`): `tenant_status`, `channel_type` (whatsapp/instagram/messenger/mock), `channel_mode`, `channel_status`, `conversation_status` (bot_active/human_active/escalated/closed), `message_direction`, `sender_type` (contact/bot/human), `user_role` (owner/agent), `booking_mode` (mock/handoff).

Tablas (tabla completa con smells en §6.2): tenants, channel_accounts, contacts, users, conversations, conversation_state, messages, flows, catalog_items, business_profile, worker_logs, patient_memory, bookings.

### 4.4 Agente — DOS pipelines, V1 ON / V2 OFF

> **CRÍTICO:** `AGENT_KERNEL_V2` se lee con `process.env.AGENT_KERNEL_V2 === 'true'` crudo en `orchestrator.ts:428`. **NO está en `env.ts` (zod schema), ni en `.env.example`, ni en `.env`.** El runtime real usa **V1**. El V2 está construido y funcional pero **desactivado**.

- **V1 (ACTIVO):** `orchestrator.ts:433-628` — detectSentiment → loadBusinessContext → off-hours check → escalation → first_contact flow → resume flow → classifyIntent → canned → LLM fallback. Persiste outbound + emite SSE via `persistAndEmitBotResponse`.
- **V2 (DEACTIVADO):** `v2-adapter.ts:51-84` → `AgentKernel.process` (`agent-kernel.ts:66-193`). Pipeline completo (ver §5). **BUG: `processMessageV2` NO persiste el mensaje outbound a DB ni emite SSE** (V1 sí). Activar V2 hoy rompe la persistencia.

### 4.5 Eval — REAL, 411 casos, V2 62.8% (no 87.7%)

> **Discrepancia:** El `AGENTS.md` raíz dice "V2 87.7% (164/187)". Eso es **stale** (case set viejo de 187 casos). El reporte real en disco `server/reports/v1-v2-regression-report.md` (2026-06-29) dice: **411 casos, V1 26.3% (108/411) vs V2 62.8% (258/411), 0 regresiones, +150 mejoras.**

- `src/agent/v2/eval/cases/index.ts:14-25` agrega 10 case files: clinical-safety 45, prompt-injection 42, privacy-pii 33, quejas-handoff 35, router 48, scheduling 41, pricing 44, faq 43, typos-ambiguous 48, regression-v1 32 → **~411 casos**.
- `eval-runner.ts` (738 líneas): filtros reviewed/critical/category/golden, exporta failures a `failures/{date}/`, escribe reportes markdown/json.
- **Validadores stub:** `eval-runner.ts:270` "Memory service validation not yet implemented", `:273` "Memory concern validation not yet implemented", `:278` "Funnel stage validation not yet implemented", `:283` "NBA validation not yet implemented". Cualquier golden conversation con `expectedFunnel`/`expectedMemoryConcern`/`expectedNextBestAction`/`expectedMemoryService` falla siempre.

### 4.6 Tests — ~256 (no 167)

> **Discrepancia:** `AGENTS.md` raíz dice "167 tests". `bookia-code/AGENTS.md` y `.bridge/HANDOFF_LOG.md` PR7 dicen "256/256 pass". El conteo en disco (`server/tests/`) soporta ~256: `v2-agent.test.ts` solo tiene 134 `it()`, más `v2-flow-adapter` 19, `v2-flow-e2e` 16, `v2-memory-persistence` 32, `v2-memory-integration` 12, `agent.test` 34, más 6 suites menores. **El número real es ~256.** El "167" del AGENTS raíz es stale.

### 4.7 Frontend Next.js 16 — REAL, NO es demo standalone

> **Discrepancia:** El `README.md:3` del repo dice "Demo con datos simulados". **Es engañoso.** El frontend está conectado de verdad al backend Hono vía `lib/api.ts` (typed, TanStack Query).

- **Conectado al backend:** dashboard intelligence (`getIntelligence`), inbox + thread + reply (`listConversations`, `getConversation`, `replyConversation`), settings (profile/catalog read+write persona), DemoLive chat (`sendSimMessage` + SSE).
- **Auth = MOCK peligroso:** NextAuth con provider Credentials leyendo `data/users.json` en **plaintext** (`admin@bookia.co`/`bookia2024`). Sin DB adapter, sin tenant propagado en sesión, sin OAuth. (`auth.ts:6-9,18-23`)
- **Tenant hardcoded** a `santa-maria` en `lib/api.ts:2` (header `x-tenant-slug`).
- **Settings parcialmente real:** solo `persona` se persiste al backend; channels "No conectado", notificaciones solo state local, la mayoría de campos no se guardan.
- Build sano: `tsc` limpio, 12/12 Jest pass. 5 componentes dashboard muertos (Recharts huérfanos: `ChannelBreakdown`, `ConversionChart`, `StatusDonut`, `MetricCard`, `RecentConversations`), Zustand instalado sin stores, 2 rutas API legacy sin consumir (`app/api/conversations`, `app/api/metrics`), E2E Playwright con assertions stale.

### 4.8 Lo que NO existe

| Área | Estado |
|---|---|
| **Meta/WhatsApp/Instagram/Messenger** | **STUB** — solo `MockAdapter` (`channels/registry.ts:6-14`). Webhook GET/POST cableado pero `getAdapter` 501 para canales reales. |
| **Agenda Pro** | **MISSING** — modo `handoff` = el humano carga manual a Agenda Pro (`booking/handoff.ts:9-25`), no hay API. |
| **Auth real** | **STUB** — register no guarda password, login lee JSON plaintext, `DEV_AUTH=true` permite impersonación por header. |
| **Scheduler de workers** | **MISSING** — reminders/reengagement/crm solo via POST manual, no hay cron/setInterval. |
| **Runner de migraciones** | **PARTIAL** — drizzle-kit solo trackea 3/12 SQL (`drizzle/meta/_journal.json`), `entrypoint.sh` no corre migraciones. |
| **CI/CD, observabilidad, TLS, secrets manager** | **MISSING.** |

### 4.9 Riesgos operacionales críticos

1. **GIT HYGIENE CRISIS (TOP PRIORITY):** Todo el trabajo V2 (PR0-PR8, cientos de archivos, reportes, e incluso la plantilla DOCX completada de Carlos) está **SIN COMMIT localmente** en `bookia-code/main` — 30 modified + 155 untracked. Último push `e1aa2de` el 2026-06-27. **Si se pierde el laptop, se pierden semanas de trabajo.** Commit + push debe ser el primer task del plan.
2. **DeepSeek API key en plaintext** en `server/.env` en disco (gitignored, pero fuera de secrets manager).
3. **`/api/sim/stream` SSE sin auth ni tenant middleware** — cualquiera con el slug lee todos los mensajes del tenant.
4. **`bookings.datetime` es `text`** — sin timezone, sin comparación optimizada.
5. **`users` sin columna password ni unique email** — bloquea auth real.
6. **`flows` sin unique `(tenant_id, key)`** — seed maneja upsert manual.

### 4.10 Bloqueadores externos — estado

- **Plantilla de flujos de Carlos: COMPLETADA** (DOCX 671KB, 2026-06-28, en `docs/source/Terminada plantilla estética Santamaría y bookia .docx`, auditada ~85% alineada con la implementación en `server/docs/knowledge-alignment-audit-santa-maria.md`). Esto **desbloqueó Fase 2** pero el plan actual NO toca Meta real.
- **Pendientes externos (fuera de scope de este plan):** NDA, Meta Business Account access, Agenda Pro API validation, decisión de hosting (Railway/Fly.io), config de `usebookia.com`.

---

## §5 — Arquitectura del agente V2 (detallada)

### 5.1 Pipeline V2 — stage by stage

**Entrada:** `processMessage(req)` en `orchestrator.ts:424`. Wraps todo en `withTenant(req.tenantId, ...)` `:425`. Feature flag en `:428`.

**V2 path (`v2-adapter.ts:51` → `agent-kernel.ts:66`):**
1. Carga `catalog_items` (`v2-adapter.ts:60-63`).
2. `createV2Providers(sql, tenantId, contactId, contactName, catalogItems)` (`:12-49`).
3. `AgentKernel.process({...})` (`agent-kernel.ts:66`).
4. Retorna `{text, messageId: v2_${Date.now()}, route, escalated, escalationReason}` (`:77-83`).

**Kernel pipeline (`agent-kernel.ts:66-193`):**
1. `emit("agent.message.received")`; build snapshot via `ConversationSnapshotBuilder` + `loadContext` (**stubbed: returns `{}`** en `v2-adapter.ts:47`).
2. `detectSentiment`.
3. `classifyIntent` → `classifyIntentStructured` from `structured-router.ts` (pipeline abajo).
4. `detectRisks` → `scanRisks` from `risk-scanner.ts`.
5. `evaluatePolicy` → `evaluatePolicy` from `policy-engine.ts`.
6. Si `policyDecision.action === "block"` → refusal text + critic + return (`:130-143`).
7. `evaluateFlow` → `flowAdapter.evaluateFlow` (`:145`). Si retorna → critic + return, route=`flow`.
8. `getCannedResponse(intent)` → si non-null → critic + return, route=`canned`.
9. `generateLlmResponse` → critic + return, route=`llm`.
10. `applyCritic` (`:27-64`) corre `criticize(...)` from `response-critic.ts`; acciones: block/handoff/revise_deterministically/regenerate_with_constraints/send.

**`structured-router.ts:389-555` (understanding pipeline):**
1. NFC normalize + empty check (`:390-399`).
2. isFirstMessage → "saludo" default (`:401-414`).
3. `ClinicalSafetyAudit` builder tracks required vs applied action (`:419-428`).
4. `audit.scanInput` + `addPostTreatmentSignal` + `addPrivacySignal` + `addInjectionSignal`.
5. **`safetyPreRoute(text)`** (`safety-pre-router.ts`) — 50+ regex patterns. Si retorna decision → enforced + exportado a `data/clinical-audit-log.jsonl` (`:444`).
6. **`deterministicDomainRoute(text)`** (`deterministic-domain-route.ts:17`) — 60+ regex `DOMAIN_SIGNALS`. Si match → return early (`:449-463`).
7. **LLM call** (`:465-472`) con el `SYSTEM_PROMPT` de 264 líneas (`:40-263`) — enum cerrado de 15 V2 intents, priority rules, examples, confidence rubric.
8. **Post-LLM risk scan** — `hasInjectionSignal` re-check (`:476-479`) boostea a `otro@0.90` si injection.
9. `extractJson` + `JSON.parse` + `normalizeIntent` (`:297-312`, alias map `:265-285`) + **`applyOverrides`** (`:314-362`) — negation overrides, active vs passive cancel, "reagendar"/"reprogramar" → cancelacion_reprogramacion.
10. `RouterOutputSchema.parse` (zod), `extractEntities` (`:364-387`).
11. `enforceClinicalSafety(...)` wraps final decision (`:528`), audit resolves + exports.

**Orden del pipeline (matches AGENTS):** safetyPreRoute → deterministicDomainRoute → LLM → postRiskScan → applyOverrides → classifyIntent → policy → flow → canned → llm → critic.

### 5.2 Flows & Santa María + Flow Adapter + Memory

**Flow engine:** `src/flows/engine.ts` — state machine con `initial`, `states[state].prompt` (template), `collects` (slot to fill), `next` (deterministic) OR `transitions` (keyword map), terminal states tienen null next.

**Santa María flows** (`src/flows/santa-maria/flows.ts`, 95 líneas) — solo **2 flows**:
- `AGENDAMIENTO_FLOW` (`:7-82`): 9 estados: `ask_city` → `show_service` → `confirm_service` (transitions si/quiero/claro) → `ask_datetime` → `collect_data` (6 campos: nombre, fecha nacimiento, cédula, teléfono, correo, fecha/hora) → `payment_info` ($50K Bancolombia A&S Group SAS NIT 901916939) → `await_proof` → `confirm_booking` (terminal) → `farewell` (terminal).
- `FIRST_CONTACT_FLOW` (`:84-95`): single state `saludo_natural` — "¡Hola {nombre}! Soy Carlos..." natural greeting (sin menú de botones, preferencia de Carlos).

**`catalog.ts`:** `CatalogItem` interface (`:1-11`) + `SANTA_MARIA_CATALOG` array, 31 servicios. Cities split CO_CITIES (5) vs ALL_CITIES (7 incl. CDMX, Miami). Precios reales COP/MXN/USD/EUR.

**`canned-responses.ts`** (149 líneas): 21+ templates por intent. `SANTA_MARIA_ESCALATION_RULES` (`:104-149`): 21 keywords, 9 no_decir rules, escalate_to = Elkin Acevedo +57 318 735 4841.

**`images/manifest.json`:** 28 JPEGs (`image1.jpeg`–`image28.jpeg`), servidos via `GET /images/:key` (`index.ts:80`).

**FlowAdapter** (`src/agent/v2/adapter/flow-adapter.ts`, 185 líneas):
- `INTENT_TO_FLOW_KEY` (`:5-8`): solo `saludo → first_contact` y `agendamiento → agendamiento`. **Todos los demás intents (precio, queja, ubicacion, etc.) retornan null** → no flow → cae a canned/LLM.
- `evaluateFlow` (`:22-40`): si flow activo → `handleResume`; else `resolveFlowKey(intent)` → `handleStart`.
- `handleResume` (`:72-110`): load definition, terminal detection (`:86-91`), `evaluateFlow`, `memoryService.onDataCollected` (`:95`), `onFlowCompleted` if completed (`:98`), `maybeCreateBooking` (`:99`), DELETE state.
- `handleStart` (`:112-150`): `startFlow`, `memoryService.hydrateFlowSlots` (`:125`), **auto-advance loop** (`:130-138`): hasta 5 iteraciones, mientras state tenga `collects` AND known value in slots, advance.
- `maybeCreateBooking` (`:152-184`): solo para `agendamiento` con `slots.service/service_name`; INSERT en `bookings` status=`pending`, ON CONFLICT DO NOTHING. **Retorna void — no confirmation message, no `onBookingConfirmed` call.**

**MemoryService** (`src/agent/v2/memory/memory-service.ts`, 172 líneas) — wrapper sobre `MemoryRepository`:
- `getUserContext` (`:46-49`), `hydrateFlowSlots` (`:51-62`) — prefill city/service/service_name from memory.
- `onDataCollected` (`:64-81`) — `SLOT_PROVIDED_MAP` (`:27-41`) mapea slots a providedData flags. `repo.merge`.
- `onFlowCompleted` (`:83-104`) — set funnelStage=`awaiting_payment` para agendamiento, `new_lead` para first_contact.
- `onBookingConfirmed` (`:106-115`) — set paymentStatus=confirmed + funnelStage=booked. **NUNCA llamada en ningún lado de src.**

**MemoryRepository** (`memory-repository.ts`, 359 líneas) — PostgreSQL-backed con **optimistic concurrency** via `version` (`:96-122`): on UPDATE `WHERE version = ${existingVersion}`; si 0 rows → throw "version_conflict" → retry hasta 2x (`:61-68`). TTL decay (`:139-151`) — después de 7 días, confidence decae exp(-days/7). Sensitive data masking (`:153-170`).

### 5.3 Safety / Policy / Understanding modules

**`src/agent/v2/understanding/`** (5 files):
- `safety-pre-router.ts` (383 líneas) — 29 HUMAN_SIGNALS, 30+ CONTRA_SIGNALS (embarazo/lactancia/lupus/diabetes/anticoagulantes/alergia/cáncer/menor de edad/cirugía reciente), REFUSE_SIGNALS, POST_SIGNALS, INJECTION_SIGNALS. `hasInjectionSignal(text)` exported para post-LLM recheck.
- `deterministic-domain-route.ts` (182 líneas) — 60+ `DOMAIN_SIGNALS` regex. `BOOKING_KEYWORDS` array (`:10`). Match → return early con confidence 0.85-0.95, bypass LLM.
- `risk-scanner.ts` — `scanRisks(text, intent)` returns `RiskFlags`.
- `structured-router.ts` (556 líneas) — orchestrator (descrito arriba).
- `input-normalizer.ts` — text normalization helper.

**`src/agent/v2/policy/`** (5 files):
- `clinical-safety.ts` (133 líneas) — `evaluateClinicalSafety(text, intent)` clasifica en 4 categorias: `general_info` | `needs_evaluation` | `urgent_handoff` | `refuse_medical_advice`. PREDEFINED_ALLOWED_CLAIMS para botox/ácido_hialurónico/rinomodelacion/valoracion (`:13-35`). URGENT_HANDOFF_KEYWORDS (`:37-42`). REFUSAL_PATTERNS (`:51-57`).
- `policy-engine.ts` (119 líneas) — `evaluatePolicy` (main) + `enforceClinicalSafety` (router-side). `CLINICAL_ACTION_MAP` (`:6-11`) maps categorias a allow/handoff/block. **Concern:** `evaluatePolicy` re-runs `evaluateClinicalSafety` (`:103`) → clinical eval ocurre **dos veces** por mensaje (una en structured-router via `enforceClinicalSafety`, una en kernel via `evaluatePolicy`). Wasteful pero no incorrecto. **Esto es lo que PR6.1 debe resolver.**
- `clinical-safety-audit.ts` (240+ líneas) — Builder pattern audit tracker. Logs a `data/clinical-audit-log.jsonl` (442KB, 411 entries). **Transparent (no enforcement) per PR6.**
- `prompt-injection.ts` (86+ líneas) — HIGH_SEVERITY_PATTERNS.
- `privacy-safety.ts` (104 líneas) — `detectPII(text)` matches cédula `\b\d{5,10}\b`, phone `\b\d{7,10}\b`, email. **Concern:** phone pattern broad → false positives con precios/edas.

**`src/agent/v2/response/`** (3 files):
- `response-critic.ts` (324 líneas) — `criticize(...)` checks output for CLINICAL_RISK_PATTERNS (`:44-53`), GUARANTEE_PATTERNS (`:55-60`), tone, length, missing CTA. Returns CriticAction (send/revise_deterministically/regenerate_with_constraints/handoff/block) + issues + revisedResponse.
- `response-composer.ts`, `tone-adapter.ts`.

### 5.4 Bugs y gaps del V2 (para cerrar en el plan)

| Gap | `file:line` | Criticidad |
|---|---|---|
| Import path mal → tsc TS2307 | `v2-adapter.ts:10` (`../../flows/engine.js` debería ser `../../../`) | **P0** |
| V2 NO persiste outbound ni emite SSE | `v2-adapter.ts:77-83` | **P0** |
| `AGENT_KERNEL_V2` no en env schema/example/.env | `orchestrator.ts:428` + `env.ts` | **P0** |
| `loadContext` returns `{}` | `v2-adapter.ts:47` | **P1** |
| `channel: "mock"` hardcoded | `v2-adapter.ts:72` | **P2** |
| `bookingMode: "mock"` hardcoded | `conversation-snapshot.ts:42` | **P2** |
| CommonJS `require()` en ESM | `v2-adapter.ts:29,40,44` | **P2** |
| Clinical eval doble (PR6.1) | `policy-engine.ts:103` + `structured-router.ts:528` | **P1** |
| `precio` no es flow, solo canned | `flow-adapter.ts:5-8` + `flows.ts` | **P1 (PR9)** |
| Auto-advance solo en handleStart, no handleResume | `flow-adapter.ts:130-138` | **P1** |
| `onBookingConfirmed` nunca llamada | `memory-service.ts:106-115` | **P1** |
| Golden validators stub | `eval-runner.ts:270,273,278,283` | **P1** |
| seed-demo crea `current_state='precio'` (estado inexistente) | `seed-demo.ts:286` | **P2** |

---

## §6 — Arquitectura backend (detallada)

### 6.1 HTTP surface table (21 endpoints)

| Method | Path | File:Line | Purpose | Auth/Tenant |
|---|---|---|---|---|
| GET | `/health` | `index.ts:22` | Health + DB counters + llmProvider | None |
| GET | `/` | `index.ts:55` | Name/version banner | None |
| POST | `/api/auth/register` | `index.ts:58-77` | Crea tenant + owner user (NO guarda password) | None |
| GET | `/images/:key` | `index.ts:80` | Sirve 28 JPEGs whitelist de Santa María | None |
| POST | `/api/sim/message` | `api/sim.ts:27` | **Entrada principal** — simula inbound WA, corre agente, rate limiter 20/10s | `resolveTenant` via `tenantSlug` body |
| GET | `/api/sim/stream` | `api/sim.ts:69` | SSE live stream filtrado por `tenantSlug` query | **NONE (vulnerabilidad)** |
| GET | `/api/conversations` | `api/dashboard.ts:15` | Lista paginada con último mensaje, filtros | Tenant header |
| GET | `/api/conversations/:id` | `dashboard.ts:48` | Detalle + mensajes ASC | Tenant |
| POST | `/api/conversations/:id/reply` | `dashboard.ts:78` | Reply humano (solo si `human_active`), emite SSE | Tenant |
| POST | `/api/conversations/:id/takeover` | `dashboard.ts:122` | Set `human_active` | Tenant |
| POST | `/api/conversations/:id/handback` | `dashboard.ts:138` | Set `bot_active`, clear assigned user | Tenant |
| GET | `/api/metrics` | `dashboard.ts:154` | KPI totals | Tenant |
| GET | `/api/metrics/intelligence` | `dashboard.ts:197` | `computeIntelligence` — funnel/reengagement KPIs | Tenant |
| GET | `/api/catalog` | `dashboard.ts:206` | `catalog_items` (optional `?city=`) | Tenant |
| GET | `/api/profile` | `dashboard.ts:225` | `business_profile` | Tenant |
| PUT | `/api/profile` | `dashboard.ts:239` | Update partial persona/booking_mode/hours | Tenant |
| GET | `/api/flows` | `dashboard.ts:258` | List `flows` table | Tenant |
| POST | `/api/workers/reminders/run` | `api/workers.ts:18` | Trigger reminder worker | None |
| GET | `/api/workers/reminders/status` | `workers.ts:44` | Log últimos 20 runs | None |
| POST | `/api/workers/reengagement/run` | `workers.ts:48` | Trigger re-engagement worker | None |
| POST | `/api/workers/crm/run` | `workers.ts:57` | Trigger CRM worker | None |
| GET | `/webhooks/:channel` | `api/webhooks.ts:7` | Webhook verify (Meta hub.challenge) | Channel verify |
| POST | `/webhooks/:channel` | `webhooks.ts:33` | Inbound webhook. `wompi` real (`:37-85`); otros → `getAdapter` 501 | Resuelve tenant via `channel_accounts` |

**Gaps HTTP:** No booking CRUD endpoints. No login/logout. No admin/tenant-management. Workers sin scheduler. SSE sin auth.

### 6.2 Schema table (13 tablas, `server/src/db/schema.ts`)

| Tabla | Línea | Propósito / Notas |
|---|---|---|
| `tenants` | `:19` | id, name, slug (unique), status, createdAt |
| `channel_accounts` | `:27` | tenant_id→tenants(cascade), channel, mode, externalAccountId, credentials(jsonb), status |
| `contacts` | `:38` | tenant_id, channel, externalId, name, phone, repurchaseSentAt. **Unique index** `(tenant_id, channel, external_id)` `:48` |
| `users` | `:51` | tenant_id, email, name, role. **No password column. No unique email. No index on tenant_id** |
| `conversations` | `:60` | tenant_id, contact_id, channel_account_id, status, assignedUserId, replyWindowExpiresAt, lastMessageAt, handoffSummary. Index `(tenant_id, status)` `:72` |
| `conversation_state` | `:75` | tenant_id, conversation_id→conversations(cascade, **unique**), flowKey, currentState, slots(jsonb), reengagementStep, lastReengagementAt. Single-row-per-conversation |
| `messages` | `:88` | tenant_id, conversation_id, direction, senderType, providerMessageId, contentType, text, mediaUrl, raw(jsonb). **Unique index** `(tenant_id, providerMessageId)` `:101`. Index `(tenant_id, conversation_id, createdAt)` `:102` |
| `flows` | `:105` | tenant_id, key, name, definition(jsonb), isActive, version. **No unique (tenant_id, key)** |
| `catalog_items` | `:116` | tenant_id, name, description, price(numeric 12,2), currency, category, durationMinutes, imageUrl, cities(jsonb[]), imageKeys(jsonb[]), promoLabel, isActive |
| `business_profile` | `:133` | tenantId **PK**→tenants (one row per tenant), persona, rules(jsonb), hours(jsonb), bookingMode, systemPromptOverrides, cannedResponses(jsonb), offHoursMessage, googleMapsUrl |
| `worker_logs` | `:147` | worker, startedAt, finishedAt, status, summary(jsonb). **No tenant_id** (global, not RLS) |
| `patient_memory` | `:156` | tenant_id, contact_id→contacts, memoryJson(jsonb), version, expiresAt, lastConversationId. **Unique index** `(tenant_id, contact_id)` `:166` |
| `bookings` | `:169` | tenant_id, conversation_id, contact_id, serviceName, servicePrice, city, datetime(**text!**), status, bookingProviderRef, data(jsonb), reminderSentAt, reminderStatus, paymentStatus, paymentUrl, paymentTransactionId, postServiceSentAt. Index `(tenant_id)` `:189` |

### 6.3 Migraciones — PARTIAL

`drizzle/` contiene 12 SQL files pero drizzle-kit solo trackea 3 (`drizzle/meta/_journal.json` entries `0000`, `0001_furry_owl`, `0002_yellow_alex_wilder`). Los demás (RLS, `0003`-`0010`) son **manually-applied SQL** que drizzle-kit no conoce.

- `0000_lively_marvel_apes.sql` (base schema)
- `0001_furry_owl.sql` + `0001_rls_policies.sql` (RLS, manual)
- `0002_yellow_alex_wilder.sql`
- `0003_add_canned_responses.sql` — canned_responses/off_hours_message
- `0004_add_reminder_fields.sql`
- `0005_add_payment_fields.sql`
- `0006_add_reengagement_fields.sql`
- `0007_add_crm_fields.sql`
- `0008_add_handoff_summary.sql`
- `0009_add_catalog_cities_images.sql`
- `0010_add_patient_memory.sql` — **newest**, crea `patient_memory` + RLS + trigger (NO en journal)

**`entrypoint.sh:17-22`** corre `seed.ts` + `seed-demo.ts` en cada container start pero **NUNCA corre migraciones** — asume que el schema ya existe. **No hay automated migration runner.**

### 6.4 Seeds Santa María (calidad producción)

- `src/db/seed.ts` (151 líneas) — Idempotent. Upserts tenant `santa-maria`, `mock` channel_account, `business_profile` (persona "Carlos", escalation a Elkin, hours L-Sáb 9-19, **offHoursMessage=null**), delete+reinsert `catalog_items` (31 servicios), upsert flows `agendamiento` + `first_contact` (version 2), crea owner `admin@santamaria.test`.
- `src/db/seed-demo.ts` (323 líneas) — 15 demo contacts con nombres colombianos realistas, ~5-25 mensajes cada uno en 30 días, ~35% con bookings, ~20% "price asked no booking". Biases horarios hacia 15-21h (60%) para heatmap realista. Idempotent (delete all demo first).
- `src/db/import-tenant.ts` (169 líneas) — CLI `tsx src/db/import-tenant.ts --slug=santa-maria` leyendo `src/db/tenant-config/{slug}.json`. **Pero `src/db/tenant-config/` directory NO existe** (referenciado por Dockerfile `:20` e `import-tenant.ts:164`).

---

## §7 — Arquitectura frontend (detallada)

### 7.1 App structure (App Router)

| Route | File | Purpose | Auth |
|---|---|---|---|
| `/` | `app/page.tsx:10` | Landing pública (dark theme, GSAP demo chat scripted) | Public |
| `/login` | `app/(auth)/login/page.tsx:12` | Login form con demo creds badge (`:46-51`) | Public |
| `/register` | `app/(auth)/register/page.tsx:10` | Register form → POST backend `/api/auth/register` (`:31`) | Public |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx:14` | Intelligence dashboard (KPIs, funnel, heatmap, ROI) | Auth (middleware) |
| `/conversations` | `app/(dashboard)/conversations/page.tsx:25` | Inbox list (`listConversations` `:26-31`) | Auth |
| `/conversations/[id]` | `app/(dashboard)/conversations/[id]/page.tsx:49` | Inbox + thread (`getConversation` `:57-61`) | Auth |
| `/settings` | `app/(dashboard)/settings/page.tsx:12` | Business profile + catalog + agent config | Auth |

`middleware.ts:4` protege `/dashboard/*`, `/conversations/*`, `/settings/*` checkeando cookie `authjs.session-token` → redirect `/login` si ausente.

### 7.2 Auth — MOCK peligroso

- `auth.ts` — NextAuth v5 beta, single provider `Credentials` (`:13`). `authorize()` (`:18`) lee users de `data/users.json` via `fs.readFileSync` (`:6-9`), compara **plaintext** (`:20-23`). Session strategy JWT (`:37`). Callbacks enrich JWT/session con `businessName` y `plan` (`:42-55`) pero **NO propagan tenant_id**.
- Demo creds hardcoded en `data/users.json:1` (`admin@bookia.co`/`bookia2024`).
- Register POSTea al backend real (`app/(auth)/register/page.tsx:31`) pero **login nunca toca el backend** — solo lee el JSON.

### 7.3 API client (`lib/api.ts`)

- `API_BASE` = `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"` (`:1`).
- `TENANT_SLUG = "santa-maria"` **hardcoded** (`:2`), enviado como `x-tenant-slug` header en cada request (`:9`).
- Funciones typed: `getIntelligence` (`:28`), `listConversations` (`:50`), `getConversation` (`:80`), `replyConversation` (`:84`), `takeoverConversation`/`handbackConversation` (`:91-97` — **definidas pero NO llamadas en UI**), `getCatalog` (`:110`), `getProfile`/`updateProfile` (`:122-131`), `sendSimMessage` (`:133`), `subscribeToSSE` (`:140`).
- TanStack Query: `["intelligence"]` 30s, `["conversations"]` 15s, `["conversation", id]`, `["profile"]`, `["catalog"]`.

### 7.4 Inbox / Conversations UI

`components/conversations/ConversationsInbox.tsx` (327 líneas):
- Two-pane: lista izquierda (w-80) + thread derecha + panel contacto opcional (w-64).
- Lista: search + Tabs filter (Todos/WA/IG/FB), rows con avatar, nombre, canal badge, estado badge, último mensaje.
- Thread: mapea `direction==="inbound"→user`, `sender_type==="bot"→ai_suggestion` else `agent`.
- **"Sugerida por IA" badge presente** (`:207-212`, Sparkles icon).
- AI suggestions con 3 botones: **Aprobar** (calls `replyConversation` `:97-108`), **Editar** (prefills input `:233`), **Escalar** (`:237` — **NO onClick, dead button**).
- Reply box: humano puede enviar via `replyConversation` (`:82-95`, `:249-269`). "✅ Mensaje enviado" (`:270-272`).
- Panel contacto: placeholder "Agenda Pro — Próximamente" (`:317-322`).

### 7.5 Dashboard metrics

`app/(dashboard)/dashboard/page.tsx`: `getIntelligence()` real (`:15-19`, 30s refetch) con `getDashboardData()` mock fallback (`:21`).

Componentes custom (NO Recharts): `RevenueKpiCards` (3 KPIs animados), `ConversionFunnel` (5 pasos), `ServiceDemand`/`ServiceDemandHeatmap`, `DemandHeatmap` (grid 7×7), `BotRoiCard`, `DashboardRecentActivity`. Empty-state cuando KPIs son $0/0 (`:24-42`).

**Dead code:** `ChannelBreakdown.tsx`, `ConversionChart.tsx`, `StatusDonut.tsx` (Recharts, orphaned), `MetricCard.tsx` (solo usado por Jest test), `RecentConversations.tsx` (unused). `Zustand` instalado sin stores. 2 rutas API legacy (`app/api/conversations`, `app/api/metrics`) leen JSON, no consumidas por pages.

### 7.6 Settings

`app/(dashboard)/settings/page.tsx`:
- `getProfile()` hydrata hours + persona (`:13-16,38-58`). Persona parseada via regex frágil (`:42-43`).
- `getCatalog()` renderiza lista de servicios con precio COP `es-CO` (`:125-144`).
- "Guardar cambios" → `updateProfile({ persona })` (`:60-69`). **Solo `persona` se persiste; business.openTime/closeTime/city/notifs NO van al backend.**
- Channels (WA/IG/FB): "No conectado" + "Conectar" disabled + tooltip "Fase 2" (`:151-188`).
- Notification toggles: state local only, no persist (`:32,208-230`).

### 7.7 Frontend gaps (para cerrar en el plan)

| Gap | `file:line` | Criticidad |
|---|---|---|
| Auth plaintext JSON, no DB adapter, no tenant en sesión | `auth.ts:6-9,18-23,42-55` | **P0** |
| `TENANT_SLUG` hardcoded | `lib/api.ts:2` | **P1** |
| "Escalar" button dead (no onClick) | `ConversationsInbox.tsx:237` | **P1** |
| `takeover`/`handback` no surfaced en UI | `lib/api.ts:91-97` | **P1** |
| Settings solo persiste `persona` | `settings/page.tsx:60-69` | **P1** |
| SSE `/api/sim/stream` sin auth | `api/sim.ts:69` | **P1** |
| 5 dead components Recharts + Zustand + 2 legacy routes | varios | **P2** |
| E2E Playwright assertions stale | `e2e/bookia.spec.ts` | **P2** |

---

## §8 — Gaps priorizados (lo que falta para "terminar")

### Stream A — Agente V2 (PRIORITARIO)

| # | Gap | `file:line` | Criticidad | Dependencias |
|---|---|---|---|---|
| A1 | Fix tsc error import path `v2-adapter.ts:10` | `v2-adapter.ts:10` | P0 | None |
| A2 | V2 message persistence: `processMessageV2` debe INSERT outbound `messages` + emitir SSE como V1 `persistAndEmitSegmented` | `v2-adapter.ts:77-83` | P0 | A1 |
| A3 | `AGENT_KERNEL_V2` en `env.ts` zod schema + `.env.example` + `.env`, default `true` (o eliminar V1) | `env.ts` + `orchestrator.ts:428` | P0 | A2 |
| A4 | `loadContext` real (cargar business context, no `{}`) | `v2-adapter.ts:47` | P1 | A3 |
| A5 | PR6.1: clinical policy enforcement single-source (eliminar doble eval en `policy-engine.ts:103` + `structured-router.ts:528`) | `policy-engine.ts:103` | P1 | A3 |
| A6 | PR9: definir flow `precio` en `flows.ts` + mapear en `flow-adapter.ts:5-8` | `flows.ts` + `flow-adapter.ts:5-8` | P1 | A3 |
| A7 | Auto-advance en `handleResume` (skip confirmation states) | `flow-adapter.ts:72-110` | P1 | A3 |
| A8 | `onBookingConfirmed` wiring desde `maybeCreateBooking` | `flow-adapter.ts:152-184` + `memory-service.ts:106-115` | P1 | A3 |
| A9 | Golden validators implementados (memory/funnel/NBA) | `eval-runner.ts:270,273,278,283` | P1 | A8 |
| A10 | Eliminar CommonJS `require()` en ESM | `v2-adapter.ts:29,40,44` | P2 | A1 |
| A11 | Fix seed-demo `current_state='precio'` (estado inexistente) | `seed-demo.ts:286` | P2 | A6 |
| A12 | Eval reporte actualizado sobre 411 casos, score honesto | `eval-runner.ts` + `reports/` | P1 | A9 |

### Stream B — Dashboard / Frontend

| # | Gap | `file:line` | Criticidad | Dependencias |
|---|---|---|---|---|
| B1 | Auth real: password hashing (argon2/bcrypt) + DB adapter Drizzle + sesión con tenant_id + columna password en `users` + unique email | `auth.ts` + `schema.ts:51` | P0 | None |
| B2 | Tenant dinámico desde sesión (no hardcoded) | `lib/api.ts:2` | P1 | B1 |
| B3 | "Escalar" button funcional (calls takeover endpoint) | `ConversationsInbox.tsx:237` | P1 | B2 |
| B4 | takeover/handback surfaced en UI | `ConversationsInbox.tsx` + `lib/api.ts:91-97` | P1 | B2 |
| B5 | Settings: persistir todos los campos (hours, rules, offHoursMessage, etc.) no solo persona | `settings/page.tsx:60-69` + `dashboard.ts:239` | P1 | B2 |
| B6 | SSE `/api/sim/stream` con auth + tenant middleware | `api/sim.ts:69` | P1 | B1 |
| B7 | Cleanup dead code (5 Recharts components, Zustand, 2 legacy routes, MetricCard) | varios | P2 | None |
| B8 | E2E Playwright actualizado a assertions reales del dashboard actual | `e2e/bookia.spec.ts` | P2 | B5 |

### Cross-cutting

| # | Gap | `file:line` / ubicación | Criticidad | Dependencias |
|---|---|---|---|---|
| C1 | **Git commit + push del trabajo V2** (30 modified + 155 untracked, último push 06-27) | `bookia-code/` git | **P0 URGENTE** | None |
| C2 | Runner de migraciones automático (drizzle-kit trackea 3/12) — o fold SQL manual en migrations tracked, o `psql -f drizzle/*.sql` en entrypoint antes de seed | `drizzle/meta/_journal.json` + `entrypoint.sh:17-22` | P1 | None |
| C3 | Secrets management para DeepSeek key (sacar de `server/.env` plaintext) | `server/.env` | P1 | None |
| C4 | Scheduler de workers (node-cron o setInterval en server) — reminders/reengagement/crm | `api/workers.ts` | P1 | None |
| C5 | Sync docs: root `AGENTS.md` (167→256 tests, 87.7%→62.8%), `.bridge/CURRENT_TASK.md` (PR8 closed), `bookia-code/AGENTS.md` | varios `.md` | P2 | A12 |
| C6 | `src/db/tenant-config/` directory (referenciado por Dockerfile pero missing) | `server/Dockerfile:20` | P2 | None |
| C7 | Adapter Meta **spec diseñado** (no implementado) — interface `channels/types.ts:2` ya declara union, falta spec de `whatsapp.ts`/`instagram.ts`/`messenger.ts` para Fase 2 | `channels/types.ts:2` + `channels/registry.ts:6-14` | P2 | None |
| C8 | Observabilidad mínima: structured logger + health endpoint con DB/LLM checks | `index.ts:22` | P2 | None |
| C9 | RLS pool concern: pool `max:1` → investigar si `set_config(..., true)` transaction-scoped permite pool mayor | `lib/tenant-db.ts:5,10-13` | P2 | None |

---

## §9 — Restricciones y decisiones ya tomadas (NO reabrir)

El plan de GPT-5 **no debe reabrir** estas decisiones. Están validadas y funcionando.

### Producto
- **Nicho inicial:** estética/med estética Colombia. No expandir nicho en este plan.
- **Cliente piloto:** Santa María. No multi-cliente en este plan.
- **Integración Agenda Pro:** no reemplazo. Modo `handoff` (manual) por ahora; API real post-Fase-1.
- **Pagos:** Wompi sandbox. Live post-MVP.
- **Canales:** Meta (WA+IG+FB) post-Fase-1. TikTok post-MVP.

### Stack
- **Backend:** Hono + Drizzle + Postgres 16 (no cambiar a tRPC/Prisma/MySQL).
- **Frontend:** Next.js 16 + React 19 + shadcn/ui (no cambiar).
- **LLM:** DeepSeek v4-flash (no cambiar a OpenAI/Anthropic en este plan).
- **Multi-tenancy:** shared-schema + RLS (no pool-per-tenant).

### Agente V2
- **Pipeline order:** safetyPreRoute → deterministicDomainRoute → LLM → postRiskScan → applyOverrides → policy → flow → canned → llm → critic. No reordenar.
- **`\b` no funciona con acentos en JS regex.** Todos los patrones ya corregidos. No reintroducir.
- **applyOverrides:** passive vs active cancel (diseñado así).
- **CONTRA_SIGNALS cede ante tercero + booking.**
- **ClinicalSafetyAudit es transparente (no enforcement).** Enforcement en policy-engine (PR6.1).
- **MemoryService es wrapper sobre MemoryRepository** con métodos flow-specific.
- **FlowAdapter puente V2→flows** con auto-advance por datos conocidos.
- **Closure-based providers** — `createV2Providers(sql, tenantId, contactId, ...)` cierra sobre DB+memory+flow.

### Santa María
- **Persona:** "Carlos" (no Sofía), tono cercano natural, saluda "Buenas {nombre}, ¿cómo estás?".
- **Sin menú de botones** (Carlos dijo que no usan menú en chat).
- **Horario:** Lun-Sáb 9:00-19:00.
- **Escalation:** Elkin (no Carlos) es el contacto de escalation (+57 318 735 4841).
- **Precios varían por país** (COP/MXN/USD/EUR) — el agente muestra según ciudad del cliente.
- **Citas requieren:** nombre, celular, correo, fecha de nacimiento, cédula.
- **Anticipo requerido** ($50K Bancolombia, A&S Group SAS NIT 901916939) para confirmar cita.

### Seguridad
- **NO commitear API key de DeepSeek** (en `/Users/alejandropena/ARIA/config/settings.py`).
- **`bookia_app` role limitado** para runtime (NOINHERIT, FORCE RLS).
- **`DEV_AUTH`** es bypass temporal para Fase 1 — el plan debe reemplazarlo por auth real (B1).

---

## §10 — Formato de output esperado de GPT-5

Produce un **plan de implementación** con esta estructura:

### Estructura del plan
1. **Resumen ejecutivo** (1 párrafo): qué logra el plan, en cuánto tiempo, con qué gates.
2. **Sprint 0 — Estabilización** (días 1-3): C1 (git commit+push URGENTE), C2 (migrations runner), C3 (secrets), A1 (tsc fix). Estos son prerequisitos.
3. **Sprints 1-N — Stream A (Agente V2)** en orden de dependencia: A2 → A3 → A4 → A5 → A6 → A7 → A8 → A9 → A10 → A11 → A12.
4. **Sprints paralelos — Stream B (Dashboard)** donde no haya dependencia con A: B1 (auth) → B2 → B3/B4/B5/B6 → B7 → B8.
5. **Cross-cutting intercalado:** C4 (scheduler), C5 (docs sync), C6 (tenant-config), C7 (Meta spec), C8 (observability), C9 (RLS pool).

### Cada task debe incluir
- **ID** (ej. A2, B1, C1).
- **Título** claro.
- **Descripción** de qué hacer y por qué (1-3 párrafos).
- **Archivos a tocar** con `file:line` (ej. `server/src/agent/v2/core/v2-adapter.ts:77-83`).
- **Dependencias** (IDs de tasks que deben estar done).
- **Criterios de aceptación verificables** — tests a escribir/pasar, tsc clean, eval score, smoke test.
- **Estimación** en días/horas (asumiendo 1-2 ingenieros).
- **Riesgos** y mitigaciones.
- **Notas** de decisiones de implementación recomendadas (pero deja margen al ejecutor).

### Milestones con gates
- **M0 — Estable:** git limpio + tsc clean + migrations runner. Gate: `npm run build` + `vitest run` verde.
- **M1 — V2 activado:** A1-A4 done. Gate: `AGENT_KERNEL_V2=true` runtime, message persistence, smoke test end-to-end con V2.
- **M2 — V2 cerrado:** A5-A12 done. Gate: eval score documentado, golden validators implementados, 0 tsc errors, PR6.1 + PR9 + auto-advance.
- **M3 — Dashboard funcional:** B1-B6 done. Gate: login real, settings persiste todo, Escalar funcional, takeover/handback en UI, SSE con auth.
- **M4 — MVP listo:** B7-B8 + C4-C9 done. Gate: dead code limpio, E2E verde, scheduler, docs sync, Meta spec diseñado. **Listo para enchufar credenciales Meta.**

### Restricciones del plan
- **NO incluir** implementación de Meta real, Agenda Pro real, ni pagos live.
- **Respetar** las decisiones de §9 (no reabrir).
- **Priorizar** Stream A primero, Stream B en paralelo donde no haya dependencia.
- **Cada task debe ser accionable** por un ingeniero con asistencia de agentes (OpenCode/Claude Code) — no tareas vagas.
- **Estimaciones realistas** asumiendo 1-2 ingenieros, ~4-6 semanas total.

---

## §11 — Apéndices

### 11.1 File map principal del repo (`/Users/alejandropena/Bookia/bookia-code/`)

```
bookia-code/
├── AGENTS.md                          # Facts del proyecto (stale vs root)
├── README.md                          # Dice "demo simulado" (engañoso)
├── package.json                       # Frontend (Next 16)
├── auth.ts                            # NextAuth mock (plaintext JSON)
├── middleware.ts                      # Protege /dashboard/*
├── app/
│   ├── page.tsx                       # Landing
│   ├── (auth)/login, register/
│   ├── (dashboard)/dashboard, conversations, settings/
│   └── api/auth/[...nextauth]/, conversations/, metrics/  # legacy
├── components/
│   ├── conversations/ConversationsInbox.tsx
│   ├── dashboard/ (RevenueKpiCards, ConversionFunnel, DemandHeatmap, BotRoiCard, DemoLive, + 5 dead)
│   ├── landing/ (navbar, hero, demo-chat, ...)
│   └── ui/ (shadcn)
├── lib/api.ts                         # API client (TENANT_SLUG hardcoded)
├── data/ (users.json plaintext, conversations.json, metrics.json, agent-review-queue.jsonl empty)
├── docs/
│   ├── PLAN-10-10-MVP.md              # 6 fases marked done (PRE-V2, stale)
│   ├── TDD-BACKEND-MVP.md             # Canonical backend TDD (COMPLETADO)
│   ├── ESTADO-ACTUAL.md, PENDIENTES-ABIERTOS.md, OUTPUT_STANDARDS.md
│   ├── source/Terminada plantilla...docx  # Carlos plantilla COMPLETED (671KB, 2026-06-28)
│   └── AUDITORIA-MVP-GPT.md           # ESTE DOCUMENTO
├── server/
│   ├── package.json                   # Backend (Hono, Vitest)
│   ├── Dockerfile                     # Multi-stage, tzdata, NO migration step
│   ├── entrypoint.sh                  # wait-for-pg → seed → seed-demo → start (NO migrations)
│   ├── docker-compose.yml (en bookia-code/)  # api + postgres
│   ├── .env / .env.example            # DeepSeek key plaintext / minimal example
│   ├── env.ts                         # Zod schema (AGENT_KERNEL_V2 MISSING)
│   ├── drizzle/                       # 12 SQL, 3 tracked by drizzle-kit
│   ├── drizzle.config.ts
│   ├── src/
│   │   ├── index.ts                   # Hono app + routes
│   │   ├── env.ts
│   │   ├── lib/tenant-db.ts           # withTenant, appSql pool max:1
│   │   ├── db/
│   │   │   ├── schema.ts              # 13 tablas
│   │   │   ├── client.ts              # admin connection
│   │   │   ├── seed.ts, seed-demo.ts, import-tenant.ts
│   │   │   └── tenant-config/         # MISSING dir (referenciada por Dockerfile)
│   │   ├── api/
│   │   │   ├── middleware.ts          # resolveTenant (DEV_AUTH header spoof)
│   │   │   ├── sim.ts                 # /api/sim/message + /stream
│   │   │   ├── dashboard.ts           # CRUD conversations/metrics/profile
│   │   │   ├── webhooks.ts            # wompi real, others 501
│   │   │   └── workers.ts             # manual triggers
│   │   ├── agent/
│   │   │   ├── orchestrator.ts        # processMessage, AGENT_KERNEL_V2 flag :428
│   │   │   ├── router.ts, responder.ts, llm/ (deepseek.ts, mock.ts)
│   │   │   ├── eval/                  # V1 eval
│   │   │   └── v2/
│   │   │       ├── types/ (agent-intent.ts, quality-score.ts)
│   │   │       ├── understanding/ (safety-pre-router, deterministic-domain-route, risk-scanner, structured-router, input-normalizer)
│   │   │       ├── policy/ (clinical-safety, clinical-safety-audit, policy-engine, prompt-injection, privacy-safety)
│   │   │       ├── response/ (response-critic, response-composer, tone-adapter)
│   │   │       ├── core/ (agent-kernel.ts, v2-adapter.ts [tsc error :10], quality-scorer, metric-emitter, conversation-snapshot)
│   │   │       ├── memory/ (memory-service.ts, memory-repository.ts)
│   │   │       ├── adapter/ (flow-adapter.ts)
│   │   │       └── eval/ (eval-runner.ts, cases/, golden-conversations.ts)
│   │   ├── flows/
│   │   │   ├── engine.ts              # state machine
│   │   │   └── santa-maria/ (catalog.ts 31 svc, flows.ts 2 flows, canned-responses.ts, images/ 28 JPEGs)
│   │   ├── channels/ (registry.ts [mock only], mock.ts, types.ts [union declared])
│   │   ├── booking/ (handoff.ts [manual], mock.ts, index.ts, types.ts)
│   │   └── metrics/intelligence.ts
│   ├── data/clinical-audit-log.jsonl # 442KB, 411 entries (PR6)
│   ├── reports/v1-v2-regression-report.{json,md}  # 411 cases, V2 62.8%
│   ├── docs/ (AGENTS-ROADMAP, PLAN-SOTA, PRR-SOTA, open-code-brief, knowledge-alignment-audit)
│   ├── scripts/smoke-test.sh
│   └── tests/ (agent, v2-agent 134, v2-flow-adapter 19, v2-flow-e2e 16, v2-memory-persistence 32, v2-memory-integration 12, rls, channels, dashboard, health, intelligence, llm, santa-maria)
├── scripts/ (eval-report.py, eval-ui.mjs, eval-ui-reeval.mjs)
├── e2e/bookia.spec.ts                 # Playwright (assertions stale)
└── .bridge/ (CURRENT_TASK.md PR8, HANDOFF_LOG.md, queue/, tasks/, memory/)
```

### 11.2 Discrepancias docs vs disco (resumen)

| Fuente | Claim | Realidad en disco |
|---|---|---|
| Root `AGENTS.md` | "167 tests, 87.7% eval" | ~256 tests, 62.8% en 411 casos |
| `bookia-code/AGENTS.md` | "256/256 pass, 87.7%" | 256 pass sí, pero 87.7% stale (es 62.8%) |
| `PLAN-10-10-MVP.md` | "6 fases 100% completadas" | Stale — era pre-V2, scope creció masivamente |
| `.bridge/CURRENT_TASK.md` | "PR8 active" | Archivos de PR8 existen, PR8 funcionalmente done |
| `bookia-code/README.md:3` | "Demo con datos simulados" | Frontend está conectado al backend real |
| `server/docs/AGENTS-ROADMAP.md` | "Sprints 2-6 not started" | Stale — PR2.x-PR8 todos done |

### 11.3 Bloqueadores externos (fuera de scope de este plan, documentar)

- **NDA** con Santa María (no firmado aún).
- **Meta Business Account access** — credenciales de WhatsApp Business API, Instagram, Messenger.
- **Agenda Pro API** — validar si existe API pública para integración (Fase 3).
- **Hosting decision** — Railway vs Fly.io vs Vercel+Cloudflare.
- **`usebookia.com` domain config** — DNS en Cloudflare, pendiente.

### 11.4 Referencias de docs clave (para profundizar si GPT-5 lo necesita)

- `bookia-repo/00. Inicio del Proyecto/Documento Madre del Proyecto.md` — master contextual.
- `bookia-repo/06. Producto/Alcance del MVP.md` — scope MVP, 3 fases, out-of-scope.
- `bookia-repo/04. Cliente Piloto/` — perfil, workflow actual, dolores, plantilla recopilación.
- `bookia-repo/05. Reuniones/2026-06-06 — Carlos x Alejo — Walkthrough Cliente Piloto.md` — transcript procesado.
- `/Users/alejandropena/Bookia/Carlos x Alejo (Walkthrough) - 2026_06_06 ... .md` — transcript crudo (1540 líneas, 76KB).
- `bookia-code/docs/TDD-BACKEND-MVP.md` — TDD canónico backend (344 líneas, COMPLETADO).
- `bookia-code/server/docs/open-code-brief-bookia-agent-sota.md` — brief original V2 (1370 líneas, "no conexiones externas").
- `bookia-code/server/docs/PRR-SOTA-Bookia-Agent-V2.md` — PRR arquitectura V2.
- `bookia-code/server/docs/knowledge-alignment-audit-santa-maria.md` — audit DOCX vs implementation (~85% alineado, 0 P0, 1 P1 phantom services, 1 P2 off-hours).
- `bookia-code/server/reports/v1-v2-regression-report.md` — eval real (411 casos, V2 62.8%).

---

## §12 — Prompt inicial sugerido para GPT-5

Copia este bloque junto con todo este documento a ChatGPT (GPT-5):

```
Eres un Arquitecto de Software Staff/Principal. Te entrego el dossier de auditoría del MVP de Bookia (un SaaS AI-first de gestión conversacional para clínicas de estética). El dossier está completo y verificado en disco con file:line references.

Tu tarea: genera un PLAN DE IMPLEMENTACIÓN DEFINITIVO que lleve el proyecto de su estado actual al NORTH STAR definido en §2 (MVP Fase 1 completo y pulido + agente V2 terminado al 100%, listo para enchufar credenciales de Meta después).

Restricciones absolutas:
- NO implementar Meta real, Agenda Pro real, ni pagos live en este plan.
- NO reabrir las decisiones de §9.
- Priorizar Stream A (agente V2) primero; Stream B (dashboard) en paralelo donde no haya dependencia.
- Cada task debe ser accionable por 1-2 ingenieros con asistencia de agentes (OpenCode/Claude Code).
- Estimación realista: 4-6 semanas total.

Formato esperado: detallado en §10. Sprints de ~1 semana, cada task con ID/título/descripción/archivos (file:line)/dependencias/criterios de aceptación verificables/estimación/riesgos. Milestones M0-M4 con gates.

Lee el dossier completo antes de empezar. Empieza tu respuesta con "## PLAN DE IMPLEMENTACIÓN — Bookia MVP → Producción Fase 1 + Agente V2 100%" y un resumen ejecutivo de 1 párrafo. Luego el Sprint 0 (estabilización, incluye el git commit+push URGENTE). Luego el resto.
```

---

*Fin del dossier. Generado por OpenCode el 2026-06-29 tras auditoría a profundidad con 3 explore agents en paralelo sobre el repo real `/Users/alejandropena/Bookia/bookia-code/`.*
