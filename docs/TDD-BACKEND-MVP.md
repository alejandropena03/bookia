# TDD — Backend MVP de Bookia

> **Documento de Diseño Técnico (Technical Design Document)**
> Versión: 1.0 · Fecha: 2026-06-11 · Autor técnico: Claude (CTO-side) · Alcance: **MVP local (Docker)**
>
> Este documento es la fuente de verdad técnica del backend. Toda decisión de implementación debe trazar a una sección de aquí. El stack de `bookia-docs` es solo referencia de negocio, no vinculante.

---

## 0. Resumen ejecutivo

Bookia es un SaaS donde un **agente de IA responde conversaciones de WhatsApp/Instagram** de forma autónoma para clínicas estéticas, con el catálogo y la personalidad del negocio cargados. El modelo de venta es **"producto terminado esperando credenciales"**: el sistema queda 100% construido y solo falta enchufar los tokens reales de Meta del cliente.

Este TDD cubre el **backend del MVP** que corre en **Docker en una Mac** (entorno del socio ejecutor). Se construye **todo el sistema dejando un único "hueco" bien definido**: la **capa de hiperpersonalización** (flujos, catálogo, tono reales de Santa María que Carlos documenta). El sistema funciona end-to-end con datos placeholder estructurados; al llegar la plantilla de Carlos, solo se **rellena esa capa de configuración**, sin reconstruir nada.

**Fuera del alcance de este TDD (explícito):** deployment a la nube, operación 24/7, DB gestionada, dominio productivo. Eso es fase post-aprobación del cliente. La arquitectura queda lista para ello sin reescritura, pero no se construye aún.

---

## 1. Principios de diseño

1. **Provider-agnostic en el LLM.** El modelo es una pieza intercambiable. Nada premium cableado. Se valida empíricamente qué modelo (DeepSeek, Llama, Haiku, etc.) da el resultado esperado al menor costo.
2. **Estabilidad sobre improvisación.** Los flujos críticos (agendar, cobrar) son determinísticos (máquina de estados + respuestas predefinidas). El LLM no inventa precios ni se salta pasos.
3. **El hueco de hiperpersonalización es configuración, no código.** El motor es genérico; los flujos/catálogo/tono se cargan como datos.
4. **Mock ⇄ Real intercambiables.** Todo canal (y el LLM) tiene un adapter mock para demostrar sin credenciales, intercambiable por el real sin tocar el core.
5. **Multi-tenant desde el día 1**, aunque empiece con un cliente.
6. **Un solo lenguaje (TypeScript)** compartido con el front existente.
7. **No sobre-ingenierizar.** Sin Redis, sin vector DB, sin LangGraph hasta que un requisito real lo justifique.

---

## 2. Stack tecnológico

| Capa | Elección | Justificación |
|---|---|---|
| Runtime | **Node.js 22 + TypeScript 5** | Comparte tipos con el front Next.js. Un solo ecosistema para un dev. |
| API framework | **Hono** | Typesafe (Zod), liviano, corre en Docker hoy y edge mañana. |
| Validación | **Zod** | Esquemas compartidos front/back; valida payloads de webhooks y API. |
| ORM | **Drizzle ORM** | Sin codegen, tipos al instante, SQL crudo para métricas del dashboard. |
| DB | **PostgreSQL 16** | Multi-tenant shared-schema + RLS. Sin pgvector al inicio. |
| LLM gateway | **OpenRouter** (con interfaz propia que permite LiteLLM/directo) | Cambiar de modelo por config; comparar costo/calidad. |
| Agente | **Híbrido propio** (router + state-machine + LLM) | Estable y bajo control, sin dependencia de LangChain. |
| Tests | **Vitest** (unit/integration) + reutilizar Playwright del front (e2e) | Vitest por velocidad y compatibilidad TS/ESM. |
| Contenedor | **Docker + docker-compose** | `api` + `postgres`. Sin Redis en MVP. |

