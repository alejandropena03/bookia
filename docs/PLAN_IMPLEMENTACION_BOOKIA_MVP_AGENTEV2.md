## PLAN DE IMPLEMENTACIÓN — Bookia MVP → Producción Fase 1 + Agente V2 100%

**Resumen ejecutivo.** Este plan lleva Bookia desde el estado auditado actual hasta el north star: **MVP Fase 1 completo y pulido + Agente V2 terminado al 100%, activado por defecto y listo para enchufar credenciales Meta en Fase 2**, sin implementar Meta real, Agenda Pro real ni pagos live. La ejecución se organiza en **Sprint 0 + 4 sprints semanales + buffer opcional**, con Stream A como ruta crítica: primero estabilización, luego activación V2 con persistencia/SSE, cierre de gaps funcionales del agente, hardening del dashboard/auth y finalmente limpieza, documentación, scheduler, observabilidad mínima y spec Meta. La estimación realista para 1-2 ingenieros con asistencia de OpenCode/Claude Code es **4.5-6 semanas**, con gates M0-M4 verificables mediante `git`, `tsc`, `vitest`, eval V2 de 411 casos, smoke tests API/SSE, Playwright y revisión explícita de secretos/docs.

---

## 0. Guardrails no negociables

Este plan **no** incluye implementación real de WhatsApp/Instagram/Messenger Meta, **no** integra Agenda Pro real, **no** habilita pagos Wompi live y **no** reabre decisiones de producto/stack/agente/Santa María/seguridad ya cerradas. El entregable final debe quedar como “producto terminado esperando credenciales”: datos, agente, dashboard, configuración, auth local y arquitectura preparada para conectar credenciales después.

**Prioridad operativa:** Stream A manda. En cada sprint, si hay conflicto de capacidad, se preserva primero el avance del Agente V2. Stream B avanza en paralelo solo donde no bloquea la ruta crítica.

**Regla de ejecución por task:** cada task debe cerrarse como una unidad revisable, con cambios pequeños, tests/eval/smoke test, y evidencia en commit. No mezclar tasks grandes en un mismo commit salvo C1, que es un snapshot de seguridad urgente.

---

## 1. Calendario objetivo y asignación sugerida

| Ventana | Foco principal | Stream A | Stream B / Cross-cutting | Gate |
|---|---|---|---|---|
| **Sprint 0, días 1-3** | Estabilización | A1 | C1, C2, C3 | **M0 — Estable** |
| **Sprint 1, semana 1** | V2 activable end-to-end | A2, A3, A4, A10 | B1, C6 | **M1 — V2 activado** |
| **Sprint 2, semana 2** | Cierre funcional V2 I | A5, A6, A7 | B2, B3, B4, C9 | M2 parcial |
| **Sprint 3, semana 3** | Cierre funcional V2 II + Dashboard core | A8, A9, A11 | B5, B6, C4 | **M3 — Dashboard funcional** |
| **Sprint 4, semana 4** | Eval, E2E, docs, spec, obs | A12 | B7, B8, C5, C7, C8 | **M2 + M4** |
| **Sprint 5, buffer 3-5 días** | RC/hardening si hace falta | Bug bash | Demo, runbook, último smoke | M4 final si no cerró en Sprint 4 |

**Capacidad sugerida:**  
- **Ingeniero A / agente principal:** Stream A completo, con apoyo de OpenCode para tests y refactors.  
- **Ingeniero B / agente secundario:** B1-B8 y C2-C9, tomando C1/C3 de inmediato.  
- Si solo hay una persona, mantener el orden de sprints, pero mover B1-B6 a los huecos después de A2/A3 y antes de A12.

---

## 2. Milestones y gates

### M0 — Estable
**Incluye:** C1, C2, C3, A1.  
**Gate verificable:**
- `git status --short` limpio o solo archivos locales explícitamente ignorados.
- Commit y push remotos existen para el snapshot V2.
- `cd server && npx tsc --noEmit` sin errores, incluido `server/src/agent/v2/core/v2-adapter.ts:10`.
- Migraciones corren en DB limpia antes de seeds.
- `cd server && npx vitest run` verde.
- Ningún secreto real queda staged/committed.

### M1 — V2 activado
**Incluye:** A2, A3, A4, A10.  
**Gate verificable:**
- `AGENT_KERNEL_V2=true` está en schema/env/example y se usa desde env tipado, no con `process.env` crudo.
- `POST /api/sim/message` con V2 inserta inbound + outbound en `messages` y emite SSE.
- Dashboard/conversation thread muestra la respuesta V2 persistida.
- Smoke test V2 documentado con conversación Santa María.
- `tsc` y `vitest` verdes.

### M2 — V2 cerrado
**Incluye:** A5-A12.  
**Gate verificable:**
- PR6.1 cerrado: clinical policy enforcement single-source, sin doble evaluación.
- PR9 cerrado: flow `precio` definido, seed incluido, mapeado a intent.
- Auto-advance funciona en `handleStart` y `handleResume`.
- `onBookingConfirmed` se llama en confirmación mock correcta.
- Golden validators memory/funnel/NBA implementados, sin stubs “not yet implemented”.
- Eval actualizado sobre **411 casos**, score documentado honestamente.
- `tsc` global y tests V2 verdes.

### M3 — Dashboard funcional
**Incluye:** B1-B6.  
**Gate verificable:**
- Login local real contra DB con hash de password, sin `data/users.json` plaintext.
- Sesión contiene `tenant_id`/`tenant_slug`/role.
- `lib/api.ts` no hardcodea `santa-maria`.
- Settings persiste todos los campos comprometidos.
- Botón “Escalar”, takeover y handback funcionan en UI.
- SSE queda protegido por auth/token tenant-scoped.

### M4 — MVP listo
**Incluye:** B7-B8 y C4-C9, más todos los gates anteriores.  
**Gate verificable:**
- Dead code removido o justificado.
- Playwright E2E verde contra app actual.
- Scheduler de workers activo y configurable.
- Docs sincronizados; no quedan claims stale `167 tests`, `87.7%`, `PR8 active`.
- Observabilidad mínima con logger estructurado + health checks.
- Meta Adapter Spec diseñado sin llamadas reales ni tokens.
- Demo Fase 1 lista: login, dashboard, settings, chat simulado V2, escalamiento, handback, eval y smoke.

---

# Sprint 0 — Estabilización crítica, días 1-3

## C1 — GIT HYGIENE CRISIS: commit + push URGENTE del trabajo V2

**Descripción.** Antes de tocar código, preservar el trabajo auditado: PR0-PR8, cientos de archivos, reportes y plantilla DOCX están sin commit en `bookia-code/main` con 30 modified + 155 untracked. Este es el riesgo operativo #1: si el laptop falla, se pierden semanas de trabajo. La tarea es crear un snapshot seguro, revisar que no entren secretos, commitear y pushear a remoto.

**Archivos / refs a revisar.**
- Repo completo: `/Users/alejandropena/Bookia/bookia-code/`.
- Estado auditado: 30 modified + 155 untracked, último push `e1aa2de` del 2026-06-27.
- Secretos a proteger: `server/.env`, key DeepSeek en plaintext fuera del repo; no commitear.
- Docs afectadas por snapshot: `.bridge/`, `server/reports/`, `server/data/clinical-audit-log.jsonl`, `docs/source/Terminada plantilla estética Santamaría y bookia .docx`.

**Dependencias.** Ninguna. Es la primera task.

**Criterios de aceptación verificables.**
- Ejecutar y guardar salida de:
  - `git status --short`
  - `git diff --stat`
  - `git ls-files --others --exclude-standard`
- Verificar que `server/.env`, keys DeepSeek, credenciales locales y archivos `.env*` sensibles no estén staged.
- Crear commit de seguridad, por ejemplo: `chore: safety snapshot agent v2 audit state`.
- `git push origin main` o, si `main` está protegido, `git push origin HEAD:safety/agent-v2-audit-snapshot`.
- Confirmar que `git log --oneline -1` coincide con remoto.
- `git status --short` limpio salvo archivos locales ignorados.

**Estimación.** 0.25-0.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** commitear secretos por accidente. **Mitigación:** revisar `git diff --cached --name-only`, usar `git check-ignore server/.env`, y escanear staged con patrón de keys antes de commit.
- **Riesgo:** snapshot demasiado grande. **Mitigación:** aceptarlo; la prioridad es preservar. La limpieza viene en B7/C5.

**Notas de implementación.**
- No reordenar ni refactorizar durante C1.
- Si hay duda, crear branch de snapshot y push inmediato; luego abrir PR interno o mergear con calma.

---

## A1 — Fix P0 de TypeScript en import path V2

**Descripción.** Corregir el import roto que impide `tsc clean`: `server/src/agent/v2/core/v2-adapter.ts:10` importa `../../flows/engine.js`, pero por profundidad debe apuntar a `../../../flows/engine.js`. Este fix desbloquea todos los gates de build y evita que la activación V2 tape un error preexistente.

**Archivos / refs a tocar.**
- `server/src/agent/v2/core/v2-adapter.ts:10`.
- Validar dependencias con `server/src/flows/engine.ts`.
- Si los tests importan adapter directamente: `server/tests/v2-*`.

