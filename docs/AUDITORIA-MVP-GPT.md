# Bookia — Dossier de Auditoría del MVP para GPT-5

> **Documento único de contexto.** Generado el 2026-06-29 por OpenCode (agente principal) tras una auditoría a profundidad del codebase en disco. Todo lo que se afirma aquí está verificado con `file_path:line_number` en el repo real `/Users/alejandropena/Bookia/bookia-code/`. Donde hay discrepancias entre la documentación y el disco, se señala explícitamente.
>
> **⚠️ UPDATE 2026-06-29:** Se incorporan descubrimientos de extracción multimodal de **34 imágenes de WhatsApp de Santa María** (vía Gemini AI Studio, validado contra API propia — 100% precisión textual). El dossier ahora incluye: pricing multi-moneda (USD, EUR, MXN además de COP), 2 servicios nuevos (Hand Rejuvenation), guía post-tratamiento de Rinomodelación, promociones con descuento, y 5 fotos before/after. Ver §13 para la data completa.
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

**⚠️ Novedad en esta versión (§13):** Se descubrieron 34 imágenes de WhatsApp con pricing multi-moneda (USD/EUR/MXN), promociones activas, servicios no cubiertos (Hand Rejuvenation), y guías post-tratamiento que **no existían en el conocimiento del agente**. El plan debe incorporar estos descubrimientos sin desviarse del north star. GPT-5 debe decidir: ¿se integran como parte del MVP, o quedan como backlog de Fase 2?

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
>
> Golden validators: **34/39 (87.2%)** — 5 fallos no reparables por límite de contexto conversacional.

- `src/agent/v2/eval/cases/index.ts:14-25` agrega 10 case files: clinical-safety 45, prompt-injection 42, privacy-pii 33, quejas-handoff 35, router 48, scheduling 41, pricing 44, faq 43, typos-ambiguous 48, regression-v1 32 → **~411 casos**.
- `eval-runner.ts` (738 líneas): filtros reviewed/critical/category/golden, exporta failures a `failures/{date}/`, escribe reportes markdown/json.
- **Validadores stub:** `eval-runner.ts:270` "Memory service validation not yet implemented", `:273` "Memory concern validation not yet implemented", `:278` "Funnel stage validation not yet implemented", `:283` "NBA validation not yet implemented". Cualquier golden conversation con `expectedFunnel`/`expectedMemoryConcern`/`expectedNextBestAction`/`expectedMemoryService` falla siempre.

### 4.6 Tests — 283 (no 167/256)

> **Discrepancia:** `AGENTS.md` raíz dice "167 tests". Versiones anteriores del dossier decían "~256". El conteo real verificado en disco (`vitest run`) es **283 tests, 0 fallos, 3.72s**. Suites: agent(26) + v2-agent(114) + v2-flow-adapter(17) + v2-flow-e2e(10) + v2-memory-persistence(24) + v2-memory-integration(11) + rls(6) + dashboard(9) + channels(8) + intelligence(7) + health(2) + santa-maria(42) + llm(7).

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

### 5.4 Santa María flows — pricing y contenido visual

El flow `PRECIO_FLOW` (`flows.ts:97-121`) y el `AGENDAMIENTO_FLOW` (`:7-82`) hoy solo manejan texto y precios COP. Los descubrimientos de §13 añaden:

- **Multi-moneda**: catálogos completos en USD (26 servicios), EUR (26), MXN (24). Hoy `catalog.ts` solo tiene COP.
- **Imágenes para enviar**: 34 imágenes WhatsApp con promos, before/after y guías que el agente debe poder enviar contextualmente.
- **Promociones**: Esperma de Salmón con precio regular vs descuento. El agente no sabe de promos hoy.
- **Guía post-tratamiento**: Rinomodelación — debe enviarse automáticamente tras agendar.
- **Hand Rejuvenation**: 2 servicios que no existen en ningún catálogo.

Ver §13 para la data completa. GPT-5 decidirá la prioridad de integración.

### 5.5 Bugs y gaps del V2 (para cerrar en el plan)

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
| Root `AGENTS.md` | "167 tests, 87.7% eval" | **283 tests**, 62.8% en 411 casos |
| `bookia-code/AGENTS.md` | "256/256 pass, 87.7%" | **283 pass** sí, pero 87.7% stale (es 62.8%) |
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

⚠️ IMPORTANTE: Este dossier incluye descubrimientos RECIENTES (§13) de 34 imágenes de WhatsApp de Santa María con pricing multi-moneda (USD, EUR, MXN), servicios no cubiertos (Hand Rejuvenation), promociones activas, y guías post-tratamiento que el agente actual NO conoce. Debes decidir si estos descubrimientos se integran en el MVP o quedan para Fase 2.

Tu tarea: genera un PLAN DE IMPLEMENTACIÓN DEFINITIVO que lleve el proyecto de su estado actual al NORTH STAR definido en §2 (MVP Fase 1 completo y pulido + agente V2 terminado al 100%, listo para enchufar credenciales de Meta después).

Considera estas preguntas abiertas al diseñar el plan:
1. Los descubrimientos de §13 — ¿cuáles son críticos para el MVP y cuáles pueden esperar? ¿Conviene integrar multi-moneda ahora o postergar?
2. ¿El agente debe enviar imágenes? ¿Es eso crítico para Fase 1 o es feature de Fase 2?
3. ¿Las promociones con descuento cambian el flow de precio existente o son un añadido menor?
4. ¿Hand Rejuvenation y la guía post-tratamiento son bloqueantes para el piloto con Carlos?

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

## §13 — Santa María: descubrimientos multimodales (34 imágenes WhatsApp)

### 13.1 Qué pasó

El DOCX de Carlos (`Terminada plantilla estética Santamaría y bookia .docx`) tiene **472 párrafos de texto** (ya implementados) y **34 imágenes embebidas** que no se veían en el Word. Fueron extraídas manualmente a `~/Downloads/Fotossantamaria/` y procesadas con Gemini AI Studio (Interactions API, modelo `gemini-3.5-flash`). Validación cruzada contra API propia: **19/19 imágenes comparables tienen contenido textual y precios 100% idénticos** — AI Studio no alucinó. Data completa en `server/data/santamaria-extraction/ai-studio-result.json` (490 líneas, ~19KB).

### 13.2 Lo que se descubrió

| Hallazgo | Detalle | Impacto |
|---|---|---|
| **Pricing multi-moneda** | La clínica opera en 4 mercados con precios INDEPENDIENTES: COP (Colombia), MXN (México), USD (USA), EUR (Europa). No es conversión directa — cada mercado tiene su propia estrategia de pricing. | ❌ Hoy `catalog.ts` solo tiene COP. El agente muestra precios COP a todos. |
| **2 servicios nuevos** | **Hand Rejuvenation (Radiesse)** y **Hand Rejuvenation (Sculptra)** — $699 USD / 699€ cada uno. No existen en el catálogo actual en ninguna moneda. | ❌ El agente no puede responder si preguntan por rejuvenecimiento de manos. |
| **Guía post-tratamiento** | Rinomodelación tiene una guía de cuidados post-procedimiento (evitar sol, presión, ejercicio 24h, hielo; inflamación 1 semana). | ❌ No existe como canned response. Debería enviarse automáticamente al agendar. |
| **Promociones activas** | Esperma de Salmón/PDRN: COP $800K → $499K (promo), MXN $5,700 → $3,800 (promo). | ❌ El agente no conoce promos. Muestra precio regular siempre. |
| **5 before/after de Red Lips** | Misma paciente en 4 monedas (COP $670K, MXN $6,500, USD $350, EUR 300€). | ❌ El agente nunca envía imágenes. No sabe qué imagen corresponde a qué moneda. |
| **Catálogo USD completo** | 26 servicios con precios en dólares ($80 consulta → $1,800 Full Face). | ❌ No modelado. |
| **Catálogo EUR completo** | 26 servicios con precios en euros (80€ consulta → 1,800€ Full Face). | ❌ No modelado. |
| **Catálogo MXN parcial** | 24 servicios con precios en pesos mexicanos ($50K consulta → $27K Full Face). | ⚠️ Solo Rinomodelación en MXN existe. |
| **Full Face paquetes** | Radiesse, Sculptra, AH tienen paquetes "Full Face" que combinan múltiples procedimientos en un solo precio. | ✅ Existen en catalog.ts pero solo en COP. |
| **Masculinización facial** | Existen versiones con Radiesse y con AH, en 4 monedas, con imágenes promocionales y checklist de inclusión. | ⚠️ Existe como descripción pero no como entry separado en catalog.ts. |
| **Red Lips** | Servicio de relleno de labios con resultado natural. Existe en 4 monedas con 5 fotos before/after. | ✅ Existe en catalog.ts pero sin imageKeys para las fotos before/after. |
| **Versiones inglés/español** | Varias promos existen en ambos idiomas con el mismo diseño. | ❌ El agente no detecta idioma ni elige imagen según idioma. |

### 13.3 Servicios vs monedas — matriz completa

