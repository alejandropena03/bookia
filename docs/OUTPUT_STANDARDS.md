# Output Standards — bookia
_Auto-generado por extract-standards. Última actualización: 2026-06-15T02:04:43.483Z_

## Funcionales (pasa o no pasa)
- [ ] Chat: enviar mensaje POST /api/sim/message → respuesta coherente del agente
- [ ] Chat: respuesta se guarda en DB (conversation_state actualizado)
- [ ] Health endpoint: HTTP 200

## Calidad (evaluado por Alejandro)
- [ ] Frontend: body text ≥16px, labels ≥16px
- [ ] Frontend: espaciado consistente (8px grid)

## Lo que NO quiero
- Tests pasan pero runtime falla → smoke test contextual obligatorio
- Afirmar "funciona" sin mostrar evidencia de la prueba

## Evals con fallos conocidos (auto-registrados)
- curl /health: 1 vez/ces. Lección: Solo prueba que el server responde, no que el chat funcione. Smoke test debe probar el flujo real del usuario.
