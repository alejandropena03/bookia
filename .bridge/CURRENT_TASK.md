# Current Task: Sprint 0 — Estabilización (Plan GPT-5)

> **Línea de trabajo oficial:** `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md` (plan GPT-5, 25 tasks, 5 sprints).
> **North star:** MVP Fase 1 completo + agente V2 100%, listo para enchufar credenciales Meta en Fase 2.
> **Stream prioritario:** A (agente V2). Restricciones: NO Meta real, NO Agenda Pro real, NO pagos live.

## Estado Sprint 0 (M0 — Estable)

| Task | Status | Commit | Notas |
|---|---|---|---|
| **C1** Git commit + push snapshot V2 | ✅ DONE | `47d2df6` | 30 modified + 157 untracked preservados en origin/main. Riesgo operativo #1 mitigado. |
| **A1** Fix tsc TS2307 import path | ✅ DONE | `bd9553a` | `v2-adapter.ts:10` `../../flows/engine.js` → `../../../flows/engine.js`. tsc clean exit 0. |
| **C2** Runner de migraciones automático | 🔴 PENDING | — | drizzle-kit trackea 3/12 SQL; entrypoint.sh no corre migraciones. 1-1.5 días. |
| **C3** Secrets management local DeepSeek | 🔴 PENDING | — | `.env.example` completo + Zod validation + secret scan. 0.5 días. |

## Gate M0 — verificado parcial
- ✅ `git status --short` limpio tras commits.
- ✅ `git push origin main` confirmado (`e1aa2de..47d2df6`).
- ✅ `cd server && npx tsc --noEmit` sin errores (A1 aplicado).
- ✅ `cd server && npx vitest run` → **283/283 tests verdes** (3.72s, DB corriendo).
- 🔴 Migraciones reproducibles en DB limpia — pendiente C2.
- 🔴 Secrets hygiene — pendiente C3.

## Próximo: Sprint 1 — Activación V2 end-to-end (semana 1)
Tasks en orden de dependencia:
- **A2** — V2 message persistence + SSE (`v2-adapter.ts:77-83` no persiste outbound).
- **A3** — `AGENT_KERNEL_V2` en env schema Zod + `.env.example`, default `true`.
- **A4** — `loadContext` real (no `{}` en `v2-adapter.ts:47`).
- **A10** — Eliminar `require()` CommonJS en ESM (`v2-adapter.ts:29,40,44`).
- **B1** — Auth real local (password hash + DB adapter + sesión tenant-aware).
- **C6** — Crear `src/db/tenant-config/` o ajustar import contract.

## Contexto previo (cerrado)
- **PR8 — Flow Adapter V2**: funcionalmente DONE (archivos en disco, 27 tests flow verdes). El bridge no se había cerrado formalmente; este commit lo cierra.
- **Auditoría MVP**: `docs/AUDITORIA-MVP-GPT.md` (56KB, verificado en disco con file:line).
- **Plan GPT-5**: `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md` (67KB, 1332 líneas).

## Discrepancias docs vs disco (a corregir en C5)
- Tests: AGENTS raíz dice "167" → real **283**.
- Eval score: AGENTS dice "87.7% (164/187)" → real **62.8% (258/411)**.
- tsc: AGENTS dice "1 error pre-existente" → **clean tras A1**.
- PR8: bridge decía "iniciando" → **DONE**.

## Pendientes fuera del plan GPT-5 (solicitados por Alejandro)
- **REGENERAR SEED-DEMO CON CONVERSACIONES REALES DEL AGENTE:** actualmente `seed-demo.ts` crea 15 contactos con mensajes hardcoded (strings literales sin sentido). Alejandro quiere que las conversaciones del dashboard sean simulaciones reales generadas por el agente (DeepSeek + flows + canned responses), no texto dummy. Task nuevo: crear un script que corra escenarios de conversación contra el agente real (saludo, precio, agendamiento, escalación) y persista las respuestas reales del bot en `messages`. Así el dashboard mostrará conversaciones coherentes con el comportamiento real del agente. Priorizar después de A2-A3 (V2 persistencia + activación) para que las conversaciones generadas pasen por el pipeline V2.