**Dependencias.** C1 recomendado antes de modificar.

**Criterios de aceptación verificables.**
- `cd server && npx tsc --noEmit` pasa sin TS2307.
- `cd server && npx vitest run tests/v2-agent.test.ts tests/v2-flow-adapter.test.ts` pasa.
- No se modifica comportamiento funcional todavía.

**Estimación.** 0.1-0.25 días.

**Riesgos y mitigaciones.**
- **Riesgo:** otros imports relativos similares aparecen. **Mitigación:** correr `tsc` completo, no solo la suite del adapter.
- **Riesgo:** arreglar import y mezclar refactor. **Mitigación:** commit pequeño separado.

**Notas.**
- Mantener ESM; no usar `require()` como solución temporal.

---

## C2 — Runner de migraciones automático antes de seed

**Descripción.** El runtime asume que el schema ya existe: `server/entrypoint.sh:17-22` corre `seed.ts` + `seed-demo.ts`, pero no migraciones. Además `drizzle/meta/_journal.json` solo trackea 3 de 12 SQL y varias migraciones manuales (`0001_rls_policies.sql`, `0003`-`0010`) quedan fuera del journal. El objetivo es que una DB limpia levante de cero con schema, RLS, patient memory, campos de pagos/reminders/reengagement/CRM y seeds, sin pasos manuales.

**Archivos / refs a tocar.**
- `server/entrypoint.sh:17-22`.
- `server/drizzle/`.
- `server/drizzle/meta/_journal.json`.
- Nuevo recomendado: `server/src/db/run-sql-migrations.ts` o `server/scripts/run-migrations.ts`.
- `server/package.json` para script `db:migrate:sql`.
- `server/src/db/schema.ts:19-190` como fuente para validar tablas.
- `server/src/db/seed.ts:151`, `server/src/db/seed-demo.ts:323`.

**Dependencias.** C1. Puede avanzar en paralelo con A1.

**Criterios de aceptación verificables.**
- En volumen Postgres vacío: `docker compose down -v && docker compose up --build` crea schema completo antes de seeds.
- Re-ejecutar container no duplica datos ni falla por migraciones ya aplicadas.
- Existe tabla de control propia, por ejemplo `bookia_migrations(filename, checksum, applied_at)`, o una estrategia equivalente documentada.
- Las 13 tablas existen, incluyendo `patient_memory` y `bookings`.
- RLS está habilitado y `FORCE ROW LEVEL SECURITY` sigue activo en tablas tenant-scoped.
- `cd server && npx vitest run tests/rls*.test.ts tests/health*.test.ts` verde.
- `entrypoint.sh` falla rápido y con log claro si una migración falla; no intenta seed sobre schema parcial.

**Estimación.** 1-1.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** SQL manual no idempotente en DB ya existente. **Mitigación:** soportar modo baseline explícito (`MIGRATIONS_BASELINE=true`) para registrar archivos aplicados tras verificación manual; en DB limpia siempre ejecutar.
- **Riesgo:** drift entre Drizzle schema y SQL manual. **Mitigación:** añadir smoke que compare existencia de columnas críticas (`patient_memory.version`, `bookings.payment_status`, `catalog_items.cities`).
- **Riesgo:** runner corre con rol `bookia_app`. **Mitigación:** migraciones usan conexión admin, runtime sigue con `bookia_app`.

**Notas.**
- No intentar “arreglar” todo el historial Drizzle en este sprint. El objetivo es reproducibilidad local y Docker.
- Mantener seeds idempotentes; no meter datos reales sensibles.

---

## C3 — Secrets management local para DeepSeek y env hygiene

**Descripción.** DeepSeek API key está en plaintext en `server/.env` local. Aunque está gitignored, el plan necesita un manejo seguro mínimo: `.env.example` completo sin secretos, validación Zod clara, secret scanning pre-commit/manual y documentación para cargar la key desde un vault local o variable shell. No se implementa un secrets manager cloud porque no hay decisión de hosting.

**Archivos / refs a tocar.**
- `server/.env.example`.
- `server/src/env.ts` y/o `server/env.ts` si ambos existen.
- `server/package.json` para script opcional `secrets:check`.
- `.gitignore`.
- Docs mínimos: `docs/` o `server/docs/`.

**Dependencias.** C1.

**Criterios de aceptación verificables.**
- `.env.example` contiene todas las variables necesarias, con placeholders seguros: `LLM_PROVIDER`, `DEEPSEEK_API_KEY`, `AGENT_KERNEL_V2`, `DEV_AUTH`, DB vars, worker toggles.
- `LLM_PROVIDER=deepseek` sin `DEEPSEEK_API_KEY` produce error claro al boot; `LLM_PROVIDER=mock` no requiere key.
- Ningún secreto real aparece en `git grep`.
- El commit no incluye `server/.env`.
- Existe comando/documentación de verificación de secretos antes de push.
- README/AGENTS actualizado posteriormente en C5 con la fuente de verdad.

**Estimación.** 0.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** romper dev local si la key deja de estar donde se espera. **Mitigación:** documentar export local (`export DEEPSEEK_API_KEY=...`) y mantener `LLM_PROVIDER=mock` como fallback para tests.
- **Riesgo:** sobreingeniería de secrets cloud. **Mitigación:** limitar a local/vault/env vars; cloud queda fuera de scope.

**Notas.**
- No commitear valores reales ni “ejemplos” con formato de key real.
- Esta task prepara A3, pero no activa V2 todavía.

---

## Gate M0 — Estable

**Ejecutar al cierre del Sprint 0:**
```bash
git status --short
cd server && npx tsc --noEmit
cd server && npx vitest run
docker compose down -v && docker compose up --build
```

**Resultado esperado:** repo preservado en remoto, build backend limpio, migraciones reproducibles, secrets no expuestos.

---

# Sprint 1 — Activación V2 end-to-end, semana 1

## A2 — Persistencia outbound + SSE para `processMessageV2`

**Descripción.** Hoy V2 retorna `{ text, messageId: v2_${Date.now()}, route, escalated, escalationReason }` en `server/src/agent/v2/core/v2-adapter.ts:77-83`, pero no inserta el mensaje outbound en `messages` ni emite SSE. V1 sí persiste y emite mediante el flujo de `orchestrator.ts:433-628`. Activar V2 sin A2 rompe dashboard, historial e inbox. La recomendación es extraer/reutilizar un único boundary de persistencia en `orchestrator.ts`, de forma que V1 y V2 produzcan una respuesta normalizada y el orchestrator haga INSERT + event emit.

**Archivos / refs a tocar.**
- `server/src/agent/orchestrator.ts:424-628`.
- `server/src/agent/v2/core/v2-adapter.ts:51-84`, especialmente `:77-83`.
- `server/src/api/sim.ts:27-69` para smoke de entrada y SSE.
- `server/src/db/schema.ts:88-102` (`messages`).
- Tests existentes: `server/tests/v2-agent.test.ts`, `server/tests/dashboard*.test.ts`, `server/tests/v2-flow-e2e.test.ts`.
- SSE emitter existente donde esté definido/reutilizado por V1.

**Dependencias.** A1, C1. C2 recomendado.

**Criterios de aceptación verificables.**
- Con `AGENT_KERNEL_V2=true`, `POST /api/sim/message` crea mensaje inbound y outbound en DB.
- El outbound tiene `direction='outbound'`, `sender_type='bot'`, `tenant_id` correcto, `conversation_id` correcto y metadata con `route` V2.
- `GET /api/conversations/:id` devuelve el outbound V2.
- SSE recibe evento de bot al enviar mensaje simulado.
- No hay duplicados si se reintenta o si el adapter devuelve `messageId`.
- Tests nuevos:
  - “V2 persists outbound message”.
  - “V2 emits SSE event”.
  - “V2 does not persist when policy blocks with handoff? / persists safe refusal according to expected behavior”.
- `cd server && npx vitest run tests/v2-flow-e2e.test.ts tests/dashboard*.test.ts` verde.

**Estimación.** 1-1.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** doble persistencia al mezclar responsabilidades adapter/orchestrator. **Mitigación:** definir contrato: kernel/adapters calculan respuesta; orchestrator persiste/emite.
- **Riesgo:** SSE actual sin auth se usa en tests. **Mitigación:** mantener compat por ahora; B6 securiza después.
- **Riesgo:** providerMessageId único. **Mitigación:** generar IDs determinísticos por request o dejar providerMessageId nullable si aplica; test anti-duplicado.

**Notas.**
- No cambiar la semántica V2 todavía; solo hacerlo observable/persistente.
- Si existen segmentos de respuesta en V1, preservar formato para UI.

---

## A3 — Env tipado y V2 default ON

**Descripción.** `AGENT_KERNEL_V2` se lee crudo con `process.env.AGENT_KERNEL_V2 === 'true'` en `server/src/agent/orchestrator.ts:428`; no está en schema Zod ni `.env.example`. La meta del north star pide V2 activado por defecto o V2 como único camino. Para Fase 1, dejar V1 disponible como fallback técnico durante una semana, pero default `true`, con env validado.