| Servicio | COP (hoy) | USD (catálogo) | EUR (catálogo) | MXN (catálogo) |
|---|---|---|---|---|
| Valoración / consulta | $50,000 | $80 | 80€ | $50K |
| Botox por zona | $630,000 | $290 | 290€ | ❌ |
| Full Face Botox | $1,580,000 | $900 | 899€ | ❌ |
| Russian Lips | $820,000 | $499 | 400€ | $8,500 |
| Doll Lips | $1,640,000 | $899 | 800€ | $16,000 |
| Red Lips | $670,000 | $350 | 300€ | $6,500 |
| Korean Face | $1,899,000 | $999 | 999€ | ❌ |
| Full Face AH | $2,999,000 | $1,500 | 1,390€ | $20,000 |
| Full Face Radiesse | $3,999,000 | $1,800 | 1,800€ | $27,000 |
| Full Face Sculptra | $3,999,000 | $1,800 | 1,800€ | $27,000 |
| Radiesse (por vial) | $2,600,000 | $699 | 699€ | ❌ |
| Sculptra (por vial) | $2,500,000 | $699 | 699€ | ❌ |
| Rinomodelación | $820,000 | $499 | 499€ | $8,500 (✅ existe) |
| Marcación mandibular | $1,640,000 | $900 | 900€ | ❌ |
| Mentón | $820,000 | $499 | 499€ | ❌ |
| Ojeras AH | $820,000 | $499 | 499€ | ❌ |
| Esperma de Salmón | $800K→$499K promo | $300 | 300€ | $5,700→$3,800 promo |
| NCTF | $630,000 | $300 | 300€ | ❌ |
| Masculinización Radiesse | $3,999,000 | $1,800 | 1,800€ | ❌ |
| Masculinización AH | $2,999,000 | $1,500 | 1,500€ | ❌ |
| Hialuronidasa | $530,000 | $300 | 300€ | ❌ |
| Nasolabiales AH | $820,000 | $499 | 499€ | ❌ |
| Pómulos AH | $1,640,000 | $899 | 899€ | ❌ |
| Mesobotox | $1,580,000 | $900 | 900€ | ❌ |
| **Hand Rejuvenation Radiesse** | ❌ **No existe** | $699 | 699€ | ❌ |
| **Hand Rejuvenation Sculptra** | ❌ **No existe** | $699 | 699€ | ❌ |

### 13.4 Imágenes: clasificación por tipo

| Tipo | Cantidad | Qué contienen | Para qué sirven |
|---|---|---|---|
| **Before/After** | 5 | Red Lips en 4 monedas (COP, MXN, USD, EUR) | El agente envía cuando el cliente pregunta por Red Lips + quiere ver resultados |
| **Pricing catalogs** | 5 | Catálogo completo en USD (2), COP (1), EUR (1) | El agente envía como respuesta a "precios" para dar visión general |
| **Post-treatment guide** | 1 | Cuidados post-Rinomodelación | El agente envía automáticamente al confirmar cita de Rinomodelación |
| **Promos** | 23 | Paquetes faciales (Radiesse, Sculptra, AH), Russian Lips, Doll Lips, Esperma de Salmón, Masculinización — en 4 monedas | El agente envía contextualmente según servicio + moneda |

### 13.5 Lo que el agente NO puede hacer hoy (y debería)

1. **Mostrar precio correcto según moneda del cliente** — hoy solo COP. Si cliente es de Miami, muestra COP.
2. **Enviar imágenes de servicios** — el agente solo responde con texto. No tiene campo `mediaUrl` en su respuesta.
3. **Enviar before/after** — ni siquiera existe la lógica de "¿quieres ver fotos?".
4. **Conocer promociones activas** — Esperma de Salmón tiene descuento y el agente no lo sabe.
5. **Enviar guía post-tratamiento** — tras agendar Rinomodelación, no se envía ninguna guía.
6. **Responder sobre Hand Rejuvenation** — no existe en el catálogo, clasifica como `otro`.
7. **Elegir imagen según idioma** — las promos existen en español e inglés, el agente no diferencia.

### 13.6 Data cruda disponible

| Archivo | Contenido |
|---|---|
| `server/data/santamaria-extraction/ai-studio-result.json` | 34 imágenes: texto completo, precios, monedas, tipo, servicios asociados |
| `server/docs/knowledge-alignment-audit-santa-maria.md` | Auditoría DOCX vs código (13 categorías, alineación ~85%) |
| `server/src/flows/santa-maria/catalog.ts` | Catálogo actual (29 servicios solo COP) |
| `server/src/flows/santa-maria/canned-responses.ts` | 24 respuestas plantilla del DOCX |
| `server/src/flows/santa-maria/flows.ts` | 3 flows existentes |

---

*Fin del dossier. Generado por OpenCode el 2026-06-29 tras auditoría a profundidad con 3 explore agents en paralelo sobre el repo real `/Users/alejandropena/Bookia/bookia-code/`.*

---

## §14 — Mapeo 1a1: cada imagen × servicio × trigger × acción

*Extraído del plan de implementación (sección [UPDATE] Mapeo completo).*

### Leyenda de columnas

| Columna | Significado |
|---|---|
| **Imagen** | Nombre en AI Studio (`image_N.jpg`). Las 34 están en `server/data/santamaria-extraction/ai-studio-result.json` con full_text extraído |
| **Type** | `before_after`, `promo`, `pricing_catalog`, `guide` |
| **Servicio** | Servicio(s) que promociona la imagen |
| **Moneda** | COP, USD, EUR, MXN, o null si es multi-moneda o solo descripción |
| **En catalog.ts** | ✅ ya existe en el catálogo (aunque solo con precio COP), ❌ no existe |
| **En IMAGE_MANIFEST** | ✅ ya referenciada en `catalog.ts` como imageKey, ❌ no referenciada |
| **Flow state** | Estado del flow donde el agente DEBERÍA enviar esta imagen |
| **Trigger** | Condición exacta para que el agente envíe la imagen |
| **Acción** | Qué hay que implementar |
| **Prio** | Alta/Media/Baja según impacto en experiencia del paciente |

### 1. Before/After — Red Lips (5 imágenes)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_1.jpg | before_after | Red Lips | MXN $6,500 | ✅ (solo COP) | ❌ | `precio → show_price` | Cliente es de CDMX (MXN) y pregunta por Red Lips o labios | Agregar imageKey a Red Lips en catalog.ts. El before/after debe enviarse según moneda del cliente | Alta |
| image_3.jpg | before_after | Red Lips | USD $350 | ✅ (solo COP) | ❌ | `precio → show_price` | Cliente es de Miami (USD) y pregunta por Red Lips | Ídem, mapear a USD | Alta |
| image_5.jpg | before_after | Red Lips | EUR 300€ | ✅ (solo COP) | ❌ | `precio → show_price` | Cliente pregunta en EUR / Europa | Ídem, mapear a EUR | Media |
| image_7.jpg | before_after | Red Lips | COP $670,000 | ✅ | ❌ | `precio → show_price` | Cliente es de Colombia y pregunta por Red Lips | Agregar imageKey a Red Lips en catalog.ts para COP | Alta |

**Patrón:** Red Lips tiene 4 versiones antes/después en 4 monedas + 1 extra. El agente debe detectar la moneda/mercado del cliente y enviar la versión correcta. Hoy catalog.ts solo tiene 4 imageKeys para Red Lips (image5-image12.jpeg del DOCX) y ninguna de las 4 versiones before/after de WhatsApp.

### 2. Pricing Catalogs — Catálogos completos por moneda (4 imágenes)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_9.jpg | pricing_catalog | **26 servicios USD** | USD | ❌ (solo COP) | ❌ | `precio → ask_city` + ciudad USD | Cliente es de Miami (USD) o pide "precios en dólares" | **Crear catálogo USD en catalog.ts con 26 entries nuevos** (o model multi-currency). Actualmente formatoPrice() solo sabe COP. | Alta |
| image_10.jpg | pricing_catalog | **24 servicios COP** | COP | ✅ (29 servicios, hay overlap) | ❌ | `precio → ask_city` | Cliente es de Colombia | No urgente — ya tenemos catálogo COP completo en catalog.ts con 29 servicios (esta imagen tiene 24, falta info de 5) | Baja |
| image_11.jpg | pricing_catalog | **24 servicios USD** (estilo alterno) | USD | ❌ | ❌ | `precio → ask_city` | Complementa image_9 con diseño social media | El agente debe poder enviar la imagen del catálogo completo según moneda del cliente | Alta |
| image_13.jpg | pricing_catalog | **26 servicios EUR** | EUR | ❌ | ❌ | `precio → ask_city` | Cliente pregunta en EUR o desde Europa | **Crear catálogo EUR en catalog.ts** | Media |

**Patrón:** 3 mercados nuevos (USD, EUR, MXN) con pricing propio. Hoy `formatPrice()` solo acepta COP. `catalog.ts` tiene un solo `price` y `currency` por servicio. El schema actual no soporta multi-moneda. Se requiere:
- Cambiar schema de CatalogItem para soportar `prices: { COP: string, USD?: string, EUR?: string, MXN?: string }` 
- O crear entries separados por moneda con `cities` filtrando
- `formatPrice()` debe aceptar currency como parámetro (ya lo hace, pero el catálogo no tiene datos multi-moneda)

