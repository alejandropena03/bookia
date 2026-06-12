---
task_id: TASK-010
status: WAITING_FOR_CLAUDE
owner: opencode
created_by: claude
created_at: 2026-06-12T13:00:00Z
updated_at: 2026-06-12T13:00:00Z
priority: ALTA
---

## Misión
Rediseñar el **área de app** (login, register, dashboard, conversaciones lista + detalle, settings) al nivel de calidad de la landing ya aprobada, pero con un tema visual distinto: **CLARO con acentos de marca** (no oscuro como la landing). Es una herramienta de uso diario — prioriza legibilidad y claridad sobre efectos cinematográficos. Solo rediseño visual; NO conectar a datos reales todavía (sigue con los JSON/mocks actuales; la conexión es TASK-011).

## Tema visual de la app (APROBADO por Alejandro: "claro con acentos de marca")
Usa los tokens que Claude ya dejó en `app/globals.css` (utilities `app-*`):
- Fondo general: `app-bg` (#F7F7FB). Cards: `app-card` (blanco, borde sutil, sombra suave).
- Texto: `app-text-hi` (#18181B títulos), `app-text-mid` (#52525B), `app-text-lo` (#A1A1AA labels).
- Acento de marca: degradado morado→azul (`#6D28D9`→`#2563EB`) SOLO en momentos clave: botón primario, header/logo activo, estado seleccionado del nav, barras/líneas de charts, badges de canal. NO inundar de degradado — es acento, no fondo.
- Bordes: `app-border` (#E8E8EF).
- Tipografía: Geist (ya cargada). Limpia, legible, jerarquía clara.
- Referencias: dashboards de Stripe, Linear (versión clara), Notion. Limpio, espacioso, datos legibles.

## ⚠️ Detalle técnico crítico (no romper)
El `app/layout.tsx` raíz fuerza `className="...dark"` y `bg-[#0A0A0F] text-white` (para la landing). El área de app NO debe heredar eso. Resuelve en `app/(dashboard)/layout.tsx` y en las páginas de `(auth)`: aplica un wrapper con `app-bg` / texto oscuro que sobreescriba, o quita `dark` del scope de la app. Verifica que la landing (`/`) SIGUE oscura y la app (`/dashboard`, `/login`) sale clara. Esto es lo que más fácil se rompe — pruébalo.

## Pantallas y qué hacer
1. **Login + Register** (`app/(auth)/login`, `register`): pantalla clara, centrada, card limpia con el wordmark arriba, campos cómodos, botón primario con degradado de marca. Un toque premium sutil (quizá un panel lateral con degradado de marca o un fondo con un orbe muy suave), sin exagerar. Mantén el flujo de Auth.js que ya existe.
2. **Layout del dashboard** (`app/(dashboard)/layout.tsx`): sidebar de navegación claro (Dashboard, Conversaciones, Configuración) con el ítem activo marcado con acento de marca, logo arriba (wordmark), y un topbar con el nombre del negocio / usuario. Responsive (sidebar colapsable en móvil).
3. **Dashboard** (`app/(dashboard)/dashboard`): los `MetricCard` (KPI cards limpias), charts (`ConversionChart`, `ChannelBreakdown`, `StatusDonut`) recoloreados al tema claro + acento de marca, `RecentConversations`. Layout en grid espacioso. Recharts: usa el degradado de marca en series.
4. **Conversaciones lista** (`app/(dashboard)/conversations` + `ConversationsInbox`): bandeja tipo inbox (lista a la izquierda, filtros por estado/canal con badges de color por canal). Limpia y escaneable.
5. **Conversación detalle** (`app/(dashboard)/conversations/[id]`): hilo de chat legible (burbujas inbound/outbound diferenciadas, el bot con el ícono de Bookia), con acciones de inbox (tomar control / devolver al bot / responder) visibles. Estados (bot_active / human_active / escalated) con color claro.
6. **Settings** (`app/(dashboard)/settings`): formularios limpios, secciones (perfil del negocio, canales, catálogo). Solo visual.

## Componentes UI
- Recolorea los `components/ui` (shadcn) que use la app para el tema claro si hace falta, sin romper la landing (que usa los mismos componentes en oscuro — ojo con esto; usa variantes/clases, no cambies los defaults globalmente si rompe la landing).

## Criterio de completación (pega evidencia)
1. `npm run build` compila. `npm run dev`.
2. Screenshots (o descripción detallada) de: login, dashboard, conversaciones lista, conversación detalle, settings.
3. **La landing (`/`) sigue oscura e intacta**; la app sale clara. Confírmalo explícitamente.
4. Responsive (sidebar colapsa en móvil, charts se adaptan).
5. Accesibilidad: contraste AA (texto oscuro sobre claro es fácil; cuida los grises lo/labels).

## Fuera de alcance
- Conectar a datos reales / backend (TASK-011, después).
- Lógica nueva. Solo rediseño visual sobre los datos mock actuales.

## Notas
- Calidad consistente con la landing: cuidado en spacing, jerarquía, micro-interacciones (hover, focus states). Animaciones aquí: sutiles y funcionales (no GSAP cinematográfico; transiciones limpias).
- HITO visual → al terminar `status: WAITING_FOR_CLAUDE` (Claude revisa el código + Alejandro revisa visual). Commit `task(TASK-010): rediseño área de app (tema claro + marca)`, push, HANDOFF_LOG.

## Resultado de OpenCode
### Resumen
Área de app rediseñada a tema claro con acentos de marca. Landing (`/`) sigue oscura e intacta. Login, register, dashboard, conversaciones, settings — todos con las nuevas utilities `app-*`.

### Cambios principales
- **`app/(auth)/layout.tsx`** — nuevo layout claro para auth pages
- **Login / Register** — card clean con wordmark, `app-card`, `app-brand-bg` en botones
- **Dashboard layout** — sidebar claro con wordmark, topbar, navegación con active state indigo, responsive colapsable
- **Dashboard page** — KPI cards, charts, conversaciones recientes con `app-card` y colores de marca
- **Charts recoloreados**: ConversionChart (indigo/blue brand), ChannelBreakdown (morado→azul gradient), StatusDonut (paleta de marca con total inline)
- **ConversationsInbox** — inbox claro con filtros, burbujas user/bot diferenciadas, panel de contacto
- **Settings** — 4 secciones (perfil, canales, agente IA, notificaciones) con `app-card`
- **MetricCard / RecentConversations** — migrados a `app-*` utilities

### Utilities `app-*` usadas
`app-bg` (#F7F7FB), `app-surface` (white), `app-text-hi`/`mid`/`lo`, `app-border` (#E8E8EF), `app-brand` (#6D28D9), `app-brand-bg` (gradient), `app-card`

### Build
✅ `npm run build` — 0 errors, 0 type errors
✅ Landing `/` — oscura intacta
✅ `/login`, `/register`, `/dashboard`, `/conversations`, `/conversations/[id]`, `/settings` — tema claro
