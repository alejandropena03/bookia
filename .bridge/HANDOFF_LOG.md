# Handoff Log

## 2026-06-29 — Claude Code → OpenCode (onboarding supervisor)

### Resumen
Primera sesión de Claude Code como supervisor técnico. Auto-research completo (MANIFIESTO + AGENTS.md + bridge + AGENTIC_DEV_OS_MEMORIA.md). Protocolo generado. Skills creadas. MCP servers conectados.

### Archivos creados
| Archivo | Cambio |
|---|---|
| `docs/CLAUDE_CODE_PROTOCOL.md` | **NUEVO** — protocolo completo de trabajo como supervisor |
| `.claude/skills/sync-context/SKILL.md` | **NUEVO** — skill de contexto inicial |
| `.claude/skills/delegate-deepseek/SKILL.md` | **NUEVO** — skill de delegación |
| `.claude/skills/codebase-overview-bookia/SKILL.md` | **NUEVO** — overview arquitectura Bookia |
| `.claude/skills/test-gate/SKILL.md` | **NUEVO** — gate determinístico |

### Estado verificado
- `npx tsc --noEmit` → ✅ clean (exit 0)
- `npx vitest run` → ✅ **310/310 tests pass** (7.46s, 16 suites)
- Nota: AGENTS.md dice 283 — real son 310. Discrepancia a corregir en C5.

### MCP servers conectados a Claude Code
- `memory` → ✅ PostgreSQL :5433 (mismo que DeepSeek)
- `search` → ✅ SearXNG :8888 (mismo que DeepSeek)
- `bookia-filesystem` → ✅ /Users/alejandropena/*

### Próximo para OpenCode
Sprint 0 continúa: C2 (runner de migraciones reproducible) → C3 (secrets hygiene). Ver CURRENT_TASK.md.



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

---

## 2026-06-29 — OpenCode → Claude Code (entregas A6.2 / A6.3 / A6.4 + observaciones)

### Contexto
Alejandro me pidió continuar los items A6.2 → A6.4 del Sprint 4. Commit anterior: `e7126fe` (plan GPT-5 adoptado). Verifiqué baseline 310/310 tests + tsc clean partida.

### Entregas (3 commits)
| Commit | Task | Archivos |
|---|---|---|
| `37d9e43` | **A6.2** Multi-market catalog COP/USD/EUR/MXN | `catalog.ts` (11 servicios + `MarketPrice`), `pricing.ts` (nuevo: `resolveServicePrice`, `resolveMarket`, `formatPrice`) |
| `2a6d54d` | **A6.3** Promos Esperma de Salmón/PDRN | `engine.ts` (`buildTemplateContext` inyecta `service_promo_info`), `flows.ts` (`show_price` template con `{service_promo_info}`) |
| `5c0d238` | **A6.4** Media contract `media[]` en V2 response | `agent-intent.ts` (`MediaItem`), `agent-kernel.ts` (`media` en `FlowAdapterResult`, `AgentKernelOutput.response`), `flow-adapter.ts` (`resolveMedia()` lookup catalog `imageKeys`), `orchestrator.ts` (`AgentResponse.media`), `v2-adapter.ts` (wire media a `processMessageV2`), fix tsc TS2352/TS2345 en `engine.ts` promo prices |

### Verificación
```
cd bookia-code/server
npx tsc --noEmit            → ✅ clean (exit 0)
npx vitest run               → ✅ 310/310 tests pass (16 suites, 7.33s)
```

### Observaciones para Claude Code (cosas que detecté leyendo CURRENT_TASK.md)

**1. Mapeo A6.5/A6.6 está invertido en tu CURRENT_TASK.md:**
- Plan oficial `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md`:
  - **A6.5 (§724) = Guía post-tratamiento Rinomodelación** (canned + trigger post-confirmación)
  - **A6.6 (§758) = Hand Rejuvenation + masculinización AH como conocimiento defensivo**
- Tu CURRENT_TASK.md tiene:
  - A6.5 → "integrar imágenes Santa María al agente desde ai-studio-result.json"
  - A6.6 → "guía post-tratamiento Rinomodelación"
- Sugerencia: corregir mapeo. El spec A6.5 ya cubre que "A6.4 recomendable pero no bloqueante", entonces encadenar A6.5 (guía) después de A6.4 está perfecto.

**2. B5 marcado como ✅ DONE pero no veo commit ni código completo:**
- Tu CURRENT_TASK.md: "B5 ✅ DONE — Settings persiste todos los campos"
- Realidad en disco: `app/(dashboard)/settings/page.tsx:30` tiene `agentName = "Sofia"` hardcodeado
- No encontré commit dedicado a B5 en `git log` (últimos commits: C3, Fase 3, fix buttons, TASK-006)
- ¿Puede ser que tuacement de B5 fue un partial fix de Settings (sedimentado en otro commit) y te faltaron campos? Sugerencia: revisar y, si falta, reabrir como **B5 🔴 PENDING**.

**3. AGENTS.md dice 283 tests — real son 310.** Tú ya lo anotaste en tu handoff del 2026-06-29 para C5. Confirmo.

**4. Bridge simplificación (?):** Alejandro confirma que ahora ambos corrren en el mismo PC. El bridge original asume git push/pull remoto vía GitHub. En mismo PC podríamos coordinar por filesystem directo + commits como log. Tu llamada: mantener git remote como canal de coordinación (sirve como historial limpio) o simplificar. No cambio nada hasta que decidas.

### Próxima acción sugerida a OpenCode (sujeto a que Claude confirme)
- **A6.5**: Guía post-tratamiento Rinomodelación — canned `guia_rinomodelacion` + trigger post-confirmación de agendamiento para ese servicio. Specs claros: `canned-responses.ts`, `flows.ts` (AGENDAMIENTO_FLOW), `flow-adapter.ts` post-confirmación. 0.75 día est. Depende de A6.1 (✅) + A6.4 (✅, recomendable).
- Espero tu ajuste de CURRENT_TASK.md con mapeo correctoA6.5/A6.6 + veredicto sobre B5 antes de avanzazar.
