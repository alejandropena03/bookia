## PLAN DE IMPLEMENTACIÓN — Bookia MVP → Producción Fase 1 + Agente V2 100%

Bookia debe cerrar Fase 1 como un producto autónomo y pulido: agente V2 activo por defecto, dashboard operativo, auth real local, knowledge base Santa María completa para el piloto, tests/evals honestos y un contrato de adaptadores listo para enchufar Meta después. El plan prioriza Stream A durante las primeras 3 semanas, ejecuta Stream B en paralelo donde no bloquea al agente, y deja explícitamente fuera Meta real, Agenda Pro real y pagos live. La ventana realista es 5 semanas con buffer de estabilización hasta 6, organizada por milestones M0–M4 con gates verificables.

---

# 0. Decisiones definitivas sobre §13 / §14 / §15

Estas decisiones son parte del alcance del MVP Fase 1. No reabren §9; aterrizan los descubrimientos recientes sin cambiar el north star.

## 0.1 Multi-moneda: sí entra en MVP, pero con implementación acotada

**Decisión:** integrar precios COP, USD, EUR y MXN ahora, porque §9 ya fija que los precios varían por país y el agente debe mostrar según ciudad; además §13 muestra que Santa María opera 4 mercados con pricing independiente (`AUDITORIA-MVP-GPT 2.md:740-749`, `AUDITORIA-MVP-GPT 2.md:755-784`).

**Implementación recomendada para MVP:** no hacer todavía un rediseño completo a `prices: Record<Currency, ...>` en todo el dashboard. Usar una capa de dominio en `catalog.ts` y datos seed de **rows por mercado** aprovechando que `catalog_items` ya tiene `price`, `currency`, `cities` e `imageKeys` (`server/src/db/schema.ts:116`, `AUDITORIA-MVP-GPT 2.md:352`). Añadir solo los campos mínimos para promos (`regular_price`, `promo_price`, `promo_label`, vigencias opcionales) en una migración controlada. El modelo multi-moneda avanzado de administración de catálogo queda para Fase 2.

## 0.2 Imágenes: sí entra el contrato y la simulación; Meta media real queda fuera

**Decisión:** el agente V2 debe poder devolver `media[]`, persistir mensajes con `mediaUrl`/`contentType=image` y mostrarlos en Dashboard/DemoLive durante Fase 1, porque las 34 imágenes contienen información comercial y post-tratamiento que el agente actual no conoce (`AUDITORIA-MVP-GPT 2.md:786-803`, `AUDITORIA-MVP-GPT 2.md:1016-1022`).

**No entra:** subir media a WhatsApp/Instagram/Messenger ni llamar Meta Graph API. Eso se cubre en la spec del adapter Meta para Fase 2.

**Regla de UX:** no enviar before/after automáticamente salvo que el usuario pida fotos/resultados/imagen o confirme "sí" después de que el agente ofrezca mostrarlas. La guía post-tratamiento de Rinomodelación sí se envía automáticamente al confirmar agendamiento.

## 0.3 Promociones: cambian `show_price`, no todo el flow

**Decisión:** las promociones activas no son un "añadido menor" de copy. El estado `precio → show_price` debe conocer precio regular + precio promocional, y el router no debe escalar automáticamente "descuento/oferta/promo" cuando exista una promo conocida para el servicio (`AUDITORIA-MVP-GPT 2.md:937-950`, `AUDITORIA-MVP-GPT 2.md:1004-1010`).

**MVP:** modelar Esperma de Salmón/PDRN COP y MXN con regular→promo, y dejar estructura para futuras promos. No construir panel avanzado de campañas.

## 0.4 Hand Rejuvenation y guía post-tratamiento

**Hand Rejuvenation:** no es bloqueante para el piloto colombiano de Carlos porque no hay precio COP confirmado, pero sí debe entrar como conocimiento defensivo: reconocer "Hand Rejuvenation / rejuvenecimiento de manos", responder USD/EUR si aplica, y escalar si piden COP/MXN para no alucinar (`AUDITORIA-MVP-GPT 2.md:952-964`, `AUDITORIA-MVP-GPT 2.md:1024-1035`).

**Guía post-tratamiento de Rinomodelación:** sí es crítica y entra en MVP. Es información de seguridad/experiencia, de baja complejidad técnica, y debe dispararse después de confirmar una cita de Rinomodelación (`AUDITORIA-MVP-GPT 2.md:865-882`, `AUDITORIA-MVP-GPT 2.md:1177-1188`).

---

# 1. Protocolo obligatorio para cada iteración con DeepSeek v4 / OpenCode

Cada sprint debe ejecutarse como una iteración autónoma con contexto completo, pero sin mezclar más de un vertical grande por agente.

## 1.1 Context pack al iniciar cada sprint

Pegar al agente ejecutor:

```md
Contexto fijo:
- North Star: MVP Fase 1 completo + agente V2 100%, listo para enchufar Meta después.
- Prohibido: Meta real, Agenda Pro real, pagos live.
- No reabrir decisiones de §9.
- Prioridad: Stream A primero. Stream B solo en paralelo si no bloquea.
- Rama/working tree debe empezar limpio salvo archivos de la task.
- Antes de tocar código: leer los archivos indicados en la task y confirmar imports/scripts reales.
- Después de tocar código: correr criterios de aceptación exactos, registrar resultados y dejar handoff.
```

## 1.2 Protocolo de ejecución por task

1. `git status --short` y confirmar que no hay cambios no relacionados.
2. Leer todos los archivos listados en "Archivos a tocar". No implementar por memoria.
3. Escribir o actualizar tests antes/de forma simultánea al cambio.
4. Implementar el vertical mínimo que satisface criterios; no refactors laterales.
5. Ejecutar aceptación local: TypeScript, Vitest/Jest/Playwright según task.
6. Actualizar `.bridge/HANDOFF_LOG.md` o equivalente con: archivos tocados, comandos corridos, resultado, deuda conocida.
7. Commit atómico por task o por grupo pequeño si las tasks son inseparables.
8. Nunca commitear `.env`, keys, dumps ni imágenes fuera de `server/src/flows/santa-maria/images/` o `server/data/santamaria-extraction/` si ya están dentro del repo.

## 1.3 Definition of Done global

Una task solo está cerrada si cumple:

- Tests/commands de aceptación verdes o failure documentado como conocido y aprobado en el gate.
- No regressions en `npx tsc --noEmit` del paquete afectado.
- No secretos en diff.
- No implementación de Meta real, Agenda Pro real ni pagos live.
- No cambio de stack.
- No cambio de decisiones §9.

---

# 2. Roadmap macro y milestones

## Timeline recomendado

| Semana | Foco | Resultado esperado |
|---|---|---|
| Días 1–3 | Sprint 0 — estabilización | Git seguro, tsc desbloqueado, migraciones/secrets base. Gate M0. |
| Semana 1 | Sprint 1 — V2 activable | V2 persiste outbound, emite SSE, flag en env, context real. Gate M1. |
| Semana 2 | Sprint 2 — precio + knowledge patch | PR6.1, PR9, multi-moneda, promos, guía, media contract. |
| Semana 3 | Sprint 3 — cierre V2 | Auto-advance resume, booking memory, golden validators, eval 411 actualizado. Gate M2. |
| Semana 4 | Sprint 4 — dashboard funcional | Auth real, tenant dinámico, escalar/takeover/handback, settings, SSE auth. Gate M3. |
| Semana 5 | Sprint 5 — hardening MVP | Scheduler, observabilidad, cleanup, E2E, docs, Meta spec. Gate M4. |
| Semana 6 | Buffer | Solo bugfixes, demo polish y estabilización. No scope nuevo. |

## Gates

### M0 — Estable

**Incluye:** C1, C2, C3, A1, C6 mínimo.

**Gate:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
# root/frontend
npm run build
npm test -- --runInBand || npm test

# backend
cd server
npx tsc --noEmit
npx vitest run