**Estructura de repo (monorepo ligero, sin tooling pesado):**

```
bookia/
├── app/                    # front Next.js EXISTENTE (no se toca en este TDD)
├── components/             # front existente
├── server/                 # ← NUEVO: el backend de este TDD
│   ├── src/
│   │   ├── index.ts        # entrypoint Hono
│   │   ├── env.ts          # validación de env vars con Zod
│   │   ├── db/             # Drizzle: schema, migraciones, cliente
│   │   ├── channels/       # Channel-Adapter (mock, whatsapp, instagram)
│   │   ├── agent/          # cerebro: router, state-machine, llm
│   │   ├── flows/          # motor de flujos configurable (el "hueco")
│   │   ├── catalog/        # carga catálogo + personalidad (el "hueco")
│   │   ├── conversations/  # servicio de conversaciones/mensajes
│   │   ├── tenants/        # multi-tenancy
│   │   ├── metrics/        # agregaciones para el dashboard
│   │   ├── api/            # rutas REST/webhooks
│   │   └── lib/            # utilidades compartidas
│   ├── drizzle/            # migraciones generadas
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── drizzle.config.ts
├── docker-compose.yml      # ← NUEVO
└── shared/                 # ← NUEVO: tipos Zod compartidos front/back
```

> Nota: el backend es un servicio aparte (`server/`) del front Next.js. Esto simplifica el deploy en Docker y separa responsabilidades. Comparten tipos vía `shared/`.

---

## 3. Modelo de datos (PostgreSQL + Drizzle)

Multi-tenant **shared schema**: toda tabla de negocio lleva `tenant_id`. RLS de Postgres como red de seguridad.

### Tablas

**`tenants`** — cada negocio cliente (Santa María = primer tenant)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| name | text | "Santa María Clínica Estética" |
| slug | text unique | "santa-maria" |
| status | enum(active, paused) | |
| created_at | timestamptz | |

**`channel_accounts`** — conexión de un canal por tenant (lo que recibe credenciales reales)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| tenant_id | uuid FK | |
| channel | enum(whatsapp, instagram, messenger, mock) | |
| mode | enum(mock, live) | el "enchufe": mock para demo, live con credenciales |
| external_account_id | text | phone_number_id / ig_id |
| credentials | jsonb (cifrado en reposo a futuro) | access_token, app_secret, verify_token… NULL en mock |
| status | enum(connected, disconnected, error) | |

**`contacts`** — el cliente final que escribe al negocio
| id, tenant_id, channel, external_id (wa_id/ig id), name, phone, created_at |

**`conversations`** — hilo de conversación
| id, tenant_id, contact_id, channel_account_id, status (enum: bot_active, human_active, escalated, closed), assigned_user_id (nullable), reply_window_expires_at, last_message_at, created_at |

**`messages`** — cada mensaje (la "memoria" = leer las últimas N filas)
| id, tenant_id, conversation_id, direction (inbound/outbound), sender_type (contact/bot/human), provider_message_id (idempotencia), content_type, text, media_url, raw (jsonb), created_at |

**`flows`** — definición de un flujo configurable (el "hueco" de hiperpersonalización)
| id, tenant_id, key (ej "agendamiento"), name, definition (jsonb: estados, transiciones, respuestas predefinidas), is_active, version |

**`catalog_items`** — servicios del negocio (el "hueco")
| id, tenant_id, name, description, price, currency, category, duration_minutes, image_url, is_active |

**`business_profile`** — personalidad/tono/reglas (el "hueco", 1 por tenant)
| tenant_id PK, persona (text: tono de voz), rules (jsonb: qué no decir, cuándo escalar), hours (jsonb), system_prompt_overrides (text) |

**`users`** — operadores humanos del negocio (para inbox/escalación)
| id, tenant_id, email, name, role (enum: owner, agent) |

**`metrics_daily`** (opcional, materializada) — pre-agregados para el dashboard, o se calcula on-the-fly al inicio.

