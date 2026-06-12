---
task_id: TASK-002
status: WAITING_FOR_CLAUDE
owner: claude
created_by: claude
completed_by: opencode
created_at: 2026-06-12T00:00:00Z
updated_at: 2026-06-12T01:40:00Z
---

## Misión ✅ COMPLETADA por OpenCode
Schema completo + migraciones + RLS + seed Santa María placeholder.

## Outputs de validación

### `npm run db:generate`
```
9 tables — migration: drizzle/0000_lively_marvel_apes.sql
```

### `docker compose up -d` + `npm run db:migrate`
```
[✓] migrations applied successfully!
```
Puerto 5432 liberado: `oli-postgres` detenido.

### `npx tsx src/db/seed.ts`
```
✓ Tenant created: Santa María Clínica Estética
✓ Channel account created: mock (mock)
✓ Business profile created
✓ 5 catalog items created
✓ Flow "agendamiento" created
✓ Owner user created: Admin Santa María

📊 Seed summary:
  tenants: 1
  channel_accounts: 1
  business_profile: 1
  catalog_items: 5
  flows: 1
  users: 1
```

### `npm test` + `npm run build`
```
✓ tests/health.test.ts (2 tests) — PASS
tsc — compila sin errores
```

### RLS verificado
```
8 tables with relrowsecurity = true
```
(messages, conversations, contacts, channel_accounts, flows, catalog_items, business_profile, users)

### Health endpoint
```json
{"status":"ok","db":"connected","timestamp":"2026-06-12T01:39:11.336Z"}
```

## Archivos creados/modificados
| Archivo | Acción |
|---|---|
| `server/src/db/schema.ts` | Reescribir: 9 tablas, 8 enums, índices, FKs |
| `server/src/db/seed.ts` | Creación: seed con Santa María placeholder |
| `server/drizzle/0000_lively_marvel_apes.sql` | Migración generada por Drizzle |
| `server/drizzle/0001_rls_policies.sql` | Creación: RLS manual SQL |

## Supuestos y decisiones
- `oli-postgres` fue detenido para liberar puerto 5432.
- Seed usa `postgres.js` directo + Drizzle insert; no Drizzle `.insert().values()` para flow definition (jsonb typed).
- Flow definition shape: `{ initial, states: { [state]: { prompt, collects, next, transitions } } }` como sugirió Claude.
- `price` usa `numeric(12,2)` para precisión monetaria.
- RLS: archivo SQL separado en `drizzle/0001_rls_policies.sql` porque Drizzle no expresa RLS nativamente. Documentado cómo usarlo: `SET app.current_tenant = '<uuid>'`.
- Contenido del seed es placeholder genérico (Servicios A-E, flujo genérico) — nada de Santa María real. Eso lo trae Carlos.

## Próxima acción
Claude revisa outputs. Si OK, TASK-003 (Channel-Adapter + MockAdapter + SSE simulator) es la siguiente.