# git
cd ..
git status --short
git log -1 --oneline
git ls-remote --heads origin main
```

Aceptación: working tree limpio, último commit pusheado, tsc sin TS2307, migraciones aplican en DB vacía, 283 tests base verdes o número actualizado documentado.

### M1 — V2 activado

**Incluye:** A2, A3, A4, A10.

**Gate:** `AGENT_KERNEL_V2=true` por defecto, `POST /api/sim/message` crea inbound + outbound persistido, SSE recibe respuesta V2, Dashboard/DemoLive la ve, smoke test con saludo/precio/agendamiento.

### M2 — V2 cerrado

**Incluye:** A5, A6.1–A6.6, A7, A8, A9, A11, A12.

**Gate:** PR6.1 single-source, PR9 `precio` flow completo, multi-moneda/promo/guide/media simulation funcionando, golden validators no stub, eval sobre 411 casos con reporte honesto, TypeScript clean y sin regresiones críticas.

### M3 — Dashboard funcional

**Incluye:** B1–B6.

**Gate:** login DB-backed con password hash, sesión contiene tenant, no `TENANT_SLUG` hardcoded, Escalar/takeover/handback en UI, Settings persiste todo, SSE no es público por slug.

### M4 — MVP listo

**Incluye:** B7, B8, C4, C5, C7, C8, C9.

**Gate:** E2E Playwright verde, scheduler activo en modo local, observabilidad mínima, docs sincronizados, Meta adapter spec diseñada, demo end-to-end lista para Carlos.

---

# 3. Sprint 0 — Estabilización crítica (días 1–3)

Objetivo: proteger el trabajo existente, desbloquear compilación, hacer reproducible la base y eliminar riesgos operacionales que pueden destruir semanas de trabajo.

## C1 — Git commit + push URGENTE del trabajo V2

**Descripción:**
El repo tiene 30 modified + 155 untracked y el último push fue `e1aa2de` del 2026-06-27. Esta es la primera task y no se debe tocar código antes de proteger el estado. El objetivo no es "ordenar perfecto"; es crear un snapshot seguro, sin secretos, y pushearlo.

**Archivos a tocar:**
- Todo el repo `bookia-code/`.
- Revisar especialmente `server/.env`, `server/data/clinical-audit-log.jsonl`, `server/reports/v1-v2-regression-report.{json,md}`, `docs/source/Terminada plantilla estética Santamaría y bookia .docx`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:172-180`.

**Dependencias:** ninguna.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
git status --short > /tmp/bookia-precommit-status.txt
git diff --cached --name-only
# verificar manualmente que server/.env y llaves no estén staged
git grep -n "DEEPSEEK\|sk-\|api_key\|API_KEY" -- . ':!server/.env' ':!.env' || true
git commit -m "chore: snapshot agent v2 mvp audit state"
git push origin main
git status --short
git log -1 --oneline
git ls-remote --heads origin main
```

Aceptación: último commit visible en remoto; `server/.env` no está en git; si queda working tree sucio, solo por archivos explícitamente ignorados.

**Estimación:** 0.5 día.

**Riesgos y mitigaciones:**
- Riesgo: commitear DeepSeek key. Mitigar con revisión de staged diff y grep antes del commit.
- Riesgo: meter binarios pesados no deseados. Mitigar revisando `git diff --cached --stat`.

**Notas:**
Si hay dudas sobre archivos grandes, hacer dos commits: `snapshot-core` y `snapshot-docs`. No postergar el push.

---

## C2 — Runner de migraciones reproducible

**Descripción:**
El contenedor asume que el schema existe: `entrypoint.sh:17-22` solo corre seed y seed-demo. Drizzle-kit trackea 3/12 SQL y las migraciones RLS/memory están fuera del journal. Para Fase 1, necesitamos una forma idempotente de levantar DB vacía y llegar al schema real.

**Archivos a tocar:**
- `server/entrypoint.sh:17-22`.
- `server/drizzle/meta/_journal.json`.
- `server/drizzle/0001_rls_policies.sql:22-117`.
- `server/drizzle/0010_add_patient_memory.sql`.
- `server/src/db/seed.ts`.
- `server/src/db/seed-demo.ts`.
- Nuevo: `server/src/db/migrate.ts` o `server/scripts/apply-migrations.ts`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:358-374`.

**Dependencias:** C1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
# contra DB vacía local o container nuevo
npm run db:migrate
npm run db:seed
npm run db:seed-demo
npx vitest run tests/rls tests/health
```

Aceptación adicional: `bookia_app` existe, RLS queda `ENABLE` + `FORCE`, `patient_memory` existe, seeds son idempotentes y el entrypoint falla si una migración falla.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: doble aplicación de SQL manual. Mitigar con tabla `schema_migrations` simple (`filename`, `checksum`, `applied_at`) si no se decide plegar todo en Drizzle journal.
- Riesgo: RLS se aplica antes de roles. Ordenar explícitamente los SQL por filename y documentar dependencias.

**Notas:**
No intentar "arreglar perfecto" Drizzle durante MVP. El objetivo es reproducibilidad y seguridad.

---

## C3 — Secrets management local para DeepSeek

**Descripción:**
La DeepSeek key está en `server/.env` en plaintext, aunque gitignored. Fase 1 necesita un patrón claro: `.env` local no versionado, `.env.example` sin valores reales, validación Zod, y documentación para inyectar secrets en hosting más adelante.

**Archivos a tocar:**
- `server/.env.example`.
- `server/src/env.ts` o `server/env.ts` según ubicación real.
- `.gitignore`.
- Nuevo opcional: `.gitleaks.toml`, `scripts/check-secrets.sh`.
- Docs: `docs/OUTPUT_STANDARDS.md` o `server/docs/open-code-brief-bookia-agent-sota.md`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:172-180`, `AUDITORIA-MVP-GPT 2.md:540-543`.

**Dependencias:** C1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
git status --short -- server/.env
git grep -n "DEEPSEEK_API_KEY=.*[A-Za-z0-9_-]\{20,\}" -- . ':!server/.env' ':!.env' || true
cd server
LLM_PROVIDER=mock npx tsc --noEmit
LLM_PROVIDER=deepseek DEEPSEEK_API_KEY=placeholder npx tsc --noEmit
```

Aceptación: `.env.example` documenta `LLM_PROVIDER`, `DEEPSEEK_API_KEY`, `AGENT_KERNEL_V2`, `DEV_AUTH`, `SCHEDULER_ENABLED`; ningún secreto real en git.

**Estimación:** 0.5 día.

**Riesgos y mitigaciones:**
- Riesgo: romper dev local si no hay key. Mitigar con `LLM_PROVIDER=mock` como default dev.

---

## A1 — Fix TS2307 import path en V2 adapter

**Descripción:**
El V2 no puede ser candidato a default si hay un error TypeScript preexistente. Corregir el import path de `flows/engine.js` y dejar TypeScript limpio antes de tocar persistencia.

**Archivos a tocar:**
- `server/src/agent/v2/core/v2-adapter.ts:10`.
- Posible impacto: `server/src/flows/engine.ts`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:288-304`, `AUDITORIA-MVP-GPT 2.md:458-472`.

**Dependencias:** C1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx tsc --noEmit
npx vitest run tests/v2-agent tests/v2-flow-adapter
```

Aceptación: desaparece TS2307, sin cambios funcionales.

**Estimación:** 0.25 día.

**Riesgos y mitigaciones:**
- Riesgo: arreglar import y descubrir más errores. Mitigar cerrando solo compile errors necesarios; no refactor lateral.

---

## C6 — Crear `src/db/tenant-config/` faltante

**Descripción:**
`Dockerfile` e `import-tenant.ts` referencian `src/db/tenant-config/`, pero el directorio no existe. Crear estructura mínima para no romper builds/imports.

**Archivos a tocar:**
- `server/Dockerfile:20`.
- `server/src/db/import-tenant.ts:164`.
- Nuevo: `server/src/db/tenant-config/.gitkeep`.
- Opcional: `server/src/db/tenant-config/santa-maria.example.json` sin secretos.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:376-380`, `AUDITORIA-MVP-GPT 2.md:488-502`.