### 3. Post-treatment Guide (1 imagen)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_2.jpg | guide | Rinomodelación | N/A (guía) | ❌ | ❌ | `agendamiento → confirm_booking` (post-confirmación) | **Automático** — enviar después de `confirm_booking` cuando el servicio es Rinomodelación | **Crear nueva canned response** `guia_rinomodelacion` con el texto de cuidados post-tratamiento. Agregar trigger en flow adapter para enviar post-confirmación de Rinomodelación. | **Alta — inmediato** |

**Texto exacto de la guía (image_2.jpg):**
```
RINOMODELACIÓN
Guía de post-tratamiento: Cuidados & Recomendaciones
- Evitar el sol directo en la zona
- Evitar hacer presión en la zona
- No hacer actividad física por 24 horas
- No ponerse hielo en la zona
- Inflamación y sensación de pesadez por una semana

Nos encanta que hayas confiado en nosotros. Para garantizar los mejores resultados, te invitamos a seguir nuestras recomendaciones. ¡Son sencillas y están pensadas para ti! Si tienes alguna pregunta, no dudes en contactarnos.
```

### 4. Promos — Full Face Radiesse (6 imágenes, 4 monedas)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_4.jpg | promo | Full Face Masculinización Radiesse | EUR 1,800€ | ❌ | ❌ | `precio → show_price` + ciudad EUR | Cliente pregunta por masculinización facial o Full Face Radiesse en EUR | Asociar esta imagen como imageKey de Full Face Radiesse + masculinización facial en EUR. Crear entrada multi-moneda para Full Face Radiesse (COP 3,999,000, MXN 27,000, USD 1,800, EUR 1,800) | Alta |
| image_6.jpg | promo | Full Face Masculinización Radiesse | USD $1,800 | ❌ | ❌ | `precio → show_price` | Cliente USD pregunta por masculinización o Radiesse | Ídem, versión USD | Alta |
| image_8.jpg | promo | Full Face Radiesse (EN) | N/A (descripción en inglés) | ❌ | ❌ | `precio → show_price` | Cliente habla inglés y pregunta por Full Face Radiesse | Asociar como imageKey multi-idioma para Radiesse | Media |
| image_17.jpg | promo | Masculinización Facial Radiesse | COP $3,999,000 | ❌ | ❌ | `precio → show_price` | Cliente COP pregunta por masculinización facial | Asociar imageKey a masculinización facial | Alta |
| image_24.jpg | promo | Full Face Radiesse | COP $3,999,000 | ✅ (Full Face — Radiesse) | ❌ (no está en imageKeys de catalog.ts) | `precio → show_price` | Cliente COP pregunta por Full Face | **Agregar image_24.jpg como imageKey de Full Face — Radiesse** en catalog.ts | Alta |
| image_33.jpg | promo | Full Face Radiesse | MXN $27,000 | ❌ | ❌ | `precio → show_price` | Cliente MXN (CDMX) pregunta por Full Face | Asociar imageKey para mercado MXN | Alta |
| image_25.jpg | promo | Facial Masculinization Radiesse (EN) | N/A (solo descripción) | ❌ | ❌ | `precio → show_price` | Cliente inglés pregunta por masculinización | Asociar imageKey multi-idioma | Media |

### 5. Promos — Full Face Sculptra (3 imágenes)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_20.jpg | promo | Full Face Sculptra (EN) | N/A | ❌ | ❌ | `precio → show_price` | Cliente inglés pregunta por Sculptra | Asociar imageKey multi-idioma para Full Face Sculptra | Media |
| image_21.jpg | promo | Full Face Sculptra | MXN $27,000 | ❌ | ❌ | `precio → show_price` | Cliente MXN pregunta por Sculptra | Agregar entrada multi-moneda Sculptra | Alta |
| image_30.jpg | promo | Full Face Sculptra | COP $3,999,000 | ✅ | ❌ (no está en imageKeys) | `precio → show_price` | Cliente COP pregunta por Sculptra | **Agregar image_30.jpg como imageKey de Full Face — Sculptra** | Alta |

### 6. Promos — Full Face Ácido Hialurónico (3 imágenes)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_19.jpg | promo | Full Face AH | COP $2,999,000 | ✅ (Full Face — Ácido Hialurónico) | ❌ (no está en imageKeys) | `precio → show_price` | Cliente COP pregunta por Full Face AH | **Agregar image_19.jpg como imageKey de Full Face — AH** | Alta |
| image_28.jpg | promo | Full Face HA (EN) | N/A | ❌ | ❌ | `precio → show_price` | Cliente inglés pregunta por Full Face HA | Asociar imageKey multi-idioma | Media |
| image_34.jpg | promo | Full Face AH | MXN $20,000 | ❌ | ❌ | `precio → show_price` | Cliente MXN pregunta por Full Face AH | Agregar entrada multi-moneda Full Face AH | Alta |

### 7. Promos — Masculinización Facial con AH (3 imágenes)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_12.jpg | promo | Full Face Masculinización AH | EUR 1,500€ | ❌ | ❌ | `precio → show_price` | Cliente EUR pregunta por masculinización facial con AH | Asociar imageKey multi-moneda | Media |
| image_15.jpg | promo | Full Face Masculinización AH | USD $1,500 | ❌ | ❌ | `precio → show_price` | Cliente USD | Ídem | Alta |
| image_18.jpg | promo | Masculinización Facial AH | COP $2,999,000 | ❌ | ❌ | `precio → show_price` | Cliente COP pregunta por masculinización facial con AH | Crear entrada en catalog.ts para "Masculinización facial con AH" (hoy solo existe con Radiesse como descripción en Full Face entries) | Alta |
| image_27.jpg | promo | Facial Masculinization (EN) | N/A | ❌ | ❌ | `precio → show_price` | Cliente inglés | Asociar imageKey multi-idioma | Media |

### 8. Promos — Russian Lips (2 imágenes en monedas no COP)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_16.jpg | promo | Russian Lips | EUR 400€ | ✅ (COP $820,000) | ❌ | `precio → show_price` | Cliente EUR pregunta por Russian Lips | Asociar imageKey con precio multi-moneda para Russian Lips | Media |
| image_23.jpg | promo | Russian Lips | COP $820,000 | ✅ | ❌ | `precio → show_price` | Cliente COP pregunta por Russian Lips | **Agregar image_23.jpg como imageKey de Russian Lips** | Alta |
| image_32.jpg | promo | Russian Lips | MXN $8,500 | ✅ (COP $820,000) | ❌ | `precio → show_price` | Cliente MXN pregunta por Russian Lips | Asociar imageKey multi-moneda MXN | Alta |

### 9. Promos — Doll Lips (3 imágenes)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_14.jpg | promo | Doll Lips | EUR 800€ | ✅ (COP $1,640,000) | ❌ | `precio → show_price` | Cliente EUR pregunta por Doll Lips | Asociar imageKey + precio multi-moneda | Media |
| image_22.jpg | promo | Doll Lips | COP $1,640,000 | ✅ | ❌ | `precio → show_price` | Cliente COP pregunta por Doll Lips | **Agregar image_22.jpg como imageKey de Doll Lips** | Alta |
| image_26.jpg | promo | Doll Lips | MXN $16,000 | ✅ (solo COP) | ❌ | `precio → show_price` | Cliente MXN pregunta por Doll Lips | Asociar imageKey multi-moneda MXN | Alta |

### 10. Promos — Esperma de Salmón / PDRN (2 imágenes con descuento)

| Imagen | Type | Servicio | Moneda | En catalog.ts | En IMAGE_MANIFEST | Flow state | Trigger | Acción | Prio |
|---|---|---|---|---|---|---|---|---|---|
| image_29.jpg | promo | Esperma de Salmón / PDRN | MXN (regular $5,700 → promo $3,800) | ✅ (COP $800,000) | ❌ | `precio → show_price` o `promo_trigger` | Cliente MXN pregunta por Esperma de Salmón o el chatbot detecta interés | **Modelar descuento promocional.** El agente debe saber que existe un precio regular y uno promocional. Responder: "Tiene un valor de $5,700 MXN, pero tenemos una promoción activa a solo $3,800 MXN". | Alta |
| image_31.jpg | promo | Esperma de Salmón / PDRN | COP ($800,000 → $499,000) | ✅ | ❌ | `precio → show_price` o `promo_trigger` | Cliente COP pregunta por Esperma de Salmón | Ídem. Pricing en COP: regular $800,000, promo $499,000. | Alta |

**Patrón importante:** Estas 2 imágenes revelan un **modelo de promociones** que no existe hoy. El catalogo tiene un campo `promoLabel` opcional ("Mes del Padre"), pero no un sistema de precio regular vs precio promocional. Propuesta de schema:
```
promoPrice?: string  // Precio promocional
promoCurrency?: string
promoLabel?: string  // Ej: "Lanzamiento", "Mes del Padre"
promoEndDate?: string
```