> **Idempotencia:** índice único `(tenant_id, provider_message_id)` en `messages` — Meta reintenta webhooks.
> **Índices:** `(tenant_id, conversation_id, created_at)` en messages; `(tenant_id, status)` en conversations.

---

## 3.bis El "hueco" de hiperpersonalización = la plantilla de Carlos

La **Plantilla de Recopilación de Flujos — Santa María** (que Carlos está llenando en el Outline) ES, literalmente, el formato de la configuración que carga este sistema. No es código: es data que rellena las tablas `flows`, `catalog_items` y `business_profile`. El sistema funciona con un placeholder hasta que llega la plantilla llena, y entonces solo se **importa**. Mapeo exacto:

| Sección de la plantilla (Carlos) | Dónde aterriza en el backend |
|---|---|
| §1 Canales activos | `channel_accounts` (qué adapters activar) |
| §2 Mensajes de bienvenida (+ variables `{nombre}`) | flujo `first_contact` + capa de **templating de variables** |
| §3 Menú de opciones / botones | flujo `menu` (state-machine: opción → rama) |
| §4 Catálogo de respuestas por tema (precios, agendamiento, horarios, dudas, pagos, otros) | `catalog_items` + **canned responses por intención** que el router selecciona |
| §5 Imágenes / multimedia | `media_url` en items y respuestas |
| §6 Flujos completos (secuencias) | `flows.definition` (jsonb) — el corazón del motor |
| §7 Reglas y límites + escalación + a quién notificar | `business_profile.rules` + reglas de escalación + destino de notificación |
| §8 Tono y personalidad (nombre del asistente, formal/cercano, emojis, frases) | `business_profile.persona` (system prompt del LLM abierto) |
| §9 Horarios del agente + comportamiento fuera de horario | `business_profile.hours` |
| §10 Info adicional | `business_profile.system_prompt_overrides` |

**Aprendizajes de la plantilla que condicionan el diseño:**

1. **Respuestas literales, no parafraseadas.** Carlos pega "texto EXACTO". → Para precios/horarios/pagos/agendamiento se usan **canned responses literales**; el LLM NO las redacta. Esto confirma la arquitectura híbrida (§5) y elimina el riesgo de alucinación en lo crítico.
2. **Sistema de variables explícito** (`{nombre}`, `{ciudad}`, `{servicio}`). → Se requiere una **capa de templating** que sustituya variables en las respuestas predefinidas, con slots que vienen de la conversación/contacto.
3. **Escalación bien definida y configurable** (§7.2: emergencia/reacción, cliente molesto, pide humano, quiere descuento, pregunta técnica) + **destino de notificación** (§7.3). → Reglas de escalación como data, más un canal de notificación al operador.
4. **Importador de plantilla:** habrá una tarea para construir un **parser/seed** que tome la plantilla llena (markdown o un form estructurado derivado) y la convierta en filas de config. Mientras tanto, el seed usa un placeholder que respeta el mismo shape.

> **Dependencia explícita:** los textos exactos, flujos y reglas reales NO existen hasta que Carlos entregue la plantilla. El MVP se construye y demuestra con placeholder estructurado; rellenarlo es importar datos, no reconstruir.

---

## 4. Channel-Adapter (el núcleo del modelo de venta)

Interfaz única; mock y real intercambiables. El día que llegan los tokens del cliente, solo cambia `mode` en `channel_accounts`, cero cambios en el core.

```ts
interface NormalizedInboundMessage {
  channel: "whatsapp" | "instagram" | "messenger" | "mock";
  providerMessageId: string;           // idempotencia
  conversationKey: string;             // hash(channel + accountId + externalUserId)
  account: { channelAccountId: string };
  contact: { externalId: string; name?: string; phone?: string };
  content: { type: string; text?: string; mediaUrl?: string; raw?: unknown };
  timestamp: string;                   // ISO 8601
  replyWindowExpiresAt?: string;       // timestamp + 24h (regla Meta)
}

interface ChannelAdapter {
  readonly channel: string;
  verifyWebhook(query, headers, rawBody): boolean;     // handshake + firma HMAC
  parseInbound(rawBody: unknown): NormalizedInboundMessage[];
  sendMessage(out: NormalizedOutboundMessage): Promise<{ providerMessageId: string }>;
  canSendFreeForm(conversation): boolean;              // ventana 24h
}
```