**Dependencias:** C1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx tsc --noEmit
# docker build si Docker está disponible
docker build -t bookia-api:test .
```

**Estimación:** 0.25 día.

**Riesgos y mitigaciones:**
- Riesgo: example JSON usado como config real. Mitigar con nombre `.example.json` y validación CLI explícita.

---

# 4. Sprint 1 — Stream A: V2 activable end-to-end (semana 1)

Objetivo: que V2 pueda ser default sin romper persistencia, SSE ni contexto. B1 puede iniciar en paralelo porque no depende de A.

## A2 — V2 persistence + SSE para outbound

**Descripción:**
`processMessageV2` hoy retorna `{ text, messageId: v2_${Date.now()}, route... }` pero no inserta outbound en `messages` ni emite SSE. Activar V2 así rompe DemoLive, dashboard thread y auditoría conversacional. Extraer o reutilizar la misma semántica de V1 (`persistAndEmitBotResponse`) para que V2 persista y emita igual que V1.

**Archivos a tocar:**
- `server/src/agent/v2/core/v2-adapter.ts:51-84`, especialmente `:77-83`.
- `server/src/agent/orchestrator.ts:424-628`, especialmente V1 persistencia `:433-628` y flag `:428`.
- `server/src/api/sim.ts:27-69`.
- `server/src/db/schema.ts:88-102` (`messages`).
- Si existe: `server/src/events/sse.ts` o helper actual de SSE.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:130-136`, `AUDITORIA-MVP-GPT 2.md:190-226`, `AUDITORIA-MVP-GPT 2.md:288-304`.

**Dependencias:** A1, C2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-agent tests/dashboard tests/health
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx tsc --noEmit
```

Smoke manual:

```bash
curl -s -X POST http://localhost:8787/api/sim/message \
  -H 'content-type: application/json' \
  -d '{"tenantSlug":"santa-maria","senderId":"smoke-v2","text":"Hola, quiero información de rinomodelación"}'
```

Aceptación: inbound y outbound quedan en `messages`; `providerMessageId` del outbound no colisiona; SSE publica el outbound; `messageId` retornado corresponde al registro persistido, no a un timestamp fake.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: duplicar lógica V1/V2. Mitigar extrayendo helper compartido pequeño, no reescribir orquestador.
- Riesgo: SSE emite sin tenant. Mitigar incluyendo `tenantId`/`tenantSlug` en evento y test multi-tenant básico.

---

## A3 — `AGENT_KERNEL_V2` en env schema y default true

**Descripción:**
El flag se lee con `process.env.AGENT_KERNEL_V2 === 'true'` en crudo y no existe en schema ni examples. Fase 1 debe correr V2 por defecto con forma explícita de desactivar a V1 si aparece un bug.

**Archivos a tocar:**
- `server/src/agent/orchestrator.ts:428`.
- `server/src/env.ts` o `server/env.ts`.
- `server/.env.example`.
- `server/.env` local de dev, sin commitear.
- `server/scripts/smoke-test.sh`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:130-136`, `AUDITORIA-MVP-GPT 2.md:288-304`.

**Dependencias:** A2, C3.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx tsc --noEmit
AGENT_KERNEL_V2=false LLM_PROVIDER=mock npx vitest run tests/agent
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-agent
```

Aceptación: `.env.example` muestra `AGENT_KERNEL_V2=true`; env inválida falla de forma legible; health o logs muestran si V2 está activo.

**Estimación:** 0.5 día.

**Riesgos y mitigaciones:**
- Riesgo: default true rompe tests V1. Mitigar parametrizando tests por flag.

---

## A4 — `loadContext` real para V2

**Descripción:**
El adapter V2 construye providers pero `loadContext` devuelve `{}`. Para respuestas fiables, V2 debe recibir business profile, persona, hours, booking mode, ciudad/moneda detectada, memoria del paciente y datos de conversación relevantes.

**Archivos a tocar:**
- `server/src/agent/v2/core/v2-adapter.ts:12-49`, `:47`, `:60-63`.
- `server/src/agent/v2/core/conversation-snapshot.ts:42`.
- `server/src/agent/v2/memory/memory-service.ts:46-62`.
- `server/src/db/schema.ts:116-145`, `:156-170`.
- `server/src/flows/santa-maria/catalog.ts:1-11`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:190-226`, `AUDITORIA-MVP-GPT 2.md:227-255`.

**Dependencias:** A3.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-memory-integration tests/v2-flow-e2e tests/santa-maria
npx tsc --noEmit
```

Aceptación: snapshot incluye `business_profile.hours`, persona Carlos, booking mode, catalog items activos, memory slots conocidos; tests cubren que un paciente con ciudad/servicio guardado no vuelve a pedir esos datos al iniciar flow.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: cargar demasiado contexto al LLM. Mitigar snapshot compacto y normalizado.
- Riesgo: mezclar tenant. Mitigar usando `withTenant` existente y tests RLS.

---

## A10 — Eliminar CommonJS `require()` en ESM

**Descripción:**
El backend es ESM (`"type": "module"`). Los `require()` en V2 adapter son deuda técnica que puede fallar en runtime/build. Convertirlos a imports estáticos o dynamic `await import()` tipado.

**Archivos a tocar:**
- `server/src/agent/v2/core/v2-adapter.ts:29,40,44`.
- Posibles módulos importados desde esos puntos.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:288-304`.

**Dependencias:** A1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
grep -R "require(" -n src/agent/v2 || true
npx tsc --noEmit
npx vitest run tests/v2-agent
```

Aceptación: no quedan `require()` en `src/agent/v2`; tests V2 verdes.

**Estimación:** 0.5 día.

**Riesgos y mitigaciones:**
- Riesgo: ciclos de import. Mitigar usando dynamic import solo donde sea estrictamente necesario.

---

## B1 — Auth real local: password hash + login DB-backed + sesión con tenant

**Descripción:**
Se inicia en paralelo en Sprint 1 y puede cerrarse en Sprint 2. El login actual lee `data/users.json` con password plaintext; register crea tenant + user pero no guarda password. Implementar credenciales reales locales sin OAuth: columna `password_hash`, unique email por tenant/global según decisión, backend login, register con hash, y NextAuth Credentials usando DB/backend en vez de JSON.

**Archivos a tocar:**
- `auth.ts:6-9,18-23,42-55`.
- `data/users.json:1`.
- `server/src/db/schema.ts:51-59` (`users`).
- `server/src/index.ts:58-77` o nuevo `server/src/api/auth.ts`.
- `app/(auth)/register/page.tsx:31`.
- `middleware.ts:4`.
- Nueva migración: `server/drizzle/0011_users_auth.sql`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:400-404`, `AUDITORIA-MVP-GPT 2.md:445-450`.

**Dependencias:** C2, C3.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx vitest run tests/auth tests/rls
npx tsc --noEmit