### 11. Servicios nuevos: Hand Rejuvenation (0 imágenes directas, aparece en catálogos USD/EUR)

Hand Rejuvenation no tiene imagen dedicada en las 34 extraídas, pero aparece en los catálogos completos de USD (image_9.jpg) y EUR (image_13.jpg):

| Catálogo | Servicio | Precio |
|---|---|---|
| USD | Hand Rejuvenation (Radiesse) | $699 |
| USD | Hand Rejuvenation (Sculptra) | $699 |
| EUR | Hand Rejuvenation (Radiesse) | 699€ |
| EUR | Hand Rejuvenation (Sculptra) | 699€ |

**No existe en catalog.ts en ninguna moneda.** Es un servicio nuevo completo. Se necesita crear 2 entries en catalog.ts con precios multi-moneda (falta precio COP — preguntar a Carlos).

### Resumen de acción por sistema

#### A. Catalog.ts — Lo que hay que cambiar

| Cambio | Archivos | Descripción |
|---|---|---|
| Modelo multi-moneda | `catalog.ts` | Cambiar `price: string` + `currency: string` → `prices: Record<string, { price: string; promoPrice?: string; promoLabel?: string }>` |
| Hand Rejuvenation x2 | `catalog.ts` | Agregar 2 nuevos servicios (Radiesse + Sculptra) con precios USD/EUR (COP pendiente) |
| Masculinización facial con AH | `catalog.ts` | Agregar entry separado (hoy solo existe como descripción dentro de Full Face) |
| imageKeys nuevas (18) | `catalog.ts` | Agregar las 18 imágenes WhatsApp al `imageKeys` de cada servicio. Ver tabla arriba. |

#### B. IMAGE_MANIFEST — Lo que hay que agregar

Las 34 imágenes AI Studio NO están en el IMAGE_MANIFEST actual. Hay que agregar entries para todas (o al menos las 18 asignadas a servicios). Propuesta:
```typescript
"image_1.jpg": { service: "Red Lips", description: "Red Lips Before/After — $6,500 MXN", type: "before_after" },
"image_2.jpg": { service: "Rinomodelación", description: "Guía post-tratamiento Rinomodelación", type: "guide" },
"image_3.jpg": { service: "Red Lips", description: "Red Lips Before/After — $350 USD", type: "before_after" },
// ... las 34
```

#### C. Canned responses — Lo que hay que agregar

| Nueva canned | Texto | Trigger |
|---|---|---|
| `guia_rinomodelacion` | Texto de cuidados post-Rinomodelación (de image_2.jpg) | Post `confirm_booking` cuando servicio = Rinomodelación, o cuando cliente pregunta "cuidados" después de agendar |
| `promo_esperma_salmon_cop` | "¡Tenemos una promoción activa! El Esperma de Salmón/PDRN tiene un valor regular de $800,000 COP, pero hoy está a solo $499,000 COP. ¿Aprovechas esta oferta?" | Cuando cliente COP pregunta por Esperma de Salmón |
| `promo_esperma_salmon_mxn` | Versión MXN: regular $5,700 → promo $3,800 | Cuando cliente MXN pregunta por Esperma de Salmón |

#### D. Flows — Lo que hay que cambiar

| Flow | Cambio |
|---|---|
| `PRECIO_FLOW → show_price` | Debe aceptar un parámetro de moneda (derivado de la ciudad del cliente). Actualmente `show_price` muestra {service_price} con moneda fija. Hay que pasar `currency` basado en `city`. |
| `PRECIO_FLOW → show_price` | Después del precio, si el servicio tiene imágenes before/after, el agente debe preguntar "¿Quieres ver fotos de antes y después?" y enviar la imagen adecuada según moneda. |
| `AGENDAMIENTO_FLOW → confirm_booking` | Si el servicio agendado es Rinomodelación, **enviar automáticamente** la guía post-tratamiento (image_2.jpg) como parte de la confirmación. |
| `AGENDAMIENTO_FLOW` (nuevo estado) | Agregar estado `send_post_guide` entre `confirm_booking` y terminal para servicios con guías post-tratamiento. |
| `PRECIO_FLOW` (nuevo) | Detectar si el servicio tiene `promoPrice` activo y mostrar precio regular + promocional. |

#### E. Deterministic Domain Router — Lo que hay que cambiar

| Patrón | Cambio |
|---|---|
| `Hand Rejuvenation`, `manos`, `rejuvenecimiento manos` | Agregar patrones en `deterministic-domain-route.ts` para detectar Hand Rejuvenation como `precio` o `agendamiento` |
| `promo`, `promoción`, `descuento`, `oferta` | El routing de promos hoy escala a humano (keyword "descuento"). Las promos de Esperma de Salmón deberían responder con precio promocional antes de escalar. Considerar sub-categoría `promo_precio`. |
| Detección de moneda por ciudad | El router ya tiene la ciudad del cliente. Refinar para que ciudades MXN y USD tengan routing de precios correcto. |

#### F. Safety Pre-Router — Lo que hay que considerar

Las imágenes de antes/después son contenido médico/estético. El safety pre-router no debería bloquearlas. Verificar que imágenes con texto "Red Lips Before/After" no disparen falsos positivos en los patrones de contenido sensible.

#### G. Orchestrator / V2 Adapter — Lo que hay que cambiar

| Cambio | Descripción |
|---|---|
| Enviar imágenes | El V2 adapter actualmente retorna solo `{ text, messageId, route, escalated, escalationReason }`. Para enviar imágenes, necesita un campo `imageUrl` o `mediaUrl` que el orchestrator (o el frontend) pueda procesar. Propuesta: agregar `media?: { url: string; type: string }[]` al response. |
| Flow con imágenes | `FlowAdapter.handleStart()` y `handleResume()` deben poder retornar `media` además de `text`. Actualmente `evaluateFlow()` solo retorna `text`. |
| Promo awareness | El agente necesita saber si hay promos activas al responder precios. Un servicio con `promoPrice` activo debe mencionarlo sin que el usuario pregunte explícitamente "hay descuento". |

### Nuevos servicios completos para catalog.ts

Basado en los catálogos USD y EUR, hay servicios en USD/EUR que NO existen en el catálogo COP actual:

| Servicio | USD | EUR | COP | Estado |
|---|---|---|---|---|
| Hand Rejuvenation (Radiesse) | $699 | 699€ | ❌ Preguntar a Carlos | Nuevo |
| Hand Rejuvenation (Sculptra) | $699 | 699€ | ❌ Preguntar a Carlos | Nuevo |
| Consulta / Reservation fee | $80 | 80€ | $50,000 COP (ya existe como Valoración) | Ya existe |
| Korean Face | $999 | 999€ | $1,899,000 COP | Ya existe |
| Hyaluronidase | $300 | 300€ | $530,000 COP | Ya existe |

### Discrepancias entre catálogos por moneda

| Servicio | COP | USD | EUR | MXN | Nota |
|---|---|---|---|---|---|
| Full Face Botox | $1,580,000 | $900 | 899€ | ❌ | EUR tiene 899 vs USD 900 — pequeña diferencia |
| Russian Lips | $820,000 | $499 | 400€ | $8,500 | EUR tiene 400€ (vs USD $499) — significativamente menor |
| Doll Lips | $1,640,000 | $899 | 800€ | $16,000 | EUR 800€ vs USD $899 |
| Red Lips | $670,000 | $350 | 300€ | $6,500 | Consistente entre mercados |
| Full Face Radiesse | $3,999,000 | $1,800 | 1,800€ | $27,000 | USD y EUR iguales |
| Full Face AH | $2,999,000 | $1,500 | 1,390€ | $20,000 | EUR 1,390 vs USD 1,500 — diferencia real |
| Esperma de Salmón | $800K→$499K | $300 | 300€ | $5,700→$3,800 | USD y EUR sin promo, COP y MXN sí |

### Nuevas tablas/estructuras de datos necesarias

```typescript
// Propuesta: nuevo schema para precios multi-moneda
interface ServicePrices {
  COP?: { price: string; promoPrice?: string; promoLabel?: string };
  USD?: { price: string; promoPrice?: string; promoLabel?: string };
  EUR?: { price: string; promoPrice?: string; promoLabel?: string };
  MXN?: { price: string; promoPrice?: string; promoLabel?: string };
}

// Propuesta: nuevo campo en CatalogItem
interface CatalogItem {
  // ... existing fields
  prices: ServicePrices;             // Reemplaza price + currency
  imageKeysByCurrency?: {            // Imágenes específicas por moneda
    COP?: string[];
    USD?: string[];
    EUR?: string[];
    MXN?: string[];
  };
  guideKey?: string;                 // Canned response key para guía post-tratamiento
  hasBeforeAfter?: boolean;          // Si tiene imágenes before/after
}

// Propuesta: modelo de promociones
interface ActivePromotion {
  serviceName: string;
  market: "COP" | "USD" | "EUR" | "MXN";
  regularPrice: string;
  promoPrice: string;
  promoLabel: string;               // "Lanzamiento", "Mes del Padre", etc.
  startDate?: string;
  endDate?: string;
  imageKey?: string;                 // Imagen promocional específica
}
```

