# Handoff Log

## 2026-06-28 — OpenCode → Próximo agente

### Resumen
- **PRs completados:** PR3.1 (regression cleanup), PR4 (quality scoring + metrics), PR6 (clinical safety audit)
- **PR pendiente:** PR6.1 — Clinical Policy Enforcement (forzar policyAction según evaluateClinicalSafety)
- **Score:** 78.1% eval, 58.4% V2 vs 26.3% V1 (411 cases, 0 regresiones)
- **Tests:** 247 pass, tsc clean

### Archivos creados/modificados en esta sesión
| Archivo | Cambio |
|---|---|
| `src/agent/v2/types/quality-score.ts` | **NUEVO** — QualityDimension, QualityScore, ReviewQueueEntry, MetricEvent |
| `src/agent/v2/core/quality-scorer.ts` | **NUEVO** — 7-dimension scorer con pesos |
| `src/agent/v2/core/metric-emitter.ts` | **NUEVO** — Dual stdout/file metric emission + review queue |
| `src/agent/v2/policy/clinical-safety-audit.ts` | **NUEVO** — Builder pattern audit con JSONL export |
| `src/agent/v2/understanding/structured-router.ts` | **MODIFICADO** — Integración ClinicalSafetyAudit en pipeline |
| `src/agent/v2/understanding/safety-pre-router.ts` | **MODIFICADO** — Third-party booking check en CONTRA_SIGNALS |
| `src/agent/v2/understanding/deterministic-domain-route.ts` | **MODIFICADO** — BOOKING_KEYWORDS + "precio en dólares" pattern |
| `src/agent/v2/eval/compare-v1-v2.ts` | **MODIFICADO** — Fix TS errors |
| `data/agent-review-queue.jsonl` | **NUEVO** — Append-only review queue |
| `data/clinical-audit-log.jsonl` | **NUEVO** — 187 entries de auditoría clínica |

### Decisiones clave
1. **Passive vs active cancel**: applyOverrides distingue "me cancelaron" (víctima → queja) de "quiero cancelar" (activo → cancelacion_reprogramacion)
2. **Tercero + booking**: pre-router salta CONTRA_SIGNALS si hay "mi hija" + "agendar"
3. **ClinicalSafetyAudit transparente**: no cambia comportamiento — solo observa y exporta. Enforcement en PR6.1
4. **Quality scorer heurístico**: 7 dimensiones con pesos, best-effort siempre

### Archivos críticos para PR7
- `server/src/agent/v2/response/response-critic.ts` — el critic debe ser reescrito con CriticAction real
- `server/src/agent/v2/types/decision-trace.ts` — puede necesitar extensión para critic issues
- Review queue + metric emitter (PR4) — integrar critic issues

### Cómo comenzar PR7
1. Leer CURRENT_TASK.md (ya actualizado a PR7)
2. Revisar response-critic.ts actual (si existe)
3. Implementar ResponseCritic con las 6 reglas obligatorias
4. Integrar con review queue y metric emitter
5. Tests: bloquear/regenerar → revisar/no bloquear → pasar
6. Validar con tsc + tests + eval + comparison + audit

## 2026-06-29 — OpenCode → Próximo agente (PR7 completado)

### Resumen PR7
Response Critic Hardening completado. El critic pasó de ser decorativo (lista NEVER_SAY + contract check) a un gate determinístico con 6 categorías de reglas, PII masking, y CriticAction real.

### Archivos modificados en PR7
| Archivo | Cambio |
|---|---|
| `src/agent/v2/response/response-critic.ts` | **REESCRITO** — nuevas interfaces, 6 reglas, masking, CriticAction |
| `src/agent/v2/core/agent-kernel.ts` | **MODIFICADO** — `applyCritic()` integrado en 4 return points |
| `src/agent/v2/types/decision-trace.ts` | **MODIFICADO** — `criticIssues[]` y `criticAction` en quality |
| `src/agent/v2/index.ts` | **MODIFICADO** — nuevos exports (maskPII, tipos) |
| `tests/v2-agent.test.ts` | **MODIFICADO** — +9 tests PR7, actualizados tests existentes |

### Score post-PR7
- Tests: 256/256 pass
- tsc: clean
- Eval: 78.1%, 0 regresiones
- Clinical audit: 0/187 fails