cd ..
npm run build
npm test -- --runInBand || npm test
```

Smoke:

- Registro crea tenant, owner y `password_hash`, nunca password plano.
- Login con password correcta crea sesión.
- Login con password incorrecta falla.
- `session.user` o `session` contiene `tenantId`, `tenantSlug`, `role`, `userId`.
- `data/users.json` deja de ser fuente de auth; puede borrarse o quedar solo como fixture de tests.

**Estimación:** 2 días.

**Riesgos y mitigaciones:**
- Riesgo: NextAuth v5 beta y API separada Hono complican cookies. Mitigar dejando NextAuth como session/JWT y usando backend `POST /api/auth/login` para validar credenciales.
- Riesgo: romper registro. Mitigar con tests de register/login y migración idempotente.

**Notas:**
Preferir `argon2id` si el entorno lo soporta; si complica build, usar `bcryptjs` como fallback documentado para MVP local.

---

# 5. Sprint 2 — Stream A: PR6.1 + PR9 + Knowledge Patch (semana 2)

Objetivo: cerrar la deuda de policy y convertir `precio` en un flow real con multi-moneda, promos y media simulation.

## A5 — PR6.1 clinical policy enforcement single-source

**Descripción:**
La evaluación clínica ocurre dos veces: en router vía `enforceClinicalSafety` y en kernel vía `evaluatePolicy`. Mantener el audit transparente y dejar enforcement en una sola fuente reduce inconsistencias, latencia y ruido en eval. No cambiar el orden global del pipeline de §9.

**Archivos a tocar:**
- `server/src/agent/v2/understanding/structured-router.ts:419-528`.
- `server/src/agent/v2/policy/policy-engine.ts:6-119`, especialmente `:103`.
- `server/src/agent/v2/policy/clinical-safety.ts:13-57`.
- `server/src/agent/v2/policy/clinical-safety-audit.ts`.
- `server/src/agent/v2/core/agent-kernel.ts:66-193`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:256-275`, `AUDITORIA-MVP-GPT 2.md:521-530`.

**Dependencias:** A3, A4.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-agent tests/agent/v2/eval -- --run
npx tsc --noEmit
```

Aceptación funcional:
- Un mensaje de contraindicación urgente escala una sola vez.
- Un mensaje de consejo médico prohibido bloquea una sola vez.
- `ClinicalSafetyAudit` sigue escribiendo auditoría transparente.
- Test espía o métrica demuestra que `evaluateClinicalSafety` no se ejecuta dos veces para el mismo mensaje.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: mover enforcement al router y violar §9. Mitigar dejando router como classifier/audit y policy engine como enforcement.
- Riesgo: bajar safety. Mitigar con casos críticos de clinical-safety y prompt-injection.

---

## A6.1 — PR9 base: `PRECIO_FLOW` real y mapeado

**Descripción:**
`precio` hoy no es flow; cae a canned/LLM. Crear un flow de precio explícito con estados mínimos: detectar/confirmar ciudad, detectar/confirmar servicio, mostrar precio, CTA a agendar, y handoff si servicio/mercado no existe.

**Archivos a tocar:**
- `server/src/flows/santa-maria/flows.ts` (nuevo `PRECIO_FLOW`; el dossier referencia `flows.ts:97-121` como área esperada).
- `server/src/agent/v2/adapter/flow-adapter.ts:5-8`, `:22-40`, `:112-150`.
- `server/src/flows/engine.ts`.
- `server/src/flows/santa-maria/canned-responses.ts`.
- `server/src/agent/v2/understanding/deterministic-domain-route.ts:10-17`, `:17-182`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:227-255`, `AUDITORIA-MVP-GPT 2.md:458-472`.

**Dependencias:** A4, A5.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-flow-adapter tests/v2-flow-e2e tests/santa-maria
npx tsc --noEmit
```

Casos mínimos:
- "¿Cuánto cuesta rinomodelación?" → pregunta ciudad si no la sabe.
- "Estoy en Bucaramanga" → resuelve COP.
- "Red Lips en Miami" → resuelve USD sin pedir ciudad extra.
- Servicio no encontrado → ofrece escalar, no inventa.
- Tras `show_price` ofrece agendar sin menú de botones.

**Estimación:** 1.5 días.

**Riesgos y mitigaciones:**
- Riesgo: flow engine no soporta suficiente lógica. Mitigar poniendo lógica de resolución en `FlowAdapter`/helper de pricing, no en templates.

---

## A6.2 — Catálogo multi-mercado mínimo: COP/USD/EUR/MXN sin rediseño completo

**Descripción:**
Integrar los precios descubiertos en §13 y §15. Para MVP, evitar una migración masiva a `prices: Record`; usar rows por mercado y helpers de dominio. Esto mantiene compatibilidad con `catalog_items.price/currency/cities/imageKeys` y permite que Dashboard siga listando servicios.

**Archivos a tocar:**
- `server/src/flows/santa-maria/catalog.ts:1-11` y `SANTA_MARIA_CATALOG`.
- `server/src/db/schema.ts:116-132` (`catalog_items`).
- `server/src/db/seed.ts:378-379` según dossier.
- Nueva migración opcional: `server/drizzle/0012_catalog_market_promos.sql`.
- Nuevo helper recomendado: `server/src/flows/santa-maria/pricing.ts`.
- `server/src/agent/v2/core/v2-adapter.ts:60-63`.
- Data fuente: `server/data/santamaria-extraction/ai-studio-result.json`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:740-784`, `AUDITORIA-MVP-GPT 2.md:851-864`, `AUDITORIA-MVP-GPT 2.md:1261-1319`.

**Dependencias:** A6.1, C2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npm run db:migrate
npm run db:seed
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/santa-maria tests/v2-flow-e2e
npx tsc --noEmit
```

Casos mínimos:
- Bucaramanga/Bogotá/Medellín/Cali/Cartagena → COP.
- CDMX/México → MXN.
- Miami/USA/dólares/USD → USD.
- Europa/España/EUR/euros → EUR.
- Precios no son conversiones; se usan valores exactos del catálogo extraído.

**Estimación:** 2 días.

**Riesgos y mitigaciones:**
- Riesgo: duplicar servicios confunde Settings. Mitigar agrupando por `serviceKey` en helper o mostrando tabs por moneda en B5.
- Riesgo: faltan MXN para varios servicios. Mitigar respuesta "ese precio para México no lo tengo confirmado; te conecto con el equipo" y handoff.

**Notas:**
No bloquear el MVP por precio COP de Hand Rejuvenation; marcarlo como `requiresHumanConfirmation` para COP/MXN.

---

## A6.3 — Promos: Esperma de Salmón/PDRN regular→promo

**Descripción:**
Modelar promos activas para que el flow de precio responda precio regular + promocional sin que el usuario tenga que preguntar "descuento". Para MVP, incluir Esperma de Salmón/PDRN COP y MXN; dejar estructura extensible.

**Archivos a tocar:**
- `server/src/flows/santa-maria/catalog.ts`.
- `server/src/flows/santa-maria/canned-responses.ts:1-149`.
- `server/src/agent/v2/adapter/flow-adapter.ts:72-150`.
- `server/src/agent/v2/understanding/deterministic-domain-route.ts:17-182`.
- `server/src/flows/santa-maria/pricing.ts` nuevo.
- `server/src/db/schema.ts:116-132` si se agregan `regular_price`/`promo_price`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:745-746`, `AUDITORIA-MVP-GPT 2.md:937-950`, `AUDITORIA-MVP-GPT 2.md:1501-1535`.

**Dependencias:** A6.2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-flow-e2e tests/santa-maria
npx tsc --noEmit
```

Casos mínimos:
- "Precio de esperma de salmón en Bucaramanga" → "regular $800.000 COP, promo $499.000 COP".
- "PDRN en CDMX" → "regular $5.700 MXN, promo $3.800 MXN".
- "¿Tienen descuentos?" + servicio conocido → responde promo conocida, no escala por default.
- "Descuento en servicio sin promo" → responde que no tiene promo confirmada y ofrece agendar/escalar.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: promo sin vigencia crea promesa comercial falsa. Mitigar copy "promoción activa registrada" y campo opcional `promoEndDate`; documentar que Carlos debe confirmar vigencia antes del piloto si cambia.

---

## A6.4 — Media contract + manifest de 34 imágenes para simulación Fase 1

**Descripción:**
Añadir `media?: { url, type, imageKey, alt, service, currency }[]` a la respuesta V2 y permitir que flow/canned puedan adjuntar imágenes. Persistir como mensajes `contentType=image` o mensaje mixto según capacidad existente. En Fase 1 esto solo se muestra en DemoLive/Dashboard mediante `/images/:key`; no se envía por Meta.

**Archivos a tocar:**
- `server/src/agent/v2/core/v2-adapter.ts:77-83`.
- `server/src/agent/v2/core/agent-kernel.ts:66-193`.
- `server/src/agent/v2/adapter/flow-adapter.ts:22-40`, `:72-150`.
- `server/src/db/schema.ts:88-102` (`messages.contentType`, `mediaUrl`).
- `server/src/index.ts:80` (`GET /images/:key`).
- `server/src/flows/santa-maria/images/manifest.json`.
- `server/src/flows/santa-maria/catalog.ts` (`imageKeys`).
- `components/conversations/ConversationsInbox.tsx:207-237`.
- DemoLive component bajo `components/dashboard/`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:786-803`, `AUDITORIA-MVP-GPT 2.md:821-850`, `AUDITORIA-MVP-GPT 2.md:976-984`, `AUDITORIA-MVP-GPT 2.md:1016-1022`.

