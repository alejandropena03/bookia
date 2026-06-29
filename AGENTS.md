# Bookia — Facts del proyecto

## Stack
- Backend: Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + Vitest
- Frontend: Next.js 16 + React 19 + shadcn/ui + Base UI + Recharts + Zustand

## Estado
- MVP funcional esperando credenciales
- Tests: 256/256 pass (vitest, agent pipeline + response critic + routing)
- Pipeline: safety pre-router → deterministic domain router → LLM → post-risk scan → clinical policy → response critic → metrics
- Eval: V2 87.7% (164/187), V1 vs V2 62.8% vs 26.3%, 0 regressions
- Clinical audit: 0/411 failures
- Modelo: deepseek-v4-flash
- Santa María hyper-personalized: 29 servicios reales, flujos personalizados, 11 canned responses, 28 imágenes mapeadas

## Santa María — Archivos clave
- `server/src/flows/santa-maria/catalog.ts` — 29 servicios con precios COP/MXN/USD/EUR, filtro por ciudad
- `server/src/flows/santa-maria/flows.ts` — agendamiento (9 estados) + first_contact (tono natural, sin menú)
- `server/src/flows/santa-maria/canned-responses.ts` — 11 templates + reglas de escalation (notificar a Elkin)
- `server/src/flows/santa-maria/images/manifest.json` — 28 imágenes mapeadas a servicios
- `server/src/flows/santa-maria/images/` — 28 service cards extraídos del docx de Carlos
- `server/src/db/seed.ts` — usa datos reales importados de santa-maria/

## Santa María — Decisiones de personalización
- Persona: **Carlos** (no Sofía), tono cercano y natural, saluda con "Buenas {nombre}, ¿cómo estás?"
- **Sin menú de botones** (Carlos dijo que no usan menú en chat)
- Horario real: Lun-Sáb 9:00-19:00
- Escalation: **Elkin** (no Carlos) es el contacto de escalation
- Precios varían por país (COP/MXN/USD/EUR) — el agente muestra según ciudad del cliente
- Citas requieren: nombre, celular, correo, fecha de nacimiento, cédula
- Anticipo requerido para confirmar cita

## Puertos
- 3001: Frontend (Next.js dev)
- 8787: Backend API (Hono)
- 5432: PostgreSQL
- 3000: Outline Wiki

## Bridge
- Activo con Claude Code vía .bridge/
- Protocolo: .bridge/README.md
- Máximo de mi forma de trabajar: leer MANIFIESTO global

## Plan activo
- `docs/PLAN-10-10-MVP.md` — Plan maestro para llegar a MVP 10/10
- Fase actual: Fase 0 completada (escalación, seed-demo, tests, tzdata)
- Siguiente: Fase 1 (estabilidad: template rendering, seed upsert, heatmap timezone, health endpoint, jest fix)

## Seguridad
- NO committear API key de DeepSeek (está en /Users/alejandropena/ARIA/config/settings.py)
- bookia_app rol limitado para runtime

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->