**Archivos / refs a tocar.**
- `server/src/agent/orchestrator.ts:428`.
- `server/src/env.ts` y/o `server/env.ts`.
- `server/.env.example`.
- `server/.env` local no commiteado.
- Tests de env/health: `server/tests/health*.test.ts`.
- `server/src/index.ts:22` si `/health` expone `llmProvider` y debe exponer `agentKernel`.

**Dependencias.** A2, C3.

**Criterios de aceptación verificables.**
- `AGENT_KERNEL_V2` existe en env schema con default `true`.
- `.env.example` documenta `AGENT_KERNEL_V2=true`.
- No queda `process.env.AGENT_KERNEL_V2` directo fuera del módulo de env.
- `/health` reporta `agentKernel: "v2"` o equivalente.
- Smoke:
  - `AGENT_KERNEL_V2=true` usa V2.
  - `AGENT_KERNEL_V2=false` solo se permite como rollback local temporal y está documentado.
- `cd server && npx tsc --noEmit && npx vitest run` verde.

**Estimación.** 0.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** tests antiguos asumen V1. **Mitigación:** fijar env por suite cuando prueben V1 explícitamente; default general V2.
- **Riesgo:** activar V2 antes de A2. **Mitigación:** dependencia estricta A2.

**Notas.**
- No eliminar V1 en este plan salvo que el costo sea cero. El gate exige V2 default/único, no borrado físico.

---

## A4 — `loadContext` real para V2

**Descripción.** El V2 construye snapshot y llama `loadContext`, pero en `server/src/agent/v2/core/v2-adapter.ts:47` retorna `{}`. Esto priva al kernel de business profile, reglas, horarios, booking mode, contexto conversacional y memoria del paciente. La tarea es implementar contexto real con queries tenant-scoped y estructura estable para que policy/flow/response puedan tomar decisiones con información de Santa María sin hardcode.

**Archivos / refs a tocar.**
- `server/src/agent/v2/core/v2-adapter.ts:12-49`, especialmente `:47`.
- `server/src/agent/v2/core/conversation-snapshot.ts:42`.
- `server/src/agent/v2/memory/memory-service.ts:46-62`.
- `server/src/db/schema.ts:105-145` (`flows`, `catalog_items`, `business_profile`).
- `server/src/db/schema.ts:156-166` (`patient_memory`).
- `server/src/flows/santa-maria/canned-responses.ts:104-149`.
- `server/src/flows/santa-maria/catalog.ts`.
- Tests: `server/tests/v2-memory-integration.test.ts`, `server/tests/v2-agent.test.ts`.

**Dependencias.** A2, A3.

**Criterios de aceptación verificables.**
- Snapshot/context incluye como mínimo:
  - business profile persona/rules/hours/bookingMode/offHoursMessage,
  - active flow state,
  - memory summary masked,
  - recent messages necesarios para contexto,
  - catalog activo filtrable por ciudad si hay memoria/slot.
- No se filtra PII sensible sin masking cuando se loguea.
- Test de usuario recurrente: ciudad/servicio en memoria hidrata el flujo.
- Test de horario: business hours reales afectan off-hours sin hardcode.
- `cd server && npx vitest run tests/v2-memory-integration.test.ts tests/v2-agent.test.ts` verde.

**Estimación.** 1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** pasar demasiado contexto al LLM. **Mitigación:** snapshot compacto y campos normalizados; evitar dumps de mensajes completos si no son necesarios.
- **Riesgo:** romper RLS con queries admin. **Mitigación:** todas las queries bajo `withTenant`.
- **Riesgo:** repetir lógica V1. **Mitigación:** reutilizar helpers si existen, pero no reordenar pipeline V2.

**Notas.**
- Preparar estructura para C8 logging: context metadata sí, PII no.

---

## A10 — Eliminar `require()` CommonJS en módulos ESM V2

**Descripción.** El proyecto usa ESM (`"type": "module"`). `server/src/agent/v2/core/v2-adapter.ts:29,40,44` usa `require()`, lo que es frágil y puede romper bajo bundling/ts-node/Node 22. Cambiar a imports ESM tipados o inyección explícita de dependencias.

**Archivos / refs a tocar.**
- `server/src/agent/v2/core/v2-adapter.ts:29,40,44`.
- Imports relacionados en `server/src/agent/v2/adapter/flow-adapter.ts`.
- `server/tsconfig.json` si aparecen problemas de moduleResolution.

**Dependencias.** A1. Puede hacerse antes o después de A4, pero no mezclar con A2 si complica review.

**Criterios de aceptación verificables.**
- `grep -R "require(" server/src/agent/v2` no devuelve usos runtime no justificados.
- `cd server && npx tsc --noEmit` verde.
- Tests V2 verdes.
- No cambia comportamiento funcional.

**Estimación.** 0.25-0.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** ciclos de import. **Mitigación:** mover factories a módulos pequeños o usar imports dinámicos ESM solo si hay ciclo real.
- **Riesgo:** mezclar con refactor de providers. **Mitigación:** commit separado.

**Notas.**
- Esta tarea reduce deuda técnica antes del cierre PR6.1/PR9.

---

## B1 — Auth real local: DB-backed credentials, password hash y sesión tenant-aware

**Descripción.** El frontend usa NextAuth Credentials leyendo `data/users.json` con password plaintext (`auth.ts:6-9,18-23`) y no propaga tenant en session (`auth.ts:42-55`). El backend register crea tenant + owner user pero no guarda password (`server/src/index.ts:58-77`), y `users` no tiene columna password ni unique email (`server/src/db/schema.ts:51`). Esta task reemplaza el mock por auth local real, sin OAuth, con hash Argon2id o bcrypt, lookup en DB y session con tenant.

**Archivos / refs a tocar.**
- Frontend `auth.ts:6-9,18-23,42-55`.
- `data/users.json:1` para retirar dependencia plaintext.
- Backend `server/src/index.ts:58-77`.
- `server/src/db/schema.ts:51` (`users`).
- Nueva migración SQL: `server/drizzle/0011_add_user_auth_fields.sql` o equivalente.
- Nuevo módulo recomendado: `server/src/auth/user-repository.ts`, `server/src/auth/password.ts`.
- `middleware.ts:4` si se requiere role/tenant validation adicional.
- Tests backend auth nuevos.
- Tests frontend login/register existentes.

**Dependencias.** C2 ideal para migración; puede arrancar en paralelo después de C1.

**Criterios de aceptación verificables.**
- `users` tiene `password_hash` no-null para usuarios locales y unique email definido según decisión del MVP.
- `POST /api/auth/register` guarda hash, nunca password plaintext.
- Existe login DB-backed, sea vía endpoint Hono `/api/auth/login` o adapter Drizzle usado por NextAuth Credentials.
- `auth.ts` ya no lee `fs.readFileSync("data/users.json")`.
- JWT/session contiene `user.id`, `tenantId`, `tenantSlug`, `role`, `businessName` o equivalente.
- Login con password correcto funciona; password incorrecto falla.
- Register → login funciona en flujo local.
- Tests cubren:
  - hash no igual a password,
  - verify correcto/incorrecto,
  - session incluye tenant,
  - usuario inexistente no filtra información.
- `DEV_AUTH` queda documentado como bypass temporal de backend para tests, no como auth dashboard.

**Estimación.** 2-2.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** NextAuth v5 beta + adapter oficial agrega tablas extra. **Mitigación:** implementar Credentials DB-backed mínimo sobre tabla `users`; no OAuth, no accounts.
- **Riesgo:** unique global de email puede bloquear multi-tenant futuro. **Mitigación:** para Fase 1 aceptar unique global si simplifica; documentar si se elige `(tenant_id,email)`.
- **Riesgo:** romper login demo. **Mitigación:** seed crea `admin@santamaria.test` con password local segura documentada solo en `.env.example` como placeholder, no real.

**Notas.**
- Preferir Argon2id (`argon2` o `@node-rs/argon2`). Si hay fricción de build local, bcrypt es aceptable para MVP.
- No implementar OAuth ni magic links.

---

## C6 — Crear `src/db/tenant-config/` o ajustar import contract

**Descripción.** `server/src/db/import-tenant.ts:164` y `server/Dockerfile:20` referencian `server/src/db/tenant-config/`, pero el directorio no existe. Esta deuda rompe importaciones futuras y Docker si espera copiarlo. Crear el directorio y un contrato mínimo para Fase 1.

**Archivos / refs a tocar.**
- `server/src/db/import-tenant.ts:164`.
- `server/Dockerfile:20`.
- Nuevo: `server/src/db/tenant-config/.gitkeep`.
- Opcional: `server/src/db/tenant-config/santa-maria.example.json`.
- Docs de import en `server/docs/` o `docs/`.

**Dependencias.** C1. Independiente.

**Criterios de aceptación verificables.**
- Docker build no falla por directorio faltante.
- `tsx src/db/import-tenant.ts --slug=santa-maria` falla con mensaje claro si no hay config real, o funciona contra config example si se decide incluirla.
- No se guardan secretos en tenant config.
- El contrato JSON documenta profile/catalog/flows sin credenciales Meta reales.

**Estimación.** 0.25 días.