**Dependencias:** A2, A6.2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-flow-e2e tests/dashboard tests/santa-maria
npx tsc --noEmit

cd ..
npm run build
npm test -- --runInBand || npm test
```

Casos mínimos:
- "Muéstrame fotos de Red Lips en Miami" → texto + `image_3.jpg` USD.
- "Quiero ver Red Lips en Colombia" → texto + `image_7.jpg` COP.
- "Envíame el catálogo en dólares" → texto + catálogo USD `image_9.jpg` o `image_11.jpg`.
- Dashboard muestra thumbnail o link seguro a `/images/:key`.
- Si el canal futuro no soporta media, el texto conserva la información esencial.

**Estimación:** 2 días.

**Riesgos y mitigaciones:**
- Riesgo: mezclar text+image rompe UI. Mitigar persistiendo mensaje textual y mensaje imagen separados si el modelo actual no soporta mixto.
- Riesgo: exponer imágenes sin control. Mitigar whitelist de manifest y no path traversal.

---

## A6.5 — Guía post-tratamiento de Rinomodelación

**Descripción:**
Crear canned response `guia_rinomodelacion` y dispararla después de confirmación de agendamiento para Rinomodelación. Debe funcionar como texto aunque la imagen no pueda renderizarse; si A6.4 ya está listo, adjuntar `image_2.jpg`.

**Archivos a tocar:**
- `server/src/flows/santa-maria/canned-responses.ts:1-149`.
- `server/src/flows/santa-maria/flows.ts:7-82` (`AGENDAMIENTO_FLOW`).
- `server/src/agent/v2/adapter/flow-adapter.ts:72-110`, `:152-184`.
- `server/src/flows/santa-maria/images/manifest.json`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:865-882`, `AUDITORIA-MVP-GPT 2.md:994-1002`, `AUDITORIA-MVP-GPT 2.md:1177-1188`.

**Dependencias:** A6.1, A6.4 recomendable pero no bloqueante.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-flow-e2e tests/santa-maria
npx tsc --noEmit
```

Casos mínimos:
- Flow de agendamiento con servicio Rinomodelación y prueba de anticipo → confirmación + guía.
- Flow de agendamiento con Botox → no envía guía de Rinomodelación.
- Usuario pregunta "cuidados después de rinomodelación" → responde canned guide sin diagnosticar.

**Estimación:** 0.75 día.

**Riesgos y mitigaciones:**
- Riesgo: enviar guía antes de confirmar cita. Mitigar trigger solo en estado terminal/confirmación o pregunta explícita del usuario.

---

## A6.6 — Hand Rejuvenation y masculinización AH como conocimiento defensivo

**Descripción:**
Agregar Hand Rejuvenation Radiesse/Sculptra con precios USD/EUR conocidos y sin precio COP/MXN; agregar Masculinización facial con AH como entry explícito porque aparece en COP, MXN, USD y EUR. Router debe reconocer variantes en español/inglés.

**Archivos a tocar:**
- `server/src/flows/santa-maria/catalog.ts`.
- `server/src/agent/v2/understanding/deterministic-domain-route.ts:17-182`.
- `server/src/flows/santa-maria/canned-responses.ts`.
- `server/src/flows/santa-maria/images/manifest.json`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:743-744`, `AUDITORIA-MVP-GPT 2.md:952-964`, `AUDITORIA-MVP-GPT 2.md:1024-1035`, `AUDITORIA-MVP-GPT 2.md:1144-1150`.

**Dependencias:** A6.2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/santa-maria tests/v2-agent
npx tsc --noEmit
```

Casos mínimos:
- "Hand rejuvenation Radiesse price in USD" → $699 USD.
- "Rejuvenecimiento de manos en euros" → 699€.
- "Rejuvenecimiento de manos en Bucaramanga" → no inventa COP; ofrece confirmar con Elkin/humano.
- "Masculinización facial con AH en Colombia" → $2.999.000 COP.

**Estimación:** 0.75 día.

**Riesgos y mitigaciones:**
- Riesgo: crear servicios sin confirmación local. Mitigar con mercado explícito y `requiresHumanConfirmation` para COP/MXN.

---

# 6. Sprint 3 — Stream A: cierre V2 y eval honesta (semana 3)

Objetivo: cerrar auto-advance, memoria, validators y reporte 411 para declarar el agente V2 terminado.

## A7 — Auto-advance en `handleResume`

**Descripción:**
`handleStart` salta estados cuando ya conoce slots, pero `handleResume` no. Esto afecta confirmaciones y conversaciones retomadas. Extraer loop reusable y aplicarlo también al resume, cuidando límite de iteraciones.

**Archivos a tocar:**
- `server/src/agent/v2/adapter/flow-adapter.ts:72-110`, `:112-150`, `:130-138`.
- `server/src/flows/engine.ts`.
- Tests: `server/tests/v2-flow-adapter`, `server/tests/v2-flow-e2e`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:227-255`, `AUDITORIA-MVP-GPT 2.md:458-472`.

**Dependencias:** A6.1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-flow-adapter tests/v2-flow-e2e
npx tsc --noEmit
```

Casos mínimos:
- Si memoria ya tiene ciudad y servicio, resume no vuelve a preguntar.
- Si el usuario confirma "sí", avanza al siguiente estado útil.
- Loop máximo evita ciclos infinitos.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: saltar estados que requieren consentimiento. Mitigar allowlist de auto-advance solo para estados con `collects` y slot conocido, no para confirmaciones clínicas/pago.

---

## A8 — Wiring de `onBookingConfirmed` y booking lifecycle mock/handoff

**Descripción:**
`onBookingConfirmed` existe pero nunca se llama. Conectar el punto correcto del flow para que memoria y bookings reflejen `awaiting_payment` → `booked/confirmed` cuando el usuario entrega prueba/confirmación en modo Fase 1.

**Archivos a tocar:**
- `server/src/agent/v2/adapter/flow-adapter.ts:152-184`.
- `server/src/agent/v2/memory/memory-service.ts:83-115`.
- `server/src/agent/v2/memory/memory-repository.ts:61-170`.
- `server/src/db/schema.ts:169-189` (`bookings`).
- `server/src/booking/handoff.ts:9-25`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:227-255`, `AUDITORIA-MVP-GPT 2.md:340-356`.

**Dependencias:** A7, A6.5.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-memory-persistence tests/v2-memory-integration tests/v2-flow-e2e
npx tsc --noEmit
```

Casos mínimos:
- Al crear booking queda `pending`/`awaiting_payment`.
- Al confirmar prueba de anticipo en flow, `paymentStatus=confirmed` y memory `funnelStage=booked`.
- No se llama `onBookingConfirmed` si el usuario solo preguntó precio.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: simular pago como real. Mitigar copy y status "mock/handoff"; no Wompi live.

---

## A9 — Golden validators reales: memory/funnel/NBA

**Descripción:**
El eval-runner marca validaciones críticas como "not yet implemented", por lo que cualquier golden con expectedMemory/expectedFunnel/NBA falla artificialmente. Implementar validators reales y documentar honestamente los 5 casos que fallen por límite contextual si persisten.

**Archivos a tocar:**
- `server/src/agent/v2/eval/eval-runner.ts:270,273,278,283`.
- `server/src/agent/v2/eval/golden-conversations.ts`.
- `server/src/agent/v2/memory/memory-service.ts:46-115`.
- `server/src/agent/v2/core/agent-kernel.ts:66-193`.
- Reports: `server/reports/v1-v2-regression-report.{json,md}`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:137-146`.

