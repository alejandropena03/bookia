# Skill: delegate-deepseek

**name:** delegate-deepseek
**description:** Escribe una tarea en .bridge/queue/<id>.md en el formato correcto del bridge protocol para OpenCode (agente par). Incluye: objetivo, contexto, archivos a tocar, criterios de aceptación verificables, reglas de encadenamiento.
**disable-model-invocation:** true (manual — Claude Code escribe la tarea, no la ejecuta)

> **Nota:** "DeepSeek" en este skill = agente par OpenCode (GLM-5.2 vía opencode-go), NO la API key del chatbot de Bookia.

## Instrucciones

Para delegar una tarea a DeepSeek/OpenCode:

1. **Determinar el TASK-ID:** último número en `.bridge/queue/` + 1. Convención: `TASK-NNN`.

2. **Leer el plan para la task específica:**
   ```bash
   # Buscar la sección relevante (no cargar las 1332 líneas completas)
   grep -n "## <código_task>" /Users/alejandropena/Bookia/bookia-code/docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md
   ```

3. **Crear el archivo** en `/Users/alejandropena/Bookia/bookia-code/.bridge/queue/TASK-NNN.md` usando el template del protocolo (ver `docs/CLAUDE_CODE_PROTOCOL.md § 1`).

4. **Verificar conflicto de ownership:** revisar `CURRENT_TASK.md`. Si OpenCode tiene esos archivos activos, no crear la tarea — hacerla yo directamente o esperar entrega. Delegar solo cuando hay conflicto real de ownership, no por asumir que "OpenCode necesita Docker" — yo también tengo Docker y verificación completa.

5. **Si es la próxima en la cola y CURRENT_TASK está vacía o DONE:** mover la tarea a `CURRENT_TASK.md` con `status: WAITING_FOR_OPENCODE`.

6. **Commitear y pushear** para que DeepSeek la vea:
   ```bash
   cd /Users/alejandropena/Bookia/bookia-code
   git add .bridge/queue/TASK-NNN.md
   git commit -m "bridge: enqueue TASK-NNN — <título corto>"
   git push origin main
   ```

## Template de tarea (copiar y completar)

```markdown
---
task_id: TASK-NNN
status: QUEUED
assigned_to: opencode
created_by: claude-code
created_at: YYYY-MM-DD
sprint: S<N>
plan_ref: docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md § <código>
blocking: <task_ids o none>
claude_review_required: false
---

# TASK-NNN — <título>

## Objetivo
<Una oración.>

## Contexto obligatorio
- North Star: MVP Fase 1 + V2 100%, NO Meta real, NO Agenda Pro real, NO pagos live.
- Plan: `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md § <código>`
- Baseline tests: ≥310 verdes antes de empezar. No romper.

## Archivos a tocar
- `server/src/.../archivo.ts:línea` — qué cambiar

## Criterios de aceptación
```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx tsc --noEmit
npx vitest run tests/<suite>
```
Aceptación: <condición exacta>

## Protocolos OpenCode obligatorios
- `ensure_session` primero — antes de tocar cualquier archivo.
- `validator` antes de reportar done — tests → typecheck → lint.
- `ripple-check` post-cambio — referencias en skills/ y config.
- `memory-keeper` al cierre — `add_decision` + `add_pattern` si hay decisiones nuevas.
- `bridge-updater` al terminar — CURRENT_TASK.md + HANDOFF_LOG + commit + push.
- `peer-sync` al cerrar sesión — regenerar LOCAL_AGENT.md.

## Reglas de ejecución
- Leer archivos antes de escribir. No implementar por memoria.
- Tests simultáneos al cambio. Vertical mínimo. Sin refactors laterales.
- Commitear por tarea. Nunca .env ni keys.
- Reportar en HANDOFF_LOG al terminar: archivos tocados, comandos corridos, output, deuda.
- Bloqueo o decisión arquitectural → status: WAITING_FOR_CLAUDE y para.
```