### Data flow completo: de cliente a imagen

```
1. Cliente escribe: "¿Cuánto cuesta Red Lips?"
2. V2 pipeline → deterministicDomainRoute detecta intent `precio`
3. PRECIO_FLOW.ask_city → "¿Desde qué ciudad?"
4. Cliente: "Miami"
5. V2 determina currency = USD, city = Miami
6. PRECIO_FLOW.ask_service → "¿Cuál servicio?"
7. Cliente: "Red Lips"
8. catalog.ts → busca Red Lips con prices.USD = $350
9. show_price → "El tratamiento de Red Lips tiene un valor de $350 USD"
10. ¿Quieres ver fotos de antes y después? (hasBeforeAfter = true)
11. Si sí → envía image_3.jpg (Red Lips before/after USD)
12. ¿Te gustaría agendar?
13. Si sí → AGENDAMIENTO_FLOW
14. Tras confirmación → si service.guideKey existe, enviar guía
```

### Estado de cada imagen - resumen ejecutivo

| Imagen | Servicio | Acción principal | Prio |
|---|---|---|---|
| image_1.jpg | Red Lips MXN | Asociar imageKey | Alta |
| image_2.jpg | Guía Rinomodelación | Crear canned + flow trigger | **Inmediata** |
| image_3.jpg | Red Lips USD | Asociar imageKey | Alta |
| image_4.jpg | Full Face Masculinización Radiesse EUR | Asociar imageKey + multi-moneda | Alta |
| image_5.jpg | Red Lips EUR | Asociar imageKey | Media |
| image_6.jpg | Full Face Masculinización Radiesse USD | Asociar imageKey + multi-moneda | Alta |
| image_7.jpg | Red Lips COP | Asociar imageKey (before/after) | Alta |
| image_8.jpg | Full Face Radiesse EN | Asociar imageKey | Media |
| image_9.jpg | Catálogo USD (26 servicios) | Modelar multi-moneda + crear catálogo USD | **Alta** |
| image_10.jpg | Catálogo COP (24 servicios) | Ya existe (verificar diferencias) | Baja |
| image_11.jpg | Catálogo USD alterno | Asociar como imageKey secundaria | Alta |
| image_12.jpg | Full Face Masculinización AH EUR | Asociar imageKey | Media |
| image_13.jpg | Catálogo EUR (26 servicios) | Modelar multi-moneda + crear catálogo EUR | Media |
| image_14.jpg | Doll Lips EUR | Asociar imageKey | Media |
| image_15.jpg | Full Face Masculinización AH USD | Asociar imageKey | Alta |
| image_16.jpg | Russian Lips EUR | Asociar imageKey | Media |
| image_17.jpg | Masculinización Facial Radiesse COP | Asociar imageKey + entry catalog | Alta |
| image_18.jpg | Masculinización Facial AH COP | Crear entry catalog + imageKey | Alta |
| image_19.jpg | Full Face AH COP | Asociar imageKey | Alta |
| image_20.jpg | Full Face Sculptra EN | Asociar imageKey | Media |
| image_21.jpg | Full Face Sculptra MXN | Asociar imageKey + multi-moneda | Alta |
| image_22.jpg | Doll Lips COP | Asociar imageKey | Alta |
| image_23.jpg | Russian Lips COP | Asociar imageKey | Alta |
| image_24.jpg | Full Face Radiesse COP | Asociar imageKey | Alta |
| image_25.jpg | Facial Masculinization Radiesse EN | Asociar imageKey | Media |
| image_26.jpg | Doll Lips MXN | Asociar imageKey | Alta |
| image_27.jpg | Facial Masculinization EN | Asociar imageKey | Media |
| image_28.jpg | Full Face HA EN | Asociar imageKey | Media |
| image_29.jpg | Esperma de Salmón MXN promo | Modelar descuento + imageKey | **Alta** |
| image_30.jpg | Full Face Sculptra COP | Asociar imageKey | Alta |
| image_31.jpg | Esperma de Salmón COP promo | Modelar descuento + imageKey | **Alta** |
| image_32.jpg | Russian Lips MXN | Asociar imageKey | Alta |
| image_33.jpg | Full Face Radiesse MXN | Asociar imageKey + multi-moneda | Alta |
| image_34.jpg | Full Face AH MXN | Asociar imageKey + multi-moneda | Alta |

### Nuevos servicios a crear en catalog.ts

| Servicio nuevo | Precios conocidos | Precio COP pendiente |
|---|---|---|
| Hand Rejuvenation (Radiesse) | USD $699, EUR 699€ | ❌ Preguntar a Carlos |
| Hand Rejuvenation (Sculptra) | USD $699, EUR 699€ | ❌ Preguntar a Carlos |
| Masculinización facial con AH | COP $2,999,000, MXN $20,000, USD $1,500, EUR 1,500€ | ✅ |

---

---

## §15 — AI Studio: extracción textual completa de las 34 imágenes

