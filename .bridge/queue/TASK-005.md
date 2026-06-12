---
task_id: TASK-005
status: QUEUED
owner: opencode
created_by: claude
depends_on: TASK-004
---

## Misión
Implementar el **cerebro híbrido del agente**: router + motor de flujos (state-machine) + responder LLM + templating de variables + escalación. Conectarlo al pipeline de `ingestInbound` (TASK-003) usando la capa LLM (TASK-004), de modo que una conversación simulada complete el **flujo de agendamiento end-to-end** y responda preguntas abiertas. Este es el hito: **el agente respondiendo solo, en vivo, con el negocio cargado.**

## Contexto
- Fuente de verdad: `docs/TDD-BACKEND-MVP.md` §5 completo (5.1 router, 5.2 motor de flujos, 5.3 responder, 5.3.bis templating, 5.3.ter escalación, 5.4 modelo).
- Ya existe: ingestInbound (persiste+emite), MockAdapter+SSE, capa LLM (OpenRouter+Mock), seed con flow `agendamiento` y business_profile de Santa María placeholder.
- Arquitectura híbrida: flujos críticos = determinísticos (respuestas predefinidas del flow.definition + templating), preguntas abiertas = LLM con system prompt (persona + catálogo). El LLM NO redacta las respuestas canned.

## Entregable
1. **`server/src/agent/router.ts`** — clasifica intención del mensaje (usa LLM barato): `{ intent: agendamiento|faq|precio|queja|charla|otro, confidence, extractedSlots }`. Valida salida con Zod; si falla → intent `otro` (abierto).
2. **`server/src/flows/engine.ts`** — motor genérico que lee `flows.definition` (shape del seed: `{ initial, states: { [s]: { prompt, collects, next, transitions, description } } }`), mantiene el estado del flujo en la conversación (qué estado, slots recolectados — persistir en conversations o tabla auxiliar `conversation_state`; crea la columna/tabla si hace falta vía migración), avanza según el input, y devuelve la respuesta predefinida renderizada. Determinístico.
3. **`server/src/flows/template.ts`** — `renderTemplate(text, context)` que sustituye `{nombre}`, `{ciudad}`, `{service_name}`, `{service_price}`, `{datetime}`, etc. con slots de la conversación/contacto/catálogo. Variables faltantes → fallback seguro (no dejar `{var}` crudo).
4. **`server/src/agent/responder.ts`** — para preguntas abiertas: arma system prompt (persona + catálogo estructurado + reglas del business_profile) y llama al LLM responder. Reglas duras: no inventar precios fuera del catálogo.
5. **`server/src/agent/escalation.ts`** — evalúa reglas de `business_profile.rules.escalation` + baja confianza del router; si aplica, marca conversación `escalated`/`human_active`, registra el motivo y emite evento de notificación.
6. **`server/src/agent/orchestrator.ts`** — el pipeline §5: recibe el mensaje persistido (hook desde ingestInbound), carga contexto (últimas N msgs + estado de flujo), corre router → (flujo activo/ detectado ? engine : responder) → chequea escalación → envía respuesta vía adapter (`sendMessage`) → persiste el outbound. Idempotente y con manejo de errores (si el LLM falla, respuesta de fallback + log).
7. Conectar el orchestrator a `ingestInbound` (en TASK-003 quedó como TODO).

## Criterio de completación (pega outputs)
1. Con `LLM_PROVIDER=mock` (sin red): una conversación simulada que recorre TODO el flujo de agendamiento (ciudad→servicio→confirmar→fecha→pago→comprobante→datos→confirmar cita) responde con las respuestas predefinidas renderizadas con variables. Pega la transcripción.
2. Una pregunta abierta ("¿el masaje incluye aceites?") cae en responder LLM (mock) y responde usando catálogo. Pega transcripción.
3. Un mensaje que dispara escalación ("tuve una reacción alérgica") marca la conversación `escalated` y emite notificación. Pega evidencia.
4. Idempotencia: reprocesar el mismo inbound no duplica outbound.
5. `npm test` (router con mock, engine transiciones, template render, escalación) + `npm run build` pasan.
6. (Opcional, si hay OPENROUTER_API_KEY) correr el mismo flujo con un modelo real barato y pegar muestra.

## Fuera de alcance
- Integración real con Agenda Pro (BookingProvider real) — el `confirm_booking` por ahora usa MockBookingProvider o un stub que loguea "cita creada". La interfaz BookingProvider (§5.5) se implementa en una tarea posterior.
- Inbox humano / endpoints de dashboard (TASK posterior).
- Adapters reales de canal.

## Notas
- Si necesitas persistir el estado del flujo, prefiero una tabla `conversation_state` (tenant_id, conversation_id, flow_key, current_state, slots jsonb) con su RLS, a meter todo en conversations. Tú decides y documentas; crea la migración.
- El orchestrator debe ser robusto: cualquier excepción del LLM → respuesta de cortesía + escalación opcional, nunca crash del webhook.
- Este es el entregable que el dueño quiere VER funcionando. Cuida que la transcripción de la demo se vea natural.
- Al terminar: `status: WAITING_FOR_CLAUDE` (este SÍ quiero revisarlo a fondo antes de seguir). Commit `task(TASK-005): cerebro híbrido del agente end-to-end`, push, HANDOFF_LOG.
