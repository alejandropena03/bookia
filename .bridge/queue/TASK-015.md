---
task_id: TASK-015
status: QUEUED
owner: opencode
created_by: claude
priority: ALTA
---

## Misión
**Construir el motor de hiperpersonalización completo**, de modo que cuando llegue la plantilla llena de Carlos, sea un único comando (`npm run import:tenant`) y el agente quede configurado con la voz, reglas y respuestas del cliente — sin tocar código.

Esto NO es "llenar la plantilla de Santa María". Es construir la infraestructura que acepta CUALQUIER plantilla de cualquier cliente futuro.

## Contexto del estado actual

Lo que ya existe (NO tocar salvo bugs):
- `flows/engine.ts` — state-machine genérica funcional, flujo "agendamiento" E2E
- `flows/template.ts` — interpolación de `{variables}` funcional
- `agent/orchestrator.ts` — pipeline completo (flow → router → escalation → canned → llm)
- `agent/router.ts` — clasifica intent
- `agent/escalation.ts` — evalúa escalación (DEFAULT_RULES + rules de business_profile)
- `booking/` — BookingProvider mock/handoff

Lo que está ROTO o INCOMPLETO (esto es lo que hay que arreglar):

1. **`responder.ts` — system prompt hardcodeado**: La línea 16 dice `"Eres un asistente virtual de una clínica estética."` — hardcodeado para clínicas. Debe construirse 100% desde la DB.

2. **`responder.ts` — `systemPromptOverrides` nunca se usa**: El campo existe en `business_profile` y en el schema, pero nunca se lee ni se aplica.

3. **`responder.ts` — canned responses hardcodeadas**: `CANNED_RESPONSES` son 3 strings fijos en el código. Deben venir de la DB (`canned_responses` table, o un JSONB en `business_profile`).

4. **Horarios: nunca se validan**: `business_profile.hours` se carga y se manda al LLM como string, pero el agente **nunca verifica si el mensaje llega dentro del horario**. Si llega a las 2am, el agente responde igual. Debe chequear y responder con `rules.respuesta_fuera_de_horario`.

5. **`escalation.ts` — mismatch de formato**: El seed define las escalation rules como `{ condition: "...", action, notify }`. El código busca `{ keyword, reason }`. Las rules de negocio del cliente **no se están aplicando**. Hay que normalizar: el formato canónico será `{ keyword, reason, notify? }` — actualizar `extractRules()` para mapear `condition → keyword`.

6. **Flujo `first_contact` no existe**: El agente no tiene un flujo de primer contacto. Cuando un cliente escribe por primera vez, no hay saludo personalizado con el nombre del asistente ni menú de opciones. El flow-engine ya soporta esto — falta el flujo en seed y la lógica que lo dispara.

7. **`orchestrator.ts` — `tryStartFlow` solo reconoce "agendamiento"**: Hardcodeado en línea 153. Debe leer los flows disponibles del tenant desde la DB y dispararlos según la key que el router clasifique.

---

## Entregables

### FIX-1: System prompt 100% desde DB (responder.ts)

Reemplazar el `systemPrompt` hardcodeado por uno construido dinámicamente:

```typescript
// Antes (hardcodeado):
const systemPrompt = `Eres un asistente virtual de una clínica estética.
Personalidad: ${context.persona}...`

// Después (dinámico):
// Si business_profile.system_prompt_overrides NO es null:
//   → usar ese string DIRECTAMENTE como system prompt (el cliente lo escribe completo)
// Si es null:
//   → construir desde las partes: persona + catalog + rules_formatted + hours_formatted + instrucciones_base
```

`BusinessContext` debe incluir `systemPromptOverrides: string | null`. Leer de `business_profile.system_prompt_overrides` en `loadBusinessContext()`.

### FIX-2: Validación de horario antes de responder (orchestrator.ts)

Después de verificar si la conversación es human_active, agregar:

```typescript
// Verificar horario ANTES de cualquier otra lógica
const outOfHours = isOutOfHours(bizContext.hours, new Date())
if (outOfHours) {
  const offHoursMsg = bizContext.offHoursMessage ?? "Gracias por escribirnos. En este momento estamos fuera de horario. Te contactaremos en cuanto abramos."
  const msgId = await persistAndEmit(...)
  return { text: offHoursMsg, route: "canned", escalated: false }
}
```