## 2026-06-29 — OpenCode → Próximo agente (PR2.6 completado, iniciando PR8)

### PR2.6 — Router Triage Final

Routing final mejorado de 78.1% a 87.7% (+9.6pp). 41 critical failures → 21. V2 vs V1: 62.8% vs 26.3% (antes 58.4%).

Router feature-freeze: los 21 failures restantes son LLM otro@0.30 que requieren refactor mayor de SYSTEM_PROMPT — no vale la pena ahora.

### Archivos modificados en PR2.6
| Archivo | Cambio |
|---|---|
| `safety-pre-router.ts` | Injection regexes, HUMAN/CONTRA signals, NFC normalization |
| `deterministic-domain-route.ts` | +15 domain signals, NFC normalization |
| `structured-router.ts` | Cancel override expandido, +30 prompt examples, NFC normalization |

### PR8 — Flow Adapter V2 (iniciando ahora)
Flows memory-aware: agendamiento, precio, first_contact consultan memoria V2 antes de pedir datos. No repreguntar lo que el usuario ya dió.

### Archivos a crear en PR8
- `src/agent/v2/adapter/flow-adapter.ts` — bridge kernel V2 → flows
- `src/agent/v2/memory/memory-service.ts` — abstracción sobre memoria persistente

## 2026-06-29 — OpenCode → Próximo agente (Adopción Plan GPT-5 + Sprint 0 parcial)

### Resumen
Auditoría a profundidad del MVP (3 explore agents en paralelo, verificado en disco) → dossier `docs/AUDITORIA-MVP-GPT.md` (56KB) → GPT-5 genera plan de implementación `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md` (67KB, 1332 líneas, 25 tasks, 5 sprints) → **adopción oficial como línea de trabajo**.

North star: **MVP Fase 1 completo + agente V2 100%, listo para enchufar credenciales Meta en Fase 2**. Stream A prioritario. NO Meta real, NO Agenda Pro real, NO pagos live.

### Sprint 0 — Estabilización (parcial)
| Task | Status | Commit | Notas |
|---|---|---|---|
| **C1** Git commit + push snapshot V2 | ✅ DONE | `47d2df6` | 30 modified + 157 untracked → origin/main. Riesgo operativo #1 mitigado. |
| **A1** Fix tsc TS2307 import path | ✅ DONE | `bd9553a` | `v2-adapter.ts:10` import path corregido. tsc clean exit 0. |
| C2 Runner migraciones | 🔴 PEND | — | 1-1.5 días |
| C3 Secrets hygiene DeepSeek | 🔴 PEND | — | 0.5 días |

### Gate M0 verificado parcial
- ✅ tsc --noEmit clean (exit 0)
- ✅ vitest run → **283/283 tests verdes** (3.72s)
- 🔴 Migraciones reproducibles — pendiente C2
- 🔴 Secrets hygiene — pendiente C3

### Discrepancias docs vs disco (corregir en C5)
- Tests: AGENTS raíz "167" → real **283**
- Eval score: AGENTS "87.7% (164/187)" → real **62.8% (258/411)**
- tsc: AGENTS "1 error pre-existente" → **clean tras A1**
- PR8: bridge "iniciando" → **funcionalmente DONE**

### Próximo agente — continuar Sprint 0
1. Leer `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md` (plan completo, §4 secuencia commits).
2. Ejecutar **C2** (runner de migraciones automático antes de seed): crear `src/db/run-sql-migrations.ts` + tabla control `bookia_migrations(filename, checksum, applied_at)` + ajustar `entrypoint.sh` para correr migraciones antes de seeds. Validar con `docker compose down -v && docker compose up --build`.
3. Ejecutar **C3** (secrets hygiene): completar `.env.example` con todas las vars (`LLM_PROVIDER`, `DEEPSEEK_API_KEY`, `AGENT_KERNEL_V2`, `DEV_AUTH`, DB vars), Zod validation que falle claro si `LLM_PROVIDER=deepseek` sin key, `LLM_PROVIDER=mock` como fallback. No commitear `.env`.
4. Si C2+C3 cierran → **Gate M0 completo** → arrancar **Sprint 1**: A2 (V2 message persistence), A3 (env tipado V2 default ON), A4 (loadContext real), A10 (eliminar require), B1 (auth real), C6 (tenant-config dir).
