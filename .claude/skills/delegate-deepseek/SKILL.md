# Skill: delegate-deepseek

**name:** delegate-deepseek
**description:** Actualiza .bridge/STATUS.md para que OpenCode sepa qué ejecutar. No hay queue, no hay git push — el filesystem es el canal.

## Cuándo usar

Cuando quiero que OpenCode ejecute algo que requiere Docker, DB real, seeds, o cualquier verificación que yo no hice todavía.

## Cómo delegar

### 1. Verificar que OpenCode no está activo en esos archivos
```bash
# Ver qué dice el STATUS.md actualmente — ¿hay algo marcado IN_PROGRESS?
cat /Users/alejandropena/Bookia/bookia-code/.bridge/STATUS.md | grep "IN_PROGRESS\|🟡"
```

### 2. Agregar sección de tarea activa en STATUS.md

Añadir al inicio del STATUS.md (antes del sprint table):

```markdown
## 🟡 TAREA ACTIVA — OpenCode
**Task:** <código> — <título>
**Objetivo:** <una oración>
**Archivos a tocar:** <lista>
**Criterios de aceptación:**
\`\`\`bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx tsc --noEmit
npx vitest run tests/<suite>
\`\`\`
**Aceptación:** <condición exacta>
**Protocolos OpenCode:**
- ensure_session antes de tocar código
- validator (tsc + vitest) antes de reportar done
- Escribir decisiones a PostgreSQL al terminar
- Actualizar STATUS.md al terminar (quitar esta sección, mover task a ✅)
- Commit código + push
```

### 3. No hay push — OpenCode lee el filesystem directamente

OpenCode verá el cambio en STATUS.md sin necesidad de git pull.

## Template de decisión al terminar

```bash
docker exec opencode-memoria-1 psql -U memoria -d memoria_global -c "
INSERT INTO episodica.decisions (project, title, decision, reason)
VALUES ('bookia', '<task> completada', '<qué se hizo>', '<decisión técnica tomada>');
"
```
