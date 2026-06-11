# Bookia — Research & Design Decisions
**Fecha:** 2026-06-10

---

## 1. Patrones UX/UI en SaaS B2B 2025-2026

### Referencias analizadas: Linear, Notion, Clerk, Intercom, Cal.com, Tidio, Respond.io

#### Tendencias dominantes 2025-2026:
- **Densidad funcional sin complejidad visual** — dashboards como Linear priorizan información densa pero con jerarquía tipográfica clara. Sin whitespace excesivo.
- **Sidebar colapsable con navegación contextual** — iconos + labels, colapsa en mobile a bottom bar.
- **Command palette / Quick actions** — acceso rápido a funciones frecuentes (Cmd+K en Linear/Notion).
- **Micro-animaciones de estado** — transiciones de status (pending → scheduled) con feedback visual inmediato.
- **Dark mode como first-class citizen** — no afterthought. Intercom y Linear lo implementan desde diseño.
- **Glassmorphism refinado** — panels con blur sutil, no el glassmorphism excesivo de 2021.
- **Tipografía editorial** — headlines grandes, bold, con contraste alto. Tendencia hacia serifs en headings de landing.
- **Tablas como UI principal** — Linear, Notion, Vercel usan tablas densas como UI core, no solo para reportes.

---

## 2. Dashboards de Conversación/Mensajería

### Patrones de Respond.io, Tidio, Chatwoot, Intercom:

#### Layout estándar — 3 columnas:
```
[Lista conversaciones] | [Thread activo] | [Panel contacto]
250px               |  flex-1          | 300px
```

#### Patrones de thread:
- Burbujas diferenciadas: cliente (izquierda, gris) vs bot/agente (derecha, color marca)
- Timestamps relativos ("hace 2 min") no absolutos
- Indicadores de canal inline (ícono WhatsApp/IG/FB junto al mensaje)
- "Typing indicator" animado para IA generando respuesta
- Bandeja de entrada unificada con filtros por canal

#### Patrones de lista:
- Avatar con inicial + badge de canal (color del canal)
- Preview truncado a 1 línea
- Timestamp relativo alineado a la derecha
- Dot indicator para no leídos
- Filtros: Todos | Pendiente | En progreso | Agendado | Escalado

---

## 3. Landing Pages de SaaS AI-first

### Referencias: Cal.com, Tidio, Botpress, ManyChat, Typebot

#### Estructura que convierte:
1. **Navbar**: Logo + 3-4 links + CTA primario (contraste alto)
2. **Hero above the fold**: Headline + subheadline + 2 CTAs + social proof (# negocios)
3. **Pain → Solution**: Framework "Antes/Después" o "Sin Bookia / Con Bookia"
4. **How it works**: 3-4 pasos visuales, no walls of text
5. **Features**: Grid 2-3 cols, ícono + título + descripción corta
6. **Pricing**: 3 tiers, tier medio destacado ("Más popular")
7. **CTA final**: Urgencia leve + CTA grande

#### Decisiones de copy que funcionan:
- Verbo de acción en headline: "Responde", "Convierte", "Agenda"
- Números concretos: "68% de conversión", "<2 min respuesta"
- Prueba social local: mencionar Colombia/Latam

---

## 4. Login Mobile-First Mejores Prácticas

- Card centrada vertical/horizontal, max-width 400px
- Logo arriba, suficiente breathing room
- Labels visibles (no solo placeholder — accessibility)
- Error messages inline, no alerts
- CTA primario full-width en mobile
- Credenciales demo visibles para producto en beta/demo
- "Recordarme" checkbox opcional
- Link a register debajo del form

---

## 5. Síntesis: 5 Principios UX para Bookia

### Principio 1: Claridad sobre densidad
Bookia sirve a dueños de negocio no-técnicos (estéticas, consultorios, salones). La UI debe ser clara y directa. Dashboard principal = 4 números grandes + 2 gráficos + tabla. Sin complejidad innecesaria.

### Principio 2: El canal siempre visible
WhatsApp, Instagram, Facebook son el core del producto. El canal de origen debe ser visible en TODA la UI — badges de color, íconos, nunca texto solo.

### Principio 3: Estado como semáforo
Las conversaciones tienen estados críticos (pendiente, escalado). Usar colores semáforo consistentes:
- Pendiente → Amarillo amber
- En progreso → Azul
- Agendado → Verde
- Escalado → Rojo
- Perdido → Gris

### Principio 4: IA visible pero humilde
Los mensajes sugeridos por IA deben tener un badge claro ("✨ IA") pero el agente humano siempre tiene el control final. Botones Aprobar/Editar/Escalar prominentes.

### Principio 5: Mobile-first real
Los usuarios de Bookia revisan conversaciones desde el celular. El layout de 3 columnas colapsa a pantalla completa en mobile con navegación entre columnas.

---

## Paleta de Colores — Compatible con logo azul/púrpura

```css
/* Core brand */
--primary: #4F46E5;        /* Indigo — acción principal */
--primary-dark: #3730A3;   /* Hover states */
--accent: #7C3AED;         /* Purple — accents, gradients */
--gradient: linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%);

/* Semantic */
--success: #10B981;        /* Verde — agendado */
--warning: #F59E0B;        /* Amber — pendiente */
--danger: #EF4444;         /* Rojo — escalado */
--neutral: #6B7280;        /* Gris — perdido */

/* Channel colors */
--whatsapp: #25D366;
--instagram: #E1306C;      /* Con gradiente ig */
--facebook: #1877F2;

/* Backgrounds */
--bg-base: #F8FAFC;        /* Casi blanco */
--bg-surface: #FFFFFF;
--bg-subtle: #F1F5F9;
--border: #E2E8F0;

/* Text */
--text-primary: #0F172A;
--text-secondary: #475569;
--text-muted: #94A3B8;
```

---

## 3 Patrones de Layout para Dashboard

### Layout A — Command Center (elegido para Bookia)
```
[Sidebar 220px] | [Main content area — fluid]
                |  [Header 64px]
                |  [Page content — padding 24px]
```
Sidebar con íconos + labels. Colapsable a 64px. Header sticky con nombre negocio + avatar.

### Layout B — Splitview (para Conversaciones)
```
[Sidebar 220px] | [Lista 320px] | [Thread fluid] | [Panel 280px]
```
Las 4 columnas en desktop, colapso progresivo en tablet y mobile.

### Layout C — Analytics
```
[Sidebar] | [Grid de métricas: 2-4 cols según breakpoint]
```
Recharts responsivos, grid CSS para adaptación automática.

---

## Componentes UI Más Usados (prioridad shadcn)

1. **Card** — métricas, features, pricing
2. **Badge** — canal, estado, tags
3. **Button** — CTAs, acciones inline
4. **Avatar** — contactos, negocio
5. **Input / Select** — forms, filtros
6. **Tabs** — filtros en conversaciones
7. **Dropdown Menu** — acciones contextuales
8. **Tooltip** — features deshabilitadas ("Fase 2")
9. **Skeleton** — loading states
10. **Toast** — feedback de acciones

---

*Research completado: 2026-06-10. Base para diseño Bookia MVP Fase 1.*
