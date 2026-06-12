---
task_id: TASK-001
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-11T00:00:00Z
updated_at: 2026-06-11T00:00:00Z
---

## Misión
Hacer el **scaffold del backend** de Bookia: un servicio nuevo en `server/` con Hono + TypeScript + Drizzle ORM, más `docker-compose.yml` en la raíz que levante `api` + `postgres`. Debe arrancar limpio con `docker compose up` y exponer un `GET /health` que responda 200.

No implementes lógica de negocio todavía (ni agente, ni canales, ni schema completo). Esto es SOLO el esqueleto que arranca y conecta a Postgres.

## Contexto relevante
- **Fuente de verdad técnica:** `docs/TDD-BACKEND-MVP.md`. Lee §2 (stack), §9 (Docker) y §2 (estructura de repo) antes de empezar.
- El front Next.js ya existe en la raíz (`app/`, `components/`, etc.). **NO lo toques.** El backend es un servicio aparte en `server/`.
- Stack decidido (no cambiar sin marcar bloqueo): Node 22, TypeScript 5, Hono, Drizzle ORM, Zod, PostgreSQL 16, Vitest. Gateway LLM será OpenRouter (no en esta tarea).
- Multi-tenant shared-schema (no aplica aún, pero tenlo presente).

## Entregable esperado
```
server/
├── src/
│   ├── index.ts            # entrypoint Hono, monta /health
│   ├── env.ts              # validación de env vars con Zod (DATABASE_URL, PORT, etc.)
│   └── db/
│       └── client.ts       # cliente Drizzle conectado a Postgres
├── package.json            # scripts: dev, build, start, test, db:generate, db:migrate
├── tsconfig.json
├── drizzle.config.ts
├── Dockerfile              # build del servicio Node 22
├── .env.example            # documenta las env vars (sin secretos reales)
└── .dockerignore
docker-compose.yml          # raíz: servicios api + postgres + volumen pgdata
.env.example                # raíz (si aplica para compose)
```
- `GET /health` → `200 { "status": "ok", "db": "connected" }` (que verifique conexión a Postgres con un `SELECT 1`).
- Vitest configurado con al menos 1 test que pase (ej: test de `/health` con db mock o un smoke test trivial).

## Criterio de completación
Ejecuta y pega los outputs en las notas:
1. `docker compose up -d` → api y postgres `healthy`.
2. `curl -s localhost:8787/health` → `{"status":"ok","db":"connected"}` (ajusta el puerto al que definas; documenta cuál).
3. `cd server && npm test` → tests pasan.
4. `cd server && npm run build` → compila sin errores de TS.

## Fuera de alcance (NO hacer en esta tarea)
- Schema de tablas (eso es TASK-002).
- Channel adapters, agente, LLM, endpoints de negocio.
- Conectar el front al backend.
- Cualquier deploy a la nube.

## Notas del agente anterior (Claude)
- Elige el puerto que prefieras para `api` (sugiero 8787) y documéntalo.
- Para el healthcheck de Postgres en compose usa `pg_isready`.
- Mantén `package.json` del server independiente del `package.json` del front (son dos proyectos).
- Si algo del TDD te bloquea o es ambiguo, NO improvises arquitectura: pon `status: WAITING_FOR_CLAUDE` y describe el bloqueo aquí.
- Cuando termines: actualiza este archivo a `status: WAITING_FOR_CLAUDE`, agrega tus notas/outputs abajo, agrega una línea al `HANDOFF_LOG.md`, commit `task(TASK-001): scaffold backend` y push a `origin main`.

## Resultado de OpenCode
_(OpenCode llena esta sección al terminar: archivos creados, comandos corridos + outputs, supuestos, bloqueos, próxima acción.)_
