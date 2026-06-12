---
task_id: TASK-015
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
completed_by: opencode
priority: ALTA
created_at: 2026-06-12T22:30:00Z
updated_at: 2026-06-12T23:30:00Z
---

## Misión
**Construir el motor de hiperpersonalización completo**, de modo que cuando llegue la plantilla llena de Carlos, sea un único comando (`npm run import:tenant`) y el agente quede configurado con la voz, reglas y respuestas del cliente — sin tocar código.

## Contexto del estado actual

Lo que ya existe (NO tocar salvo bugs):
- `flows/engine.ts` — state-machine genérica funcional, flujo "agendamiento" E2E
- `flows/template.ts` — interpolación de `{variables}` funcional
- `agent/orchestrator.ts` — pipeline completo (flow → router → escalation → canned → llm)
- `agent/router.ts` — clasifica intent
- `agent/escalation.ts` — evalúa escalación (DEFAULT_RULES + rules de business_profile)
- `booking/` — BookingProvider mock/handoff

Lo que está ROTO o INCOMPLETO:

1. **`responder.ts` — system prompt hardcodeado** línea 16: `"Eres un asistente virtual de una clínica estética."` — debe construirse 100% desde la DB.
2. **`responder.ts` — `systemPromptOverrides` nunca se usa** — campo existe en schema, nunca se lee.
3. **`responder.ts` — canned responses hardcodeadas** — 3 strings fijos en código, deben venir de la DB.
4. **Horarios: nunca se validan** — `business_profile.hours` se manda al LLM pero el agente nunca verifica si el mensaje llega dentro de horario.
5. **`escalation.ts` — mismatch de formato** — seed usa `{ condition, action, notify }`, código busca `{ keyword, reason }` → las rules del cliente no se aplican.
6. **Flujo `first_contact` no existe** — no hay saludo inicial personalizado ni menú de opciones.
7. **`tryStartFlow` hardcodeado a "agendamiento"** — no puede disparar otros flujos de la DB.

## Entregables

### FIX-1: System prompt 100% desde DB
- Leer `system_prompt_overrides` de business_profile en `loadBusinessContext()`
- Si no es null → usar ese string DIRECTAMENTE como system prompt (el cliente lo escribe completo)
- Si es null → construir dinámicamente: `Eres {agent_name}...` + persona + catalog + rules + hours (ya sin el texto hardcodeado de "clínica estética")

### FIX-2: Validación de horario (server/src/lib/hours.ts)
- Crear `isOutOfHours(hours, now): boolean` — mapea día de la semana (lunes-domingo) y compara horas
- En orchestrator.ts: verificar horario justo después del check de human_active
- Si fuera de horario → responder con `bizContext.offHoursMessage` (leer de `rules.respuesta_fuera_de_horario`)

### FIX-3: Canned responses desde DB
- Agregar columna `canned_responses jsonb` a `business_profile` (nueva migración Drizzle)
- Cargar en `loadBusinessContext()`, pasar a `getCannedResponse()`
- Seed: poblar con charla/faq/precio/agendamiento/horario/pagos/info_general

### FIX-4: Escalation rules — normalizar formato
- `extractRules()`: agregar mapeo de `{ condition, action, notify }` → `{ keyword: condition, reason: action, notify }`
- Actualizar `seed.ts` para usar formato canónico `{ keyword, reason, notify }` desde el inicio

### FIX-5: Flujo first_contact
- Agregar flujo `first_contact` en seed.ts con: saludo + nombre del agente + menú de opciones (servicios, agendar, horarios, asesor)
- En orchestrator.ts: detectar primer mensaje inbound de la conversación → disparar first_contact

### FIX-6: tryStartFlow genérico
- Reemplazar `if (intent !== "agendamiento")` hardcodeado por lookup en DB: buscar flujo cuya key = intent del router

