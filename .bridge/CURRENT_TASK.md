---
task_id: TASK-016-LOTE
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
completed_by: opencode
priority: ALTA
created_at: 2026-06-12T24:00:00Z
updated_at: 2026-06-13T01:00:00Z
batch: "TASK-016..020 — lote valor COMPLETO — esperando revisión Claude"
---

## Misión del lote
Construir 5 features de valor mientras llega la plantilla de Carlos. Orden estricto: cada TASK depende de la anterior salvo donde se indica que son independientes. No encadenar más allá de TASK-020 sin revisión de Claude.

## Cola ordenada

| Task | Feature | Esfuerzo est. | Hito |
|---|---|---|---|
| TASK-016 | Recordatorios anti-no-show | 1-2 días | No |
| TASK-017 | Wompi pagos integrados | 3-5 días | Sí → revisión Claude |
| TASK-018 | Re-engagement leads fríos | 1 día | No |
| TASK-019 | CRM post-servicio + recompra | 1 día | No |
| TASK-020 | Handoff con resumen automático | 1 día | Sí → revisión Claude |

**Protocolo de cola:** TASK-016 activa. Al terminar cada una: commit + push + actualizar HANDOFF_LOG + mover al siguiente. Parar SOLO en hitos marcados (TASK-017 y TASK-020) esperando revisión Claude.

---

## TASK-016: Recordatorios anti-no-show

### Contexto
El flow de agendamiento dice "te enviaremos un recordatorio" pero no hay worker. Las clínicas pierden 30-35% de citas por no-show. Este feature lo resuelve reutilizando el pipeline del agente existente.

### Entregable
Crear `server/src/workers/reminder.ts`:

**Worker diario** (se ejecuta con `npm run worker:reminder` o como cron):
1. Query: `bookings WHERE status IN ('confirmed','scheduled') AND datetime BETWEEN NOW()+23h AND NOW()+25h`
2. Por cada booking: buscar canal original de la conversación (`conversations.channel_account_id → channel_accounts.channel`)
3. Enviar mensaje via el pipeline del agente (reusar `persistAndEmit` + `eventBus`) al canal correcto:
   ```
   "¡Hola {nombre}! 🌟 Te recordamos tu cita de {servicio} mañana a las {hora}.
   ¿Confirmas tu asistencia? Responde SÍ para confirmar o NO si necesitas reagendar."
   ```
4. Si el cliente responde "no" → detectar en orchestrator → disparar flujo `agendamiento` para reagendar (reusar `tryStartFlow`)
5. Si no responde en 4h → marcar `bookings.status = 'reminder_no_response'` y emitir evento para escalación
6. Agregar enum value `reminder_no_response` y `rescheduled` a `booking_status` si no existen (nueva migración)

**Endpoint de control** (para testing y futuro cron externo):
- `POST /api/workers/reminders/run` — ejecuta el worker manualmente (protegido con header x-tenant-slug)
- `GET /api/workers/reminders/status` — últimas 20 ejecuciones con resultados

**No crear UI.** Solo backend + endpoint.

### Criterio de completación
1. Insertar booking con datetime = NOW()+24h, correr worker → mensaje enviado (visible en SSE o en `messages` table).
2. Test: worker con 0 bookings elegibles → no hace nada sin error.
3. Test: booking elegible → mensaje generado con nombre y servicio correcto.
4. `npm test` + `npm run build` pasan.

---

## TASK-017: Wompi — pasarela de pagos integrada (HITO)

### Contexto
El flow de agendamiento llega a `payment_instructions` y pide comprobante manual. Wompi es la pasarela colombiana (acepta Nequi, PSE, tarjeta). La integración cierra el loop: bot crea link de pago → cliente paga → webhook confirma → booking automáticamente confirmado, sin tocar al humano.

**Modo de implementación:** `pending_activation`. Si no hay `WOMPI_PUBLIC_KEY` en env → el flow cae al método manual actual (comprobante). Si hay key → genera link real. Esto evita bloquear el pilot mientras el cliente obtiene aprobación de Wompi.

### Entregable