**Riesgos y mitigaciones.**
- **Riesgo:** duplicar seed Santa María. **Mitigación:** marcar config como example o generar desde seed en una task futura; no migrar seed ahora.
- **Riesgo:** incluir datos sensibles de Carlos. **Mitigación:** solo información ya presente en seeds/docs del MVP.

**Notas.**
- C6 es pequeño; ideal para cerrar al final de Sprint 1.

---

## Gate M1 — V2 activado

**Smoke mínimo recomendado:**
```bash
cd server && AGENT_KERNEL_V2=true LLM_PROVIDER=mock npx tsx src/index.ts
curl -X POST http://localhost:8787/api/sim/message \
  -H 'content-type: application/json' \
  -d '{"tenantSlug":"santa-maria","senderId":"smoke-v2","text":"Hola, quiero precio de botox en Bucaramanga"}'
```

**Validar en DB/API:**
- Hay outbound persistido.
- SSE emite evento.
- `/health` reporta V2.
- Dashboard puede leer la conversación.

---

# Sprint 2 — Cierre funcional V2 I + dashboard tenant-aware, semana 2

## A5 — PR6.1: clinical policy enforcement single-source

**Descripción.** Hoy la evaluación clínica corre dos veces: en router vía `structured-router.ts:528` con `enforceClinicalSafety(...)` y en policy vía `policy-engine.ts:103` con `evaluateClinicalSafety(...)`. La decisión de §9 mantiene `ClinicalSafetyAudit` transparente y enforcement en policy-engine. Esta task elimina la doble evaluación sin perder audit log ni protección clínica.

**Archivos / refs a tocar.**
- `server/src/agent/v2/understanding/structured-router.ts:419-528`.
- `server/src/agent/v2/policy/policy-engine.ts:6-119`, especialmente `:103`.
- `server/src/agent/v2/policy/clinical-safety-audit.ts`.
- `server/src/agent/v2/policy/clinical-safety.ts`.
- `server/src/agent/v2/core/agent-kernel.ts:120-143`.
- Eval cases: `server/src/agent/v2/eval/cases/clinical-safety*`, `prompt-injection*`, `privacy-pii*`.

**Dependencias.** A3, A4.

**Criterios de aceptación verificables.**
- `evaluateClinicalSafety` se ejecuta una sola vez por mensaje en flujo normal.
- El router sigue generando audit transparente y señales, pero no cambia el intent final por enforcement clínico salvo reglas de routing no clínicas ya existentes.
- `policy-engine` es la única fuente de action `allow|handoff|block` clínica.
- Tests con spy/mock verifican single call.
- Casos críticos clínicos del eval siguen pasando o mejoran.
- `server/data/clinical-audit-log.jsonl` sigue recibiendo entradas con required/applied action transparentes.
- `cd server && npx vitest run tests/v2-agent.test.ts` verde.

**Estimación.** 1-1.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** bajar score de safety por quitar enforcement router-side. **Mitigación:** mover señales necesarias al policy input; correr subset `clinical-safety` antes de merge.
- **Riesgo:** confundir audit con enforcement. **Mitigación:** nombres explícitos: `auditClinicalSafetySignals` vs `evaluatePolicy`.

**Notas.**
- No reordenar pipeline V2. El orden sigue: route → policy → flow/canned/llm → critic.

---

## A6 — PR9: flow `precio` definido y mapeado

**Descripción.** `flow-adapter.ts:5-8` solo mapea `saludo → first_contact` y `agendamiento → agendamiento`. El intent `precio` cae a canned/LLM, aunque es una de las rutas comerciales clave. Se debe agregar un flow `precio` en `server/src/flows/santa-maria/flows.ts` y mapearlo, preservando precios por ciudad/moneda y evitando pagos live.

**Archivos / refs a tocar.**
- `server/src/flows/santa-maria/flows.ts:7-95`.
- `server/src/agent/v2/adapter/flow-adapter.ts:5-8`, `:22-40`, `:112-150`.
- `server/src/flows/santa-maria/catalog.ts`.
- `server/src/db/seed.ts:151` para upsert flow `precio`.
- `server/src/db/schema.ts:105-115` (`flows`).
- Eval cases pricing: `server/src/agent/v2/eval/cases/pricing*`.
- Tests: `server/tests/v2-flow-adapter.test.ts`, `server/tests/v2-flow-e2e.test.ts`.

**Dependencias.** A3. A4 recomendado para ciudad/memoria.

**Criterios de aceptación verificables.**
- Existe `PRECIO_FLOW` o equivalente con estados válidos, versionado y seed.
- `INTENT_TO_FLOW_KEY` incluye `precio: "precio"`.
- Si usuario pregunta “precio de botox en Bucaramanga”, el flow responde precio COP y CTA de agendamiento/valoración.
- Si falta ciudad, pregunta ciudad antes de precio.
- Si falta servicio, pide servicio sin mostrar menú de botones.
- Si ciudad internacional aplica, respeta moneda del catálogo.
- No genera booking ni pago live desde flow precio.
- Tests cubren service known, city known, city missing, service missing, servicio no encontrado.
- Eval pricing no empeora y el reporte documenta variación.

**Estimación.** 1-1.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** duplicar lógica de canned price. **Mitigación:** flow usa catálogo como fuente; canned queda fallback.
- **Riesgo:** estados inválidos en seed-demo. **Mitigación:** A11 añade validación y corrige demo.
- **Riesgo:** precios por país. **Mitigación:** reutilizar `catalog.ts`, no hardcodear precios en prompts del flow salvo datos bancarios ya definidos para agendamiento.

**Notas.**
- El flow debe sentirse conversacional, no formulario rígido.
- No introducir menú de botones; decisión §9.

---

## A7 — Auto-advance en `handleResume`

**Descripción.** `FlowAdapter.handleStart` tiene auto-advance loop en `flow-adapter.ts:130-138`, pero `handleResume` (`:72-110`) no lo hace. Esto provoca que usuarios con datos conocidos se queden atrapados en estados que ya se pueden saltar durante confirmación/resume. Extraer un helper común para auto-advance y usarlo en ambos caminos.

**Archivos / refs a tocar.**
- `server/src/agent/v2/adapter/flow-adapter.ts:72-150`.
- `server/src/flows/engine.ts`.
- `server/src/agent/v2/memory/memory-service.ts:51-81`.
- Tests: `server/tests/v2-flow-adapter.test.ts`, `server/tests/v2-flow-e2e.test.ts`, `server/tests/v2-memory-integration.test.ts`.

**Dependencias.** A6 recomendado, A4.

**Criterios de aceptación verificables.**
- Helper compartido, por ejemplo `advanceKnownSlots(definition, state, slots, maxSteps=5)`.
- `handleStart` y `handleResume` usan el mismo comportamiento.
- Test: usuario con ciudad + servicio en memoria no repite `ask_city`/`show_service`.
- Test: usuario que confirma servicio y ya tiene datos básicos avanza al siguiente slot faltante.
- Test anti-loop: no más de 5 avances y log/metric si se corta.
- No salta estados terminales ni estados con transitions que requieren confirmación explícita cuando no hay señal del usuario.
- Tests flow e2e verdes.

**Estimación.** 0.75-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** saltar consentimiento/confirmación que debe ser explícito. **Mitigación:** solo auto-avanzar estados con `collects` y slot conocido; no saltar transitions semánticas salvo definición marcada como skippable.
- **Riesgo:** loops por definiciones mal formadas. **Mitigación:** maxSteps + test de flow definitions.

**Notas.**
- Esta task es clave para que V2 se sienta “inteligente” con memoria.

---

## B2 — Tenant dinámico desde sesión, sin `TENANT_SLUG` hardcoded

**Descripción.** `lib/api.ts:2` hardcodea `TENANT_SLUG = "santa-maria"` y lo envía en `x-tenant-slug`. Tras B1, la sesión ya debe traer tenant. Esta task hace que el cliente API use el tenant de sesión o un proxy server-side, eliminando el hardcode peligroso.

**Archivos / refs a tocar.**
- `lib/api.ts:1-140`, especialmente `:2`, `:9`, `:140`.
- `auth.ts` session callbacks de B1.
- Páginas que llaman API: `app/(dashboard)/dashboard/page.tsx:14`, `app/(dashboard)/conversations/page.tsx:25`, `app/(dashboard)/conversations/[id]/page.tsx:49`, `app/(dashboard)/settings/page.tsx:12`.
- Hooks/TanStack Query si existen.
- Tests frontend.

**Dependencias.** B1.

**Criterios de aceptación verificables.**
- `grep -R 'TENANT_SLUG = "santa-maria"' .` no encuentra hardcode en código runtime.
- API client recibe tenantSlug desde session/context o route handler server-side.
- Usuario Santa María sigue viendo sus datos.
- Tests cubren que headers usen tenant de sesión.
- Si no hay sesión, llamadas protegidas fallan/redirect, no usan fallback silencioso.
- `npm run build` del frontend verde.

**Estimación.** 0.75-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** client components no pueden leer session en funciones sueltas. **Mitigación:** crear API provider/hook o pasar tenant desde page server component.
- **Riesgo:** romper DemoLive público si usa sim API. **Mitigación:** DemoLive pública puede usar tenant demo explícito controlado por env `NEXT_PUBLIC_DEMO_TENANT_SLUG`, separado del dashboard auth.

