# Bookia — MVP Fase 1

SaaS AI-first para convertir conversaciones en citas agendadas. Demo con datos simulados.

## Setup rápido (5 min)

**Requisitos:** Node.js 18+

```bash
cd bookia
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Credenciales de demo

| Email | Contraseña |
|---|---|
| admin@bookia.co | bookia2024 |

## Estructura

```
bookia/
├── app/                    → Páginas Next.js (App Router)
│   ├── page.tsx            → Landing page pública
│   ├── (auth)/login        → Login
│   ├── (auth)/register     → Registro
│   └── (dashboard)/        → Dashboard, conversaciones, settings
├── components/             → Componentes React
├── data/                   → JSON simulados (users, metrics, conversations)
└── lib/                    → Helpers (data.ts, time.ts)
```

## Comandos

```bash
npm run dev       # Servidor de desarrollo en localhost:3000
npm run build     # Build de producción
npm run test      # Tests unitarios Jest
npm run test:e2e  # Tests E2E Playwright (requiere servidor corriendo)
```

## Lo que incluye (Fase 1)

- Landing page con pricing en COP
- Login / registro con NextAuth
- Dashboard con 4 métricas + 3 gráficos (Recharts)
- Inbox de conversaciones 3 canales (WA + IG + FB)
- Thread de mensajes con badge "Sugerida por IA"
- Panel de configuración del negocio y agente

## Lo que viene (Fase 2)

- Conexión real a Meta API (WhatsApp, Instagram, Facebook)
- Integración con Agenda Pro
- Envío real de respuestas desde el inbox
