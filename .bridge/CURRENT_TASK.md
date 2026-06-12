---
task_id: TASK-015
status: DONE
owner: claude
reviewed_by: claude
priority: ALTA
created_at: 2026-06-12T22:30:00Z
updated_at: 2026-06-12T23:45:00Z
queue: TASK-016-features-propuesta
---

## Estado
**APROBADA. Motor de hiperpersonalización completo.**

Cuando llegue la plantilla de Carlos → `npm run import:tenant -- --slug=santa-maria` → agente configurado.

## Fixes aplicados (6) + feature (1)
1. System prompt 100% desde DB (sin hardcoded "clínica estética")
2. Validación de horario antes de responder (isOutOfHours)
3. Canned responses desde DB (migración 0003, columna canned_responses jsonb)
4. Escalation rules — formato canónico normalizado (condition→keyword)
5. Flujo first_contact con saludo + menú de 4 opciones
6. tryStartFlow genérico (any flow key matching intent, not just "agendamiento")
7. import-tenant.ts — importador idempotente desde JSON

## Fix Claude (post-revisión)
Double query en orchestrator.ts: `hoursRaw` se consultaba dos veces (una en loadBusinessContext, otra extra). Eliminada la query redundante — `hoursRaw` ahora vive en `BusinessContext` y se reutiliza.

## Propuesta de próximos features
En `queue/TASK-016-features-propuesta.md`: 4 features para cerrar loop de valor (pasarela pagos Wompi, recordatorios inteligentes, re-engagement leads, CRM cumpleaños). Pendiente discusión.
