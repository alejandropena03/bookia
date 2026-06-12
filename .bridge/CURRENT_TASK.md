---
task_id: TASK-011
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
created_at: 2026-06-12T15:00:00Z
updated_at: 2026-06-12T18:00:00Z
priority: ALTA
---

## Contexto
El dashboard actual (TASK-010) quedó funcional pero GENÉRICO: "mensajes hoy, citas, conversión, tiempo respuesta" lo tiene cualquier dashboard. Alejandro quiere un dashboard NOVEDOSO de alto impacto: insights que el seller NUNCA ha tenido, porque Bookia lee TODAS las conversaciones. Claude ya arregló el bug del login (salía oscuro) — eso ya está. Esta tarea es el dashboard de inteligencia.

Tema: CLARO con acentos de marca (tokens `app-*`, ya definidos). Datos: MOCK REALISTA ahora (estructura lista para que el backend la calcule después). NO conectar backend aún.

## Misión
Rediseñar el **Dashboard** (`app/(dashboard)/dashboard/page.tsx` + componentes en `components/dashboard/`) como un panel de inteligencia comercial de alto impacto, MIX BALANCEADO con estos bloques (en este orden de jerarquía):

### Bloque 1 — DINERO (protagonista, arriba, grande)
Tres KPI hero grandes con tendencia:
- **Ingreso potencial en conversaciones activas** (suma de precios de servicios consultados sin agendar) — ej. "$4.2M COP en juego"
- **Citas agendadas (en $)** este mes — ej. "$8.7M COP · 34 citas"
- **Dinero sobre la mesa** (leads que preguntaron precio pero no agendaron) — ej. "$2.1M COP sin cerrar"
Estos son el gancho. Números grandes, con micro-tendencia (▲/▼ vs periodo anterior).

### Bloque 2 — EMBUDO DE CONVERSIÓN (funnel visual)
Embudo: Mensajes recibidos → Mostraron interés → Pidieron precio → Agendaron → Confirmaron pago. Con % de caída entre cada paso. Resalta dónde se cae más (el paso con peor conversión en rojo/ámbar). Muy accionable.

### Bloque 3 — DEMANDA POR SERVICIO
Tabla/barras: por cada servicio del catálogo → cuántas veces se preguntó vs cuántas se agendó (tasa de cierre por servicio). Ordenado por demanda. Muestra el "se pregunta mucho pero no cierra" (oportunidad).

### Bloque 4 — MAPA DE CALOR DE DEMANDA (horas × días)
Heatmap 7 días × franjas horarias mostrando cuándo llegan más mensajes. El seller ve cuándo necesita más gente / cuándo lanzar promos. (Puede ser grid de celdas con intensidad de color de marca.)

### Bloque 5 — ROI DEL BOT
- Conversaciones resueltas SIN intervención humana (% y conteo)
- Horas de trabajo ahorradas (estimado)
- Mensajes respondidos fuera de horario (leads que se habrían perdido)
Justifica pagar Bookia.

### Bloque 6 — ACTIVIDAD EN VIVO / recientes
Lista compacta de conversaciones recientes con estado (bot/humano/escalada/agendada) y canal. Mantener pero secundario.

