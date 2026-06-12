---
task_id: TASK-014
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
depends_on: TASK-013
created_at: 2026-06-12T21:30:00Z
updated_at: 2026-06-12T21:30:00Z
priority: ALTA
batch: "TASK-012..014 — conectar producto end-to-end. TASK-012 DONE. TASK-013 DONE (con fix Claude). TASK-014 activa = HITO FINAL."
---

## Misión
**Verificación end-to-end + datos de muestra para la demo.** Dejar Bookia funcionando como un todo coherente: poblar datos de muestra realistas para Santa María (para que el dashboard de inteligencia muestre números convincentes con data REAL, no vacíos), y validar el flujo completo de punta a punta.

## Contexto
- TASK-012 DONE: `GET /api/metrics/intelligence` calcula insights reales desde DB.
- TASK-013 DONE: Front conectado al backend real. Dashboard consume `/api/metrics/intelligence`, conversaciones y detalle son reales, demo en vivo (botón flotante violeta) envía `POST /api/sim/message` y recibe respuesta del agente por SSE en tiempo real.
- Fix Claude en TASK-013: `DemoLive` ahora filtra SSE por `conversationId` para no mezclar threads en el chat de demo.
- Con solo el seed mínimo actual, el dashboard de inteligencia se ve casi vacío. Hay que poblar datos de muestra para que la demo impacte.

## Entregable
1. **Script de datos de muestra** (`server/src/db/seed-demo.ts` o ampliar el seed): genera para Santa María un volumen realista de conversaciones/mensajes/bookings DISTRIBUIDOS en el tiempo (últimos 30 días), con:
   - Variedad de canales (whatsapp/instagram/facebook).
   - Conversaciones en distintos estados (bot_active, human_active, escalated, closed).
   - Bookings con distintos servicios y precios del catálogo Santa María (para que KPIs de dinero den montos realistas — estamos hablando de servicios de $150K a $350K COP).
   - Mensajes en distintas horas/días (para que el heatmap tenga forma, picos tarde-noche que se ven bien).
   - Algunas conversaciones con mensajes de "precio" / "cuánto cuesta" sin booking (para "dinero sobre la mesa" y el embudo con caída visible).
   - Corre idempotente (no duplica si se re-ejecuta; o limpia y resiembra los datos demo).
2. **Validación E2E** (ejecutar y pegar evidencia):
   - `docker compose up` + migrate + seed + seed-demo.
   - Front levantado, dashboard muestra insights con datos de muestra (describe los montos, embudo con % de caída, heatmap con forma).
   - Demo en vivo: enviar mensaje simulado nuevo → agente responde → aparece en conversación, dashboard sube al refrescar.
   - Conversaciones lista/detalle, takeover/handback funcionan contra datos reales.
3. **README-DEMO.md** (en la raíz o en docs/): pasos exactos para levantar todo y dar la demo (docker up, seeds, front dev, qué mostrar). Para que cualquiera del equipo pueda demostrarlo sin fricción.

## Criterio de completación (pega evidencia)
1. Output de seed-demo corriendo. Dashboard con datos de muestra (describe los números clave: ingreso, embudo, heatmap, ROI).
2. Demo en vivo funcionando E2E.
3. `npm test` + `npm run build` (front y server) pasan.
4. README-DEMO con los pasos.

## Fuera de alcance
- Credenciales reales de Meta / canales reales.
- AgendaPro real, TikTok.

## Notas
- Objetivo: al terminar, Alejandro puede hacer `docker compose up` + seeds + `npm run dev` y mostrar Bookia funcionando con el negocio de Santa María "vivo": dashboard con inteligencia real y el agente respondiendo en la demo. Ese es el producto "esperando credenciales".
- **HITO FINAL de esta fase** → al terminar: `status: WAITING_FOR_CLAUDE`. Claude hace revisión final del producto completo.
- Commit: `task(TASK-014): datos de muestra + verificación E2E`, push, actualizar HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
