---
task_id: TASK-009
status: QUEUED
owner: opencode
created_by: claude
depends_on: TASK-007
priority: ALTA (es la carta de presentación como developers)
---

## Misión
Rediseñar la **landing page** de Bookia (`app/page.tsx`) con un nivel de frontend premium "tech luxe": estética Apple/Stripe/Linear pero con ALTO IMPACTO VISUAL (animaciones avanzadas con GSAP), sin sentirse saturado. Esta landing es la primera impresión del cliente y la carta de presentación del equipo como developers — tiene que ser WOW técnicamente y ejecutada con excelencia. Aprovecha tus skills de GSAP (core, ScrollTrigger, timeline, React, performance) y de frontend design (shadcn, Tailwind v4).

NO toques el backend ni el dashboard en esta tarea — SOLO la landing (`app/page.tsx` y los componentes/estilos que necesite). El dashboard/login se rediseñan en una tarea posterior.

## Dirección visual (APROBADA por Alejandro — respétala)
- **Estilo:** "tech luxe" — premium, sofisticado, tecnológicamente avanzado. Referencias: Apple (product pages), Stripe, Linear, Vercel. EVITAR: corporativo, cargado, genérico, parecerse a Amazon/MercadoLibre.
- **Fondo MIXTO:** hero oscuro dramático (`#0A0A0F`/`#0D0B14`) que transiciona a secciones más claras al hacer scroll. El hero impacta, el resto respira.
- **Paleta (degradado signature del logo):**
  - Violeta: `#5B21B6` → `#6D28D9`
  - Azul: `#2563EB` → `#3B82F6`
  - Degradado signature: `linear-gradient(135deg, #6D28D9, #2563EB)` — úsalo en wordmark, CTAs, acentos.
  - Fondo oscuro `#0A0A0F`, superficie `#16131F` con glass/blur, texto `#FFFFFF`/`#A1A1AA`.
- **Tipografía:** Display tipo Geist o Satoshi (geométrica premium); cuerpo Inter. Titulares grandes, peso bold/black, tracking negativo (estilo Apple). Carga las fuentes vía next/font.
- **Logo:** wordmark en `public/bookia-wordmark.svg` (texto SVG, se ve bien con la fuente cargada). El ícono del calendario: Alejandro guardará `public/bookia-logo.png` y/o `public/bookia-icon.png` — úsalos. Si no están aún, deja el `<img>` apuntando a esas rutas con un placeholder y coméntalo.

## Estructura de secciones + animación (GSAP, cada efecto con propósito)
1. **Navbar flotante** glass-morphism, logo + links + CTA. Se compacta/oscurece al hacer scroll.
2. **Hero (oscuro):** wordmark + headline potente (ej: "Tu negocio responde solo. 24/7.") + subhead + CTA. Fondo con degradado animado tipo aurora/mesh en movimiento lento (canvas o CSS animado, performante). Texto entra con reveal escalonado (SplitText o stagger). Glow sutil en el logo/CTA.
3. **Demo del agente en vivo (momento estrella):** mockup de chat (WhatsApp-like) donde se ve al agente de una clínica estética respondiendo. Al hacer scroll, los mensajes aparecen "escribiéndose" en tiempo real (typing effect + stagger). Este es el corazón del pitch: "míralo responder solo".
4. **Cómo funciona:** 3 pasos (1. Conecta tus canales · 2. Carga tu negocio · 3. Responde solo). Scroll-triggered con parallax suave y números animados.
5. **Características:** grid de cards (multicanal WhatsApp/IG, agenda, inteligencia comercial, pausa humana). Glass-morphism, hover con tilt 3D sutil, borde con degradado animado.
6. **Métricas/prueba social:** contadores que suben al entrar en viewport (ej. "<5s respuesta", "24/7", "100% conversaciones atendidas").
7. **CTA final:** "Agenda una demo". Degradado pulsante, botón magnético (sigue el cursor sutilmente).
8. **Footer** limpio con logo, links, marca.

## Requisitos técnicos
- GSAP + ScrollTrigger (y SplitText/otros plugins que tengas). Animaciones a 60fps, usa `will-change`/transforms, respeta `prefers-reduced-motion` (degrada a estático).
- Responsive impecable (mobile-first; en móvil simplifica animaciones pesadas).
- Accesibilidad: contraste AA, foco visible, alt text.
- Performance: lazy-load de lo pesado, no bloquear el LCP del hero. Lighthouse performance > 80 en desktop.
- Es Next.js (App Router) — OJO con SSR de GSAP: los componentes animados son client components (`"use client"`), inicializa GSAP en `useEffect`/`useLayoutEffect` con cleanup.
- Mantén el contenido en español (es el mercado: Colombia).

## Criterio de completación (pega evidencia)
1. `npm run dev` y screenshots del hero + sección demo + una sección con scroll. (O describe el resultado con detalle si no puedes adjuntar imágenes.)
2. `npm run build` del front compila sin errores.
3. Animaciones funcionan y degradan con `prefers-reduced-motion`.
4. Responsive verificado (describe mobile).
5. NO se rompió el backend ni rutas existentes (login/dashboard siguen cargando aunque con su diseño viejo por ahora).

## Notas
- Este es un HITO visual de máxima prioridad → al terminar `status: WAITING_FOR_CLAUDE` para que Claude (y Alejandro) revisen antes de propagar al resto.
- Pon todo el cuidado y creatividad: es literalmente el escaparate del equipo. Si una animación puede ser más elegante, hazla más elegante.
- Si necesitas el wordmark en paths (no dependiente de fuente) para favicon, genéralo tú con tooling.
- Commit `task(TASK-009): rediseño landing premium tech-luxe + GSAP`, push, HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