**Dependencias:** A8.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npm run eval:v2 -- --golden
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npm run eval:v2 -- --critical
npx tsc --noEmit
```

Aceptación: no aparece "not yet implemented" en salida; validators inspeccionan memoria/funnel/NBA real; reporte diferencia fallos reales vs limitaciones conocidas.

**Estimación:** 1.5 días.

**Riesgos y mitigaciones:**
- Riesgo: tests dependen de DB state. Mitigar fixtures por conversación y reset transaccional.

---

## A11 — Fix `seed-demo` con `current_state='precio'`

**Descripción:**
El seed demo crea una conversación con estado `precio` inexistente. Una vez PR9 exista, corregir seed para usar un estado válido del nuevo flow o resetear la conversación a un estado coherente.

**Archivos a tocar:**
- `server/src/db/seed-demo.ts:286`.
- `server/src/flows/santa-maria/flows.ts`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:288-304`, `AUDITORIA-MVP-GPT 2.md:376-380`.

**Dependencias:** A6.1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npm run db:seed-demo
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run tests/v2-flow-e2e tests/dashboard
```

Aceptación: no hay `conversation_state.current_state` que no exista en su `flowKey`; dashboard demo carga sin errores.

**Estimación:** 0.25 día.

**Riesgos y mitigaciones:**
- Riesgo: fixtures quedan stale. Mitigar test que valide estados seed vs definiciones.

---

## A12 — Eval 411 actualizado y score honesto

**Descripción:**
Ejecutar y versionar un reporte post-fixes sobre los 411 casos reales. No perseguir un número cosmético; el gate exige reporte honesto, 0 regresiones críticas conocidas, y explicación de fallos restantes.

**Archivos a tocar:**
- `server/src/agent/v2/eval/cases/index.ts:14-25`.
- `server/src/agent/v2/eval/eval-runner.ts`.
- `server/reports/v1-v2-regression-report.{json,md}`.
- Docs sync luego en C5.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:137-146`, `AUDITORIA-MVP-GPT 2.md:667-678`.

**Dependencias:** A9, A5, A6.1–A6.6, A7, A8.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npm run eval:v2 -- --all
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npm run eval:v2 -- --export-failures
npx tsc --noEmit
npx vitest run
```

Aceptación: reporte incluye total real de casos, V1/V2, golden validators, improvements/regressions, fallos críticos, fecha y commit SHA; no quedan referencias a 187 casos/87.7% salvo como histórico stale.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: score baja por validators reales. Mitigar documentando causas; no falsear score.

---

# 7. Sprint 4 — Stream B: Dashboard funcional y seguro (semana 4)

Objetivo: convertir el dashboard de demo conectado en una herramienta funcional para el piloto local.

## B2 — Tenant dinámico desde sesión; eliminar hardcode `santa-maria`

**Descripción:**
El API client hardcodea `TENANT_SLUG = "santa-maria"`. Después de B1, las llamadas deben usar el tenant de sesión. Para MVP single-tenant, Santa María puede ser seed default, pero no puede estar hardcoded en `lib/api.ts`.

**Archivos a tocar:**
- `lib/api.ts:1-2`, `:9`, `:28-140`.
- `auth.ts:42-55`.
- Pages dashboard/conversations/settings que llaman API.
- `middleware.ts:4`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:406-411`, `AUDITORIA-MVP-GPT 2.md:441-452`.

**Dependencias:** B1.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
grep -R "TENANT_SLUG = \"santa-maria\"" -n . || true
npm run build
npm test -- --runInBand || npm test
```

Aceptación: sesión contiene `tenantSlug`; API functions reciben tenant explícito o lo leen de helper seguro; no hay hardcode salvo fixtures/tests.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: client components no tienen sesión al primer render. Mitigar hooks que esperen `status === authenticated` o server components que pasen tenant.

---

## B3 — Botón "Escalar" funcional

**Descripción:**
El botón existe pero no tiene `onClick`. Debe llamar takeover, invalidar queries y actualizar UI a human_active.

**Archivos a tocar:**
- `components/conversations/ConversationsInbox.tsx:207-237`.
- `lib/api.ts:91-97`.
- `server/src/api/dashboard.ts:122-138`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:413-422`, `AUDITORIA-MVP-GPT 2.md:441-452`.

**Dependencias:** B2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
npm test -- --runInBand || npm test
npm run build
```

Smoke: en conversación con sugerencia IA, click "Escalar" llama `POST /api/conversations/:id/takeover`, status cambia a `human_active`, aparece estado visual, reply humano queda habilitado.

**Estimación:** 0.75 día.

**Riesgos y mitigaciones:**
- Riesgo: takeover sin assigned user. Mitigar usar userId de sesión si backend lo soporta; si no, status mínimo y audit/handoff summary.

---

## B4 — Takeover / handback visibles en UI

**Descripción:**
Además de "Escalar", el operador necesita ver y devolver el control al bot. Agregar barra de estado en thread header con acciones según status: bot_active → tomar control; human_active/escalated → devolver al bot.

**Archivos a tocar:**
- `components/conversations/ConversationsInbox.tsx:82-108`, `:249-272`.
- `lib/api.ts:91-97`.
- `server/src/api/dashboard.ts:122-138`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:413-422`, `AUDITORIA-MVP-GPT 2.md:441-452`.

**Dependencias:** B3.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
npm run build
npm test -- --runInBand || npm test
```

Aceptación: UI muestra propietario actual; handback cambia status a `bot_active`; reply manual respeta estados; queries se invalidan sin reload.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: el bot responde inmediatamente tras handback en medio de un flow. Mitigar que handback solo cambie status; próximo inbound reanuda con resumen/memory.

---

## B5 — Settings persiste todos los campos relevantes

**Descripción:**
Settings solo persiste `persona`; hours/city/notifs son locales. Persistir business profile completo: persona, hours, offHoursMessage, bookingMode, rules, canned overrides básicos, googleMapsUrl; y adaptar catálogo para multi-mercado en modo lectura/edición mínima.

**Archivos a tocar:**
- `app/(dashboard)/settings/page.tsx:13-16`, `:38-69`, `:125-144`, `:151-188`, `:208-230`.
- `server/src/api/dashboard.ts:225-258`, especialmente `:239`.
- `server/src/db/schema.ts:133-145` (`business_profile`).
- `lib/api.ts:110-131`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:432-439`, `AUDITORIA-MVP-GPT 2.md:441-452`.

**Dependencias:** B2, A6.2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx vitest run tests/dashboard
npx tsc --noEmit

cd ..
npm run build
npm test -- --runInBand || npm test
```

Casos mínimos:
- Cambiar horario y recargar → persiste.
- Cambiar offHoursMessage y bookingMode → persiste.
- Notification toggles persisten en `business_profile.rules.notificationPreferences` o estructura equivalente.
- Lista catálogo muestra precios por mercado sin duplicación confusa.

**Estimación:** 2 días.

**Riesgos y mitigaciones:**
- Riesgo: regex frágil para persona/hours. Mitigar formulario controlado con shape JSON, no parse de string.

---

## B6 — SSE `/api/sim/stream` con auth + tenant

**Descripción:**
SSE es público por query `tenantSlug`. Protegerlo. Como `EventSource` no permite headers custom de forma portable, usar fetch streaming con headers autenticados desde el cliente, o un proxy Next same-origin que adjunte tenant/session. No debe quedar acceso "solo con slug".

**Archivos a tocar:**
- `server/src/api/sim.ts:69`.
- `server/src/api/middleware.ts` (`resolveTenant`, `DEV_AUTH`).
- `lib/api.ts:140` (`subscribeToSSE`).
- DemoLive component bajo `components/dashboard/`.
- `auth.ts` sesión tenant.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:105-116`, `AUDITORIA-MVP-GPT 2.md:318-320`, `AUDITORIA-MVP-GPT 2.md:441-452`.