- **`MockAdapter`**: `verifyWebhook → true`, `parseInbound` genera mensaje simulado, `sendMessage` persiste en DB + emite por WebSocket/SSE al panel (conversación simulada en vivo). `canSendFreeForm → true`.
- **`WhatsAppAdapter`**: REST directo a Graph API (`POST /v21.0/{phone_number_id}/messages`), valida `X-Hub-Signature-256` con app_secret, respeta ventana 24h y plantillas. SDK opcional: `whatsapp-api-js` como cliente HTTP tipado.
- **`InstagramAdapter`**: REST a Graph API, payload estilo Messenger (`entry[].messaging[]`).

**Credenciales por canal a "enchufar"** (documentado para el cliente):
- WhatsApp: `phone_number_id`, `access_token` (System User), `app_secret`, `verify_token`.
- Instagram: `page_access_token`/IG token, `ig_id`, `app_secret`, `verify_token`.

**TikTok:** post-MVP. El adapter admite añadirlo sin refactor.

---

## 5. El cerebro del agente (híbrido)

Pipeline por cada mensaje entrante normalizado:

```
inbound → cargar contexto (últimas N msgs + estado de flujo activo) →
  ROUTER (LLM barato clasifica intención) →
    ├── flujo estructurado activo o detectado → MOTOR DE FLUJOS (state-machine)
    └── pregunta abierta → LLM RESPONDER (system prompt + catálogo)
  → ¿escalar? (regla o baja confianza) → marcar conversación human_active
  → enviar respuesta vía ChannelAdapter → persistir
```

### 5.1 Router
LLM económico (vía gateway) que clasifica el mensaje en una intención: `{ intent: "agendamiento" | "faq" | "precio" | "queja" | "charla" | "otro", confidence, extractedSlots }`. Devuelve JSON estructurado (con validación Zod; si falla, fallback a "abierto").

### 5.2 Motor de flujos (state-machine genérica — el "hueco")
- Un flujo se define como **datos** en `flows.definition` (jsonb): estados, transiciones, qué dato pide cada estado, **respuestas predefinidas (templated)**, y qué tool ejecuta al completar.
- El motor es genérico: lee la definición y avanza el estado guardando los slots en la conversación.
- El LLM **solo extrae datos** (ej: parsear "mañana a las 3" → fecha/hora), **no redacta** las respuestas críticas — esas son predefinidas. → **Determinístico, nunca inventa precios.**
- Flujo placeholder de ejemplo (`agendamiento`): `ask_city → show_service → payment_instructions → await_proof → collect_data → confirm_booking`. Se reemplaza por el real de Carlos.

### 5.3 LLM responder (preguntas abiertas)
- System prompt = personalidad (`business_profile.persona`) + catálogo estructurado (`catalog_items`) + reglas. **Prompt-stuffing**, sin RAG.
- Reglas duras: no inventar precios fuera del catálogo, escalar si pregunta algo médico sensible / fuera de alcance.

### 5.3.bis Capa de templating de variables
- Las respuestas predefinidas (canned) contienen variables tipo `{nombre}`, `{ciudad}`, `{servicio}` (formato de la plantilla de Carlos).
- Un `renderTemplate(text, context)` sustituye las variables con datos del `contact` / slots de la conversación. Variables faltantes → fallback seguro (omitir o valor neutro), nunca dejar `{var}` crudo al cliente.

