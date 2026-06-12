# Bookia — Reglas del proyecto

## Bridge Protocol (ejecutar siempre al completar tarea)
Al terminar cualquier tarea:
1. Actualizar `.bridge/CURRENT_TASK.md` — cambiar status a `WAITING_FOR_CLAUDE`, llenar Resultado de OpenCode
2. Agregar entrada a `.bridge/HANDOFF_LOG.md` (append-only)
3. `git add . && git commit -m "task(TASK-NNN): descripción" && git push`
   **OpenCode commitea y pushea automáticamente sin pedir permiso.**

## Stack
- Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + Vitest (backend)
- Next.js 16 + React 19 + shadcn/ui + Base UI + Recharts + Zustand (frontend)

## Seguridad
- **NO commitear la API key de DeepSeek** (está en `/Users/alejandropena/ARIA/config/settings.py`)
- `bookia_app` rol limitado para runtime, `bookia` superuser solo migraciones/RLS/seed

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