**Dependencias:** B1, B2, A2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx vitest run tests/dashboard tests/channels
npx tsc --noEmit

cd ..
npm run build
```

Security smoke:
- `GET /api/sim/stream?tenantSlug=santa-maria` sin auth → 401/403.
- Stream autenticado con tenant de sesión → recibe solo eventos de ese tenant.
- Intento cross-tenant → 403 o 0 eventos.

**Estimación:** 1.5 días.

**Riesgos y mitigaciones:**
- Riesgo: romper DemoLive por streaming fetch. Mitigar fallback controlado solo en dev con token firmado corto, no query slug pública.

---

# 8. Sprint 5 — Hardening, workers, docs, E2E y Meta spec (semana 5)

Objetivo: convertir lo implementado en un MVP confiable, demostrable y listo para Fase 2.

## C4 — Scheduler local de workers

**Descripción:**
Reminders/reengagement/crm existen solo como POST manual. Agregar scheduler opt-in con env, idempotente, que llame los mismos handlers sin duplicar lógica.

**Archivos a tocar:**
- `server/src/api/workers.ts:18-57`.
- `server/src/index.ts` bootstrap.
- Nuevo: `server/src/workers/scheduler.ts`.
- `server/src/db/schema.ts:147-155` (`worker_logs`).
- `server/.env.example` (`SCHEDULER_ENABLED`, intervalos).
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:331-334`, `AUDITORIA-MVP-GPT 2.md:488-502`.

**Dependencias:** C2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
SCHEDULER_ENABLED=true LLM_PROVIDER=mock npx vitest run tests/workers tests/health
npx tsc --noEmit
```

Aceptación: scheduler no corre por default en tests salvo env; manual POST sigue funcionando; logs registran runs; no doble ejecución concurrente.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: worker global sin tenant. Mitigar iterar tenants activos o documentar global para Fase 1; no romper RLS.

---

## C8 — Observabilidad mínima y health útil

**Descripción:**
No hay observabilidad. Para Fase 1 basta structured logger, request id, logs de agent route/latency, y `/health` con DB + env operacional sin filtrar secrets.

**Archivos a tocar:**
- `server/src/index.ts:22`.
- `server/src/agent/v2/core/metric-emitter.ts` si existe.
- `server/src/agent/v2/core/agent-kernel.ts:66-193`.
- `server/src/api/middleware.ts`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:85-99`, `AUDITORIA-MVP-GPT 2.md:488-502`.

**Dependencias:** A12.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
curl -s http://localhost:8787/health
npx vitest run tests/health
npx tsc --noEmit
```

Aceptación: health reporta DB ok, llmProvider, agentKernelV2, scheduler status; logs por request incluyen requestId, tenantSlug, route V2, latency; no secrets.

**Estimación:** 0.75 día.

**Riesgos y mitigaciones:**
- Riesgo: logs con PII. Mitigar mascarar teléfono/cédula/email usando util de privacy existente.

---

## C9 — Revisar RLS pool y `set_config` leakage

**Descripción:**
`appSql` tiene `max:1` y `set_config(..., false)` es session-scoped. Investigar y, si tests lo prueban, migrar a transacción con `set_config(..., true)` y pool mayor sin leak cross-tenant.

**Archivos a tocar:**
- `server/src/lib/tenant-db.ts:5`, `:10-13`.
- `server/tests/rls`.
- `server/drizzle/0001_rls_policies.sql:69-117`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:117-123`, `AUDITORIA-MVP-GPT 2.md:488-502`.