```json

{
  "clinic": "Santa María Estética",
  "extraction_date": "2026-06-29",
  "total_images": 34,
  "images": {
    "image_1.jpg": {
      "content_type": "before_after",
      "full_text": "Red Lips BY SANTA MARIA MEDICINA ESTÉTICA\n$6.500 MXN\nPRECIO DE LANZAMIENTO",
      "participants": [],
      "services": ["Red Lips"],
      "prices": ["$6.500 MXN"],
      "currency": "MXN",
      "commercial_info": "Launch price promotion",
      "language": "es",
      "has_before_after": true,
      "notes": "Before and after comparison of lip procedure"
    },
    "image_2.jpg": {
      "content_type": "promo",
      "full_text": "RINOMODELACIÓN\nGuía de post-tratamiento: Cuidados & Recomendaciones\n- Evitar el sol directo en la zona\n- Evitar hacer presión en la zona\n- No hacer actividad física por 24 horas\n- No ponere hielo en la zona\n- Inflamación y sensación de pesadez por una semana\nNos encanta que hayas confiado en nosotros. Para garantizar los mejores resultados, te invitamos a seguir nuestras recomendaciones. ¡Son sencillas y están pensadas para ti! Si tienes alguna pregunta, no dudes en contactarnos.",
      "participants": [],
      "services": ["Rinomodelación"],
      "prices": [],
      "currency": null,
      "commercial_info": "Post-treatment guide and care instructions",
      "language": "es",
      "has_before_after": false,
      "notes": "Post-treatment recommendation infographic"
    },
    "image_3.jpg": {
      "content_type": "before_after",
      "full_text": "Red Lips BY SANTA MARIA MEDICINA ESTÉTICA\n$350 USD\nPRECIO DE LANZAMIENTO",
      "participants": [],
      "services": ["Red Lips"],
      "prices": ["$350 USD"],
      "currency": "USD",
      "commercial_info": "Launch price in USD",
      "language": "es",
      "has_before_after": true,
      "notes": "Before and after lips photo with USD pricing"
    },
    "image_4.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nFULL FACE MASCULINIZACIÓN FACIAL CON RADIESSE\n- Radiesse Facial completo\n- Rinomodelación AH\n- Mentón AH\n- Marcación mandibular AH\n1.800 €",
      "participants": [],
      "services": ["Radiesse Facial completo", "Rinomodelación AH", "Mentón AH", "Marcación mandibular AH"],
      "prices": ["1.800 €"],
      "currency": "EUR",
      "commercial_info": "Radiesse facial masculinization package",
      "language": "es",
      "has_before_after": false,
      "notes": "Male model aesthetic promo in EUR"
    },
    "image_5.jpg": {
      "content_type": "before_after",
      "full_text": "Red Lips BY SANTA MARIA MEDICINA ESTÉTICA\n300 €\nPRECIO DE LANZAMIENTO",
      "participants": [],
      "services": ["Red Lips"],
      "prices": ["300 €"],
      "currency": "EUR",
      "commercial_info": "Launch price in EUR",
      "language": "es",
      "has_before_after": true,
      "notes": "Before and after lips photo in EUR"
    },
    "image_6.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nFULL FACE MASCULINIZACIÓN WITH RADIESSE\n- Complete Facial Rejuvenation with Radiesse\n- AH Rinomodelling\n- AH Mentum\n- AH Jawline Definition\n$1800 USD",
      "participants": [],
      "services": ["Complete Facial Rejuvenation with Radiesse", "AH Rinomodelling", "AH Mentum", "AH Jawline Definition"],
      "prices": ["$1800 USD"],
      "currency": "USD",
      "commercial_info": "Full face masculinization package with Radiesse",
      "language": "en",
      "has_before_after": false,
      "notes": "Male model aesthetic promo in USD"
    },
    "image_7.jpg": {
      "content_type": "before_after",
      "full_text": "Red Lips BY SANTA MARIA MEDICINA ESTÉTICA\n$670.000 COP\nPRECIO DE LANZAMIENTO",
      "participants": [],
      "services": ["Red Lips"],
      "prices": ["$670.000 COP"],
      "currency": "COP",
      "commercial_info": "Launch price in COP",
      "language": "es",
      "has_before_after": true,
      "notes": "Before and after lips photo in COP"
    },
    "image_8.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARÍA ESTÉTICA PRESENTS\nFULL FACE RADIESSE\n- Full face with Radiesse\n- Upper-face Botox\n- Non-surgical rhinoplasty (HA)\n- Russian Lips\n- Chin (HA)",
      "participants": [],
      "services": ["Full face with Radiesse", "Upper-face Botox", "Non-surgical rhinoplasty (HA)", "Russian Lips", "Chin (HA)"],
      "prices": [],
      "currency": null,
      "commercial_info": "Treatment breakdown card",
      "language": "en",
      "has_before_after": false,
      "notes": "Radiesse package description poster"
    },
    "image_9.jpg": {
      "content_type": "pricing_catalog",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nSERVICES & PRICES USD\nConsultation / Reservation $80 USD\nBotox (per area) (forehead, frown lines, crow's feet, masseters) $290 USD\nFull Face Botox $900 USD\nRussian Lips $499 USD\nDoll Lips $899 USD\nRed Lips $350 USD\nKorean Face $999 USD\nFull Face Hyaluronic Acid (HA) $1500 USD\nFull Face Radiesse $1800 USD\nFull Face Sculptra $1800 USD\nNCTF Skin Booster $300 USD\nRadiesse (per vial) $699 USD\nSculptra (per vial) $699 USD\nNon-surgical rhinoplasty $499 USD\nJawline Contouring (HA) $900 USD\nChin Augmentation (HA) $499 USD\nUnder Eye Filler (HA) $499 USD\nSalmon DNA (Skin Booster) $300 USD\nFacial Masculinization (Radiesse) $1800 USD\nFacial Masculinization (HA) $1500 USD\nHyaluronidase (filler dissolving) $300 USD\nNasolabial Folds (HA) $499 USD\nCheek Contouring (HA) $899 USD\nMesobotox $900 USD\nHand Rejuvenation (Radiesse) $699 USD\nHand Rejuvenation (Sculptra) $699 USD",
      "participants": [],
      "services": ["Consultation / Reservation", "Botox (per area)", "Full Face Botox", "Russian Lips", "Doll Lips", "Red Lips", "Korean Face", "Full Face Hyaluronic Acid (HA)", "Full Face Radiesse", "Full Face Sculptra", "NCTF Skin Booster", "Radiesse (per vial)", "Sculptra (per vial)", "Non-surgical rhinoplasty", "Jawline Contouring (HA)", "Chin Augmentation (HA)", "Under Eye Filler (HA)", "Salmon DNA (Skin Booster)", "Facial Masculinization (Radiesse)", "Facial Masculinization (HA)", "Hyaluronidase (filler dissolving)", "Nasolabial Folds (HA)", "Cheek Contouring (HA)", "Mesobotox", "Hand Rejuvenation (Radiesse)", "Hand Rejuvenation (Sculptra)"],
      "prices": ["$80 USD", "$290 USD", "$900 USD", "$499 USD", "$899 USD", "$350 USD", "$999 USD", "$1500 USD", "$1800 USD", "$1800 USD", "$300 USD", "$699 USD", "$699 USD", "$499 USD", "$900 USD", "$499 USD", "$499 USD", "$300 USD", "$1800 USD", "$1500 USD", "$300 USD", "$499 USD", "$899 USD", "$900 USD", "$699 USD", "$699 USD"],
      "currency": "USD",
      "commercial_info": "Complete service catalog menu",
      "language": "en",
      "has_before_after": false,
      "notes": "Full service price list poster"
    },
    "image_10.jpg": {
      "content_type": "pricing_catalog",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nSERVICIOS Y PRECIOS COP\nCosto de valoración o reserva $50.000 COP\nBótox por zona (frente, entrecejo, orbicular párpados, maseteros) $630.000 COP\nFull Face Bótox $1.580.000 COP\nRussian Lips $820.000 COP\nFull Face AH $2.999.000 COP\nFull Face Radiesse $3.999.000 COP\nFull Face Sculptra $3.999.000 COP\nNCTF $630.000 COP\nRadiesse $2.600.000 COP\nSculptra $2.500.000 COP\nRinomodelación $820.000 COP\nMarcación mandibular $1.640.000 COP\nMentón $820.000 COP\nDoll Lips $1.640.000 COP\nOjeras con AH $820.000 COP\nEsperma de salmón $800.000 COP\nMasculinización facial con Radiesse $3.999.000 COP\nMasculinización facial con AH $2.999.000 COP\nHialuronidasa $530.000 COP\nNasolabiales con AH $820.000 COP\nPómulos con AH $1.640.000 COP\nMesobotox $1.580.000 COP\nRed Lips $670.000 COP\nKorean face $1.899.000 COP",
      "participants": [],
      "services": ["Costo de valoración o reserva", "Bótox por zona", "Full Face Bótox", "Russian Lips", "Full Face AH", "Full Face Radiesse", "Full Face Sculptra", "NCTF", "Radiesse", "Sculptra", "Rinomodelación", "Marcación mandibular", "Mentón", "Doll Lips", "Ojeras con AH", "Esperma de salmón", "Masculinización facial con Radiesse", "Masculinización facial con AH", "Hialuronidasa", "Nasolabiales con AH", "Pómulos con AH", "Mesobotox", "Red Lips", "Korean face"],
      "prices": ["$50.000 COP", "$630.000 COP", "$1.580.000 COP", "$820.000 COP", "$2.999.000 COP", "$3.999.000 COP", "$3.999.000 COP", "$630.000 COP", "$2.600.000 COP", "$2.500.000 COP", "$820.000 COP", "$1.640.000 COP", "$820.000 COP", "$1.640.000 COP", "$820.000 COP", "$800.000 COP", "$3.999.000 COP", "$2.999.000 COP", "$530.000 COP", "$820.000 COP", "$1.640.000 COP", "$1.580.000 COP", "$670.000 COP", "$1.899.000 COP"],
      "currency": "COP",
      "commercial_info": "Complete service catalog menu in COP",
      "language": "es",
      "has_before_after": false,
      "notes": "Full service price list poster in COP"
    },
    "image_11.jpg": {
      "content_type": "pricing_catalog",
      "full_text": "SERVICIOS & PRECIOS USD\nFACIAL & TOXINA\nBótox por zona (frente, entrecejo, orbicular párpados, maseteros): 290usd\nFull Face Bótox: 900 usd\nRussian Lips: 499 usd\nDOLL LIPS: 899 usd\nRed lips: 350 usd\nkorean face: 999 usd\nFull Face AH: 1500 usd\nFull Face Radiesse: 1800 usd\nFull Face Sculptra: 1800 usd\nNCTF: 300 usd\nRadiesse: 699 usd\nSculptra: 699 usd\nRinomodelación: 499 usd\nMarcación mandibular: 900 usd\nMentón: 499 usd\nARMONIZACIÓN & BIOESTIMULADORES\nOjeras con AH: 499 usd\nEsperma de salmón: 300 usd\nMasculinización facial con Radiesse: 1800 usd\nMasculinización facial con AH: 1500 usd\nHialuronidasa: 300 usd\nNasolabiales con AH: 499 usd\nPómulos con AH: 899 usd\nMesobotox: 900 usd\nCosto de valoración o reserva: 80 usd\nAGENDA TU CITA [flecha] Cupos limitados",
      "participants": [],
      "services": ["Bótox por zona", "Full Face Bótox", "Russian Lips", "DOLL LIPS", "Red lips", "korean face", "Full Face AH", "Full Face Radiesse", "Full Face Sculptra", "NCTF", "Radiesse", "Sculptra", "Rinomodelación", "Marcación mandibular", "Mentón", "Ojeras con AH", "Esperma de salmón", "Masculinización facial con Radiesse", "Masculinización facial con AH", "Hialuronidasa", "Nasolabiales con AH", "Pómulos con AH", "Mesobotox", "Costo de valoración o reserva"],
      "prices": ["290usd", "900 usd", "499 usd", "899 usd", "350 usd", "999 usd", "1500 usd", "1800 usd", "1800 usd", "300 usd", "699 usd", "699 usd", "499 usd", "900 usd", "499 usd", "499 usd", "300 usd", "1800 usd", "1500 usd", "300 usd", "499 usd", "899 usd", "900 usd", "80 usd"],
      "currency": "USD",
      "commercial_info": "Social media style pricing catalog sheet",
      "language": "es",
      "has_before_after": false,
      "notes": "Alternative dark styling menu"
    },
    "image_12.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nFULL FACE MASCULINIZACIÓN FACIAL CON AH\n[visto] Botox tercio superior\n[visto] Rinomodelación AH\n[visto] Mentón AH\n[visto] Marcación mandibular AH\n1.500 €",
      "participants": [],
      "services": ["Botox tercio superior", "Rinomodelación AH", "Mentón AH", "Marcación mandibular AH"],
      "prices": ["1.500 €"],
      "currency": "EUR",
      "commercial_info": "AH facial masculinization package",
      "language": "es",
      "has_before_after": false,
      "notes": "Male model aesthetic promo in EUR with checklist"
    },
    "image_13.jpg": {
      "content_type": "pricing_catalog",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nSERVICES & PRICES EUR\nConsultation / Reservation 80 €\nBotox (per area) (forehead, frown lines, crow's feet, masseters) 290 €\nFull Face Botox 899 €\nRussian Lips Premium 400 €\nDoll Lips 800 €\nRed Lips 300 €\nKorean Face 999 €\nFull Face Hyaluronic Acid (HA) 1.390 €\nFull Face Radiesse 1.800 €\nFull Face Sculptra 1.800 €\nNCTF Skin Booster 300 €\nRadiesse (per vial) 699 €\nSculptra (per vial) 699 €\nNon-surgical rhinoplasty 499 €\nJawline Contouring (HA) 900 €\nChin Augmentation (HA) 499 €\nUnder Eye Filler (HA) 499 €\nSalmon DNA (Skin Booster) 300 €\nFacial Masculinization (Radiesse) 1.800 €\nFacial Masculinization (HA) 1.500 €\nHyaluronidase (filler dissolving) 300 €\nNasolabial Folds (HA) 499 €\nCheek Contouring (HA) 899 €\nMesobotox 900 €\nHand Rejuvenation (Radiesse) 699 €\nHand Rejuvenation (Sculptra) 699 €",
      "participants": [],
      "services": ["Consultation / Reservation", "Botox (per area)", "Full Face Botox", "Russian Lips Premium", "Doll Lips", "Red Lips", "Korean Face", "Full Face Hyaluronic Acid (HA)", "Full Face Radiesse", "Full Face Sculptra", "NCTF Skin Booster", "Radiesse (per vial)", "Sculptra (per vial)", "Non-surgical rhinoplasty", "Jawline Contouring (HA)", "Chin Augmentation (HA)", "Under Eye Filler (HA)", "Salmon DNA (Skin Booster)", "Facial Masculinization (Radiesse)", "Facial Masculinization (HA)", "Hyaluronidase (filler dissolving)", "Nasolabial Folds (HA)", "Cheek Contouring (HA)", "Mesobotox", "Hand Rejuvenation (Radiesse)", "Hand Rejuvenation (Sculptra)"],
      "prices": ["80 €", "290 €", "899 €", "400 €", "800 €", "300 €", "999 €", "1.390 €", "1.800 €", "1.800 €", "300 €", "699 €", "699 €", "499 €", "900 €", "499 €", "499 €", "300 €", "1.800 €", "1.500 €", "300 €", "499 €", "899 €", "900 €", "699 €", "699 €"],
      "currency": "EUR",
      "commercial_info": "Complete service catalog menu in EUR",
      "language": "en",
      "has_before_after": false,
      "notes": "Full service price list poster in EUR"
    },
    "image_14.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nDOLL LIPS\n[corazón] VOLUMEN NATURAL Aporta volumen sin perder naturalidad.\n[labios] DEFINICIÓN PERFECTA Contorno preciso y perfilado ideal.\n[corazón] FORMA DE CORAZÓN Diseño personalizado que realiza la forma natural de tus labios.\n[destellos] SIMETRÍA ARMÓNICA Resultados equilibrados y proporcionados para un acabado impecable.\n[gota] HIDRATACIÓN PROFUNDA Labios suaves, hidratados y con apariencia saludable.\n800 €",
      "participants": [],
      "services": ["Doll Lips"],
      "prices": ["800 €"],
      "currency": "EUR",
      "commercial_info": "Doll lips highlighting benefits",
      "language": "es",
      "has_before_after": false,
      "notes": "Feature description card for Doll Lips"
    },
    "image_15.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nFULL FACE MASCULINIZACIÓN WITH AH\n[visto] Upper third botox\n[visto] AH rhinomodelling\n[visto] AH mentum\n[visto] AH jawline definition\n[visto] AH mandibular marking\n$1500 USD",
      "participants": [],
      "services": ["Upper third botox", "AH rhinomodelling", "AH mentum", "AH jawline definition", "AH mandibular marking"],
      "prices": ["$1500 USD"],
      "currency": "USD",
      "commercial_info": "AH facial masculinization package in USD",
      "language": "en",
      "has_before_after": false,
      "notes": "Male model aesthetic promo in USD with checklist"
    },
    "image_16.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARIA MEDICINA ESTÉTICA\nRUSSIAN LIPS\n[destellos] Labios casi perfectos, carnosos y acordes a la fisonomía de cada persona.\n[gota] Ácido hialurónico. Aporta elasticidad y viscosidad muy parecidas al tejido natural.\n[pluma] Resultados armónicos y naturales.\n400 €",
      "participants": [],
      "services": ["Russian Lips"],
      "prices": ["400 €"],
      "currency": "EUR",
      "commercial_info": "Russian lips highlighting benefits",
      "language": "es",
      "has_before_after": false,
      "notes": "Feature description card for Russian Lips"
    },
    "image_17.jpg": {
      "content_type": "promo",
      "full_text": "Masculinización Facial Rejuvenecimiento\n- Radiesse Facial completo\n- Rinomodelación AH\n- Mentón AH\n- Marcación mandibular AH\n$3'999.000 COP",
      "participants": [],
      "services": ["Radiesse Facial completo", "Rinomodelación AH", "Mentón AH", "Marcación mandibular AH"],
      "prices": ["$3'999.000 COP"],
      "currency": "COP",
      "commercial_info": "Package price in COP",
      "language": "es",
      "has_before_after": false,
      "notes": "Facial masculinization promotion with male model"
    },
    "image_18.jpg": {
      "content_type": "promo",
      "full_text": "Masculinización facial\n- Botox tercio superior\n- Rinomodelación AH\n- Mentón AH\n- Marcación mandibular AH\n$2'999.000 COP",
      "participants": [],
      "services": ["Botox tercio superior", "Rinomodelación AH", "Mentón AH", "Marcación mandibular AH"],
      "prices": ["$2'999.000 COP"],
      "currency": "COP",
      "commercial_info": "Alternative package price in COP",
      "language": "es",
      "has_before_after": false,
      "notes": "Facial masculinization promotion with male model"
    },
    "image_19.jpg": {
      "content_type": "promo",
      "full_text": "FULL FACE ÁCIDO HIALURÓNICO\n- Botox tercio superior\n- Pómulos AH\n- Rinomodelación AH\n- Russian Lips\n- Menton AH\n- Marcación mandibular AH\n$2'999.000 COP",
      "participants": [],
      "services": ["Botox tercio superior", "Pómulos AH", "Rinomodelación AH", "Russian Lips", "Menton AH", "Marcación mandibular AH"],
      "prices": ["$2'999.000 COP"],
      "currency": "COP",
      "commercial_info": "Hyaluronic Acid package pricing",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model full face promo"
    },
    "image_20.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARÍA ESTÉTICA PRESENTS\nFULL FACE SCULPTRA\nTreatment includes\n- Full face with Sculptra\n- Upper-face Botox\n- Non-surgical rhinoplasty (HA)\n- Russian Lips\n- Chin (HA)",
      "participants": [],
      "services": ["Full face with Sculptra", "Upper-face Botox", "Non-surgical rhinoplasty (HA)", "Russian Lips", "Chin (HA)"],
      "prices": [],
      "currency": null,
      "commercial_info": "Treatment breakdown card",
      "language": "en",
      "has_before_after": false,
      "notes": "Sculptra package description poster"
    },
    "image_21.jpg": {
      "content_type": "promo",
      "full_text": "FULL FACE SCULPTRA\n- Facial completo con Sculptra\n- Botox tercio superior\n- Rinomodelación AH\n- Russian Lips\n- Menton AH\n$27.000 MXN\nSANTA MARIA ESTETICA",
      "participants": [],
      "services": ["Facial completo con Sculptra", "Botox tercio superior", "Rinomodelación AH", "Russian Lips", "Menton AH"],
      "prices": ["$27.000 MXN"],
      "currency": "MXN",
      "commercial_info": "Sculptra full face package",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model aesthetic promo in MXN"
    },
    "image_22.jpg": {
      "content_type": "promo",
      "full_text": "DOLL LIPS\nPerfilamiento y aumento labial buscando máxima simetría, volnen alto y marcación del arco de cupido en HD.\nIncluye: 2 ml de ácido hialurónico\nPRECIO $1.640.000",
      "participants": [],
      "services": ["Doll Lips"],
      "prices": ["$1.640.000"],
      "currency": "COP",
      "commercial_info": "Special mapping analysis feature",
      "language": "es",
      "has_before_after": false,
      "notes": "Lips graphic with overlay vectors"
    },
    "image_23.jpg": {
      "content_type": "promo",
      "full_text": "RUSSIAN LIPS\nDiseño labial de alta precisión que mejora la proyección del arco de cupido, respetando la armonía natural del rostro.\nIncluye: 1 ml de ácido hialurónico\nPRECIO $820.000",
      "participants": [],
      "services": ["Russian Lips"],
      "prices": ["$820.000"],
      "currency": "COP",
      "commercial_info": "Special mapping analysis feature",
      "language": "es",
      "has_before_after": false,
      "notes": "Lips graphic with overlay vectors"
    },
    "image_24.jpg": {
      "content_type": "promo",
      "full_text": "FULL FACE RADIESSE\n- Facial completo con Radiesse\n- Botox tercio superior\n- Rinomodelación AH\n- Russian Lips\n- Menton AH\n$3'999.000 COP",
      "participants": [],
      "services": ["Facial completo con Radiesse", "Botox tercio superior", "Rinomodelación AH", "Russian Lips", "Menton AH"],
      "prices": ["$3'999.000 COP"],
      "currency": "COP",
      "commercial_info": "Radiesse package in COP",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model promo card"
    },
    "image_25.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARÍA ESTÉTICA PRESENTS\nFACIAL MASCULINIZATION REJUVENATION\n- Full face with Radiesse\n- Non-surgical rhinoplasty (HA)\n- Chin (HA)\n- Jawline definition (HA)",
      "participants": [],
      "services": ["Full face with Radiesse", "Non-surgical rhinoplasty (HA)", "Chin (HA)", "Jawline definition (HA)"],
      "prices": [],
      "currency": null,
      "commercial_info": "Service breakdown checklist card",
      "language": "en",
      "has_before_after": false,
      "notes": "Masculinization details card with male model"
    },
    "image_26.jpg": {
      "content_type": "promo",
      "full_text": "DOLL LIPS\nPerfilamiento y aumento labial buscando máxima simetría, volnen alto y marcación del arco de cupido en HD.\nIncluye: 2 ml de ácido hialurónico\nPRECIO $16.000 MXN",
      "participants": [],
      "services": ["Doll Lips"],
      "prices": ["$16.000 MXN"],
      "currency": "MXN",
      "commercial_info": "Special mapping analysis feature in MXN",
      "language": "es",
      "has_before_after": false,
      "notes": "Lips mapping analysis graphic"
    },
    "image_27.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARÍA ESTÉTICA PRESENTS\nFACIAL MASCULINIZATION\n- Upper-face Botox\n- Non-surgical rhinoplasty (HA)\n- Chin (HA)\n- Jawline definition (HA)",
      "participants": [],
      "services": ["Upper-face Botox", "Non-surgical rhinoplasty (HA)", "Chin (HA)", "Jawline definition (HA)"],
      "prices": [],
      "currency": null,
      "commercial_info": "Service breakdown checklist card",
      "language": "en",
      "has_before_after": false,
      "notes": "Alternative masculinization layout card"
    },
    "image_28.jpg": {
      "content_type": "promo",
      "full_text": "SANTA MARÍA ESTÉTICA PRESENTS\nFULL FACE HYALURONIC ACID\n- Upper-face Botox\n- Cheekbones (HA)\n- Non-surgical rhinoplasty (HA)\n- Russian Lips\n- Chin (HA)\n- Jawline definition (HA)",
      "participants": [],
      "services": ["Upper-face Botox", "Cheekbones (HA)", "Non-surgical rhinoplasty (HA)", "Russian Lips", "Chin (HA)", "Jawline definition (HA)"],
      "prices": [],
      "currency": null,
      "commercial_info": "Full face breakdown poster",
      "language": "en",
      "has_before_after": false,
      "notes": "Female model full face HA card"
    },
    "image_29.jpg": {
      "content_type": "promo",
      "full_text": "ESPERMA DE SALMÓN\nEL SECRETO DETRÁS DE UNA PIEL PERFECTA\nPDRN\nRegeneración avanzada para una piel visiblemente más luminosa\nAntes: 5,700 MXN\nHoy: $3,800 MXN",
      "participants": [],
      "services": ["Esperma de salmón / PDRN"],
      "prices": ["5,700 MXN", "$3,800 MXN"],
      "currency": "MXN",
      "commercial_info": "Discounted PDRN treatment",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model facial promotion"
    },
    "image_30.jpg": {
      "content_type": "promo",
      "full_text": "FULL FACE SCULPTRA\n- Facial completo con Sculptra\n- Botox tercio superior\n- Rinomodelación AH\n- Russian Lips\n- Menton AH\n$3'999.000 COP",
      "participants": [],
      "services": ["Facial completo con Sculptra", "Botox tercio superior", "Rinomodelación AH", "Russian Lips", "Menton AH"],
      "prices": ["$3'999.000 COP"],
      "currency": "COP",
      "commercial_info": "Sculptra package in COP",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model promo card in COP"
    },
    "image_31.jpg": {
      "content_type": "promo",
      "full_text": "ESPERMA DE SALMÓN\nEL SECRETO DETRÁS DE UNA PIEL PERFECTA\nPDRN\nRegeneración avanzada para una piel visiblemente más luminosa\nAntes: $800.000 COP\nHoy: $499.000 COP",
      "participants": [],
      "services": ["Esperma de salmón / PDRN"],
      "prices": ["$800.000 COP", "$499.000 COP"],
      "currency": "COP",
      "commercial_info": "Discounted PDRN treatment in COP",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model facial promotion in COP"
    },
    "image_32.jpg": {
      "content_type": "promo",
      "full_text": "RUSSIAN LIPS\nDiseño labial de alta precisión que mejora la proyección del arco de cupido, respetando la armonía natural del rostro.\nIncluye: 1 ml de ácido hialurónico\nPRECIO $8.500 MXN",
      "participants": [],
      "services": ["Russian Lips"],
      "prices": ["$8.500 MXN"],
      "currency": "MXN",
      "commercial_info": "Special mapping analysis feature in MXN",
      "language": "es",
      "has_before_after": false,
      "notes": "Lips mapping analysis graphic in MXN"
    },
    "image_33.jpg": {
      "content_type": "promo",
      "full_text": "FULL FACE RADIESSE\n- Facial completo con Radiesse\n- Botox tercio superior\n- Rinomodelación AH\n- Russian Lips\n- Menton AH\n$27.000 MXN\nSANTA MARIA ESTETICA",
      "participants": [],
      "services": ["Facial completo con Radiesse", "Botox tercio superior", "Rinomodelación AH", "Russian Lips", "Menton AH"],
      "prices": ["$27.000 MXN"],
      "currency": "MXN",
      "commercial_info": "Radiesse package in MXN",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model promo card in MXN"
    },
    "image_34.jpg": {
      "content_type": "promo",
      "full_text": "FULL FACE ÁCIDO HIALURÓNICO\n- Botox tercio superior\n- Pómulos AH\n- Rinomodelación AH\n- Russian Lips\n- Menton AH\n- Marcación mandibular AH\n$20.000 MXN\nSANTA MARIA ESTETICA",
      "participants": [],
      "services": ["Botox tercio superior", "Pómulos AH", "Rinomodelación AH", "Russian Lips", "Menton AH", "Marcación mandibular AH"],
      "prices": ["$20.000 MXN"],
      "currency": "MXN",
      "commercial_info": "HA package in MXN",
      "language": "es",
      "has_before_after": false,
      "notes": "Female model promo card in MXN"
    }
  },
  "summary": {
    "total_services_found": [
      "Consultation / Reservation",
      "Botox (per area)",
      "Full Face Botox",
      "Russian Lips",
      "Doll Lips",
      "Red Lips",
      "Korean Face",
      "Full Face Hyaluronic Acid (HA)",
      "Full Face Radiesse",
      "Full Face Sculptra",
      "NCTF Skin Booster",
      "Radiesse (per vial)",
      "Sculptra (per vial)",
      "Non-surgical rhinoplasty",
      "Jawline Contouring (HA)",
      "Chin Augmentation (HA)",
      "Under Eye Filler (HA)",
      "Salmon DNA (Skin Booster) / Esperma de salmón / PDRN",
      "Facial Masculinization",
      "Hyaluronidase",
      "Nasolabial Folds (HA)",
      "Cheek Contouring (HA)",
      "Mesobotox",
      "Hand Rejuvenation"
    ],
    "unique_prices": [
      "$6.500 MXN",
      "$350 USD",
      "1.800 €",
      "300 €",
      "$1800 USD",
      "$670.000 COP",
      "$80 USD",
      "$290 USD",
      "$900 USD",
      "$499 USD",
      "$899 USD",
      "$999 USD",
      "$1500 USD",
      "$300 USD",
      "$699 USD",
      "$50.000 COP",
      "$630.000 COP",
      "$1.580.000 COP",
      "$820.000 COP",
      "$2.999.000 COP",
      "$3.999.000 COP",
      "$2.600.000 COP",
      "$2.500.000 COP",
      "$1.640.000 COP",
      "$800.000 COP",
      "$530.000 COP",
      "1.500 €",
      "80 €",
      "290 €",
      "899 €",
      "400 €",
      "800 €",
      "1.390 €",
      "27.000 MXN",
      "16.000 MXN",
      "5,700 MXN",
      "3,800 MXN",
      "8.500 MXN",
      "20.000 MXN"
    ],
    "currencies_found": ["MXN", "USD", "EUR", "COP"],
    "image_types_distribution": {
      "before_after": 5,
      "promo": 24,
      "pricing_catalog": 5
    }
  }
}

```

