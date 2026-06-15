# Bookia — Guía de Desarrollo

## Requisitos

- **Node.js 22+**
- **Docker Desktop** (con `docker compose`)
- **npm** (viene con Node.js)

## Arranque rápido (1 comando)

```bash
bash start-dev.sh
```

Esto levanta PostgreSQL, la API (Hono :8787), aplica migraciones, importa datos demo, y ejecuta el smoke test.

Luego, en otra terminal:

```bash
npm run dev
```

Frontend en `http://localhost:3001`.

## Arranque manual

```bash
# 1. Levantar servicios Docker
docker compose up -d

# 2. Aplicar migraciones
cd server && npm run db:migrate

# 3. Poblar base y datos demo
npm run seed
npm run seed:demo
cd ..

# 4. Levantar frontend
npm run dev
```

## Smoke test

```bash
cd server && npm run smoke-test
```

Prueba todos los endpoints críticos y flujo E2E del agente.

## Login

El login usa mock de NextAuth (`data/users.json`):
- Ve a `/register`, llena cualquier campo y haz clic en "Crear cuenta"
- Luego ve a `/login` con cualquier email

## Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend (Next.js) | 3001 |
| Backend API (Hono) | 8787 |
| PostgreSQL | 5432 |
| Outline Wiki | 3000 |

## Troubleshooting

### "Sin conversaciones" / dashboard vacío

```bash
cd server && npm run seed:demo
```

### "Error conectando al backend" en el DemoLive

```bash
# Verificar que la API responde
curl http://localhost:8787/health

# Si no responde:
docker compose ps
docker compose up -d api
```

### Datos se pierden al rebuild

El seed no es persistente entre `docker compose build`. Después de rebuild:

```bash
cd server && npm run seed && npm run seed:demo
```

### Puerto 5432 ocupado

Si tienes otra instancia de PostgreSQL en 5432, cambia el puerto en `docker-compose.yml` o detén el otro servicio.

## Tests

```bash
# Backend
cd server && npm test     # 58 tests
npm run build             # TypeScript compile

# Frontend
cd .. && npm run build    # Next.js build
```

## Endpoints principales

Ver `docs/TDD-BACKEND-MVP.md` para la documentación completa de la API.

| Endpoint | Descripción |
|----------|-------------|
| GET /health | Health check + DB status |
| GET /api/conversations | Lista de conversaciones |
| GET /api/metrics/intelligence | Dashboard KPIs |
| POST /api/sim/message | Demo chat |
| GET /api/sim/stream | SSE streaming |

## Stack

- **Backend:** Node 22 + TypeScript 5 + Hono + Drizzle ORM + PostgreSQL 16 + DeepSeek API
- **Frontend:** Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui + TanStack Query
- **Tests:** Vitest (58 tests)
- **Infra:** Docker + docker-compose
