# AGENTS-ROADMAP.md — Bookia Agent SOTA Evolution

**Source of truth** para el plan de evolución del agente conversacional.
Reemplaza el estado de avance en cada sprint.
Referencia principal: `docs/open-code-brief-bookia-agent-sota.md`

---

## Goal

Convertir el agente actual de "buena base funcional" (107 tests, 97.7% router, ~69/100 human experience) en un **Agent Operating System vertical** para clínica estética: confiable, seguro, cálido, medible, mantenible y clínicamente prudente.

## Constraints

- No romper tests existentes (107/107)
- No eliminar arquitectura híbrida V1
- No mover todo a LLM
- No inventar servicios, precios ni datos clínicos
- No prometer resultados médicos ni diagnosticar
- No depender de una sola llamada LLM para decisiones críticas
- No tocar conexiones externas (WhatsApp, Instagram, pagos, CRM)
- Feature flag: `AGENT_KERNEL_V2=true`

## Estado actual

| Sprint | Progreso |
|---|---|
| 1 — Foundation: Tipos + Kernel | ✅ 132 tests (107 V1 + 25 V2) |
| 2 — Structured Router + Policy | ⬜ No iniciado |
| 3 — Clinical Safety + Privacy | ⬜ No iniciado |
| 4 — Memory + Planner | ⬜ No iniciado |
| 5 — Response Composer + Critic | ⬜ No iniciado |
| 6 — Hardening + PRR v2 | ⬜ No iniciado |

## Target final

| Métrica | Baseline (PRR v1) | Sprint 1 | Target V2 |
|---|---|---|---|
| Router accuracy | 97.7% | — | ≥98% |
| Invalid intent rate | ~1% | — | 0% |
| Tests | 107 | 132 (+25) | ≥200 |
| Eval cases | 43 | — | ≥600 + 30 golden convos |
| Human Experience | ~69/100 | — | ≥80/100 |
| Clinical unsafe responses | Sin medición | — | 0% |
| Prompt leakage | Sin medición | — | 0% |
| Privacy leakage | Sin medición | — | 0% |
| Warm path overhead | — | — | <150ms sobre V1 |

## Decisiones clave

- **Estructura paralela**: `src/agent/v2/` convive con `src/agent/` V1; no se migra hasta Sprint 6
- **Feature flag**: `AGENT_KERNEL_V2=true` activa V2; por defecto V1 sigue funcionando
- **Tipos compartidos**: los tipos base (AgentIntent, DecisionTrace, etc.) son nuevos; no refactorizar tipos V1
- **Reuso**: sentiment.ts, segmentation.ts, llm/, flows/ se reusan en V2 sin cambios
- **Evals**: mantener evals V1 + crear evals V2 separados

## Archivos clave

- `docs/open-code-brief-bookia-agent-sota.md` — brief original (autoridad)
- `docs/PLAN-SOTA.md` — plan detallado con sprints, archivos, tests por sprint
- `docs/PRR-Bookia-Agent-Santa-Maria.pdf` — PRR v1 (baseline)
- `docs/PRR-Bookia-Agent-Santa-Maria-v2.md` — PRR v2 (target del plan)

## Referencias

- [Brief original](docs/open-code-brief-bookia-agent-sota.md)
- [Plan detallado](docs/PLAN-SOTA.md)
- [PRR v1 PDF](PRR-Bookia-Agent-Santa-Maria.pdf)
