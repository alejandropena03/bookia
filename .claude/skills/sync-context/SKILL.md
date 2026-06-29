# Skill: sync-context

**name:** sync-context
**description:** Lee AGENTS.md + .bridge/CURRENT_TASK.md + HANDOFF_LOG.md + plan activo. Reporta estado completo en < 2 minutos. Usar al inicio de cada sesión de Bookia.

## Instrucciones — 3 queries, no 10 pasos

### 1. Hechos recientes (git — fuente de verdad)
```bash
cd /Users/alejandropena/Bookia/bookia-code && git log --oneline -10
```

### 2. Intención actual (bridge)
```bash
cat /Users/alejandropena/Bookia/bookia-code/.bridge/CURRENT_TASK.md
```

### 3. Decisiones recientes (PostgreSQL compartido)
```bash
docker exec opencode-memoria-1 psql -U memoria -d memoria_global -c \
  "SELECT title, LEFT(decision,120), t FROM episodica.decisions WHERE project='bookia' ORDER BY t DESC LIMIT 5;"
```

### Gate rápido (solo si vas a tocar código)
```bash
cd /Users/alejandropena/Bookia/bookia-code/server && npx vitest run 2>&1 | tail -5
```

Esas 3 queries dan el 90% del contexto. No leer HANDOFF_LOG completo ni PLAN entero — es ruido de tokens.

Reporta en este formato:
```
**Sprint activo:** <sprint + milestone>
**Tarea pendiente:** <task + status>
**Tests:** <N>/<N> (verificado o no verificado)
**tsc:** clean / <N> errores
**Próximos 3 items:** <en orden de prioridad del plan>
**Riesgos activos:** <deuda técnica, bloqueos>
**DeepSeek last handoff:** <fecha + resumen 1 línea>
```