### 5.3.ter Escalación a humano (configurable)
- Reglas de escalación vienen de `business_profile.rules` (mapeo de §7.2 de la plantilla): emergencia/reacción, cliente molesto, pide humano, pide descuento, pregunta técnica/médica, o baja confianza del router.
- Al escalar: conversación → `escalated`/`human_active`, y se **notifica al destino configurado** (§7.3: nombre + WhatsApp/email). En MVP la notificación puede ser un registro + evento por el stream; el canal real (WhatsApp/email al operador) se enchufa igual que los demás.

### 5.4 Capa de modelo (provider-agnostic)
```ts
interface LlmProvider {
  complete(params: { system: string; messages: Msg[]; tools?: Tool[]; model: string }): Promise<LlmResult>;
}
```
- Implementación default vía **OpenRouter** (un endpoint, muchos modelos). El modelo se elige por config (`MODEL_ROUTER`, `MODEL_RESPONDER`).
- **`MockLlmProvider`** para tests sin gastar tokens.
- **Harness de evaluación** (`server/src/agent/eval/`): corre un set de conversaciones de prueba contra varios modelos → tabla de costo (tokens × precio) + calidad (criterios). Permite decidir el modelo con datos, no opinión.

### 5.5 Integración de agendamiento — BookingProvider (3 modos configurables)
**Agenda Pro SÍ expone API REST v3 (validado 2026-06-11), PERO la API key la tiene el cliente — igual que las credenciales de Meta.** Por eso, en el MVP **NO se agenda de verdad**; la integración real con Agenda Pro queda como "se enchufa después".

**Decisión (2026-06-12): el cierre de cita es CONFIGURABLE por tenant** vía `business_profile` (`booking_mode`), con 3 implementaciones intercambiables de la misma interfaz `BookingProvider`:

| `booking_mode` | Implementación | Comportamiento al confirmar cita | Uso |
|---|---|---|---|
| `mock` | `MockBookingProvider` | "¡Cita confirmada!" + guarda en DB simulada (disponibilidad y reserva falsas) | **Demo de venta** (vistoso, 100% automático) |
| `handoff` | `HandoffBookingProvider` | Recolecta todos los datos y los entrega al operador + notifica para que los cargue a Agenda Pro a mano | **Piloto real antes de tener la API** (= workflow actual de Santa María) |
| `agendapro` | `AgendaProProvider` | Agenda de verdad vía API v3 | Cuando el cliente comparte su API key (POST-MVP) |

**Alcance MVP:** construir `mock` y `handoff`. `agendapro` queda como **interfaz + stub documentado**, NO se implementa (TASK-008 sale del MVP). El día que llega la API key, se implementa y se cambia el flag — cero reconstrucción.

```ts
interface BookingProvider {
  listServices(): Promise<Service[]>;
  listProviders(): Promise<Provider[]>;
  listLocations(): Promise<Location[]>;
  getAvailableSlots(params): Promise<Slot[]>;            // GET /v3/available_slots
  findClient(query): Promise<Client | null>;             // GET /v3/clients/search
  createClient(data): Promise<Client>;                   // POST /v3/clients
  createBooking(data): Promise<Booking>;                 // POST /v3/bookings  ← crítico
}
```

- **Base URL:** `https://connect.agendapro.com/v3/` · **Auth:** `Authorization: Bearer apk_live_...` (key generada por el cliente en Configuraciones > Integraciones).
- **MockBookingProvider / HandoffBookingProvider:** lo del MVP (ver tabla arriba). No tocan Agenda Pro.
- **AgendaProProvider (POST-MVP, no se construye aún):** REST real. Se enchufa con la API key del cliente, igual que las credenciales de Meta.
- **Rate limits** (~70/min, 10.000/día): **cachear** catálogo (`services`/`providers`/`locations`) y disponibilidad; NO consultar `available_slots` en cada turno del LLM.
- **Webhooks de Agenda Pro** (`trigger`, `resource_type:"Booking"`): sincronizar cancelaciones/cambios hechos fuera de Bookia.