**Dependencias:** C2.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx vitest run tests/rls -- --runInBand
npx tsc --noEmit
```

Aceptación: test concurrente con 2 tenants no ve filas cruzadas; si se mantiene `max:1`, queda documentado como trade-off de MVP; si se sube pool, se prueba transaction-scoped GUC.

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: cambiar pool y abrir leak. Mitigar no cambiar sin test de concurrencia que falle antes/pase después.

---

## B7 — Cleanup de dead code y dependencias huérfanas

**Descripción:**
Eliminar componentes Recharts muertos, rutas API legacy y Zustand si no se usa, o justificar retención. Reduce confusión antes de entregar a Carlos y evitar tests sobre componentes no usados.

**Archivos a tocar:**
- `components/dashboard/ChannelBreakdown.tsx`.
- `components/dashboard/ConversionChart.tsx`.
- `components/dashboard/StatusDonut.tsx`.
- `components/dashboard/MetricCard.tsx`.
- `components/dashboard/RecentConversations.tsx`.
- `app/api/conversations/*`.
- `app/api/metrics/*`.
- `package.json` si se remueve Zustand/Recharts no usados.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:424-430`, `AUDITORIA-MVP-GPT 2.md:441-452`.

**Dependencias:** B5.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
npm run build
npm test -- --runInBand || npm test
npx tsc --noEmit || true
```

Aceptación: no imports rotos; tests actualizados para componentes vivos; rutas legacy no aparecen en navegación ni uso.

**Estimación:** 0.75 día.

**Riesgos y mitigaciones:**
- Riesgo: borrar algo que e2e usa. Mitigar grep de imports y ejecutar build antes/después.

---

## B8 — E2E Playwright actualizado

**Descripción:**
Los E2E tienen assertions stale. Actualizarlos a los flujos reales: login, dashboard KPIs, settings persist, conversation takeover/handback, DemoLive V2 con SSE/media.

**Archivos a tocar:**
- `e2e/bookia.spec.ts`.
- `playwright.config.*` si existe.
- Seed helpers si hacen falta.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:441-452`, `AUDITORIA-MVP-GPT 2.md:569-575`.

**Dependencias:** B1–B6, A12.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
npx playwright test
npm run build
```

E2E mínimos:
- Login real con user seed.
- Dashboard carga métricas desde backend.
- Settings cambia horario/offHours y persiste reload.
- Conversación: Escalar → reply humano → handback.
- DemoLive: mensaje "Red Lips en Miami" → respuesta V2 USD; si se pide foto, aparece media.

**Estimación:** 1.5 días.

**Riesgos y mitigaciones:**
- Riesgo: flakiness por SSE. Mitigar waits por eventos visibles y seed controlada.

---

## C5 — Sync docs y AGENTS stale

**Descripción:**
Actualizar documentación para que el próximo agente no parta de datos falsos: tests 283+ real, eval 411 real, V2 default, PR8/PR9/PR6.1 estado final, decisiones §13.

**Archivos a tocar:**
- `AGENTS.md` raíz.
- `bookia-code/AGENTS.md`.
- `.bridge/CURRENT_TASK.md`.
- `.bridge/HANDOFF_LOG.md`.
- `README.md:3`.
- `server/docs/AGENTS-ROADMAP.md`.
- `server/docs/knowledge-alignment-audit-santa-maria.md` si se actualiza.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:667-678`, `AUDITORIA-MVP-GPT 2.md:701-728`.

**Dependencias:** A12, B8.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code
grep -R "87.7\|187 casos\|167 tests\|PR8 active\|demo con datos simulados" -n AGENTS.md server/docs .bridge README.md || true
git diff --check
```

Aceptación: docs reflejan estado real; README no dice que frontend es solo demo standalone; link al reporte eval actual.

**Estimación:** 0.75 día.

**Riesgos y mitigaciones:**
- Riesgo: docs prometen Meta real. Mitigar sección explícita "out of scope Fase 1".

---

## C7 — Meta adapter spec diseñado, no implementado

**Descripción:**
Diseñar el contrato para enchufar credenciales Meta en Fase 2 sin llamar APIs reales. El objetivo es que la interfaz, payload mapping, errores, media mapping y webhook verification estén especificados y, si se agregan stubs, lancen `not_configured`.

**Archivos a tocar:**
- `server/src/channels/types.ts:2`.
- `server/src/channels/registry.ts:6-14`.
- `server/src/api/webhooks.ts:7-85`.
- Nuevo doc: `server/docs/meta-adapter-spec.md`.
- Opcional: `server/src/channels/meta/README.md`.
- Contexto dossier: `AUDITORIA-MVP-GPT 2.md:161-171`, `AUDITORIA-MVP-GPT 2.md:488-502`, `AUDITORIA-MVP-GPT 2.md:569-575`.

**Dependencias:** A6.4, B6.

**Criterios de aceptación verificables:**

```bash
cd /Users/alejandropena/Bookia/bookia-code/server
npx tsc --noEmit
npx vitest run tests/channels
```

Spec debe cubrir:
- `sendMessage(text, media[])` mapping a WhatsApp/Instagram/Messenger.
- Webhook verification y inbound normalization.
- Idempotency por `providerMessageId`.
- Media upload/download strategy.
- Tenant resolution desde `channel_accounts`.
- Secrets/env requeridos.
- Explicitamente "no real network calls in Fase 1".

**Estimación:** 1 día.

**Riesgos y mitigaciones:**
- Riesgo: implementar "un poco" de Meta real. Mitigar tests que registry siga devolviendo 501/not_configured sin credentials.

---

# 9. Sprint 6 — Buffer de estabilización opcional (semana 6)

Usar solo si algún gate falla o si la demo de Carlos necesita pulido visual. No aceptar scope nuevo.

## Actividades permitidas

- Bugfixes de A/B/C que bloqueen M4.
- Pulido visual de media en DemoLive/Conversations.
- Ajustes copy de Carlos/Santa María sin cambiar flows.
- Re-run completo de eval y E2E.
- Rebase/merge/commit final y tag.

## Actividades prohibidas

- Meta real.
- Agenda Pro real.
- Wompi live.
- Panel completo de campañas/promociones.
- Rediseño mayor de catálogo.
- Multi-cliente comercial.

---

# 10. Checklist final de producción Fase 1

## Agente V2

- [ ] `AGENT_KERNEL_V2=true` default en env schema y `.env.example`.
- [ ] V2 persiste outbound y emite SSE.
- [ ] `loadContext` real.
- [ ] PR6.1 single-source clinical policy.
- [ ] PR9 `precio` flow real.
- [ ] Multi-moneda COP/USD/EUR/MXN implementada con datos exactos.
- [ ] Promos Esperma de Salmón/PDRN COP/MXN.
- [ ] Media payload + manifest 34 imágenes en simulación.
- [ ] Guía Rinomodelación automática post-confirmación.
- [ ] Hand Rejuvenation reconocido sin alucinar COP/MXN.
- [ ] Auto-advance en start y resume.
- [ ] Booking memory lifecycle conectado.
- [ ] Golden validators reales.
- [ ] Eval 411 actualizado y documentado.

## Dashboard

- [ ] Auth DB-backed con password hash.
- [ ] Sesión incluye tenant.
- [ ] No tenant hardcoded en API client.
- [ ] Escalar funcional.
- [ ] Takeover/handback visibles.
- [ ] Settings persiste profile/hours/rules/offHours/bookingMode/notifs.
- [ ] SSE protegido.
- [ ] Media renderiza en conversaciones/demo.
- [ ] Dead code limpiado.
- [ ] Playwright verde.

## Cross-cutting

- [ ] Git limpio y push final.
- [ ] Migraciones reproducibles desde DB vacía.
- [ ] Secrets fuera de git.
- [ ] Scheduler local opt-in.
- [ ] Observabilidad mínima.
- [ ] RLS pool probado.
- [ ] Docs sincronizados.
- [ ] Meta adapter spec lista.

---

# 11. Comandos de smoke final para M4

```bash
cd /Users/alejandropena/Bookia/bookia-code

git status --short

# Backend
cd server
npm run db:migrate
npm run db:seed
npm run db:seed-demo
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx tsc --noEmit
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx vitest run
AGENT_KERNEL_V2=true LLM_PROVIDER=mock npm run eval:v2 -- --all

# Frontend
cd ..
npm run build
npm test -- --runInBand || npm test
npx playwright test

# Manual API smoke
curl -s http://localhost:8787/health
curl -s -X POST http://localhost:8787/api/sim/message \
  -H 'content-type: application/json' \
  -d '{"tenantSlug":"santa-maria","senderId":"m4-smoke-1","text":"Hola, estoy en Miami y quiero saber precio de Red Lips"}'
```

Resultado esperado del último smoke: respuesta V2 con precio USD $350, CTA natural para agendar, y si se pide foto, media correspondiente a `image_3.jpg`.

---

# 12. Backlog explícito Fase 2

Estos puntos quedan fuera del plan aunque el diseño los prepare:

- Meta Graph API real para WhatsApp/Instagram/Messenger.
- Subida/envío real de media a Meta.
- Agenda Pro API real.
- Wompi live.
- Panel avanzado de campañas/promos con fechas, segmentos y auditoría.
- Rediseño total de catálogo multi-moneda con UI completa de administración.
- TikTok.
- Hosting production-grade, TLS, CI/CD completo, Sentry/PostHog.
- Precio COP/MXN definitivo de Hand Rejuvenation si Carlos no lo confirma durante Fase 1.

---

# 13. Orden recomendado de commits

1. `chore: snapshot agent v2 audit state` — C1.
2. `chore(db): add reproducible migration runner` — C2/C6.
3. `chore(config): harden env and secrets handling` — C3/A3.
4. `fix(agent-v2): compile adapter and remove cjs requires` — A1/A10.
5. `feat(agent-v2): persist outbound messages and sse events` — A2.
6. `feat(agent-v2): load real business context` — A4.
7. `fix(agent-v2): single-source clinical policy enforcement` — A5.
8. `feat(agent-v2): add pricing flow` — A6.1.
9. `feat(santamaria): add multi-market catalog and promos` — A6.2/A6.3/A6.6.
10. `feat(agent-v2): support media responses and post-treatment guide` — A6.4/A6.5.
11. `fix(flows): auto-advance resume and booking memory lifecycle` — A7/A8/A11.
12. `test(eval): implement golden validators and update 411-case report` — A9/A12.
13. `feat(auth): db-backed credentials and tenant session` — B1/B2.
14. `feat(inbox): escalation takeover and handback controls` — B3/B4.
15. `feat(settings): persist business profile configuration` — B5.
16. `fix(security): protect sim sse stream` — B6.
17. `feat(workers): add local scheduler and health observability` — C4/C8/C9.
18. `chore(frontend): cleanup dead code and update e2e` — B7/B8.
19. `docs: sync mvp state and meta adapter spec` — C5/C7.
20. `chore: mvp phase1 release candidate` — final M4 tag.

---

# 14. Final gate para declarar "listo para Carlos"

Bookia está listo para el piloto demo con Carlos cuando:

1. Carlos puede iniciar sesión con credenciales reales locales.
2. Dashboard muestra métricas y conversaciones seed reales.
3. Settings guarda cambios y al recargar se mantienen.
4. DemoLive usa V2 default y responde en tono Carlos.
5. Preguntas de precio por Colombia, México, USA y Europa devuelven moneda correcta.
6. Esperma de Salmón muestra promo correcta en COP/MXN.
7. Red Lips puede mostrar before/after en moneda correcta cuando el usuario pide foto.
8. Rinomodelación envía guía post-tratamiento al confirmar cita.
9. Escalar/takeover/handback funciona en UI.
10. Eval 411 y Playwright están verdes o con fallos documentados no bloqueantes.
11. Repo está limpio, pusheado y con docs actualizadas.
12. Meta no está implementado, pero la spec permite enchufar credenciales en Fase 2 sin rediseñar el agente.
