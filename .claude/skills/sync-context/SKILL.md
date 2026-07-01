# Skill: sync-context

**name:** sync-context
**description:** Arranca sesión en Bookia. 3 queries, no 10 pasos. Lee git log + STATUS.md + PostgreSQL. Reporta estado en < 1 minuto.

## Instrucciones

```bash
# 1. Hechos recientes (git — fuente inmutable)
git -C /Users/alejandropena/Bookia/bookia-code log --oneline -10

# 2. Estado activo (filesystem directo — no git pull)
cat /Users/alejandropena/Bookia/bookia-code/.bridge/STATUS.md

# 3. Decisiones recientes (PostgreSQL compartido con OpenCode)
docker exec opencode-memoria-1 psql -U memoria -d memoria_global \
  -c "SELECT title, LEFT(decision,120), t FROM episodica.decisions WHERE project='bookia' ORDER BY t DESC LIMIT 5;"

# 4. Gate (solo si vas a tocar código)
cd /Users/alejandropena/Bookia/bookia-code/server && npx vitest run 2>&1 | tail -5
```

## Formato de reporte

```
Sprint activo: <sprint + milestone>
Pendientes: <N tasks — listar las 3 más prioritarias>
Tests: <N>/327 ✅ / ❌ (baseline verificado 2026-07-01, ver test-gate)
tsc: clean / N errores
Última decisión PostgreSQL: <título + fecha>
```

## Regla

No leer HANDOFF_LOG (eliminado), no leer PLAN completo (1332 líneas), no leer AGENTS.md entero.
El STATUS.md + git log dan el 90% del contexto.