**Notas.**
- Mantener Fase 1 mono-cliente como decisión de producto, pero sin hardcode inseguro en librería central.

---

## B3 — Botón “Escalar” funcional

**Descripción.** En `ConversationsInbox.tsx:237`, el botón “Escalar” está renderizado pero no tiene `onClick`. El backend ya tiene `POST /api/conversations/:id/takeover` en `dashboard.ts:122`. Esta task conecta la UI para que un humano tome control desde una sugerencia IA o conversación activa.

**Archivos / refs a tocar.**
- `components/conversations/ConversationsInbox.tsx:82-108`, `:207-237`.
- `lib/api.ts:91-97`.
- Backend endpoint existente: `server/src/api/dashboard.ts:122`.
- Tests UI/conversations si existen.

**Dependencias.** B2 recomendado, B1.

**Criterios de aceptación verificables.**
- Click en “Escalar” llama `takeoverConversation(conversationId)`.
- UI muestra loading y luego estado `human_active`.
- TanStack Query invalida/refresca conversación y lista.
- Si falla backend, se muestra error no intrusivo.
- Botón no está disponible para conversaciones ya `human_active` o `closed`.
- Test manual: conversación bot_active → click → status DB `human_active`.

**Estimación.** 0.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** takeover sin tenant correcto. **Mitigación:** depende de B2; endpoint usa tenant middleware.
- **Riesgo:** UX confusa. **Mitigación:** cambiar label a “Escalar a humano” y mostrar badge “Humano activo”.

**Notas.**
- No integrar Agenda Pro aquí; panel sigue “Próximamente”.

---

## B4 — Surface takeover/handback completo en UI

**Descripción.** `lib/api.ts:91-97` ya define `takeoverConversation` y `handbackConversation`, pero la UI no expone el flujo completo. Se debe agregar control visible en header/thread para tomar control y devolver al bot, con estados claros.

**Archivos / refs a tocar.**
- `components/conversations/ConversationsInbox.tsx` completo.
- `lib/api.ts:91-97`.
- Backend endpoints: `server/src/api/dashboard.ts:122-138`.
- Posible componente nuevo: `components/conversations/ConversationControlBar.tsx`.

**Dependencias.** B2, B3.

**Criterios de aceptación verificables.**
- Header de conversación muestra estado: Bot activo / Humano activo / Escalado / Cerrado.
- Desde bot_active se puede “Tomar control”.
- Desde human_active se puede “Devolver al bot”.
- Reply humano solo se permite cuando corresponde según estado actual.
- Handback limpia assigned user como endpoint actual.
- Tests o smoke:
  - takeover cambia a `human_active`,
  - handback vuelve a `bot_active`,
  - UI refleja ambos sin reload manual.

**Estimación.** 0.75-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** bot responde mientras humano está activo. **Mitigación:** si no existe, añadir/verificar guard en orchestrator para no auto-responder en `human_active`; si ya existe, cubrir con test.
- **Riesgo:** estados `escalated` vs `human_active` ambiguos. **Mitigación:** mapear ambos en UI, no cambiar enum.

**Notas.**
- Este es requisito directo del north star para dashboard pulido.

---

## C9 — RLS pool concern: transacción tenant-scoped y pool > 1 seguro

**Descripción.** `server/src/lib/tenant-db.ts:5` usa pool `max:1` y `set_config(..., false)` session-scoped en `:10-13`, lo que crea cuello de botella y posible leak cross-tenant bajo concurrencia. Investigar y, si los tests lo validan, cambiar a `set_config(..., true)` dentro de transacción para permitir pool mayor sin fuga.

**Archivos / refs a tocar.**
- `server/src/lib/tenant-db.ts:5,10-13`.
- Tests RLS existentes: `server/tests/rls*.test.ts`.
- `server/drizzle/0001_rls_policies.sql:69-117`.

**Dependencias.** C2 recomendado.

**Criterios de aceptación verificables.**
- `withTenant(tenantId, fn)` ejecuta `fn` dentro de transacción o contexto que garantice `app.current_tenant` scoped a la operación.
- `set_config('app.current_tenant', ..., true)` usado si va dentro de transacción.
- Pool puede subir a `max:5` o `max:10` sin leaks.
- Test concurrente con dos tenants:
  - tenant A no ve tenant B,
  - tenant B no ve tenant A,
  - 50 requests concurrentes no mezclan resultados.
- Si no se puede cambiar seguro en esta ventana, dejar `max:1` y documentar bloqueo con test que prueba seguridad actual; pero M4 debe registrar la decisión.

**Estimación.** 1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** postgres-js API requiere `sql.begin`. **Mitigación:** ajustar tipos y helpers; no migrar todos los repos si `withTenant` centraliza.
- **Riesgo:** performance vs seguridad. **Mitigación:** priorizar seguridad; pool mayor solo si test concurrente pasa.

**Notas.**
- No cambiar shared-schema + RLS; decisión §9 no se reabre.

---

# Sprint 3 — Cierre funcional V2 II + dashboard core, semana 3

## A8 — Wire `onBookingConfirmed` y lifecycle de booking mock

**Descripción.** `MemoryService.onBookingConfirmed` (`memory-service.ts:106-115`) nunca se llama. `FlowAdapter.maybeCreateBooking` (`flow-adapter.ts:152-184`) crea booking pending, pero no retorna confirmación ni actualiza memory a booked. Para Fase 1, sin pagos live, se debe modelar correctamente el lifecycle mock: booking pending al llegar a pago/anticipo, booked/confirmed cuando el usuario entrega comprobante o llega al estado de confirmación definido por el flow.

**Archivos / refs a tocar.**
- `server/src/agent/v2/adapter/flow-adapter.ts:72-110`, `:152-184`.
- `server/src/agent/v2/memory/memory-service.ts:83-115`.
- `server/src/db/schema.ts:169-189` (`bookings`).
- `server/src/flows/santa-maria/flows.ts:7-82` (`await_proof`, `confirm_booking`).
- Tests: `server/tests/v2-memory-persistence.test.ts`, `server/tests/v2-flow-e2e.test.ts`.

**Dependencias.** A7.

**Criterios de aceptación verificables.**
- Booking se crea como `pending` cuando usuario avanza al punto de pago/anticipo.
- Al recibir comprobante mock o completar `confirm_booking`, se llama `memoryService.onBookingConfirmed`.
- `patient_memory.memoryJson.paymentStatus='confirmed'` y `funnelStage='booked'`.
- `bookings.paymentStatus` y/o `status` reflejan confirmación mock de Fase 1.
- No se llama Wompi live ni Agenda Pro.
- Test e2e de agendamiento completo valida booking + memory.
- Idempotencia: reenviar comprobante no crea bookings duplicados.

**Estimación.** 1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** confirmar demasiado pronto antes del comprobante. **Mitigación:** separar pending vs confirmed; usar estado `await_proof`/`confirm_booking`.
- **Riesgo:** ON CONFLICT actual no tiene constraint suficiente. **Mitigación:** revisar idempotencia por `(tenant_id, conversation_id, serviceName)` o lógica de lookup antes de insert; no crear migración compleja si no hace falta.
- **Riesgo:** mezclar pagos live. **Mitigación:** todo queda mock/sandbox; Wompi live fuera de scope.

**Notas.**
- Esta task desbloquea validators de funnel/memory de A9.

---

## A9 — Golden validators: memory, funnel y next-best-action

**Descripción.** `eval-runner.ts:270,273,278,283` marca validators como “not yet implemented”, por lo que cualquier golden conversation con `expectedFunnel`, `expectedMemoryConcern`, `expectedNextBestAction` o `expectedMemoryService` falla de forma falsa. Implementar validadores reales para que el eval mida capacidades V2 y no stubs.

**Archivos / refs a tocar.**
- `server/src/agent/v2/eval/eval-runner.ts:270-283`.
- `server/src/agent/v2/eval/golden-conversations.ts`.
- `server/src/agent/v2/memory/memory-repository.ts:61-170`.
- `server/src/agent/v2/memory/memory-service.ts:46-115`.
- `server/src/agent/v2/core/agent-kernel.ts:66-193` si se necesita exponer NBA/route metadata.
- Reports: `server/reports/v1-v2-regression-report.{json,md}` después en A12.

**Dependencias.** A8 para booking/funnel confiable. A4 para context.

**Criterios de aceptación verificables.**
- No queda ningún log/mensaje “Memory service validation not yet implemented”, “Memory concern validation not yet implemented”, “Funnel stage validation not yet implemented” ni “NBA validation not yet implemented”.
- Validator memory service lee memoria real o snapshot post-conversación y compara servicio/city/flags esperados.
- Validator memory concern compara contra flags clínicos/contraindicaciones guardadas o metadata definida en golden.
- Validator funnel compara `funnelStage` real: `new_lead`, `awaiting_payment`, `booked`, etc.
- Validator NBA compara next-best-action desde metadata del kernel/respuesta o heurística explícita del eval, no texto libre frágil.
- Golden conversations fallan/pasan por resultados reales, no por stub.
- Reporte JSON incluye breakdown por validator.
- Tests unitarios del eval runner cubren pass/fail para cada validator.

