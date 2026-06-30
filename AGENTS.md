# Bookia — Facts del proyecto

## Stack
- Backend: Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + Vitest
- Frontend: Next.js 16 + React 19 + shadcn/ui + Base UI (Recharts y Zustand removidos — sin uso real)

## Estado (actualizado 2026-06-30 — Sprint 4 + A12 completados)
- MVP funcional esperando credenciales Meta para Fase 2
- **Tests: 282 pass / 12 skip-DB / 33 skip-unit** (vitest). Los 12 que fallan son integración con PG — solo corren con DB activa. Suites: agent(26) + v2-agent(114) + v2-flow-adapter(17) + v2-flow-e2e(10) + v2-memory-persistence(24) + v2-memory-integration(11) + rls(6) + dashboard(9) + channels(8) + intelligence(7) + health(2) + santa-maria(42) + llm(7)
- Pipeline V2 completo: safetyPreRoute → deterministicDomainRoute → LLM → postRiskScan → applyOverrides → classifyIntent → policy → flowAdapter → canned → llm → critic → metrics
- **Eval V2 (A12 final): 97.3% (182/187)** reviewed cases. 100% clinical-safety. 0 fallos críticos. 5 fallos = ambigüedades estructurales + falsos negativos sin contexto de conversación.
- Historical: el "62.8% (258/411)" era sobre 411 casos totales incluyendo generados/no revisados. El número operativo es 97.3% sobre 187 revisados.
- Clinical audit: 0 failures (PR6.1 enforcement activo)
- Modelo: deepseek-v4-flash (API key en server/.env — nunca commitear)
- **V2 activo** (`AGENT_KERNEL_V2=true` default en env.ts). Pipeline completo.
- SSE stream protegido con HMAC token (`SSE_STREAM_SECRET` en env — vacío = dev open)
- Scheduler local de workers (`WORKERS_ENABLED=false` default — activar en prod)
- Observabilidad: requestLogger middleware + `/health` extendido (db/llm/workers/migrations)
- Santa María hyper-personalized: 29+ servicios + precios multi-moneda (COP/USD/EUR/MXN) + imageKeys wa_ + 24 canned responses + 3 flows + 20 escalation keywords

## Santa María — Archivos clave
- `server/src/flows/santa-maria/catalog.ts` — 29 servicios con precios multi-moneda (COP/USD/EUR/MXN) + imageKeys wa_. El LLM recibe el catálogo completo vía `buildCatalogKnowledge()` en v2-adapter.ts (fuente: TypeScript, no DB).
- `server/src/flows/santa-maria/flows.ts` — agendamiento (9 estados) + first_contact + precio (3 estados)
- `server/src/flows/santa-maria/canned-responses.ts` — **24** templates (no 11) + reglas de escalation (20 keywords, notificar a Elkin)
- `server/src/flows/santa-maria/images/` — 28 service cards del DOCX (image1-28.jpeg, baja resolución) + 34 fotos WhatsApp HD (wa_01-34.jpg). imageKeys en catálogo apuntan solo a wa_.
- `server/src/db/seed.ts` — usa datos reales importados de santa-maria/
- `server/data/santamaria-extraction/ai-studio-result.json` — **34 imágenes WhatsApp extraídas** con pricing USD/EUR/MXN/COP completo
- `server/docs/knowledge-alignment-audit-santa-maria.md` — Auditoría DOCX vs implementación (426 líneas, 13/13 categorías)

## Santa María — Nuevos descubrimientos (2026-06-29)
- **Pricing multi-moneda**: USD (26 servicios), EUR (26 servicios), MXN (24 servicios) existen en imágenes promos. Solo COP implementado.
- **Hand Rejuvenation (Radiesse y Sculptra)**: 2 servicios no cubiertos en el catálogo actual.
- **Guía post-tratamiento de Rinomodelación**: contenido valioso que debería ser canned response.
- **Red Lips**: existe en 4 monedas con before/after reales.
- **Descuentos promocionales**: Esperma de Salmón/PDRN tiene precio regular vs promocional.
- **No es conversión directa**: cada mercado tiene pricing propio e independiente.

## Santa María — Decisiones de personalización
- Persona: **Carlos** (no Sofía), tono cercano y natural, saluda con "Buenas {nombre}, ¿cómo estás?"
- **Sin menú de botones** (Carlos dijo que no usan menú en chat)
- Horario real: Lun-Sáb 9:00-19:00, pero **responde normal fuera de horario** (no bloquea, no menciona horario)
- Escalation: **Elkin** (no Carlos) es el contacto de escalation
- Precios varían por país (COP/MXN/USD/EUR) — el agente muestra según ciudad del cliente (pendiente multi-moneda)
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
- `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md` — Plan (25 tasks, 5 sprints)
- Sprint 4 completado: A6.img ✅ A6.kb ✅ B6 ✅ B7 ✅ C4 ✅ C7 ✅ C8 ✅ B8 ✅ **A12 ✅**
- **A12 COMPLETADO**: Eval 97.3% (182/187) reviewed. Reporte en `server/reports/a12-eval-final-2026-06-30.md`. 12 fixes en router y pre-router.
- Fase 2: Meta adapter (WhatsApp/IG/Messenger) — spec en `server/docs/meta-adapter-spec.md`

## Comandos clave
```bash
# Backend dev
cd server && npm run dev          # Puerto 8787
cd server && npx vitest run       # Tests (requiere PG para integración)
cd server && npx tsc --noEmit     # TypeScript check

# Frontend dev
npm run dev                       # Puerto 3001
npx playwright test               # E2E (requiere frontend + backend corriendo)

# Eval
cd server && npx tsx src/agent/v2/eval/eval-runner.ts

# Seed (requiere PG)
cd server && npx tsx src/db/seed.ts
```

## Seguridad
- NO committear API key de DeepSeek (está en /Users/alejandropena/ARIA/config/settings.py)
- NO committear GEMINI_API_KEY (en server/.env local)
- bookia_app rol limitado para runtime

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->
