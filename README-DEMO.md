# Bookia — Guía de Demo

## Requisitos

- Node 22+
- Docker Desktop (PostgreSQL en contenedor)
- Puerto 5432 libre (PostgreSQL)
- DeepSeek API key en `/Users/alejandropena/ARIA/config/settings.py`

## Levantar todo

### 1. Base de datos

```bash
# Desde la raíz del proyecto
docker compose up -d postgres
```

### 2. Backend (Hono API :8787)

```bash
cd server
npm install          # primera vez
npm run db:migrate   # crear esquema
npm run seed         # seed base: tenant Santa María, catálogo, flujo
npm run seed:demo    # datos de muestra: conversaciones, mensajes, bookings
npm run dev          # http://localhost:8787
```

### 3. Frontend (Next.js :3000)

```bash
# Desde la raíz
npm install          # primera vez
npm run dev          # http://localhost:3000
```

### 4. Login

Abrir http://localhost:3000/login

Credenciales demo:
- **Email:** admin@santamaria.test
- **Contraseña:** (no hay — el login usa archivo local `data/users.json`)

Para desarrollo:
- Login usa Auth.js con credenciales mock desde `data/users.json`
- Puedes registrar un nuevo usuario en `/register`

## Qué mostrar en la demo

### Dashboard de inteligencia (`/dashboard`)
Los KPIs muestran datos reales calculados por el backend:
- **Ingreso potencial**: suma de servicios consultados sin agendar
- **Citas agendadas**: ingresos por bookings confirmados
- **Dinero sobre la mesa**: leads que pidieron precio pero no agendaron
- **Embudo**: 5 etapas con % de caída
- **Mapa de calor**: demanda por día × hora
- **ROI del bot**: horas ahorradas, leads fuera de horario

### Demo en vivo (botón flotante violeta abajo a la derecha)
1. Haz clic en el botón del robot 🤖
2. Escribe un mensaje (ej: "Hola, ¿cuánto cuesta la depilación?")
3. El agente IA responde en tiempo real vía SSE
4. Los mensajes aparecen en el dashboard al refrescar

### Conversaciones (`/conversations`)
- Lista de conversaciones reales desde la DB
- Cada conversación muestra canal, estado, último mensaje
- Click para ver detalle (mensajes completos)

### Configuración (`/settings`)
- Perfil del negocio sincronizado del backend
- Catálogo de servicios con precios desde la DB

## Estructura de datos demo

El seed demo (`npm run seed:demo`) genera:
- **15 contactos** en 3 canales (WhatsApp, Instagram, Messenger)
- **15 conversaciones** distribuidas en 30 días
- **~200-300 mensajes** (inbound + outbound)
- **~5 bookings** (~35% de conversaciones)
- **Conversaciones con precio sin booking** para "dinero sobre la mesa"
- Horarios variados (9-22h) para heatmap con picos tarde-noche

Es idempotente: elimina datos demo existentes antes de re-insertar.
No modifica: tenant, catálogo, flujos, perfil ni usuarios.

## Arquitectura

```
Frontend (Next.js :3000)  ───►  API (Hono :8787)  ───►  PostgreSQL :5432
  ├── Dashboard                GET /api/metrics/intelligence
  ├── Conversaciones           GET /api/conversations, /api/conversations/:id
  ├── Settings                 GET /api/profile, /api/catalog
  └── Demo en vivo             POST /api/sim/message + SSE /api/sim/stream
```

## Solución de problemas

| Problema | Solución |
|---|---|
| `port already in use` | `lsof -i :3000` / `lsof -i :8787` → kill PID |
| `MissingSecret` | `.env` debe tener `AUTH_SECRET` |
| `ECONNREFUSED postgres` | `docker compose up -d postgres` |
| Token no funciona | Asegurar DeepSeek key en archivo de settings |
| Dashboard vacío | Correr `npm run seed:demo` |
