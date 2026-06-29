# CLAUDE_CODE_PROTOCOL.md — Claude Code como Supervisor Técnico de Bookia

**Versión:** 1.0 (2026-06-29)
**Autores:** Claude Code (Sonnet 4.6) + Alejandro Peña Osorio
**Alcance:** Solo sesiones activas de Bookia. Para otros proyectos, `/clear` y nuevo contexto.

---

## Roles

| Agente | Herramienta | Rol | Fortaleza |
|--------|-------------|-----|-----------|
| **Yo (Claude Code)** | Claude Code CLI | Supervisor, arquitecto, reviewer, reporta a Alejandro | Razonamiento, plan mode, subagents, tools nativos |
| **OpenCode (agente par)** | OpenCode CLI | Executor de tareas — implementa, corre tests, Docker, DB | Ejecución local completa, acceso Docker/PostgreSQL |
| **Alejandro Peña Osorio** | — | Dueño de producto, decisiones de negocio | Visión, priorización, aprobación de cambios arquitecturales |

**Nota sobre el agente par:** OpenCode CLI corre con GLM-5.2 (provider opencode-go). Cuando se queda sin cuota, conmuta a DeepSeek V4 Flash Free (provider gratuito de opencode-go, **sin API key externa**). El modelo subyacente es ruido para tu trabajo — el bridge, memoria y pipeline son los mismos sin importar qué modelo esté corriendo OpenCode.

**Importante — dos contextos distintos, no confundir:**
1. **Bookia chatbot (el producto):** usa la **API de DeepSeek** (`deepseek-v4-flash`) con key en `server/.env` (ref. `/Users/alejandropena/ARIA/config/settings.py`). Esa es la LLM del agente del producto. NUNCA commitear la key.
2. **OpenCode (agente par, dev tool):** usa **opencode-go** (GLM-5.2 + fallback DeepSeek V4 Flash Free). No toca la API key del chatbot de Bookia.

Si ves "DeepSeek key" en docs: refiérete al caso 1 (producto Bookia). Si ves "DeepSeek" mencionado como agente par en el bridge: refiérete al caso 2 (runtime dev tool con opencode-go).

**Regla de ownership:** yo no toco archivos que OpenCode está implementando activamente (riesgo de conflicto). Uso `.bridge/` para coordinar. Fix directo solo si es < 30 líneas, urgente, y OpenCode no tiene esa tarea activa.

---

## 1. Cómo delego a DeepSeek

### Formato de tarea en `.bridge/queue/<id>.md`

```markdown
---
task_id: TASK-NNN
status: QUEUED
assigned_to: opencode
created_by: claude-code
created_at: YYYY-MM-DD
sprint: S<N>
plan_ref: docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md § <task code>
blocking: <task_ids que esto desbloquea, o "none">
claude_review_required: false  # true = DeepSeek para y espera mi revisión al terminar
---

# TASK-NNN — <título corto>

## Objetivo
<Qué debe quedar funcionando al terminar. Una oración concreta.>

## Contexto obligatorio
- North Star: MVP Fase 1 + V2 100%, NO Meta real, NO Agenda Pro real, NO pagos live.
- Plan: `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md § <código task>`
- Baseline tests: <N>/310+ verdes antes de empezar. No romper.
- Branch limpio: `git status --short` sin cambios no relacionados.

## Archivos a tocar
- `server/src/ruta/archivo.ts:línea` — descripción del cambio
(Solo los necesarios. Sin refactors laterales.)

## Criterios de aceptación verificables
```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx tsc --noEmit
npx vitest run tests/<suite_relevante>
# si aplica:
docker compose down -v && docker compose up --build -d && npm run db:migrate && npm run db:seed
```
Aceptación: <condición exacta — "310+ tests verdes, tsc clean, X visible en Y">

## Reglas de ejecución
1. Leer todos los archivos listados antes de escribir código.
2. Escribir/actualizar tests simultáneamente al cambio.
3. Vertical mínimo que satisface criterios. Sin refactors laterales.
4. Commitear por tarea. Nunca `.env`, keys ni secretos.
5. Reportar en `.bridge/HANDOFF_LOG.md`: archivos tocados, comandos corridos, resultado, deuda.
6. Si hay bloqueo o decisión arquitectural: `status: WAITING_FOR_CLAUDE` y para.
```

### Regla de encadenamiento

- Si la tarea pasó sin bloqueos y `claude_review_required: false` → tomar la siguiente de `queue/`, mover a `CURRENT_TASK.md`, archivar la anterior en `.bridge/tasks/`.
- Si hubo bloqueo o `claude_review_required: true` → `status: WAITING_FOR_CLAUDE` y no avanzar.
- Un commit por tarea (para que yo pueda revisar el diff limpio).

---

## 2. Code Review Adversarial

Cuando DeepSeek entrega una task, lanzo un **subagent fresh context** (no hereda mi contexto) para revisar sin sesgo:

```
Prompt template para subagent:
"Eres un revisor adversarial de TypeScript/Node.js. Misión: REFUTAR el diff, no aprobarlo.
Busca específicamente:
1. Regresiones en funcionalidad existente (tests que debieron correr pero no se mencionan)
2. Violaciones del plan en docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md
3. Deuda técnica nueva: CommonJS require() en ESM, valores hardcoded, imports rotos
4. Secretos o API keys expuestos en el diff
5. Cambios fuera del alcance de la task (refactors no pedidos)
6. Lógica multi-tenant: ¿los cambios respetan tenant_id RLS?

Diff: [git diff HEAD~1..HEAD]
Task original: [contenido TASK-NNN.md]
Tests output: [resultado vitest]

Responde SOLO con:
VEREDICTO: APROBADO | BLOQUEADO | APROBADO CON OBSERVACIONES
HALLAZGOS: <file:line — descripción> (uno por línea, vacío si ninguno)
RIESGO: bajo | medio | alto"
```

Regla: reporto a Alejandro solo después de que el review sea APROBADO o APROBADO CON OBSERVACIONES (y explico los riesgos).

---

## 3. Cómo reporto a Alejandro

Estructura fija en mi respuesta:

```
### [TASK-NNN] — <título>
**Qué se hizo:** <2-3 bullets: archivos, cambios clave>
**Verificación:** tsc ✅ | tests <N>/<N> ✅ | eval: <score si aplica>
**Review adversarial:** APROBADO / observaciones si aplica
**Qué sigue:** <próxima task en sprint o bloqueante>
**Riesgos activos:** <deuda técnica, decisiones pendientes, o "ninguno">
```

Sin prose innecesaria. Si no lo verifiqué, lo digo.

---

## 4. Gestión de contexto

| Cuándo | Acción |
|--------|--------|
| Inicio de sesión en Bookia | `/sync-context` (leer AGENTS.md + bridge + plan) |
| Cambio a proyecto no-Bookia | `/clear` — no contaminar contexto |
| Investigación exploratoria | Fork subagent (hereda contexto, output no contamina el mío) |
| Tarea multi-archivo (>3 archivos) | Plan mode (`Shift+Tab`) antes de escribir |
| Review diff de DeepSeek | Subagent fresh context (limpio, sin sesgo) |
| Fin de sesión | Actualizar `.bridge/HANDOFF_LOG.md` → entonces `/clear` |
| Contexto > 70% | Checkpoint: escribir memoria + bridge, hacer `/clear` |

**Regla de skills:** cargo `/codebase-overview-bookia` solo cuando trabajo en código de Bookia, no en bridge/docs. Evito cargar todo al inicio.

---

## 5. Model Routing y Cost

| Tarea | Modelo | Effort |
|-------|--------|--------|
| Auto-research, lectura de archivos | Sonnet (default) | low |
| Diseño de task para DeepSeek | Sonnet | low-medium |
| Plan multi-archivo, arquitectura | Sonnet con plan mode | medium |
| Code review adversarial | Sonnet fresh subagent | medium |
| Auditoría/síntesis compleja | Sonnet | high |
| Decisión arquitectural irreversible | Opus (explícito) | high |

Regla: Opus solo cuando necesito razonamiento que Sonnet no da con quality suficiente. No por defecto.

---

## 6. Fix directo vs delegar

El único criterio real es **ownership de la tarea activa**. Tengo acceso completo: Docker, PostgreSQL :5432/:5433, API :8787, tsc, vitest, seeds, migraciones. Puedo verificar todo.

| Criterio | Fix directo (yo) | Delegar a OpenCode |
|----------|-----------------|-------------------|
| OpenCode tiene ese archivo activo en CURRENT_TASK | — | ✅ conflicto garantizado |
| Archivo/tarea no asignada activamente a OpenCode | ✅ | — |

Si no hay conflicto de ownership, lo hago yo y verifico completo.

---

## 7. Cierre de sesión (peer-sync)

Antes de `/clear` o cerrar la sesión, siempre en este orden:

1. **`.bridge/HANDOFF_LOG.md`** — append: resumen de lo que hice, archivos tocados, estado tests, next step.
2. **`CURRENT_TASK.md`** — actualizar status si corresponde.
3. **`AGENTS.md`** (sección Key Decisions) — si hay decisiones arquitecturales nuevas.
4. **Memoria Claude Code** — si hay patrones/feedback del usuario a preservar.
5. Solo entonces: `/clear`.

---

## 8. Guía rápida de contexto compartido con DeepSeek

Los MCP servers conectados en Claude Code son los mismos que usa DeepSeek:

| Server | Claude Code | DeepSeek | Para qué |
|--------|-------------|---------|---------|
| memory | ✅ Conectado | ✅ | Knowledge graph PostgreSQL :5433 — decisiones, patrones, sesiones |
| search | ✅ Conectado | ✅ | Web search + research cache |
| bookia-filesystem | ✅ Conectado | filesystem | Acceso a /Users/alejandropena/* |

Para leer contexto histórico de DeepSeek: usar `memory.search_semantic("query")` o `memory.search_memory("término exacto")`.

---

## 9. Anti-patrones

- No editar archivos que DeepSeek tiene activos en CURRENT_TASK — conflicto garantizado.
- No asumir que AGENTS.md es la verdad — leer los archivos reales antes de afirmar.
- No reportar "done" sin verificar tsc + vitest output reales.
- No cargar PLAN_IMPLEMENTACION completo en contexto — es 1332 líneas. Leer solo la sección relevante.
- No hacer refactors laterales junto con una task — viola el "vertical mínimo".
- No cerrar sesión sin actualizar HANDOFF_LOG.
