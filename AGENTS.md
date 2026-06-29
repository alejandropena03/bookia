# Bookia — Facts del proyecto

## Stack
- Backend: Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + Vitest
- Frontend: Next.js 16 + React 19 + shadcn/ui + Base UI + Recharts + Zustand

## Estado (actualizado 2026-06-29)
- MVP funcional esperando credenciales
- **Tests: 283/283 pass** (vitest, 3.72s). Suites: agent(26) + v2-agent(114) + v2-flow-adapter(17) + v2-flow-e2e(10) + v2-memory-persistence(24) + v2-memory-integration(11) + rls(6) + dashboard(9) + channels(8) + intelligence(7) + health(2) + santa-maria(42) + llm(7)
- Pipeline V2 completo: safetyPreRoute → deterministicDomainRoute → LLM → postRiskScan → applyOverrides → classifyIntent → policy → flowAdapter → canned → llm → critic → metrics
- **Eval V2: 62.8% (258/411)** sobre 411 casos. V1 vs V2: 26.3% vs 62.8%. 0 regresiones. **No 87.7%** — esa cifra era de un case set viejo (164/187).
- Golden validators: **34/39 (87.2%)** — 5 fallos no reparables por límite de contexto conversacional.
- Clinical audit: 0/411 failures (PR6.1 enforcement activo)
- Modelo: deepseek-v4-flash
- **V2 desactivado por flag** (`AGENT_KERNEL_V2` no existe en env tipado). Pipeline listo pero sin persistencia outbound ni SSE (pendiente A2+A3).
- Santa María hyper-personalized: 29 servicios + 24 canned responses + 3 flows + 20 escalation keywords

## Santa María — Archivos clave
- `server/src/flows/santa-maria/catalog.ts` — 29 servicios con precios COP, filtro por ciudad. **Solo COP implementado.** USD/EUR/MXN existen en las imágenes promos pero no en catálogo.
- `server/src/flows/santa-maria/flows.ts` — agendamiento (9 estados) + first_contact + precio (3 estados)
- `server/src/flows/santa-maria/canned-responses.ts` — **24** templates (no 11) + reglas de escalation (20 keywords, notificar a Elkin)
- `server/src/flows/santa-maria/images/manifest.json` — 28 imágenes mapeadas a servicios (del DOCX)
- `server/src/flows/santa-maria/images/` — 28 service cards extraídos del docx de Carlos
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
- `docs/PLAN_IMPLEMENTACION_BOOKIA_MVP_AGENTEV2.md` — Plan GPT-5 (25 tasks, 5 sprints)
- Sprint 0 parcial: C1✅ A1✅ C2⏳ C3⏳
- Siguiente en prioridad: C2 (migrations runner) → C3 (secrets) → A2 (V2 persistencia) → A3 (V2 activación)

## Seguridad
- NO committear API key de DeepSeek (está en /Users/alejandropena/ARIA/config/settings.py)
- NO committear GEMINI_API_KEY (en server/.env local)
- bookia_app rol limitado para runtime

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know — read `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->