Crear `server/src/lib/hours.ts`:
```typescript
// isOutOfHours(hours: Record<string, { open: string; close: string }>, now: Date): boolean
// hours tiene keys: "lunes", "martes", ..., "domingo"
// Mapear getDay() → nombre del día en español
// Parsear "09:00" y "22:30" → comparar con hora actual
// Si el día no existe en hours → considerar cerrado
```

`BusinessContext` debe incluir `offHoursMessage: string | null` — leer de `business_profile.rules.respuesta_fuera_de_horario`.

### FIX-3: Canned responses desde DB (responder.ts + schema)

Las canned responses deben ser configurables por tenant, no hardcodeadas.

**Opción elegida**: guardarlas como JSONB en `business_profile.canned_responses` (estructura: `Record<string, string>` donde key = intent, value = template con `{variables}`).

Cambios:
- `schema.ts`: agregar columna `canned_responses jsonb` a `business_profile` (con migración).
- `loadBusinessContext()`: cargar `canned_responses` de la DB.
- `getCannedResponse()`: buscar en las canned_responses del tenant en vez del objeto hardcodeado. Fallback a DEFAULT si no hay.
- `seed.ts`: poblar `canned_responses` de Santa María con las respuestas que tiene actualmente (charla, faq, precio) + agregar: `agendamiento`, `horario`, `pagos`, `info_general`.

### FIX-4: Escalation rules — normalizar formato (escalation.ts + seed.ts)

El formato canónico en la DB será `{ keyword: string, reason: string, notify?: boolean }`.

- `extractRules()` ya intenta varios formatos — agregar mapeo de `{ condition, action, notify }` → `{ keyword: condition, reason: action, notify }`.
- Actualizar `seed.ts` para que las escalation rules usen el formato canónico `{ keyword, reason, notify }` desde el principio (no `condition/action`).

### FIX-5: Flujo first_contact (seed.ts + orchestrator.ts)

Agregar flujo `first_contact` en `seed.ts`:
```json
{
  "key": "first_contact",
  "description": "Saludo inicial + menú de opciones",
  "definition": {
    "initial": "welcome",
    "states": {
      "welcome": {
        "prompt": "¡Hola {nombre}! Soy {agent_name}, asistente virtual de {business_name}. ¿En qué puedo ayudarte hoy?\n\n1️⃣ Precios y servicios\n2️⃣ Agendar una cita\n3️⃣ Horarios de atención\n4️⃣ Hablar con un asesor",
        "collects": "menu_option",
        "transitions": {
          "1": "show_services",
          "agendar": "redirect_agendamiento",
          "2": "redirect_agendamiento",
          "horario": "show_hours",
          "3": "show_hours",
          "asesor": "escalate",
          "4": "escalate"
        },
        "next": "fallback_llm"
      },
      "show_services": { "prompt": "Estos son nuestros servicios:\n{catalog_list}", "next": null },
      "show_hours": { "prompt": "Nuestro horario de atención:\n{hours_text}", "next": null },
      "redirect_agendamiento": { "prompt": "¡Con gusto! Vamos a agendar tu cita.", "next": null },
      "fallback_llm": { "prompt": null, "next": null }
    }
  }
}
```

En `orchestrator.ts`, antes del paso "Classify intent", agregar lógica de primer contacto:
```typescript
// ¿Es el primer mensaje de esta conversación?
const [msgCount] = await sql`SELECT COUNT(*) as n FROM messages WHERE conversation_id = ${conversationId} AND direction = 'inbound'`
if (Number(msgCount.n) === 1) {
  // Intentar disparar flujo first_contact
  const firstContactResult = await tryStartFlow(sql, conversationId, 'first_contact', catalogItems, contactName)
  if (firstContactResult.executed) { ... }
}
```

### FIX-6: tryStartFlow genérico (orchestrator.ts)

