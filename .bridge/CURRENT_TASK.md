---
task_id: TASK-002b
status: WAITING_FOR_OPENCODE
owner: opencode
created_by: claude
created_at: 2026-06-12T02:00:00Z
updated_at: 2026-06-12T02:00:00Z
---

## Misión
**Fix de seguridad sobre TASK-002 (aprobada con correcciones).** Claude revisó el RLS y encontró dos huecos reales que ya corrigió en `server/drizzle/0001_rls_policies.sql`. Tu trabajo: **re-aplicar el RLS corregido y validar que el aislamiento multi-tenant funciona de verdad** (no solo que las tablas tengan RLS habilitado).

TASK-002 en sí quedó muy bien (schema, seed, índices). Esto es solo cerrar el RLS correctamente.

## Qué cambió Claude en el SQL (ya está commiteado por Claude)
1. **`FORCE ROW LEVEL SECURITY`** en todas las tablas de negocio — porque por defecto el rol DUEÑO de la tabla bypassa RLS; sin FORCE, si la app se conecta como dueño el RLS no aplica nada.
2. **`WITH CHECK`** además de `USING` en cada política — `USING` solo filtra lectura; sin `WITH CHECK` un tenant podría INSERTAR/ACTUALIZAR filas con el `tenant_id` de otro tenant.
3. **`current_setting('app.current_tenant', true)`** (segundo arg `true`) — fail-safe: si el GUC no está seteado devuelve NULL en vez de reventar, y NULL no matchea → 0 filas (seguro por defecto).

## Implicación crítica que debes resolver
Con `FORCE RLS`, **el seed y las migraciones ya NO pueden correr sin más**, porque el rol dueño ya no bypassa RLS y el seed inserta sin setear `app.current_tenant`. Opciones (elige y documenta):
- **(A) Recomendada:** que el seed setee el GUC antes de insertar. Pero el seed crea el tenant primero y necesita su id... → patrón: crear el tenant (esa tabla NO tiene RLS, así que entra), luego `SET app.current_tenant = '<nuevo_tenant_id>'` antes de insertar el resto.
- **(B)** correr seed/migraciones con un rol que tenga `BYPASSRLS` (ej: el superusuario `postgres`), y la app de runtime con un rol normal sin BYPASSRLS. Más cercano a producción pero más setup.
- Para el MVP, (A) es más simple. Implementa lo que veas mejor y documéntalo.

## Entregable esperado
1. Seed ajustado para funcionar con FORCE RLS (patrón A o B).
2. Re-aplicar migración RLS limpia desde cero (drop volumen o recrear DB para validar idempotencia del flujo completo).
3. **Test de aislamiento real** (`server/tests/rls.test.ts` o script): crea 2 tenants con datos, setea `app.current_tenant` al tenant 1, verifica que SELECT solo ve filas del tenant 1 y que un INSERT con tenant_id del tenant 2 es RECHAZADO. Este test es el que demuestra que el RLS sirve.

## Criterio de completación (pega outputs)
1. Recrear DB limpia: `docker compose down -v && docker compose up -d`.
2. `npm run db:migrate` + aplicar `0001_rls_policies.sql` → sin errores.
3. `npx tsx src/db/seed.ts` → corre OK con FORCE RLS activo (sin bypass accidental).
4. Test de aislamiento: SELECT como tenant 1 NO ve filas de tenant 2; INSERT cross-tenant rechazado con error de policy. Pega el output.
5. `npm test` + `npm run build` siguen pasando.

## Deuda menor anotada (NO bloqueante, NO la arregles ahora)
- `flows.is_active` y `catalog_items.is_active` son `integer` (0/1). Lo idiomático en Postgres es `boolean`. Lo dejamos como está por ahora; si en una tarea futura tocamos esas tablas, migrar a boolean. Anotado en PENDIENTES.

## Fuera de alcance
- Integrar el `SET app.current_tenant` en el middleware de la app (eso es de una tarea posterior cuando haya endpoints autenticados). Aquí solo el seed + el test lo setean manualmente.

## Notas del agente anterior (Claude)
- Excelente trabajo en TASK-002, el seed quedó muy fiel al workflow real de Santa María. Solo faltaba blindar el RLS de verdad.
- El SQL corregido ya está en el repo (Claude lo commiteó junto con esta tarea). Haz `git pull` y verás `0001_rls_policies.sql` actualizado.
- Al terminar: `status: WAITING_FOR_CLAUDE`, llena "Resultado de OpenCode", línea en `HANDOFF_LOG.md`, commit `task(TASK-002b): RLS hardening + test aislamiento` y push.

## Resultado de OpenCode
_(OpenCode llena esto.)_
