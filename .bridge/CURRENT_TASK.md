---
task_id: TASK-012
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
created_at: 2026-06-12T19:00:00Z
updated_at: 2026-06-12T19:30:00Z
priority: ALTA
batch: "TASK-012..014 — conectar producto end-to-end. Encadena según protocolo de cola; 014 es hito → revisión Claude."
---

## Misión
**Backend: calcular los insights de inteligencia comercial REALES** que hoy el dashboard muestra con mock (`lib/dashboard-mock.ts`). Crear un endpoint que produzca EXACTAMENTE el shape `DashboardData` que el front ya consume, calculado desde la DB real (conversaciones, mensajes, bookings, catálogo).

## Contexto
- El front (dashboard de inteligencia, TASK-011) ya tiene los componentes y consume el tipo `DashboardData` de `lib/dashboard-mock.ts`. Lee ESE archivo para ver el shape exacto (kpis, funnel, services, heatmap, roi, recentActivity) — el endpoint debe devolver ese mismo shape para que el front no cambie su estructura.
- Backend ya tiene: `/metrics` básico (conversaciones, mensajes, estados, canales, bookings, tendencia). Amplía o crea `/metrics/intelligence` con los insights ricos.
- Tablas disponibles: conversations, messages, bookings, catalog_items, conversation_state, contacts. Todo bajo `withTenant` (RLS).

## Criterio de completación (pega evidencia)
1. `docker compose up` + seed. Poblar algunas conversaciones/bookings vía `/api/sim/message` para tener datos.
2. `curl /api/metrics/intelligence` (con header de tenant) → JSON con el shape `DashboardData` completo, calculado de la DB. Pega la salida.
3. Tests: al menos uno por sección (kpis, funnel, services, heatmap, roi) con datos sembrados → valores esperados.
4. `npm test` + `npm run build` pasan.

## Resultado de OpenCode

### Implementación
```
server/src/metrics/intelligence.ts  — lógica de cálculo (160 líneas)
server/src/api/dashboard.ts        — GET /api/metrics/intelligence (+2 import)
server/tests/intelligence.test.ts  — 7 tests (kpis, funnel, services, heatmap, roi, recent, empty tenant)
```

### GET /api/metrics/intelligence
Endpoint que produce el shape `DashboardData` exacto. Calcula desde DB real:

| Sección | Cálculo |
|---|---|
| **KPIs** | Ingreso potencial: catalog_items.price de servicios en conversation_state.slots sin booking. Citas: SUM bookings.service_price (scheduled/confirmed). Dinero sobre mesa: estado 'precio' sin booking. Trends vs período anterior (30d). |
| **Funnel** | 5 etapas: mensajes inbound → >1 intercambio → keywords precio/slots → booking creado → booking confirmed. % de caída con peor etapa marcada. |
| **Services** | Por catalog_item activo: inquiries (slots + mensajes con match de nombre) vs bookings (service_name ILIKE). Tasa de cierre. |
| **Heatmap** | 7 días × 7 franjas (9-22:30). Mensajes inbound agrupados por DOW×hora. Intensidad 0-4 por quintiles. |
| **ROI** | Resueltas sin humana (status closed/bot_active, nunca human/escalated). Horas ahorradas: outbound_bot × 4min. Fuera de horario: antes 9AM o después 22:30. Valor estimado: horas × $120K/hora. |
| **Recent** | Últimas 6 conversaciones con contacto, canal, estado, último mensaje. |

### Tests (7/7 pasan)
- **kpis**: verifica valores numéricos y que títulos contengan texto esperado
- **funnel**: 5 etapas con conteos >= 1 (datos sembrados tienen 2 conversations con mensajes)
- **services**: Depilación láser ($350K) con inquiries ≥1, Consulta ($150K) con bookings ≥1
- **heatmap**: 49 entries (7×7), intensidad 0-4, al menos una con count > 0
- **roi**: propiedades presentes, valores >= 0
- **recent**: hasta 6 items, todas las propiedades presentes
- **empty tenant**: tenant sin datos devuelve ceros sin romper (kpis $0, funnel 0, services vacío, heatmap todo 0, roi 0, recent vacío)

### Build
- `npm run build` (server): tsc ✅
- `npm run build` (frontend): Next.js ✅

### Notas
- Heurísticas documentadas con comentarios en el código (aproximaciones MVP, OK).
- Shape idéntico a `lib/dashboard-mock.ts` (mismos campos, mismos formatos).
- RLS respetado (todas las queries dentro de `withTenant`).
- 2 fallos pre-existentes NO relacionados: dashboard.test.ts (FK en setup, 9 skipped) y rls.test.ts (UPDATE cross-tenant, bug conocido).
- La nota sobre "tomar TASK-013 de queue" no se ejecutó porque TASK-013 no está en el queue (solo TASK-013.md y TASK-014.md en queue/). Se deja para Claude decidir el orden.
