---
task_id: TASK-014
status: QUEUED
owner: opencode
created_by: claude
depends_on: TASK-013
---

## Misión
**Verificación end-to-end + datos de muestra para la demo.** Dejar Bookia funcionando como un todo coherente: poblar datos de muestra realistas para Santa María (para que el dashboard de inteligencia muestre números convincentes con data REAL, no vacíos), y validar el flujo completo de punta a punta.

## Contexto
- Tras TASK-012 (insights backend) y TASK-013 (front conectado), el sistema está unido. Pero con solo el seed mínimo, el dashboard de inteligencia se vería casi vacío. Hay que poblar datos de muestra para que la demo impacte.

## Entregable
1. **Script de datos de muestra** (`server/src/db/seed-demo.ts` o ampliar el seed): genera para Santa María un volumen realista de conversaciones/mensajes/bookings DISTRIBUIDOS en el tiempo (últimos 30 días), con:
   - Variedad de canales (whatsapp/instagram/facebook).
   - Conversaciones en distintos estados (bot_active, human_active, escalated, closed).
   - Bookings con distintos servicios y precios (para que los KPIs de dinero den montos realistas).
   - Mensajes en distintas horas/días (para que el heatmap tenga forma, picos tarde-noche).
   - Algunas conversaciones que pidieron precio y no agendaron (para "dinero sobre la mesa" y el embudo).
   - Corre idempotente (no duplica si se re-ejecuta; o limpia y resiembra los datos demo).
2. **Validación E2E** (script o checklist ejecutado):
   - `docker compose up` + migrate + seed + seed-demo.
   - Front levantado, dashboard muestra insights con los datos de muestra (montos, embudo, heatmap con forma, ROI).
   - Demo en vivo: enviar mensaje simulado nuevo → agente responde → aparece en la conversación Y el contador correspondiente del dashboard sube al refrescar.
   - Conversaciones lista/detalle, takeover/handback funcionan contra datos reales.
3. **README de arranque** (`README-DEMO.md` o sección en README): pasos exactos para levantar todo y dar la demo (docker up, seeds, front dev, qué mostrar). Para que cualquiera del equipo pueda demostrarlo.

## Criterio de completación (pega evidencia)
1. Outputs de: seed-demo corriendo, dashboard con datos de muestra (describe los números), demo en vivo funcionando E2E.
2. `npm test` + `npm run build` (front y server) pasan.
3. README-DEMO con los pasos.

## Fuera de alcance
- Credenciales reales de Meta / canales reales (se enchufan después).
- AgendaPro real, TikTok.

## Notas
- El objetivo es que al terminar, Alejandro pueda hacer `docker compose up` + seeds + `npm run dev` y mostrar Bookia funcionando con el negocio de Santa María "vivo": dashboard con inteligencia real y el agente respondiendo en la demo. Ese es el producto "esperando credenciales".
- HITO FINAL de esta fase → `status: WAITING_FOR_CLAUDE`. Commit `task(TASK-014): datos de muestra + verificación E2E`, push, HANDOFF_LOG.

## Resultado de OpenCode
_(llenar)_
