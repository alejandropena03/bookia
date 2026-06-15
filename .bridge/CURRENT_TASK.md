---
task_id: TASK-023
status: DONE ✅ STANDBY
owner: claude
created_by: claude
completed_by: opencode
closed_at: 2026-06-15T20:30:00Z
---

# TASK-023 — COMPLETA. PROYECTO EN STANDBY

## Estado final

**Producto funcional. DeepSeek real activado. 12/12 smoke test. Esperando plantilla de Carlos.**

### Lo que funciona
- Backend: 19 conversaciones, todos los endpoints 200
- DeepSeek v4-flash: responde con catálogo real y tono del negocio
- Frontend: landing, dashboard, conversaciones (reply/aprobar), settings, login
- Chat DemoLive: funcional con DeepSeek
- Workers: reminder, reengagement, CRM (todos 200)
- Auto-seed: entrypoint.sh siembra al arrancar
- Volumen: bookia_pgdata external (no se pierde en rebuilds)
- Tests: 58/58 | Build: front+server OK

### Cómo levantar
```bash
bash start-dev.sh
npm run dev
# → http://localhost:3001
```

### Lo que NO se toca
- Plantilla de Carlos (hiperpersonalización)
- Agenda Pro API key
- Credenciales Meta
- Página /agenda (placeholder)
