# Bridge Protocol v2 — Agentic Dev OS (mismo PC)

**Vigente desde:** 2026-06-29 | **Reemplaza:** bridge v1 (git push/pull entre máquinas)

## Arquitectura

```
Claude Code (supervisor) ──filesystem──► .bridge/STATUS.md ◄──filesystem── OpenCode (executor)
                          ──PostgreSQL──► episodica.decisions ◄──PostgreSQL──
                          ──git log────► commits de código ◄──git push──
```

Ambos agentes en el mismo PC. El canal es el **filesystem** para estado de tareas y **PostgreSQL** para decisiones. Git es para el código, no para el bridge.

---

## Arranque de sesión (cualquier agente)

```bash
# 1. Hechos — qué se hizo recientemente
git -C /Users/alejandropena/Bookia/bookia-code log --oneline -10

# 2. Estado activo — qué hay que hacer
cat /Users/alejandropena/Bookia/bookia-code/.bridge/STATUS.md

# 3. Decisiones recientes — contexto
docker exec opencode-memoria-1 psql -U memoria -d memoria_global \
  -c "SELECT title, LEFT(decision,120), t FROM episodica.decisions WHERE project='bookia' ORDER BY t DESC LIMIT 5;"
```

---

## Cierre de sesión (obligatorio)

```bash
# 1. Actualizar STATUS.md — marcar lo que hiciste, actualizar pendientes
# 2. Escribir decisiones al grafo
docker exec opencode-memoria-1 psql -U memoria -d memoria_global \
  -c "INSERT INTO episodica.decisions (project,title,decision,reason) VALUES ('bookia','<título>','<decisión>','<razón>');"
# 3. Commit del código
git -C /Users/alejandropena/Bookia/bookia-code add server/ app/ && \
  git commit -m "<task>: <descripción>" && git push origin main
```

---

## Archivos

| Archivo | Propósito |
|---------|-----------|
| `STATUS.md` | Estado vivo del sprint — la fuente de verdad para ambos agentes |
| `README.md` | Este protocolo |

El historial de decisiones está en `episodica.decisions` (PostgreSQL). El historial de código está en `git log`. No hay más archivos.