**Estimación.** 1.5-2 días.

**Riesgos y mitigaciones.**
- **Riesgo:** no existe campo NBA explícito. **Mitigación:** introducir metadata `nextBestAction` en respuesta V2 o derivarlo en eval con reglas versionadas; preferir metadata explícita si el cambio es pequeño.
- **Riesgo:** memory concerns no están normalizados. **Mitigación:** definir schema mínimo en memoryJson y adaptar golden expectations a ese schema.
- **Riesgo:** score baja al medir de verdad. **Mitigación:** documentar honestamente; el gate exige verdad, no inflar score.

**Notas.**
- No ajustar goldens para “hacer pasar” sin evidencia. Cada cambio de expected debe justificar desalineación real.

---

## A11 — Corregir seed-demo `current_state='precio'` y validar estados de flows

**Descripción.** `server/src/db/seed-demo.ts:286` crea `current_state='precio'`, un estado inexistente antes de PR9 y potencialmente inválido incluso después si el flow se llama `precio` pero su estado inicial tiene otro nombre. Esta task corrige la seed y añade validación para que ningún demo state apunte a un estado inexistente.

**Archivos / refs a tocar.**
- `server/src/db/seed-demo.ts:286`.
- `server/src/flows/santa-maria/flows.ts` después de A6.
- `server/src/flows/engine.ts`.
- Tests seed/flow si existen; si no, crear `server/tests/seed-demo-flow-state.test.ts`.

**Dependencias.** A6.

**Criterios de aceptación verificables.**
- `seed-demo.ts` usa un `flow_key` y `current_state` existentes.
- Test recorre todas las conversation_state demo y verifica que `flow_key` existe y `current_state` pertenece a `definition.states`.
- `docker compose down -v && docker compose up --build` seed demo completo sin errores.
- No se rompe la narrativa de demos “price asked no booking”.

**Estimación.** 0.25-0.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** seed-demo depende de datos borrados/reinsertados. **Mitigación:** test sobre DB limpia.
- **Riesgo:** corregir con un estado terminal que no simula bien. **Mitigación:** usar estado inicial real del `precio` flow o un estado intermedio válido como `ask_service`.

**Notas.**
- Pequeña task ideal para cerrar junto con A6/A7 o al inicio de Sprint 3.

---

## B5 — Settings persiste todos los campos comprometidos

**Descripción.** Settings solo persiste `persona` (`settings/page.tsx:60-69`). Los horarios, ciudad, reglas, off-hours y toggles quedan en state local o ni se envían. El backend `PUT /api/profile` (`dashboard.ts:239`) ya actualiza parcialmente profile, pero hay que tipar y completar payload/UI para que Fase 1 sea administrable sin tocar código.

**Archivos / refs a tocar.**
- `app/(dashboard)/settings/page.tsx:12-230`.
- `server/src/api/dashboard.ts:225-239`.
- `server/src/db/schema.ts:133-145` (`business_profile`).
- `lib/api.ts:122-131`.
- `server/src/db/seed.ts` para defaults `hours`, `rules`, `offHoursMessage`.
- Tests frontend/backend settings.

**Dependencias.** B2. Puede avanzar en paralelo con A8/A9.

**Criterios de aceptación verificables.**
- Settings carga y guarda:
  - persona/nombre del agente,
  - horarios Lun-Sáb 9-19 o estructura equivalente,
  - bookingMode mock/handoff,
  - reglas de escalación editables mínimas,
  - offHoursMessage,
  - Google Maps URL si se muestra,
  - notificaciones si se decide persistirlas en `rules`/profile; si no, retirarlas o marcarlas claramente “local/no persistidas”.
- Después de reload, los campos guardados permanecen.
- API valida payload con Zod o validación equivalente.
- No se puede guardar JSON inválido en `rules/hours`.
- Tests cubren PUT + GET profile y UI save.
- El texto de channels sigue “Fase 2 / no conectado”; no se implementa Meta real.

**Estimación.** 1.5-2 días.

**Riesgos y mitigaciones.**
- **Riesgo:** sobrecargar Settings con campos sin backend. **Mitigación:** solo mostrar como editable lo que se persiste; lo demás disabled con copy Fase 2.
- **Riesgo:** regex frágil para persona (`settings/page.tsx:42-43`). **Mitigación:** separar campos estructurados en profile/rules y evitar parsear texto libre si es posible.
- **Riesgo:** romper prompt/persona Santa María. **Mitigación:** seed defaults y test snapshot.

**Notas.**
- Esto convierte “panel de configuración” en producto real Fase 1, no demo.

---

## B6 — Proteger `/api/sim/stream` con auth y tenant scope

**Descripción.** `GET /api/sim/stream` (`server/src/api/sim.ts:69`) no tiene auth ni tenant middleware; cualquiera con `tenantSlug` puede leer mensajes. EventSource no permite headers custom fácilmente, y frontend usa `subscribeToSSE` en `lib/api.ts:140`. Implementar un mecanismo de token SSE tenant-scoped para Fase 1 local.

**Archivos / refs a tocar.**
- `server/src/api/sim.ts:69`.
- `server/src/api/middleware.ts` si se reutiliza resolveTenant.
- `lib/api.ts:140`.
- Nuevo route handler recomendado en Next: `app/api/sim/stream-token/route.ts` o equivalente server-side.
- `auth.ts` session tenant fields de B1.
- `server/src/env.ts` para `SSE_STREAM_SECRET` o `INTERNAL_STREAM_SECRET`.
- Tests backend SSE auth.

**Dependencias.** B1, B2.

**Criterios de aceptación verificables.**
- `GET /api/sim/stream?tenantSlug=santa-maria` sin token devuelve 401/403.
- Token firmado contiene tenantSlug/tenantId y expiración corta.
- Token de tenant A no puede abrir stream de tenant B.
- EventSource desde UI funciona tras obtener token desde sesión.
- Tests cubren token válido, expirado, tenant mismatch, sin token.
- No se rompe DemoLive si es público: para demo pública usar token demo generado server-side o limitar a tenant demo sin datos sensibles.

**Estimación.** 1-1.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** CORS/cookies entre Next `3001` y Hono `8787`. **Mitigación:** token query firmado para SSE, no depender de cookies cross-port.
- **Riesgo:** filtrar token en logs. **Mitigación:** logger redacts query token en C8 o desde esta task.
- **Riesgo:** romper tests de A2. **Mitigación:** actualizar tests con helper de token o modo test.

**Notas.**
- No usar token Meta ni credenciales externas. Es auth interna Fase 1.

---

## C4 — Scheduler local de workers

**Descripción.** Reminders, reengagement y CRM solo corren con triggers HTTP manuales (`server/src/api/workers.ts:18,48,57`). Para MVP pulido, debe existir scheduler local configurable que ejecute workers en intervalos razonables, sin infraestructura externa.

**Archivos / refs a tocar.**
- `server/src/api/workers.ts:18-57`.
- `server/src/index.ts` boot lifecycle.
- Módulos worker actuales si están separados.
- `server/src/db/schema.ts:147` (`worker_logs`).
- `server/src/env.ts` para `WORKERS_ENABLED`, cron/interval vars.
- Tests worker/scheduler nuevos.

**Dependencias.** C2 recomendado.

**Criterios de aceptación verificables.**
- `WORKERS_ENABLED=false` por default en tests si evita flakiness; configurable a true en dev/prod local.
- Scheduler dispara reminders/reengagement/crm según intervalos definidos.
- Endpoints manuales siguen funcionando.
- Cada run escribe `worker_logs` con status/summary.
- Si hay error en worker, no tumba API; queda log estructurado.
- Test con fake timers o intervalo corto en test verifica al menos un run.
- No envía mensajes reales Meta ni Agenda Pro; solo usa canales/mock/handoff existentes.

**Estimación.** 1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** doble ejecución si hay dos instancias. **Mitigación:** para Fase 1 documentar single instance; opcional advisory lock DB simple.
- **Riesgo:** tests flaky por timers. **Mitigación:** inyectar scheduler y controlar con fake timers.
- **Riesgo:** workers globales sin tenant_id en logs. **Mitigación:** aceptado para MVP; documentar en C5 o agregar tenant si worker lo requiere sin migración compleja.

**Notas.**
- No meter BullMQ/Redis; fuera de escala MVP.

---

## Gate M3 — Dashboard funcional

**Ejecutar al cierre de B1-B6:**
```bash
npm run build
cd server && npx vitest run tests/dashboard*.test.ts tests/auth*.test.ts
```

**Smoke UI:** login DB → dashboard → conversations → escalar → handback → settings save/reload → DemoLive SSE.

---

# Sprint 4 — Eval final, limpieza, documentación, spec y observabilidad, semana 4

## A12 — Eval V2 actualizado sobre 411 casos y reporte honesto

**Descripción.** El reporte real actual es 411 casos, V2 62.8%, pero docs stale dicen 87.7%/187 o 167 tests. Tras A5-A11, correr el eval completo y generar reporte actualizado sin inflar resultados. El gate no exige un score arbitrario; exige que sea real, reproducible y explicado.

