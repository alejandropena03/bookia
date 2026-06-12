---
task_id: TASK-012
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T19:00:00Z
updated_at: 2026-06-12T19:00:00Z
priority: ALTA
batch: "TASK-012..014 — conectar producto end-to-end. Encadena según protocolo de cola; 014 es hito → revisión Claude."
---

## Misión
**Backend: calcular los insights de inteligencia comercial REALES** que hoy el dashboard muestra con mock (`lib/dashboard-mock.ts`). Crear un endpoint que produzca EXACTAMENTE el shape `DashboardData` que el front ya consume, calculado desde la DB real (conversaciones, mensajes, bookings, catálogo).

## Contexto
- El front (dashboard de inteligencia, TASK-011) ya tiene los componentes y consume el tipo `DashboardData` de `lib/dashboard-mock.ts`. Lee ESE archivo para ver el shape exacto (kpis, funnel, services, heatmap, roi, recentActivity) — el endpoint debe devolver ese mismo shape para que el front no cambie su estructura.
- Backend ya tiene: `/metrics` básico (conversaciones, mensajes, estados, canales, bookings, tendencia). Amplía o crea `/metrics/intelligence` con los insights ricos.
- Tablas disponibles: conversations, messages, bookings, catalog_items, conversation_state, contacts. Todo bajo `withTenant` (RLS).

## Entregable — endpoint `GET /api/metrics/intelligence`
Calcula desde la DB y devuelve el shape `DashboardData`:
1. **kpis (dinero):**
   - Ingreso potencial: suma de `price` de catalog_items mencionados/consultados en conversaciones activas sin booking. (Heurística: servicios referenciados en conversation_state.slots o por match de texto en messages de conversaciones sin booking.)
   - Citas agendadas en $: suma de `service_price` de bookings (status confirmed) del periodo + conteo.
   - Dinero sobre la mesa: ingreso potencial de conversaciones que pidieron precio (intent precio o llegaron a estado de precio) pero no agendaron.
   - Cada KPI con trend vs periodo anterior (compara con ventana previa equivalente).
2. **funnel:** conteos por etapa — mensajes recibidos (inbound) → conversaciones con interés (>1 intercambio) → pidieron precio (intent/estado precio) → agendaron (booking creado) → confirmaron pago (booking confirmed). Con % de caída entre etapas.
3. **services:** por cada catalog_item — veces consultado (match en mensajes/slots) vs veces agendado (bookings de ese servicio) → tasa de cierre. Ordenado por demanda.
4. **heatmap:** mensajes inbound agrupados por día-de-semana × franja horaria (usa el timestamp de messages). Normaliza intensidad 0-4.
5. **roi:** conversaciones resueltas sin pasar a human_active/escalated (% y conteo), estimación de horas ahorradas (heurística: nº mensajes outbound del bot × tiempo medio por respuesta manual), mensajes respondidos fuera del horario del business_profile.
6. **recentActivity:** últimas conversaciones con estado + canal (puede reusar lógica de /conversations).

## Reglas
- Si un cálculo no tiene datos suficientes (DB casi vacía con solo el seed), devuelve ceros/valores neutros SIN romper — el front debe poder renderizar con datos reales aunque sean bajos. (Para la demo, el seed o un script de datos de muestra puede poblar; ver TASK-014.)
- Documenta cada heurística con un comentario (son aproximaciones, está bien para MVP; lo importante es el shape correcto y que sea data real, no inventada).
- Respeta `withTenant` / RLS en todas las queries.
- Performance: una o pocas queries con agregación; no N+1.

## Criterio de completación (pega evidencia)
1. `docker compose up` + seed. Poblar algunas conversaciones/bookings vía `/api/sim/message` para tener datos.
2. `curl /api/metrics/intelligence` (con header de tenant) → JSON con el shape `DashboardData` completo, calculado de la DB. Pega la salida.
3. Tests: al menos uno por sección (kpis, funnel, services, heatmap, roi) con datos sembrados → valores esperados.
4. `npm test` + `npm run build` pasan.

## Fuera de alcance
- Conectar el front (eso es TASK-013, en queue).
- Cambiar el front. Solo backend aquí.

## Notas
- El shape es el contrato: míralo en `lib/dashboard-mock.ts` y prodúcelo idéntico (mismos nombres de campos).
- Al terminar sin bloqueos: toma TASK-013 de queue/ según protocolo de cola. Commit `task(TASK-012): endpoint de inteligencia comercial`, push, HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
