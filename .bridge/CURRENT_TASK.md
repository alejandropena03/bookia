# Current Task — Bookia MVP (actualizado 2026-06-29 por Claude Code)

> **Plan oficial:** `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md`
> **North star:** MVP Fase 1 completo + V2 100%. NO Meta real, NO Agenda Pro real, NO pagos live.
> **Tests baseline:** 310/310 pass | tsc clean

---

## Estado real por sprint (verificado en git log)

| Sprint | Milestone | Estado | Tasks |
|--------|-----------|--------|-------|
| Sprint 0 | M0 — Estable | ✅ COMPLETO | C1, C2, C3, C6, A1 |
| Sprint 1 | M1 — V2 activado | ✅ COMPLETO | A2, A3, A4, A10, B1 |
| Sprint 2 | M2 parcial | ✅ COMPLETO | A5/PR6.1, A6, A7, B2, B3, B4, C9 |
| Sprint 3 | M2 cierre | ✅ COMPLETO | A8, A9 (golden validators 34/39), A11 |
| Sprint 4 | M3 + M4 | 🟡 EN PROGRESO | A6.2✅ A6.3✅ A6.4✅ — pendientes abajo |

---

## Sprint 4 — Pendientes reales

| Task | Status | Descripción |
|------|--------|-------------|
| **A6.1** | ✅ DONE | Clinical policy enforcement single-source |
| **A6.2** | ✅ DONE | Multi-market catalog COP/USD/EUR/MXN |
| **A6.3** | ✅ DONE | Promos Esperma de Salmón/PDRN |
| **A6.4** | ✅ DONE | Media contract: media[] en V2 response pipeline |
| **A6.5** | 🔴 PENDING | Integrar imágenes Santa María al agente desde `server/data/santamaria-extraction/ai-studio-result.json` (34 imágenes ya analizadas). Runtime usa DeepSeek API, no visión externa. |
| **A6.6** | 🔴 PENDING | Guía post-tratamiento Rinomodelación en agente |
| **A12** | 🔴 PENDING | Eval V2 actualizado 411 casos, reporte honesto |
| **B5** | ✅ DONE | Settings persiste todos los campos |
| **B6** | 🔴 PENDING | SSE /api/sim/stream con auth |
| **B7** | 🔴 PENDING | Cleanup dead code frontend |
| **B8** | 🔴 PENDING | Playwright E2E actualizado |
| **C4** | 🔴 PENDING | Scheduler local workers |
| **C5** | 🔴 PENDING | Sync docs + bridge con verdad en disco |
| **C7** | 🔴 PENDING | Meta Adapter Spec diseñado (no implementado) |
| **C8** | 🔴 PENDING | Observabilidad mínima |

## Sin bloqueantes externos activos
Las imágenes de Santa María ya están analizadas en `server/data/santamaria-extraction/ai-studio-result.json`. A6.5 es integración pura, no requiere API de visión.

## Tarea pendiente fuera del plan
- **Seed-demo con conversaciones reales del agente** (solicitado por Alejandro): reemplazar strings dummy en seed-demo.ts con simulaciones reales generadas por el agente. Hacer post-A2/A3 para que pasen por V2.

---

## Próximo paso sugerido
1. Decisión sobre A6.5 (imágenes) — ¿qué proveedor/approach?
2. A6.6 (guía post-tratamiento Rinomodelación) — no requiere decisión externa
3. A12 (eval actualizado 411 casos) — importante para medir dónde estamos realmente
