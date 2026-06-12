---
task_id: TASK-005
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
created_at: 2026-06-12T03:00:00Z
updated_at: 2026-06-12T03:00:00Z
batch: "TASK-003..005 emitidas juntas."
---

## Misión
Implementar el **cerebro híbrido del agente**: router + motor de flujos (state-machine) + responder LLM + templating de variables + escalación. Conectarlo al pipeline de `ingestInbound` (TASK-003) usando la capa LLM (TASK-004), de modo que una conversación simulada complete el **flujo de agendamiento end-to-end** y responda preguntas abiertas. Este es el hito: **el agente respondiendo solo, en vivo, con el negocio cargado.**

## Contexto
- Fuente de verdad: `docs/TDD-BACKEND-MVP.md` §5 completo (5.1 router, 5.2 motor de flujos, 5.3 responder, 5.3.bis templating, 5.3.ter escalación, 5.4 modelo).
- Ya existe: ingestInbound (persiste+emite), MockAdapter+SSE, capa LLM (DeepSeek+Mock), seed con flow `agendamiento` y business_profile de Santa María placeholder.
- Arquitectura híbrida: flujos críticos = determinísticos (respuestas predefinidas del flow.definition + templating), preguntas abiertas = LLM con system prompt (persona + catálogo). El LLM NO redacta las respuestas canned.

## Entregable
1. **`server/src/agent/router.ts`** — clasifica intención del mensaje (usa LLM barato): `{ intent: agendamiento|faq|precio|queja|charla|otro, confidence, extractedSlots }`. Valida salida con Zod; si falla → intent `otro` (abierto).
2. **`server/src/flows/engine.ts`** — motor genérico que lee `flows.definition`, mantiene estado en `conversation_state`, avanza según input, devuelve respuesta predefinida renderizada. Determinístico.
3. **`server/src/flows/template.ts`** — `renderTemplate(text, context)` que sustituye `{variable}` con slots. Fallback seguro.
4. **`server/src/agent/responder.ts`** — para preguntas abiertas: arma system prompt (persona + catálogo + reglas) y llama al LLM responder.
5. **`server/src/agent/escalation.ts`** — evalúa reglas de escalación + baja confianza del router.
6. **`server/src/agent/orchestrator.ts`** — pipeline §5: recibe mensaje persistido, carga contexto, corre router → (flujo ? engine : responder) → escalación → emite respuesta. Conectado desde `sim.ts`.
7. **Tabla `conversation_state`** (tenant_id, conversation_id, flow_key, current_state, slots jsonb) con RLS.

## Criterio de completación
1. ✅ Con `LLM_PROVIDER=mock`: conversación simulada recorre TODO el flujo de agendamiento end-to-end. Transcripción abajo.
2. ✅ Pregunta abierta cae en responder LLM (mock) y responde.
3. ✅ Escalación: "tuve una reacción alérgica" → `escalated` + notificación.
4. ✅ Idempotencia: reprocesar mismo inbound no duplica.
5. ✅ `npm test` (39 tests) + `npm run build` pasan.

## Notas
- DeepSeek API reemplazó OpenRouter por decisión de Alejandro.
- `bookia_app` pool configurado con `max: 1` para consistencia de session-level GUC.
- Minor TODO: template `{catalog_list}` y `{service_price}` no se interpolan desde catálogo real. Se resuelve al integrar catálogo en template context.
- **BookingProvider pendiente:** Claude agregó §5.5 actualizado en la revisión del queue: interfaz `BookingProvider` con `MockBookingProvider` (demo) y `HandoffBookingProvider` (workflow real Santa María), factory por `business_profile.booking_mode`. No implementado aún — queda para revisión de Claude o TASK posterior.

## Transcripción demo
```
POST → "Quiero agendar una cita" → "¡Hola Ana! ¿De qué ciudad nos escribes?"
POST → "Bogotá"                 → "Tenemos estos servicios... ¿Cuál te interesa?"
POST → "Limpieza facial"        → "Has elegido: Limpieza facial... ¿Te gustaría agendar?"
POST → "si, quiero"             → "Perfecto. ¿Qué día y hora te gustaría agendar?"
POST → "Manana a las 3pm"       → "Para confirmar tu cita... ¿Cómo prefieres pagar?"
POST → "Transferencia"          → "¡Gracias! Una vez realices el pago... envíanos el comprobante"
```

## Resultado de OpenCode
TASK-005 implementado. 39 tests, build compila, Docker corriendo, flujo E2E funcional.
Cambios estructurales para alinearse con specs de Claude:
- `server/src/flows/engine.ts` (antes agent/flow-engine.ts)
- `server/src/flows/template.ts` (antes agent/template.ts)
- `server/src/agent/orchestrator.ts` (antes agent/service.ts)
- `conversation_state` table en vez de columnas en conversations