**Prerrequisito de onboarding (negocio):** el cliente debe tener **plan Pro de Agenda Pro** (la API solo está en ese plan) — plantearlo junto con los tokens de Meta.

**Pendiente de validar con cuenta real:** esquema exacto del body de `POST /v3/bookings` (campos obligatorios: probablemente `service_id`, `provider_id`, `location_id`, `client_id`, `start_time`) y enumeración completa de eventos de webhook. Las páginas de referencia son SPA; se confirman en navegador o con credenciales Pro. → La interfaz `BookingProvider` aísla esto: si el esquema difiere, solo cambia `AgendaProProvider`.

---

## 6. API / Endpoints (Hono)

**Webhooks (entrada de canales):**
- `GET /webhooks/:channel` — handshake de verificación (devuelve `hub.challenge`).
- `POST /webhooks/:channel` — recibe mensajes; valida firma; normaliza; encola procesamiento; responde 200 rápido.

**Simulación (para demo sin credenciales):**
- `POST /api/sim/message` — inyecta un mensaje simulado al pipeline (lo usa el front para la demo en vivo).
- `GET /api/sim/stream` (SSE/WebSocket) — stream de mensajes para ver la conversación en tiempo real.

**Dashboard / app (consumidos por el front):**
- `GET /api/conversations` — lista paginada con filtros (status, canal).
- `GET /api/conversations/:id` — hilo completo.
- `POST /api/conversations/:id/reply` — operador humano responde.
- `POST /api/conversations/:id/escalate` / `/takeover` / `/handback` — control humano/bot.
- `GET /api/metrics` — KPIs del dashboard (volumen, tasa respuesta, conversión a cita, por canal, tendencias).
- **Catálogo y config (panel self-service):** CRUD `GET/POST/PUT/DELETE /api/catalog`, `GET/PUT /api/profile`, `GET/PUT /api/flows`.
- `GET /api/channel-accounts` / `PUT /api/channel-accounts/:id` — gestionar el "enchufe" de credenciales.

Todas las rutas (excepto webhooks) requieren auth y resuelven `tenant_id` del usuario autenticado (reusar Auth.js del front vía JWT compartido).

---

## 7. Seguridad y privacidad

- **Multi-tenant aislado:** toda query filtra por `tenant_id`; RLS de Postgres como red de seguridad ante bugs.
- **Validación de webhooks:** firma HMAC-SHA256 (`X-Hub-Signature-256`) con `app_secret` en cada webhook real.
- **Credenciales:** en `channel_accounts.credentials` (jsonb). Para MVP local en texto; **TODO producción:** cifrado en reposo (KMS/secret manager). Documentado como deuda explícita.
- **Datos de conversaciones:** Ley 1581 Colombia (habeas data). NDA antes de conectar datos reales del cliente (responsabilidad de negocio, no técnica). Solo el tenant ve sus datos.
- **Secrets:** nunca en el repo. `.env` local + `env.ts` que valida con Zod al arrancar. **Rotar el token de GitHub actualmente embebido en el remote.**

---

## 8. Testing (TDD real)

- **Unit:** state-machine de flujos (transiciones, extracción de slots), normalización de cada adapter, router (con MockLlmProvider).
- **Integration:** pipeline completo inbound→respuesta con MockAdapter + MockLlm + Postgres de test (Docker).
- **Contract:** validar que `parseInbound` maneja payloads reales de Meta (fixtures guardados).
- **Idempotencia:** reenviar el mismo `provider_message_id` no duplica.
- **Eval harness:** no es test pass/fail, es comparación de modelos (output a reporte).
- Cobertura objetivo MVP: lógica de agente y adapters > 80%.

---

## 9. Docker (entorno del ejecutor)

