# Handoff — sesión sin Docker/Postgres (2026-07-01)

> Este doc existe porque esta sesión corre en una máquina sin Docker/Postgres:
> no puede levantar la DB, correr `vitest` de integración, ni pegarle en vivo a
> `/api/sim/message`. Está pensado para que una instancia de Claude Code que
> clona este repo en frío tenga el contexto completo sin tener que preguntar.
> Lee esto ANTES que `AGENTS.md`/`.bridge/STATUS.md` — son la foto del código,
> esto es la foto del *plan y las decisiones*.

## Qué es Bookia (MVP, alcance)

Agente conversacional (WhatsApp-style) con agendamiento para clínicas estéticas
en LATAM. Cliente piloto real: **Santa María** (persona del agente: **Carlos**,
escalation a **Elkin**). MVP = Fase 1: simulador de chat + dashboard + agente
real contra DeepSeek, sin canales reales todavía.

- **Fase 1 (MVP actual):** simulador (`/api/sim/message`), sin Meta/WhatsApp
  real, sin Agenda Pro real, sin pagos live. Login demo
  (`admin@santamaria.test` / `bookia2024`), dashboard con datos reales, Inbox
  con conversaciones generadas por el agente real (no mock), widget
  "DemoLive" para chat en vivo con el agente real.
- **Fase 2 (no empezar sin pedido explícito):** Meta adapter (WhatsApp/IG/
  Messenger) — spec completa en `server/docs/meta-adapter-spec.md`. Bloqueado
  por credenciales Meta reales que Alejandro no ha dado. JWT auth real para
  producción también es deuda técnica activa de Fase 2 (`resolveTenant` con
  `DEV_AUTH=false` no valida JWT real hoy).

## Stack
- Backend: Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + Vitest — puerto 8787
- Frontend: Next.js 16 + React 19 + shadcn/ui + Base UI, en la RAÍZ del repo (no en `client/`) — puerto 3001
- LLM del agente: DeepSeek `deepseek-v4-flash` (modelo de razonamiento — gasta
  tokens de "pensamiento" oculto antes del texto visible; con `maxTokens` bajo
  en llamadas de juez/análisis la respuesta puede salir vacía sin error)

## Estado real al 2026-07-01 (más reciente que `AGENTS.md`/`STATUS.md` — que quedaron desactualizados)

- **Bug crítico arreglado:** precios multi-mercado nunca funcionaron en
  producción — `catalog_items` no tenía columnas de precio multi-moneda, todo
  cliente fuera de Colombia veía COP. Arreglado con migración
  `0013_add_catalog_multi_market_prices.sql` + reseed. Verificado CDMX→MXN,
  Miami→USD. Si tocas precios/mercados, verificar que el SELECT de
  `v2-adapter.ts` sigue incluyendo `prices`/`requires_human_confirmation`.
- **Eval de calidad corrido:** `server/src/agent/v2/eval/quality-eval.ts`, 38
  escenarios reales (booking, precio multi-mercado, emergencias, quejas,
  seguridad, PII, ambiguos) contra DeepSeek real + juez LLM. Scores (1-5):
  accuracy 3.92, tono 4.58, seguridad 4.47, utilidad 3.76. Reporte crudo en
  `server/src/agent/v2/eval/reports/quality-eval-raw.json`.
- **6 hallazgos de ese eval quedaron documentados como plan, NO ejecutados**
  — ver la sección completa más abajo. Es el trabajo pendiente más concreto
  y accionable que existe ahora mismo.
- Tests: última cifra confirmada localmente 327/327 (no 282 — ese número de
  `AGENTS.md`/`STATUS.md` es de antes del Sprint de eval/quality-eval de esta
  semana). **No puedes correr vitest de integración aquí sin Postgres** — los
  tests que pegan a DB van a fallar por falta de conexión, no por bugs reales.

## Decisiones activas (no reabrir sin pedido explícito)

- V2 kernel activo por defecto (`AGENT_KERNEL_V2=true`)
- Router: **feature-freeze en el SYSTEM_PROMPT del LLM** — solo mejoras
  determinísticas (regex, keywords, canned responses, patrones en
  `deterministic-domain-route.ts`/casos especiales en `agent-kernel.ts`). No
  reescribir el prompt del router.
- Sin menú de botones en el chat (pedido explícito del cliente Carlos)
- Modelo local descartado (hardware insuficiente)
- Nunca commitear secretos (`server/.env`, API keys) — línea roja sin excepción
- No usar Meta real, Agenda Pro real, ni pagos live hasta Fase 2 con
  credenciales reales

## El plan pendiente más concreto: 6 fixes del eval de calidad

Cada uno es un push/commit separado. Todos deben respetar el feature-freeze
del router (solo determinístico). Antes de tocar código, confirmar que el
síntoma sigue reproduciéndose leyendo el código actual (puede que ya se haya
tocado algo relacionado).

### Push 1 — Flow de precio no reutiliza info ya dada por el cliente
Cliente dice "¿Cuánto cuesta el Russian Lips?" (ya menciona el servicio), el
bot pregunta ciudad, cliente responde, y el bot pregunta de nuevo "¿cuál
servicio?" ignorando lo ya dicho. Causa: `routerDecision.entities.service`/
`.city` no se pasan a `flowAdapter.evaluateFlow()` — la interfaz solo recibe
`(conversationId, intent, text)`. Archivos: `server/src/agent/v2/core/
agent-kernel.ts` (pasar `routerDecision.entities` a `evaluateFlow`),
`server/src/agent/v2/core/v2-adapter.ts` (provider `evaluateFlow`),
`server/src/agent/v2/adapter/flow-adapter.ts` (`handleStart` — pre-sembrar
`slots.service`/`slots.city` desde entities antes de `advanceKnownSlots`).

