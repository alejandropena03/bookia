---
task_id: TASK-006
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T05:00:00Z
updated_at: 2026-06-12T05:00:00Z
---

## Misión
**Cerrar los huecos del hito (TASK-005) antes de avanzar a features nuevas.** El cerebro funciona pero tiene un bug serio de persistencia y 3 cosas incompletas. Esta tarea los corrige. Claude revisó el código real; los detalles son precisos.

## 🔴 FIX 1 (serio) — Persistir las respuestas del bot
**Problema:** en `server/src/agent/orchestrator.ts`, `emitResponse()` solo emite por SSE pero NUNCA hace INSERT en `messages`. Las respuestas del agente no quedan en la DB (rompe historial, dashboard, "ver conversación"). Además inventa un `crypto.randomUUID()` en vez del id real.
**Fix:** antes de emitir, INSERTAR el mensaje outbound en `messages` (direction='outbound', sender_type='bot' o 'human' si escaló, text=respuesta, content_type='text', provider_message_id generado tipo `bot_<uuid>` para no chocar con la idempotencia). Usar el id y created_at reales de ese INSERT en el evento SSE. Debe ir dentro del mismo `withTenant`/sql del pipeline. Hazlo en UN helper `persistAndEmit(sql, ...)` para no repetir en cada rama del pipeline.
**Criterio:** tras una conversación, `SELECT direction, sender_type, text FROM messages WHERE conversation_id=... ORDER BY created_at` muestra inbound Y outbound intercalados. Pega el output.

## 🟠 FIX 2 — Escalación coherente y configurable
**Problemas:** (a) en `escalation.ts`, el chequeo `confidence < 0.4 → return false` ocurre ANTES de los keywords, así que un "tuve una emergencia" con baja confianza NO escala (al revés de lo correcto). (b) Usa keywords hardcoded e ignora `business_profile.rules.escalation` del seed.
**Fix:** (a) revisar SIEMPRE los keywords/reglas primero; la baja confianza es una señal ADICIONAL de escalación (o de fallback a humano), no un cortocircuito que la impide. (b) cargar las reglas desde `business_profile.rules` del tenant; si no hay, usar las default. Mantén la lista default como fallback.
**Criterio:** test: "tuve una reacción alérgica" escala aunque confidence sea baja; "hola" no escala. Reglas vienen del profile. Pega outputs.

## 🟠 FIX 3 — BookingProvider (mock + handoff) y cierre del flujo
**Problema:** el flujo de agendamiento llega a "envíanos el comprobante" pero no hay cierre real. La §5.5 del TDD (actualizada) pide BookingProvider configurable.
**Fix:**
- `server/src/booking/types.ts` — interfaz `BookingProvider { getAvailableSlots, findOrCreateClient, createBooking }` (firmas simples; ver §5.5).
- `server/src/booking/mock.ts` — `MockBookingProvider`: "crea" la reserva guardándola (puedes usar una tabla `bookings` simple — crea migración con tenant_id + RLS — o por ahora loguear+devolver un id simulado; prefiero tabla `bookings` para que el dashboard la use luego).
- `server/src/booking/handoff.ts` — `HandoffBookingProvider`: NO confirma; dispara escalación/notificación al operador con los datos recolectados.
- `server/src/booking/index.ts` — factory por `business_profile.booking_mode` (default 'mock' del seed).
- Conectar el estado `confirm_booking` del flujo (o el final del flujo de agendamiento) para que llame al provider resuelto. En modo mock responde "¡Cita confirmada!" con los datos; en handoff responde "te confirmamos en breve" y escala.
- Añade `booking_mode` a `business_profile` (columna o dentro de `rules`/nuevo campo) y al seed con valor 'mock'.
**Criterio:** flujo de agendamiento en modo mock termina creando una booking (pega el SELECT de `bookings`); en modo handoff escala con los datos. Pega ambas transcripciones.

## 🟡 FIX 4 — Interpolar precio/catálogo en el flujo + Zod en router
- El motor de flujo debe poblar `service_name` y `service_price` desde `catalog_items` cuando el cliente elige un servicio (matchear el texto del cliente contra el catálogo del tenant). `{catalog_list}` debe renderizar la lista real de servicios.
- En `router.ts`: validar la salida del LLM con Zod y tolerar que el modelo envuelva el JSON en ```json ... ``` (stripear fences antes de parsear). Si falla → intent "otro" con confidence 0.
**Criterio:** transcripción muestra "Has elegido: Limpieza facial ($X)" con precio real. Router parsea aunque venga con fences.

## Criterio de completación global (pega outputs)
1. `npm test` (añade/actualiza tests para: persistencia de outbound, escalación corregida, booking mock+handoff, interpolación de precio, router con fences) + `npm run build` pasan.
2. Transcripción E2E en modo mock: agendamiento completo que termina con booking creada y persistida (inbound+outbound en messages).
3. Transcripción de escalación correcta.
4. `docker compose up` + seed + demo funcionando.

## Fuera de alcance
- AgendaProProvider real (post-MVP).
- Inbox humano UI / endpoints de dashboard (TASK-007).
- Deuda is_active integer→boolean (sigue anotada, no la toques salvo que crees la tabla bookings, ahí usa boolean).

## Notas
- Este es cierre de calidad del cerebro; cuando pase, el agente queda sólido y recién ahí avanzamos a inbox/dashboard/canales reales.
- Commit(s) idealmente uno por FIX para revisión limpia. Al terminar: `status: WAITING_FOR_CLAUDE`, llena Resultado, línea en HANDOFF_LOG, push.

## Resultado de OpenCode
_(llenar)_
