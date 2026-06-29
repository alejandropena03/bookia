# Skill: codebase-overview-bookia

**name:** codebase-overview-bookia
**description:** Arquitectura completa de Bookia: Hono+Drizzle+PostgreSQL V2 kernel, Next.js 16 frontend, multi-tenant RLS, flows V2, bridge protocol, estructura de archivos clave. Cargar on-demand cuando trabajas en código de Bookia.

## Arquitectura

### Stack
- **Backend:** Node 22 + TypeScript 5 (ESM) + Hono + Drizzle ORM + PostgreSQL 16 + Vitest
- **Frontend:** Next.js 16 + React 19 + shadcn/ui + Base UI + Recharts + Zustand
- **LLM del producto (chatbot Bookia):** DeepSeek API `deepseek-v4-flash` — key en `server/.env` / ARIA settings.py. NUNCA commitear.
- **Agente par (dev tool):** OpenCode CLI con GLM-5.2 → fallback DeepSeek V4 Flash Free vía opencode-go. Sin key externa.
- **Docker:** api:8787 + postgres:5432

### V2 Kernel Pipeline
```
safetyPreRoute → deterministicDomainRoute → LLM → postRiskScan
  → applyOverrides → classifyIntent → policy → flowAdapter
  → canned → llm → critic → metrics
```

Feature flag: `AGENT_KERNEL_V2` (actualmente no tipado — pendiente A3).

### Multi-tenant RLS
- `tenant_id` FK en todas las tablas de datos
- `bookia_app` role limitado para runtime
- `withTenant(sql, tenantId)` wrapper en queries
- Tests: `tests/rls.test.ts` (6 tests)

### Flows V2
- FlowAdapter: `server/src/agent/v2/adapter/flow-adapter.ts`
- MemoryService: `server/src/agent/v2/memory/memory-service.ts`
- Auto-advance en handleStart (bucle hasta 5 iter para saltar estados con datos conocidos)
- Flows Santa María: agendamiento (9 estados) + first_contact + precio (3 estados)

### Estructura de archivos clave
```
server/src/agent/
  v2/
    core/agent-kernel.ts          # Pipeline V2 principal
    core/v2-adapter.ts            # Adapter V2 (tiene require() CommonJS — deuda A10)
    understanding/structured-router.ts
    understanding/safety-pre-router.ts
    understanding/deterministic-domain-route.ts
    adapter/flow-adapter.ts       # PR8 — bridge V2 → flows
    memory/memory-service.ts      # PR8 — wrapper sobre MemoryRepository
    policy/clinical-safety.ts
    policy/clinical-safety-audit.ts
    response/response-critic.ts   # PR7 — gate determinístico
  orchestrator.ts                 # Despacha V1 o V2 según flag
server/src/flows/santa-maria/
  catalog.ts                      # 29 servicios COP (USD/EUR/MXN pendiente A6)
  flows.ts                        # agendamiento + first_contact + precio
  canned-responses.ts             # 24 templates + 20 escalation keywords
server/src/db/
  schema.ts                       # Drizzle schema — tablas, RLS
  seed.ts / seed-demo.ts          # Seeds (demo usa strings dummy — pendiente regen)
server/drizzle/                   # 12 SQL migrations (3/12 trackeadas por Drizzle — C2)
```

### Tests (baseline 310/310)
| Suite | Tests |
|-------|-------|
| v2-agent.test.ts | 126 |
| santa-maria.test.ts | 42 |
| v2-memory-persistence.test.ts | 24 |
| agent.test.ts | 26 |
| v2-flow-adapter.test.ts | 17 |
| v2-flow-e2e.test.ts | 10 |
| v2-memory-integration.test.ts | 11 |
| dashboard.test.ts | 9 |
| channels.test.ts | 8 |
| migrations.test.ts | 7 |
| llm.test.ts | 7 |
| intelligence.test.ts | 7 |
| rls.test.ts | 6 |
| health.test.ts | 2 |

### Eval Score (real, no stale)
- V2: **62.8% (258/411)** — no 87.7% (ese número era 164/187 de set viejo)
- V1 vs V2: 26.3% vs 62.8%. 0 regresiones.
- Golden validators: 34/39 (87.2%)

### Deuda técnica activa
- `v2-adapter.ts:29,40,44` — `require()` CommonJS en ESM (A10, urgente)
- `v2-adapter.ts:47` — `loadContext` devuelve `{}` (A4)
- `v2-adapter.ts:77-83` — no persiste outbound ni emite SSE (A2)
- `orchestrator.ts:428` — `AGENT_KERNEL_V2` no tipado (A3)
- Seed-demo usa strings hardcoded (tarea pendiente post-A2-A3)
- Drizzle trackea solo 3/12 migrations (C2)
