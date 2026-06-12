---
task_id: TASK-009b
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T11:00:00Z
updated_at: 2026-06-12T11:00:00Z
---

## Contexto
Claude revisó tu TASK-009 (buena base sólida) y la ELEVÓ directamente: reescribió `hero.tsx`, mejoró `globals.css` (jerarquía de blancos text-hi/mid/lo, gradient-brand 4 stops, grain overlay, bg-grid, mask-fade-edges), añadió spotlight-que-sigue-el-cursor en `features.tsx` y divisor luminoso + gradación en `how-it-works.tsx`. Haz `git pull` para ver esos cambios (commit "design: elevar landing a tech-luxe").

Claude NO pudo correr el build (no tiene las deps instaladas en su máquina). Tu trabajo: **validar que compila/se ve bien + propagar el mismo nivel premium a las secciones que Claude no tocó.**

## Misión
1. **VALIDAR build:** `npm run build` y `npm run dev`. Asegúrate de que los cambios de Claude compilan (hero, features, how-it-works, globals.css). Si algo no compila (ej. utilities `text-hi`/`bg-grid`/`mask-fade-edges` que Claude añadió como `@utility` en Tailwind v4 — verifica que la sintaxis `@utility` es correcta para esta versión; si no, conviértelas a clases normales en `@layer utilities`), CORRÍGELO conservando la intención visual.
2. **Aplicar la jerarquía de blancos** (`text-hi`/`text-mid`/`text-lo` en vez de `text-white/40` etc.) en demo-chat, metrics, cta, navbar, footer — para coherencia con el hero. El texto desvaído (`/30`,`/40`) se ve poco premium; usa text-mid (0.62) para cuerpo y text-hi (0.95) para énfasis.
3. **Demo-chat (momento estrella) — subir el nivel:** añade un **typing indicator real** (3 puntos animados) que aparezca ~600ms ANTES de cada mensaje del bot, luego el mensaje. Que se sienta que el agente "está escribiendo". Mantén el ScrollTrigger once. Esto vende el producto.
4. **Metrics:** que los contadores realmente cuenten hacia arriba (count-up con GSAP) al entrar en viewport, no solo fade. (<5s, 68%, 24/7, etc.)
5. **CTA final:** botón magnético sutil (el botón se desplaza ~6px hacia el cursor en hover/mousemove). Es el detalle "wow" del cierre.
6. **Navbar:** usa el ícono `/bookia-icon.jpeg` + wordmark, glass al hacer scroll. Verifica que el logo se ve nítido.
7. **Performance:** Lighthouse > 80 desktop, 60fps, reduced-motion respetado (Claude ya puso el guard global en CSS).

## Criterio de completación (pega evidencia)
1. `npm run build` compila sin errores. Pega el resultado.
2. `npm run dev` + screenshots (o descripción detallada) de: hero, demo-chat con typing, features con spotlight, metrics contando, cta.
3. Confirma reduced-motion y responsive móvil.
4. Las utilities de Claude funcionan (o las corregiste conservando el look).

## Fuera de alcance
- Backend, dashboard, login (esos van después).
- Conectar a datos reales (TASK-008, sigue en pausa hasta terminar el rediseño visual).

## Notas
- Si una utility `@utility` de Tailwind v4 que añadió Claude da problema de build, ese es el error más probable — revísalo primero.
- Es la carta de presentación: cuida cada micro-detalle. Al terminar `status: WAITING_FOR_CLAUDE` (Claude + Alejandro revisan el resultado visual). Commit `task(TASK-009b): validar + propagar nivel premium`, push, HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