**Archivos / refs a tocar.**
- `server/src/agent/v2/eval/eval-runner.ts`.
- `server/src/agent/v2/eval/cases/index.ts:14-25`.
- `server/reports/v1-v2-regression-report.md`.
- `server/reports/v1-v2-regression-report.json`.
- `server/src/agent/v2/eval/failures/` si se regeneran failures.
- Docs sync posterior: C5.

**Dependencias.** A5, A6, A7, A8, A9, A11.

**Criterios de aceptación verificables.**
- Eval corre sobre 411 casos o el número exacto actual derivado de `cases/index.ts`; si cambia, se explica por qué.
- Reporte incluye:
  - fecha,
  - commit hash,
  - total cases,
  - pass/fail por categoría,
  - V1 vs V2 si aplica,
  - 0 regresiones o regresiones listadas,
  - failures exportadas,
  - notas sobre validators nuevos.
- No quedan stubs en validators.
- `cd server && npx tsx src/agent/v2/eval/eval-runner.ts` o comando real documentado produce los reportes.
- `tsc` y `vitest` verdes después de actualizar snapshots/reportes.
- Docs no dicen 87.7% salvo como histórico explícitamente marcado stale.

**Estimación.** 0.75-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** score baja al medir validators reales. **Mitigación:** documentar con honestidad y crear backlog post-MVP si hay categorías no críticas.
- **Riesgo:** eval no determinista por LLM. **Mitigación:** usar `LLM_PROVIDER=mock` para baseline determinista o fijar modo eval; si DeepSeek se usa, documentar variance.
- **Riesgo:** failures masivas. **Mitigación:** no bloquear M2 por score absoluto salvo safety crítica; bloquear por regresiones P0/P1.

**Notas.**
- Este es el cierre formal de Stream A.

---

## B7 — Cleanup de dead code frontend y dependencias huérfanas

**Descripción.** Hay 5 componentes dashboard muertos (`ChannelBreakdown`, `ConversionChart`, `StatusDonut`, `MetricCard`, `RecentConversations`), Zustand instalado sin stores y 2 rutas API legacy (`app/api/conversations`, `app/api/metrics`) que leen JSON y no se consumen. Limpiar reduce confusión de agentes y evita que código demo contradiga el producto real.

**Archivos / refs a tocar.**
- `components/dashboard/ChannelBreakdown.tsx`.
- `components/dashboard/ConversionChart.tsx`.
- `components/dashboard/StatusDonut.tsx`.
- `components/dashboard/MetricCard.tsx`.
- `components/dashboard/RecentConversations.tsx`.
- `app/api/conversations/*`.
- `app/api/metrics/*`.
- `package.json` si se elimina Zustand/Recharts solo si no se usan.
- Tests que referencian `MetricCard`.

**Dependencias.** B5 recomendado.

**Criterios de aceptación verificables.**
- Componentes muertos removidos o movidos a `legacy/` con justificación; preferible remover.
- Rutas API legacy eliminadas si no se usan.
- `grep -R` confirma que no quedan imports rotos.
- Si `MetricCard` solo existía por test, eliminar/actualizar test.
- Si Recharts o Zustand quedan en `package.json`, hay uso real; si no, remover y lockfile actualizado.
- `npm run build` y Jest/RTL frontend verdes.

**Estimación.** 0.5-0.75 días.

**Riesgos y mitigaciones.**
- **Riesgo:** borrar componente usado dinámicamente. **Mitigación:** `grep -R` + build.
- **Riesgo:** lockfile conflict. **Mitigación:** commit separado y test build inmediato.

**Notas.**
- No rediseñar dashboard; solo limpiar deuda.

---

## B8 — Playwright E2E actualizado a UI real

**Descripción.** `e2e/bookia.spec.ts` tiene assertions stale. Actualizar E2E para los flujos reales del MVP: login DB, dashboard intelligence, conversations, takeover/handback, settings persist, DemoLive/SSE V2 si es estable en CI local.

**Archivos / refs a tocar.**
- `e2e/bookia.spec.ts`.
- `playwright.config.*` si existe.
- Test fixtures/seed scripts.
- Selectors en componentes si hace falta `data-testid`.
- `app/(auth)/login/page.tsx:12`.
- `app/(dashboard)/dashboard/page.tsx:14`.
- `app/(dashboard)/conversations/[id]/page.tsx:49`.
- `app/(dashboard)/settings/page.tsx:12`.

**Dependencias.** B1-B6, B7.

**Criterios de aceptación verificables.**
- `npx playwright test` verde local contra app actual.
- E2E cubre:
  - login con usuario DB seed,
  - dashboard carga KPIs/empty-state sin error,
  - abrir conversación,
  - takeover,
  - handback,
  - settings save/reload,
  - al menos un mensaje simulado V2 si entorno lo permite.
- Selectors robustos (`data-testid`) donde el copy pueda variar.
- Test reset/seed documentado.

**Estimación.** 1-1.5 días.

**Riesgos y mitigaciones.**
- **Riesgo:** E2E flaky por SSE/timers. **Mitigación:** separar test SSE como smoke opcional o usar espera por evento DB/API.
- **Riesgo:** depender de DeepSeek. **Mitigación:** E2E usa `LLM_PROVIDER=mock`.
- **Riesgo:** datos demo cambiantes. **Mitigación:** seed reset antes de suite.

**Notas.**
- Este gate da confianza al demo del piloto.

---

## C5 — Sincronizar docs y bridge con la verdad del disco

**Descripción.** Hay docs stale: root `AGENTS.md` dice “167 tests, 87.7% eval”; `bookia-code/AGENTS.md` mezcla “256 pass” con 87.7%; `.bridge/CURRENT_TASK.md` dice PR8 active aunque está funcionalmente done; README dice demo simulado aunque frontend está conectado. Actualizar docs para que futuros agentes no trabajen sobre premisas falsas.

**Archivos / refs a tocar.**
- `AGENTS.md` raíz.
- `bookia-code/AGENTS.md`.
- `.bridge/CURRENT_TASK.md`.
- `.bridge/HANDOFF_LOG.md`.
- `README.md:3`.
- `docs/ESTADO-ACTUAL.md`, `docs/PENDIENTES-ABIERTOS.md` si existen.
- `server/docs/AGENTS-ROADMAP.md`.
- Reportes de A12.

**Dependencias.** A12. B7 recomendado.

**Criterios de aceptación verificables.**
- `grep -R "167 tests\|87.7%\|164/187\|PR8 active\|Demo con datos simulados" .` no devuelve claims actuales falsos; si aparecen, están marcados como histórico/stale.
- Docs dicen número real de tests/eval del commit actual.
- README describe frontend conectado al backend Hono y Fase 1 sin Meta real.
- `.bridge/CURRENT_TASK.md` apunta al siguiente task real o a M4 closed.
- Se documentan comandos reales: build, tests, eval, e2e, migrations, seed.
- No se documentan credenciales reales.

**Estimación.** 0.5-0.75 días.

**Riesgos y mitigaciones.**
- **Riesgo:** docs vuelven a divergir al final. **Mitigación:** C5 se hace después de A12/B8 o se repite en Sprint 5 buffer.
- **Riesgo:** borrar contexto útil histórico. **Mitigación:** marcar como histórico, no eliminar si sirve.

**Notas.**
- Esta tarea es de alto impacto para OpenCode/Claude Code: reduce hallucinations operativas.

---

## C7 — Meta Adapter Spec diseñado, no implementado

**Descripción.** `channels/types.ts:2` ya declara unión con WhatsApp/Instagram/Messenger, pero `channels/registry.ts:6-14` solo conoce `MockAdapter`; webhooks reales devuelven 501 para canales no mock. Para “listo para enchufar credenciales”, diseñar la spec de adapters Meta sin registrar ni llamar APIs reales.

**Archivos / refs a tocar.**
- `server/src/channels/types.ts:2`.
- `server/src/channels/registry.ts:6-14`.
- `server/src/api/webhooks.ts:7-85`.
- Nuevo doc: `server/docs/meta-adapter-spec.md`.
- Opcional interfaces/types: `server/src/channels/meta/types.ts` sin implementación runtime.
- `.env.example` con placeholders comentados, no activos.

**Dependencias.** C5 no necesaria, pero conviene alinearlo.

**Criterios de aceptación verificables.**
- Documento cubre:
  - adapter contract por canal,
  - webhook verification mapping,
  - inbound normalization,
  - outbound send contract,
  - idempotency/providerMessageId,
  - media/attachments,
  - error handling/retries,
  - credential storage esperado en `channel_accounts.credentials`,
  - tenant resolution,
  - security/signature validation,
  - test plan de Fase 2.
- No hay llamadas HTTP reales a Meta.
- `registry.ts` no habilita WhatsApp/Instagram/Messenger todavía, o los stubs lanzan `501 Not Implemented` explícito.
- `.env.example` puede listar placeholders `META_*` comentados, pero no requeridos para boot.
- Tests existentes de webhooks siguen esperando 501 para reales.

