---
task_id: TASK-024
status: DONE ✅
owner: opencode
created_by: opencode
completed_by: opencode
created_at: 2026-06-27T02:30:00Z
closed_at: 2026-06-27T03:00:00Z
title: "Hiperpersonalización completa desde plantilla final de Carlos"
---

# TASK-024 — Plantilla Carlos TERMINADA → agente 100% alineado + multi-ciudad

## Qué se hizo

Re-extracción completa del docx final "Terminada plantilla estética Santamaría y bookia (1).docx" enviado por Carlos, sincronizada con runtime. **El agente ahora opera con los datos reales completos y textos exactos de Carlos**, no con placeholder.

### Fase 0 — Re-extracción desde el docx final
- Reescribí `flows/santa-maria/catalog.ts`: 31 servicios reales (añadidos **Radiesse Plus $2.800.000** + **Faja mentonera $60.000** que faltaban), con `cities` e `imageKeys` por servicio.
- Reescribí `flows/santa-maria/canned-responses.ts`: **24 canned responses** (antes 11) con textos EXACTOS del docx. Nuevas: `bienvenida`, `dudas_medicas` (Q&A duraciones + cuidados + anestesia), `solicitud_comercial` (Elkin 318 735 4841), `devolucion` (email + 5-15 días), `rechazo_fecha_nacimiento` (justificación médica), `nombres_doctores` (Natalia/Ronald/Raúl por ciudad), `reagendamiento_control` (30 días + $50.000), `comprobante_pago` (Bancolombia A&S Group SAS NIT 901916939), `caso_alergia` (Flujo 1), `reengagement_info_enviada`.
- Reescribí `flows/santa-maria/flows.ts`: `AGENDAMIENTO_FLOW` con bienvenida EXACTA de Carlos ("¡Hola! ✨ Bienvenido(a)...") y textos exactos de confirmación + recordatorio. 9 datos requeridos: nombre, celular, servicio, fecha, hora, ciudad, cédula, correo, fecha nacimiento.

### Fase 1 — Sincronización config canónica (DB = fuente de verdad)
1a. **Schema**: añadí columnas `cities jsonb`, `image_keys jsonb`, `promo_label text` a `catalog_items` (schema.ts). Migración SQL `0009_add_catalog_cities_images.sql` con IF NOT EXISTS + COMMENT.
1b. **tenant-config/santa-maria.json** completamente reescrito: persona "Carlos" exacta, horario real L-S 9-19, 31 servicios con cities+image_keys+promo_label, 24 canned responses exactos, escalation rules reales (Elkin + email), flow agendamiento con 9 datos + texto exacto de confirmación.
1c. **import-tenant.ts**: mapea `cities`/`image_keys`/`promo_label` del JSON a las columnas nuevas.
1d. **Migración 0009 aplicada** via `psql -f`. **Seed.ts reconstruido**: INSERT entrega `cities`/`image_keys`/`promo_label`, profile carga `frases_caracteristicas` + `escalate_to` en rules. Bug encontrado y arreglado en seed: `db.execute(sql)` devolvía cursor no array → cambié a `queryClient` directo para el SELECT del tenant. Bug arreglado: `queryClient.json()` no existe en postgres.js driver → cambié a `JSON.stringify(obj)::jsonb`. Dockerfile ampliado para copiar `src/db/tenant-config/` al dist. **Import + seed ejecutados en container** con éxito.

### Fase 1e — Validación de endpoints
- `/health`: 38 catalogItems, deepseek, ok.
- `/api/catalog` (sin filtro): **31 servicios** reales (Faja mentonera $60.000, Full Face AH $2.999.000 con image_keys ["image16.jpeg","image28.jpeg"], Barbie Botox $2.999.000 con image_keys ["image26.jpeg"], cities pobladas).
- `/api/catalog?city=Medellín`: **31 servicios** (incluye Micropigmentación exclusiva Medellín $650.000).
- `/api/catalog?city=CDMX`: **19 servicios** (excluye Micropigmentación y "Botox por zona" — solo CO). **Filtro multi-ciudad funciona.**
- `/api/profile`: persona "Te llamas Carlos y eres el asesor virtual de Santa María..." completa.

### Fase 2 — Hiperpersonalización E2E
**Agendamiento flow probado paso a paso via `/api/sim/message`:**
1. "quiero agendar" → flow dispara bienvenida EXACTA de Carlos ("¡Hola! ✨ Bienvenido(a)... ¿desde qué ciudad nos escribes? 😊").
2. "medellin" → catálogo FILTRADO por Medellín (31 servicios incluyendo Micropigmentación exclusive).
3. "russian lips" → "Excelente elección. Tratamiento de Russian Lips valor de 820000 COP ¿agendar valoración con el doctor?" — flow avanza de estado correctamente.
- **Escalation OK**: "hablar con Elkin" escalaron con reason "Cliente pide hablar con Elkin específicamente". "emergencia con botox" escalado con reason "Cliente menciona emergencia o reacción adversa".
- **Off-hours OK**: fuera de 9-19 Bogotá, responde con offHours message exacto.

### Tests y build final
- **Server tests**: **65/65 pasan** (antes 58; +7 tests nuevos incluidos los de escalation con custom rules Santa María).
- **Server build (tsc)**: OK.
- **Frontend build (next build)**: OK.
- **Smoke test**: 15/15 PASS.

## Lo que sigue (deuda técnica postergada por Alejandro)
- **Fase 3 (bugs TASK-022)**: worker CRM (`bookings.datetime` es `text` → comparación timestamp falla), webhook (`tenantId: "resolve-later"` literal), habilitar botones reply/takeover en `ConversationsInbox.tsx`, settings persistir en DB.
- **Fase 4 (cierre del loop)**: recordatorios inteligentes, pasarela Wompi, re-engagement, CRM cumpleaños.
- **Refinamientos menores**: formatPrice() aplicado a canned "precio" (hoy muestra "820000.00 COP" en lugar de "$820.000 COP"). Router más preciso para ciertos intents ("ubicacion" no mapea siempre a canned `ubicacion`). first_contact flow trigger bisa.

## Cómo levantar
```bash
docker compose -f /Users/alejandropena/Bookia/bookia-code/docker-compose.yml up -d
npm run dev --prefix /Users/alejandropena/Bookia/bookia-code
# → http://localhost:3001  DemoLive chat: probarísimo los flujos reales de Carlos
```

## Archivos modificados (12)
- `server/src/db/schema.ts` — +3 columnas en catalog_items
- `server/src/db/seed.ts` — bug fix + cities/image_keys + frases_caracteristicas
- `server/src/db/import-tenant.ts` — mapear nuevas columnas
- `server/src/db/tenant-config/santa-maria.json` — reescrito total
- `server/src/flows/santa-maria/catalog.ts` — reescrito total (+2 servicios)
- `server/src/flows/santa-maria/canned-responses.ts` — reescrito total (24 canned, +escalate_to)
- `server/src/flows/santa-maria/flows.ts` — reescrito total (textos exactos Carlos)
- `server/src/flows/engine.ts` — CatalogItem +campos opcionales
- `server/src/agent/orchestrator.ts` — SELECT trae cities/image_keys/promo_label, filtra catalog_list por city
- `server/src/api/dashboard.ts` — /api/catalog expone cities/image_keys/promo_label + filtro ?city
- `server/Dockerfile` — copia tenant-config/ al dist
- `server/drizzle/0009_add_catalog_cities_images.sql` — migración nueva