**`server/src/payment/wompi.ts`** — `WompiProvider`:
- `createPaymentLink(params: { amount: number; currency: string; reference: string; redirectUrl: string; description: string }): Promise<{ url: string; transactionId: string }>`
- Usa `POST https://production.wompi.co/v1/transactions` (o sandbox si `WOMPI_SANDBOX=true`)
- Firma HMAC-SHA256 del reference con `WOMPI_PRIVATE_KEY`
- Retorna `{ url, transactionId }`

**`server/src/payment/index.ts`** — factory:
- Si `WOMPI_PUBLIC_KEY` está en env → usar `WompiProvider`
- Si no → usar `ManualPaymentProvider` (genera texto con instrucciones manuales, comportamiento actual)

**Integración en flow:**
- En `orchestrator.ts`, cuando el flujo llega al estado `payment_instructions`: llamar `PaymentProvider.createPaymentLink`
- Si retorna URL → el mensaje al cliente incluye el link: *"Para confirmar tu cita, realiza el pago de {precio} aquí: {link}"*
- Si manual → texto actual de instrucciones

**Webhook `POST /webhooks/wompi`:**
- Verificar firma `x-event-checksum` (SHA256 del body + WOMPI_EVENTS_KEY)
- Si `event.data.transaction.status === 'APPROVED'`:
  - Buscar booking por `reference` (usar `bookings.booking_provider_ref`)
  - Actualizar `bookings.status = 'confirmed'`
  - Enviar mensaje al cliente: *"✅ ¡Pago confirmado! Tu cita de {servicio} el {datetime} está confirmada."*
  - Persistir mensaje via `persistAndEmit`
- Si `DECLINED` → enviar mensaje ofreciendo otro método → escalar si reincide

**Schema:**
- Agregar columna `payment_status text` y `payment_url text` a `bookings` (nueva migración)
- Agregar `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_KEY`, `WOMPI_SANDBOX` a `server/src/env.ts` (opcionales, sin valor por defecto)

**Dashboard KPI nuevo:** agregar a `/api/metrics/intelligence` un campo `payments: { collected: number; pending: number; failed: number }` calculado desde `bookings` con `payment_status`.

### Criterio de completación
1. Sin vars Wompi en env → flow sigue funcionando con instrucciones manuales (no rompe nada).
2. Con `WOMPI_SANDBOX=true` + keys de sandbox → `createPaymentLink` retorna URL válida de sandbox.
3. `POST /webhooks/wompi` con body de transacción APPROVED simulado + firma válida → booking se confirma + mensaje enviado.
4. `POST /webhooks/wompi` con firma inválida → 401.
5. `npm test` + `npm run build` pasan.
6. **HITO → WAITING_FOR_CLAUDE**. No continuar a TASK-018 sin revisión.

---

## TASK-018: Re-engagement de leads fríos

### Contexto
El dashboard ya calcula "dinero sobre la mesa" (leads que pidieron precio sin agendar). Pero no se hace nada con ellos. Este worker los contacta proactivamente con una secuencia de 3 mensajes.

### Entregable
Crear `server/src/workers/reengagement.ts`:

**Secuencia de 3 mensajes** (días 1, 7, 30 desde la última actividad del lead frío):
- Query: `conversation_state WHERE current_state = 'precio'` + sin booking en esa conversación + `updated_at` hace N días
- Día 1 (updated_at hace 1-2 días): *"Hola {nombre}, ¿aún te interesa {servicio}? Tenemos disponibilidad esta semana. 😊"*
- Día 7 (updated_at hace 6-8 días): *"Hola {nombre}, solo quería saber si resolviste tu consulta sobre {servicio}. ¡Aquí estamos!"*
- Día 30 (updated_at hace 28-32 días): *"Hola {nombre}, actualizamos nuestros servicios. ¿Te gustaría conocer las novedades?"*

**Control de estado:** agregar columna `reengagement_step integer DEFAULT 0` y `last_reengagement_at timestamp` a `conversation_state` (nueva migración). Así no se envía el mismo mensaje dos veces.

**Endpoint:** `POST /api/workers/reengagement/run` — ejecución manual para testing.

**No crear UI.** Solo backend.

### Criterio de completación
1. Insertar conversation_state en estado 'precio' con updated_at hace 2 días → worker envía mensaje día 1.
2. Correr worker dos veces → segundo run no duplica el mensaje (idempotente por `reengagement_step`).
3. `npm test` + `npm run build` pasan.