### Push 2 — No detecta despedidas ("gracias", "ok gracias")
Bot repite el prompt genérico en vez de despedirse cálidamente. Fix: regex
estricto `^(ok\s+)?(muchas\s+)?gracias\.?!?$` (evitar falsos positivos en
"gracias, también quiero saber X") como caso especial en `agent-kernel.ts`
(mismo patrón que embarazo/implantes ya existentes), respuesta tipo "¡Con
gusto! Cuando quieras, aquí estoy 😊".

### Push 3 — Preguntas por zona corporal reciben el catálogo genérico completo
"¿qué recomiendan para líneas de expresión?"/"tengo papada, ¿qué me sirve?"
reciben el canned `faq_servicios` genérico. Causa: efecto secundario del fix
de alucinación previo — todo lo que `deterministic-domain-route.ts` clasifica
como `faq_servicios` (incluye zona corporal, ver ~línea 754-761) cae en el
mismo canned. Fix: casos especiales en `agent-kernel.ts` por zona, con
respuesta real del catálogo:
- líneas de expresión → Botox / Full Face Botox
- papada → Lipopapada enzimática (COP 368.000) + Faja mentonera (COP 60.000)
- ojeras → NCTF — Ojeras / Ojeras con ácido hialurónico
- pómulos → Proyección de pómulos
- mentón → Proyección de mentón
- labios → Doll Lips / Russian Lips / Red Lips (según busque volumen/definición/natural)

### Push 4 — Confusión de enrutamiento entre intents similares
"¿cuánto dura el botox?" a veces cae en `resultados_esperados` (Instagram) en
vez de `dudas_medicas`. "¿Quién es el doctor?" a veces cae en `dudas_medicas`
en vez de `nombres_doctores`. Causa: variación del router LLM. Fix: patrones
determinísticos en `deterministic-domain-route.ts` ANTES del router LLM:
- `/cu[aá]nto (dura|tiempo)/i` + mención de tratamiento → forzar `dudas_medicas`
- `/qui[eé]n es el doctor|qu[eé] doctor|nombre del doctor/i` → forzar
  `nombres_doctores` (verificar si es un intent real en `agent-intent.ts` o
  solo canned key sin patrón de router — si es lo segundo, tratarlo como caso
  especial en `agent-kernel.ts`)

### Push 5 — "¡Claro!" como apertura suena mal en casos sensibles
"¿son mejores que la clínica X?"/"¿me hacen descuento especial?" arrancan con
"¡Claro!" (opener genérico de `precio_flow`), sonando como que confirma la
comparación/descuento. Causa: ambos matchean intent `precio` y arrancan el
flow, cuyo primer estado abre con "¡Claro!". Fix: casos especiales en
`agent-kernel.ts` ANTES del dispatch a flow: competencia
(`/mejor(es)?\s+que|compit(en|encia)|otra\s+cl[íi]nica/i` + contexto
comparativo) y descuento especial (`/descuento\s+especial|rebaja|negociar\s+
precio/i`), cada uno con canned fijo que NO empiece confirmando.

### Push 6 — Corrección de ciudad a mitad de flow rompe todo (el más complejo)
Cliente dice "Bogotá", luego "ah espera, en realidad escribo desde CDMX" — el
bot mete el texto completo de la corrección como respuesta al estado actual
(ej. nombre de servicio), generando basura tipo "El tratamiento de Ah espera,
en realidad escribo desde Ciudad de México tiene un valor de .". Causa:
`evaluateFlow`/`getNextState` en `server/src/flows/engine.ts` no distingue
mensajes "fuera de guion" de respuestas válidas al slot pedido — mete
cualquier cosa en `collects` sin validar. Fix: detectar frases de corrección
(`/ah\s+espera|en\s+realidad|perd[oó]n|me\s+equivoqu[eé]|correcci[oó]n/i`)
combinadas con nombre de ciudad reconocible ANTES del `collects` normal — si
matchea, actualizar `slots.city` directamente (sin avanzar de estado) y
re-preguntar el slot original. Cuidado: no romper los tests existentes de
`engine.ts`.

### Cómo se verificaría cada push (si hubiera Docker/Postgres — aquí no aplica)
1. `npx tsc --noEmit` desde `server/` — **esto sí puedes correrlo sin DB**
2. `npx vitest run` (requiere PG — no vas a poder correr los de integración)
3. curl real a `/api/sim/message` reproduciendo el escenario — requiere server+DB corriendo
4. `npm run seed` + `seed-demo.ts` si el fix toca catálogo/canned — requiere PG
5. Commit individual por push, mensaje describiendo el problema real

## Restricciones de esta sesión (sin Docker/Postgres)

- **No puedes correr tests de integración ni levantar el servidor con DB
  real.** Sí puedes correr `tsc --noEmit`, lint, y tests unitarios puros que
  no toquen Drizzle/Postgres.
- **No mergees ni pushees a `main`.** Trabaja en una rama nueva
  (`fable5-next-level` o similar) y pushea esa rama. Alejandro/otra sesión con
  Docker la revisa y prueba en vivo antes de mergear.
- No hay memoria compartida (Postgres MCP) disponible aquí — todo el contexto
  de decisiones/estado vive en este archivo y en `AGENTS.md`/`.bridge/
  STATUS.md`. Si algo no está acá y es ambiguo, no asumas — déjalo anotado en
  el PR/commit para revisión.
- Sigue el feature-freeze del router: nada de reescribir el `SYSTEM_PROMPT`
  del LLM, solo determinístico.
- Nunca toques/commitees `.env`, API keys, ni credenciales.