## Diseño / visualización (eres el experto)
- Jerarquía clara: dinero arriba y grande, lo demás abajo en grid.
- **Tipografía de números:** usa `tabular-nums` y un peso fuerte pero ELEGANTE. Alejandro dijo que la letra de los números no le gustaba — dale carácter (considera un tamaño grande con tracking ajustado, no el look genérico). Para los montos en $ usa formato es-CO ($4.200.000 o $4.2M).
- Charts: Recharts, recoloreados al degradado de marca (#6D28D9→#2563EB). Limpios, con grid sutil, sin saturar. Tooltips legibles.
- Cards `app-card`, espaciado generoso, micro-interacciones en hover.
- Cada bloque con un título claro y una frase de "qué significa" (el seller no es técnico).
- Badges de canal con color por canal (WhatsApp verde, Instagram degradado rosa/morado, Facebook azul).

## Datos mock (créralos realistas en un archivo, ej. `data/dashboard.json` o un módulo `lib/dashboard-mock.ts`)
Genera un dataset coherente para Estética Santa María: ~47 mensajes/día, servicios reales placeholder (consulta, facial, depilación láser, masaje, paquete) con precios COP, 30 días de serie temporal, embudo con caídas realistas, heatmap con picos en tarde-noche (coherente con su horario 9-22:30), ROI del bot creíble. Documenta el SHAPE para que el backend lo calcule luego (TASK futura).

## Criterio de completación (pega evidencia)
1. `npm run build` compila. `npm run dev`.
2. Screenshots/descripción del dashboard completo (los 6 bloques).
3. Login (`/login`) ahora sale CLARO (Claude arregló el bug del root; confírmalo) y la landing (`/`) sigue oscura.
4. Responsive (los bloques se reorganizan en móvil/tablet).
5. Números bien formateados (COP, tabular-nums, jerarquía).

## Fuera de alcance
- Conectar backend (después). Pero deja el shape del mock claro para que el backend lo implemente.
- Las otras páginas (conversaciones/settings) ya quedaron en TASK-010; solo tócalas si algo se ve roto por el cambio del root layout.

## Notas
- Esto es lo que diferencia a Bookia de "otro chatbot": el dashboard de inteligencia. Ponle el mismo nivel de cuidado que la landing.
- HITO → al terminar `status: WAITING_FOR_CLAUDE` (Claude revisa código + Alejandro revisa visual). Commit `task(TASK-011): dashboard de inteligencia comercial`, push, HANDOFF_LOG.

## Resultado de OpenCode

### Build ✅
- `npm run build` compila sin errores (TypeScript + production build).
- Fix adicional: `TooltipTrigger asChild` no existe en Base UI → corregido en `settings/page.tsx`.

### Componentes creados (6 bloques + mock data)

| Bloque | Componente | Archivo |
|---|---|---|
| 1 — Dinero | `RevenueKpiCards` | `components/dashboard/RevenueKpiCards.tsx` |
| 2 — Embudo | `ConversionFunnel` | `components/dashboard/ConversionFunnel.tsx` |
| 3 — Demanda por servicio | `ServiceDemand` | `components/dashboard/ServiceDemandHeatmap.tsx` |
| 4 — Mapa de calor | `DemandHeatmap` | `components/dashboard/DemandHeatmap.tsx` |
| 5 — ROI del bot | `BotRoiCard` | `components/dashboard/BotRoiCard.tsx` |
| 6 — Actividad reciente | `DashboardRecentActivity` | `components/dashboard/DashboardRecentActivity.tsx` |
| Mock data | `getDashboardData()` | `lib/dashboard-mock.ts` |

### Datos mock (Santa María)
- **KPIs**: $4.2M en juego (potencial), $8.7M (34 citas), $2.1M (sin cerrar) — con flechas ▲12%, ▲8%, ▼5%
- **Embudo**: 1410 → 987 (30% caída) → 423 (57% caída, mayor fuga) → 89 → 67 confirmados
- **Servicios**: Depilación láser (#1 demanda, 11.2% cierre), Consulta (#2, 23.9% cierre), Facial, Masaje, Paquete Premium
- **Heatmap**: 7 días × 7 franjas (9-22:30), picos jueves 5-7pm (61 mensajes), intensidad 0-4
- **ROI**: 73% sin humana, 47h ahorradas, 234 fuera de horario, $5.6M valor estimado
- **Shape documentado**: docstring con tipos completos para implementación backend

### Feature highlights
- **AnimatedNumber**: contador animado en los KPIs de dinero (efecto visual de carga creciente)
- **TrendArrow**: flecha hacia arriba/abajo con color verde/rojo
- **ProgressBar**: barras de progreso con degradado morado→azul, la peor etapa en rojo
- **Sort toggle**: demanda por servicio cambiable entre "Demanda" y "Cierre"
- **Heatmap**: grid con 5 niveles de intensidad (indigo → purple), tooltip en hover
- **ROI card**: 3 métricas en badges de colores + valor estimado con gradient-brand
- **Responsive**: grid adaptable (md:grid-cols-3 para KPIs, lg:grid-cols-5 para embudo + resumen, lg:grid-cols-2 para heatmap+ROI)
- **Números**: tabular-nums en todos los valores, formato es-CO con toLocaleString, formato corto ($4.2M)
- **Login claro**: confirmado — el fix de Claude en el layout raíz se mantiene

### Archivos modificados
```
M  app/(dashboard)/dashboard/page.tsx          # 74→72 líneas, reescrito
M  app/(dashboard)/settings/page.tsx            # fix TooltipTrigger asChild
A  lib/dashboard-mock.ts                         # nuevo — mock data + shape doc
A  components/dashboard/RevenueKpiCards.tsx      # nuevo — bloque 1
A  components/dashboard/ConversionFunnel.tsx     # nuevo — bloque 2
A  components/dashboard/ServiceDemandHeatmap.tsx # nuevo — bloque 3
A  components/dashboard/DemandHeatmap.tsx        # nuevo — bloque 4
A  components/dashboard/BotRoiCard.tsx           # nuevo — bloque 5
A  components/dashboard/DashboardRecentActivity.tsx # nuevo — bloque 6
```

### Por revisar (Claude)
- Calidad visual de los 6 bloques en claro
- Coherencia del mock data con la realidad de Santa María
- El shape documentado para que el backend lo implemente después
- Que el login salga claro y la landing oscura se mantengan correctos
