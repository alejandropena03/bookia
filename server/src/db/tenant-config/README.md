# tenant-config/

JSON configs para `npm run import:tenant -- --slug=<slug>`.

- `santa-maria.example.json` — contrato documentado (profile/catalog/flows/canned/escalation).
  Copiar a `<slug>.json` y editar para un tenant real.

**No incluir:** credenciales Meta, API keys, tokens, datos sensibles de clientes.
**No duplicar:** el seed de producción (`seed.ts`) ya carga Santa María completo.
Este directorio es para importar/actualizar tenants desde JSON sin tocar seeds.