**Estimación.** 0.75-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** caer en implementación real. **Mitigación:** scope de esta task es doc/types only; no tokens, no SDKs, no sends.
- **Riesgo:** spec demasiado abstracta. **Mitigación:** incluir payload examples normalizados y checklist de enchufe Fase 2.

**Notas.**
- Este es el puente para credenciales Meta después, no el enchufe.

---

## C8 — Observabilidad mínima: logger estructurado + health DB/LLM/agent

**Descripción.** Observabilidad actual es consola + metric emitter in-memory. Para MVP Fase 1 se necesita mínimo: logs estructurados con requestId/tenantId sin PII, health con DB/LLM/agent/migrations, y redacción de secretos/tokens. No se agrega Sentry/PostHog.

**Archivos / refs a tocar.**
- `server/src/index.ts:17-22`.
- `server/src/agent/v2/core/metric-emitter.ts` si existe.
- `server/src/api/middleware.ts`.
- `server/src/api/sim.ts:69` para redacción token SSE.
- `server/src/env.ts`.
- Tests health/logging si existen.

**Dependencias.** A3, C2, B6 recomendado.

**Criterios de aceptación verificables.**
- Middleware asigna `requestId`.
- Logs incluyen método/path/status/duration/requestId y tenantSlug/tenantId cuando existe.
- Logs no incluyen message text completo por default ni tokens SSE/API keys.
- `/health` incluye:
  - API status,
  - DB reachable,
  - migrations status o última migración,
  - LLM provider configurado,
  - agent kernel `v2`,
  - workers enabled/disabled.
- Si DB falla, `/health` responde degraded/fail con status apropiado.
- Tests validan shape de health.
- No se integra SaaS externo.

**Estimación.** 0.75-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** logs con PII de pacientes. **Mitigación:** redaction helper y tests de no incluir email/teléfono/cédula en logs.
- **Riesgo:** health llama DeepSeek y ralentiza. **Mitigación:** health solo valida configuración o ping opcional con timeout corto; mock en tests.

**Notas.**
- C8 facilita demo y debugging, pero no debe crecer a observabilidad cloud.

---

## Gate M2 + M4 — Cierre de agente y MVP listo

**Ejecutar al cierre del Sprint 4:**
```bash
cd server && npx tsc --noEmit
cd server && npx vitest run
cd server && npx tsx src/agent/v2/eval/eval-runner.ts
npm run build
npx playwright test
```

**Verificaciones manuales obligatorias:**
- V2 ON por defecto.
- Chat simulado persiste outbound y SSE.
- Flow precio funciona.
- Agendamiento mock llega a pending/confirmed según prueba.
- Settings persiste reload.
- Escalar/takeover/handback visible.
- SSE sin token falla.
- Docs no tienen claims stale.
- Meta spec existe y no implementa llamadas reales.

---

# Sprint 5 — Buffer de release candidate, 3-5 días si hace falta

Este sprint no agrega scope funcional nuevo. Existe para absorber hallazgos de gates M2-M4, estabilizar demos y dejar el proyecto presentable. Si todos los gates cierran en Sprint 4, se usa solo para demo rehearsal y últimos fixes P2.

## RC1 — Bug bash end-to-end Fase 1

**Descripción.** Recorrer el producto como Santa María: login, dashboard, settings, chat simulado, conversación de precio, agendamiento con anticipo mock, escalamiento, handback y revisión de métricas. Abrir bugs P0/P1 con repro y cerrarlos antes de demo.

**Archivos / refs a tocar.**
- Solo archivos relacionados con bugs encontrados.
- Checklist base: `server/src/api/sim.ts:27-69`, `server/src/agent/orchestrator.ts:424-628`, `components/conversations/ConversationsInbox.tsx`, `app/(dashboard)/settings/page.tsx`, `app/(dashboard)/dashboard/page.tsx`.

**Dependencias.** M2, M3 casi cerrados.

**Criterios de aceptación verificables.**
- Checklist E2E completado.
- Cero bugs P0/P1 abiertos.
- P2 restantes documentados fuera de scope o en backlog Fase 2.
- Capturas o notas de demo listas.

**Estimación.** 1-2 días.

**Riesgos y mitigaciones.**
- **Riesgo:** descubrir un defecto profundo tarde. **Mitigación:** priorizar workaround seguro si no afecta north star; no reabrir arquitectura.
- **Riesgo:** scope creep. **Mitigación:** solo bugs contra criterios M0-M4.

**Notas.**
- No agregar features nuevas en RC1.

---

## RC2 — Release notes y runbook local

**Descripción.** Crear una guía corta para correr el MVP local: levantar DB/API/frontend, migrar/seed, login, correr eval/tests/e2e, activar mock/deepseek, y explicar qué queda listo para Meta Fase 2.

**Archivos / refs a tocar.**
- `README.md`.
- `docs/ESTADO-ACTUAL.md`.
- `server/docs/meta-adapter-spec.md`.
- `.bridge/HANDOFF_LOG.md`.

**Dependencias.** C5, C7, C8.

**Criterios de aceptación verificables.**
- Un nuevo agente puede levantar el proyecto desde cero siguiendo el runbook.
- Runbook no contiene secretos reales.
- Incluye comandos para:
  - migrations,
  - seeds,
  - API,
  - frontend,
  - tests,
  - eval,
  - Playwright.
- Incluye claramente “fuera de scope”: Meta real, Agenda Pro real, pagos live.

**Estimación.** 0.5-1 día.

**Riesgos y mitigaciones.**
- **Riesgo:** docs duplicadas. **Mitigación:** README apunta a docs canónicas; no repetir todo.
- **Riesgo:** comandos no probados. **Mitigación:** ejecutar comandos antes de marcar done.

**Notas.**
- Esta tarea es especialmente útil para handoff a agentes.

---

# 3. Checklist final de aceptación del north star

Al final de M4, Bookia debe cumplir:

- [ ] **Agente V2 ON por defecto** con env tipado.
- [ ] **Persistencia outbound + SSE** funcionando con V2.
- [ ] **`tsc` clean global**.
- [ ] **Tests verdes** y número real documentado.
- [ ] **PR6.1 cerrado**: clinical policy enforcement single-source.
- [ ] **PR9 cerrado**: flow `precio` en `flows.ts` + mapping.
- [ ] **Auto-advance completo** en start/resume.
- [ ] **Golden validators reales** para memory/funnel/NBA.
- [ ] **Eval de 411 casos** actualizado y honesto.
- [ ] **Auth local real** con password hash y session tenant-aware.
- [ ] **Dashboard funcional**: Settings persiste, Escalar/takeover/handback, SSE protegido.
- [ ] **Migraciones reproducibles** antes de seeds.
- [ ] **Scheduler workers** local/configurable.
- [ ] **Secrets hygiene** sin keys committed.
- [ ] **Docs sincronizadas** con estado real.
- [ ] **Meta Adapter Spec** lista, sin implementación real.
- [ ] **Playwright E2E verde**.
- [ ] **No Meta real, no Agenda Pro real, no pagos live.**

---

# 4. Secuencia de commits recomendada

1. `chore: safety snapshot agent v2 audit state` — C1.
2. `fix(agent-v2): repair flow engine import and esm imports` — A1, A10 si pequeño.
3. `chore(db): add deterministic sql migration runner` — C2.
4. `chore(env): document secrets and agent kernel env` — C3, parte de A3.
5. `feat(agent-v2): persist outbound responses and emit sse` — A2.
6. `feat(agent-v2): enable v2 by default with typed env` — A3.
7. `feat(agent-v2): load tenant business context and memory snapshot` — A4.
8. `feat(auth): replace plaintext demo auth with db-backed credentials` — B1.
9. `fix(policy): make clinical enforcement single-source` — A5.
10. `feat(flows): add pricing flow for Santa Maria` — A6.
11. `fix(flows): auto-advance known slots on resume` — A7.
12. `feat(memory): confirm booking lifecycle in mock flow` — A8.
13. `feat(eval): implement golden validators` — A9.
14. `fix(seed): validate demo flow states` — A11.
15. `feat(frontend): use session tenant in API client` — B2.
16. `feat(conversations): support escalation takeover and handback` — B3/B4.
17. `feat(settings): persist full business profile` — B5.
18. `fix(security): protect sim sse stream` — B6.
19. `feat(workers): add local scheduler` — C4.
20. `perf(security): harden tenant db context under concurrency` — C9.
21. `test(eval): update v2 regression report` — A12.
22. `chore(frontend): remove dead dashboard code and legacy routes` — B7.
23. `test(e2e): update playwright coverage for mvp flows` — B8.
24. `docs: sync project state and meta adapter spec` — C5/C7/RC2.
25. `feat(obs): add structured logging and health checks` — C8.

---

# 5. Backlog explícito fuera de este plan

Estos puntos quedan documentados para Fase 2/3 y **no deben colarse** en los sprints anteriores:

- Meta WhatsApp/Instagram/Messenger real.
- Agenda Pro API real.
- Wompi live/pagos reales.
- Hosting production definitivo.
- OAuth/magic links.
- TikTok.
- Observabilidad SaaS externa.
- Multi-cliente comercial más allá de tenant architecture existente.
- Reemplazo de Agenda Pro.
