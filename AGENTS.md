# Bookia — Facts del proyecto

## Stack
- Backend: Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + Vitest
- Frontend: Next.js 16 + React 19 + shadcn/ui + Base UI + Recharts + Zustand

## Estado
- MVP funcional esperando credenciales
- Tests: 58/58 (vitest)
- Modelo: deepseek-v4-flash

## Puertos
- 3001: Frontend (Next.js dev)
- 8787: Backend API (Hono)
- 5432: PostgreSQL
- 3000: Outline Wiki

## Bridge
- Activo con Claude Code vía .bridge/
- Protocolo: .bridge/README.md
- Máximo de mi forma de trabajar: leer MANIFIESTO global

## Seguridad
- NO committear API key de DeepSeek (está en /Users/alejandropena/ARIA/config/settings.py)
- bookia_app rol limitado para runtime

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->