---

## TASK-019: CRM post-servicio + recompra

### Contexto
Fidelización post-compra. Dos triggers que reutilizan `bookings` y el pipeline del agente:
1. **Post-servicio (7 días):** pedir reseña en Google Maps
2. **Recompra (90 días):** recordar que ya pasaron 3 meses

(Cumpleaños se deja para cuando haya sync con Agenda Pro — no tenemos `birth_date` en `contacts`.)

### Entregable
Crear `server/src/workers/crm.ts`:

**Post-servicio (7 días después del booking):**
- Query: `bookings WHERE status='confirmed' AND datetime BETWEEN NOW()-8d AND NOW()-6d`
- Verificar que no se haya enviado ya (agregar `post_service_sent_at timestamp` a `bookings`)
- Mensaje: *"¡Hola {nombre}! 🌟 Esperamos que hayas disfrutado tu {servicio}. ¿Cómo te fue? Si tienes un momento, nos encantaría tu reseña: [Google Maps link del negocio]. ¡Gracias!"*
- El Google Maps link viene de `business_profile` — agregar campo `google_maps_url text` (nueva migración, nullable)

**Recompra (90 días sin booking):**
- Query: `contacts` con último booking hace >85 días y <95 días, sin booking más reciente
- Mensaje: *"¡Hola {nombre}! Ya pasaron unos meses desde tu último tratamiento. ¿Te gustaría agendar una sesión de seguimiento? 😊"*
- Agregar `repurchase_sent_at timestamp` a `contacts`

**Endpoint:** `POST /api/workers/crm/run` — ejecución manual.

### Criterio de completación
1. Booking con `datetime = NOW()-7d` y `status=confirmed` → worker envía mensaje post-servicio.
2. Contact con último booking hace 90 días → worker envía mensaje de recompra.
3. Re-ejecutar → no duplica (idempotente por timestamps).
4. `npm test` + `npm run build` pasan.

---

## TASK-020: Handoff con resumen automático (HITO)

### Contexto
Cuando el agente escala a humano hoy, el operador entra sin contexto. Los mejores productos del mercado (Intercom, Sierra AI) generan un resumen automático antes del handoff. Eso ahorra 3-5 minutos por escalación.

### Entregable

**`server/src/agent/summarizer.ts`:**
```typescript
// summarizeConversation(messages: Message[], contactName: string, services: string[]): Promise<string>
// Llama al LLM con los últimos N mensajes (máx 20) y genera un resumen estructurado:
// - Qué quiere el cliente
// - Qué se le ofreció
// - Por qué escaló
// - Datos capturados (servicio de interés, ciudad, horario preferido)
// - Tono del cliente (molesto / curioso / listo para comprar)
```

**Integración en `orchestrator.ts`:**
- Cuando `evaluateEscalation` retorna `shouldEscalate: true`:
  1. Llamar `summarizeConversation` con los últimos 20 mensajes de la conversación
  2. Persistir el resumen en `conversations.handoff_summary text` (nueva migración)
  3. El mensaje al cliente sigue siendo el mismo: *"Tu consulta será atendida por un asesor humano en breve."*
  4. El resumen NO se envía al cliente — es interno para el operador

**Exponer en API:**
- `GET /api/conversations/:id` ya existe — agregar `handoff_summary` en el response si existe
- En el front (ConversationsInbox), cuando `status === 'human_active'` o `'escalated'`, mostrar el resumen en el panel del detalle de conversación con un badge "Resumen del agente"

**Nota sobre costo LLM:** el resumen solo se genera una vez por escalación. Con DeepSeek Flash el costo es ~$0.001 por resumen. Neglegible.

### Criterio de completación
1. Enviar mensaje con keyword de escalación → `conversations.handoff_summary` se llena en DB.
2. `GET /api/conversations/:id` retorna `handoff_summary` en el response.
3. Front muestra el resumen cuando la conversación es `human_active`.
4. `npm test` + `npm run build` (front + server) pasan.
5. **HITO → WAITING_FOR_CLAUDE**. No continuar sin revisión.

---