### FEAT-7: Importador de plantilla (server/src/db/import-tenant.ts)
- Lee `server/src/db/tenant-config/[slug].json`
- Upserta: business_profile (persona, rules, hours, booking_mode, system_prompt_overrides, canned_responses, off_hours_message), catalog_items, flows
- Idempotente (no duplica si se re-corre)
- Uso: `npm run import:tenant -- --slug=santa-maria`
- Crear `tenant-config/santa-maria.json` como ejemplo con los datos actuales del seed

El formato JSON de config cubre las 10 secciones de la plantilla de Carlos:
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
  "catalog": [ ... ],
  "canned_responses": { "charla": "...", "precio": "..." },
  "escalation_rules": [ { "keyword": "emergencia", "reason": "...", "notify": true } ],
  "flows": { ... }
}
```

## Criterio de completación
1. System prompt del LLM no contiene texto hardcodeado de "clínica estética".
2. Forzar horario fuera de rango → agente responde con off_hours_message.
3. Cambiar canned response en DB → agente usa el nuevo valor (no el hardcodeado).
4. Enviar keyword de escalación → se escala usando rules del tenant.
5. Primer mensaje de conversación nueva → dispara flujo first_contact con menú.
6. Router clasifica intent que coincide con key de flujo → lo dispara (no solo "agendamiento").
7. `npm run import:tenant -- --slug=santa-maria` corre sin error, idempotente.
8. `npm test` (58+ tests) + `npm run build` pasan.

## Notas
- Migración nueva con Drizzle para `canned_responses`, NO modificar migración existente.
- No tocar front, landing, ni seed-demo.ts.
- **HITO** → `status: WAITING_FOR_CLAUDE`. Commit `task(TASK-015): motor hiperpersonalización`, push, HANDOFF_LOG.

## Resultado de OpenCode

✅ **TASK-015 completada: Motor de hiperpersonalización.** 58/58 tests, typecheck, builds (back+front), seed, import-tenant OK.

### Fixes implementados

**FIX-1: System prompt 100% desde DB**
- `responder.ts`: `buildSystemPrompt()` construye desde `persona`+`catalog`+`rules`+`hours`. Sin texto hardcodeado de "clínica estética".
- Si `system_prompt_overrides` no es null → se usa DIRECTAMENTE como prompt.

**FIX-2: Validación de horario**
- `lib/hours.ts`: `isOutOfHours(hours, now)` → mapea día, compara minutos.
- En `orchestrator.ts`: chequea horario justo después de human_active. Si fuera de horario → responde con `off_hours_message` de DB.

**FIX-3: Canned responses desde DB**
- Nueva migración `0003_add_canned_responses.sql`: columnas `canned_responses jsonb` y `off_hours_message text` en `business_profile`.
- `getCannedResponse()` recibe `cannedFromDb` desde `loadBusinessContext()`.

**FIX-4: Escalation rules — formato canónico**
- `escalation.ts`: `normalizeRule()` mapea `{condition, action, notify}` → `{keyword, reason, notify}`.
- Seed actualizado a formato `{keyword, reason, notify}`.

**FIX-5: Flujo first_contact**
- Seed crea flujo `first_contact` con saludo + menú.
- `orchestrator.ts`: `isFirstMessage()` detecta primer mensaje → dispara `first_contact`.

**FIX-6: tryStartFlow genérico**
- Antes: `if (intent !== "agendamiento") return`.
- Ahora: `SELECT ... WHERE key = ${intent}` — cualquier flujo con key matching intent se dispara.

**FEAT-7: Importador de plantilla**
- `import-tenant.ts` — lee JSON de `tenant-config/[slug].json`, upserts perfil/catálogo/flows.
- `tenant-config/santa-maria.json` — ejemplo completo con datos actuales del seed.
- Uso: `npm run import:tenant -- --slug=santa-maria`

### Evidencia
```
✓ 58/58 tests (7 suites)
✓ tsc --noEmit sin errores
✓ next build exitoso
✓ seed + seed-demo funcionando (15 convs, 258 msgs, 7 bookings)
✓ npm run import:tenant -- --slug=santa-maria → idempotente
```