```yaml
# docker-compose.yml (conceptual)
services:
  api:
    build: ./server
    env_file: ./server/.env
    ports: ["8787:8787"]
    depends_on: [postgres]
  postgres:
    image: postgres:16
    environment: { POSTGRES_DB: bookia, POSTGRES_PASSWORD: ... }
    volumes: ["pgdata:/var/lib/postgresql/data"]
  # redis: OMITIDO en MVP
volumes: { pgdata: {} }
```
Arranque: `docker compose up` → `drizzle-kit migrate` → seed del tenant Santa María (placeholder) → demo lista.

---

## 10. Plan de construcción (orden de tareas para OpenCode)

Se ejecuta vía el **bridge Git** (`.bridge/`). Cada tarea es un handoff a OpenCode (que corre Docker/Postgres/tests en la Mac).

1. **TASK-001 — Scaffold backend:** `server/` con Hono + TS + Drizzle + env.ts + Dockerfile + docker-compose + Postgres arriba. Criterio: `docker compose up` levanta api+db y `GET /health` responde 200.
2. **TASK-002 — Schema + migraciones:** todas las tablas §3 con Drizzle + RLS + seed de tenant Santa María placeholder. Criterio: migración aplica, seed corre, tests de schema pasan.
3. **TASK-003 — Channel-Adapter + MockAdapter:** interfaz + mock + endpoints `/api/sim/*` + SSE. Criterio: inyectar mensaje simulado se persiste y emite por stream.
4. **TASK-004 — Capa LLM provider-agnostic + MockLlm:** interfaz `LlmProvider`, impl OpenRouter, MockLlm. Criterio: responder con MockLlm sin red; con OpenRouter (key) responde real.
5. **TASK-005 — Cerebro: router + motor de flujos + responder:** pipeline completo con flujo placeholder de agendamiento. Criterio: conversación simulada completa el flujo de agendamiento determinístico end-to-end.
6. **TASK-006 — Inbox + escalación humana + API dashboard/metrics.** Criterio: endpoints responden, takeover/handback funcionan.
7. **TASK-007 — WhatsAppAdapter + InstagramAdapter (REST real, sin credenciales aún):** estructura completa lista para enchufar. Criterio: verifyWebhook/parseInbound pasan contra fixtures reales de Meta.
8. **TASK-008 — Eval harness de modelos:** corre conversaciones de prueba contra ≥3 modelos (incluido uno barato tipo DeepSeek) → reporte costo/calidad. Criterio: genera tabla comparativa.
9. **TASK-009 — Importador de la plantilla de Carlos:** parser/seed que toma la plantilla llena (las 10 secciones §3.bis) y la convierte en filas de `flows` + `catalog_items` + `business_profile` + canned responses. Criterio: dado un archivo de plantilla de ejemplo, el seed produce una config válida que el agente consume.
10. **TASK-010 — Conectar el front existente al backend real** (reemplazar los JSON simulados por la API).

**El "hueco" de hiperpersonalización** queda en: `flows` (definición real), `catalog_items` (servicios/precios reales), `business_profile` (tono/reglas reales) + canned responses literales. Todo se rellena importando la plantilla de Carlos (TASK-009), sin tocar código. El mapeo exacto plantilla→tablas está en §3.bis.

---

## 11. Decisiones abiertas / dependencias

1. **API de Agenda Pro:** ✅ RESUELTO (2026-06-11) — SÍ expone API REST v3. PERO (decisión 2026-06-12): la API key la tiene el cliente, así que **NO se agenda de verdad en el MVP**. Agendamiento configurable (`booking_mode`: mock/handoff ahora, agendapro post-MVP) — ver §5.5. `AgendaProProvider` real se construye cuando el cliente comparta su key.
2. **Plantilla de flujos de Carlos:** necesaria para rellenar el "hueco". El MVP se construye con placeholder mientras tanto.
3. **Modelo final:** se decide tras TASK-008 (eval), no antes.
4. **Migración del número de WhatsApp actual a Cloud API:** validar viabilidad (riesgo de negocio).
5. **Cifrado de credenciales en reposo:** deuda para fase producción.

---

*Fin del TDD v1.0. Cambios futuros se versionan aquí mismo.*