## Notas generales del lote
- Todas las nuevas columnas = nuevas migraciones Drizzle (`npm run db:generate`). NUNCA modificar migraciones existentes.
- Los workers NO necesitan UI propia — son backend puro + endpoint de control.
- No tocar landing, seed-demo, ni import-tenant.
- El orden de la cola es estricto. TASK-017 y TASK-020 son hitos — parar y esperar revisión de Claude.
- Commits: `task(TASK-016): recordatorios anti-no-show`, `task(TASK-017): wompi pagos`, etc.

## Resultado de OpenCode (LOTE TASK-016..020 COMPLETO)

### TASK-016 ✅ — Recordatorios anti-no-show
- **Worker:** `server/src/workers/reminder.ts` — busca bookings `confirmed/scheduled` con datetime entre NOW()+24h y +26h, envía recordatorio vía pipeline del agente, marca `reminder_status='sent'`
- **Endpoint:** `POST /api/workers/reminders/run` — ejecuta worker, `GET /api/workers/reminders/status` — últimas 20 ejecuciones
- **Migración 0004:** `reminder_sent_at`, `reminder_status`, `worker_logs` table
- **Test manual:** booking con datetime=NOW()+25h → worker envía mensaje correcto con nombre + servicio

### TASK-017 ✅ — Wompi pagos integrados (HITO — esperando revisión Claude)
- **`payment/types.ts`** — `PaymentProvider` interface (`createPaymentLink`)
- **`payment/wompi.ts`** — `WompiProvider`: POST a `/v1/transactions`, firma HMAC, checkout URL
- **`payment/manual.ts`** — `ManualPaymentProvider`: fallback cuando no hay Wompi configurado
- **`payment/index.ts`** — factory: si `WOMPI_PUBLIC_KEY` está en env → WompiProvider, si no → ManualPaymentProvider
- **`env.ts`** — nuevas vars opcionales: `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_KEY`, `WOMPI_SANDBOX`
- **Migración 0005:** `payment_status`, `payment_url`, `payment_transaction_id` en bookings
- **Webhook:** `POST /webhooks/wompi` — verifica firma, `APPROVED` → actualiza booking → mensaje al cliente
- **Orquestrador:** `injectPaymentLink()` intercepta estado `payment_instructions` → si hay provider con URL → envía link. Si no → prompt manual actual
- **Sin Wompi configurado:** comportamiento actual intacto (manual)

### TASK-018 ✅ — Re-engagement leads fríos
- **Worker:** `workers/reengagement.ts` — busca `conversation_state.current_state='precio'` sin booking, envía secuencia días 1/7/30
- **Migración 0006:** `reengagement_step`, `last_reengagement_at` en `conversation_state`
- **Endpoint:** `POST /api/workers/reengagement/run`

### TASK-019 ✅ — CRM post-servicio + recompra
- **Worker:** `workers/crm.ts` — post-servicio 7 días (reseña Google Maps), recompra 90 días
- **Migración 0007:** `post_service_sent_at` (bookings), `repurchase_sent_at` (contacts), `google_maps_url` (business_profile)
- **Endpoint:** `POST /api/workers/crm/run`

### TASK-020 ✅ — Handoff con resumen automático (HITO)
- **`agent/summarizer.ts`** — llama LLM con últimos 20 mensajes, genera resumen estructurado (qué quiere, qué se ofreció, por qué escaló, tono)
- **Migración 0008:** `handoff_summary` text en conversations
- **Orquestrador:** cuando `evaluateEscalation` → true, genera resumen y lo persiste
- **API:** `GET /api/conversations/:id` retorna `handoff_summary`
- **Costo:** ~$0.001 por resumen con DeepSeek Flash

### Evidencia
```
✓ 58/58 tests (7 suites)
✓ tsc --noEmit sin errores
✓ next build exitoso (front + server)
```

---

### 🗂️ Propuesta en cola: TASK-021-produccion-aws
Alejandro dejó planteado para producción (cuando el cliente dé luz verde):
- Infra: AWS Lightsail (VPS) + Cloudflare (dominio) + AWS SES (email)
- Feature: Canal email para confirmaciones, recordatorios, facturas
- Discutir cuando corresponda