Reemplazar el `if (intent !== "agendamiento")` hardcodeado por lookup en la DB:
```typescript
// En vez de hardcodear "agendamiento":
const [flow] = await sql`
  SELECT key, definition FROM flows
  WHERE tenant_id = ${tenantId}
    AND is_active = 1
    AND key = ${intent}  -- el intent del router debe coincidir con la key del flujo
  LIMIT 1
`
if (flow) { ... iniciar flujo ... }
```

Los flujos de la DB deben tener keys que coincidan con los intents del router: `agendamiento`, `first_contact`, `precios`, etc.

### FEAT-7: Importador de plantilla (server/src/db/import-tenant.ts)

Este es el entregable más importante para el futuro. Un script que:

1. **Lee** `server/src/db/tenant-config/[slug].json` — un archivo JSON con el formato de la plantilla de Carlos convertido a JSON.
2. **Upserta** en la DB:
   - `business_profile`: persona, rules, hours, booking_mode, system_prompt_overrides, canned_responses, off_hours_message.
   - `catalog_items`: servicios con nombre, precio, moneda, categoría, descripción, duración.
   - `flows`: inserta/actualiza flujos (first_contact, agendamiento, y cualquier flujo adicional).
3. **Idempotente**: si se corre dos veces con la misma config, no duplica.
4. **Uso**: `npm run import:tenant -- --slug=santa-maria`

El formato del JSON de configuración (`tenant-config/santa-maria.json`) debe incluir:
```json
{
  "slug": "santa-maria",
  "business_name": "Estética Santa María",
  "agent_name": "Sofia",
  "persona": "...",
  "tone": "amigable",
  "hours": { "lunes": { "open": "09:00", "close": "22:30" }, ... },
  "off_hours_message": "...",
  "system_prompt_overrides": null,
  "booking_mode": "handoff",
  "catalog": [
    { "name": "Depilación láser", "price": 350000, "currency": "COP", "category": "Depilación", "duration_minutes": 45 }
  ],
  "canned_responses": {
    "charla": "¡Hola {nombre}! Soy Sofia de Santa María...",
    "precio": "Con gusto te cuento sobre nuestros precios..."
  },
  "escalation_rules": [
    { "keyword": "emergencia", "reason": "Emergencia médica", "notify": true },
    { "keyword": "reacción", "reason": "Reacción adversa", "notify": true }
  ],
  "flows": { ... }
}
```

Crear también `server/src/db/tenant-config/santa-maria.json` como ejemplo completo (placeholder con los datos actuales del seed, para validar que el importador funciona).

---

## Criterio de completación

1. **FIX-1**: `curl /api/sim/message` con tenant santa-maria → el system prompt del LLM NO contiene "clínica estética" hardcodeado. Si `system_prompt_overrides` tiene valor, se usa ese directamente.
2. **FIX-2**: Cambiar los hours de santa-maria a horario que excluye la hora actual → el agente responde con `off_hours_message` en vez de procesar. Revertir después.
3. **FIX-3**: Las canned responses de charla/faq/precio se leen de la DB, no del código. Cambiar el valor en la DB → el agente usa el nuevo valor.
4. **FIX-4**: Las escalation rules del seed (formato `{ keyword, reason, notify }`) se aplican correctamente al enviar un mensaje con una keyword de escalación.
5. **FIX-5**: Primer mensaje de una conversación nueva dispara flujo `first_contact` con el menú.
6. **FIX-6**: El intent del router puede activar cualquier flujo de la DB por key, no solo "agendamiento".
7. **FEAT-7**: `npm run import:tenant -- --slug=santa-maria` corre sin error, y los datos en la DB coinciden con el JSON de configuración. Idempotente.
8. `npm test` (58+ tests) + `npm run build` pasan.

## Notas
- Al agregar columna `canned_responses` a `business_profile`, crear una migración nueva con Drizzle (`npm run db:generate`), NO modificar la migración existente.
- No tocar el front, la landing, ni seed-demo.ts — solo el servidor.
- El importador es la pieza que desbloquea el pitch: "cuando Carlos nos manda la plantilla, corro un comando y el agente suena exactamente como Sofia de Santa María".
- HITO → `status: WAITING_FOR_CLAUDE`. Commit `task(TASK-015): motor hiperpersonalización`, push, HANDOFF_LOG.
