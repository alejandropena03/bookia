---
title: Pendientes Abiertos
collection: f8db5a5c-53ed-406a-9a8d-4e6de6d0c487
---

# Pendientes Abiertos

**Ultima actualizacion:** 2026-06-15

---

## Prioridad alta (urgente)

| # | Pendiente | Responsable | Estado | Detalle |
|---|-----------|-------------|--------|---------|
| 1 | **Credenciales Meta** (WhatsApp/Instagram) | Carlos | 🔴 Pendiente | Necesario para conectar canales reales |
| 2 | **API key Agenda Pro** | Cliente | 🔴 Pendiente | Requiere plan Pro de Agenda Pro |
| 3 | **Plantilla de flujos de Carlos** | Carlos | 🔴 Pendiente | Para rellenar hiperpersonalizacion via import-tenant |
| 4 | **Fix bug CRM worker** | OpenCode/Claude | 🟠 En cola | Text vs timestamp comparison en bookings.datetime |
| 5 | **Auditoria Claude (TASK-022)** | Claude | 🟡 Esperando | 5 preguntas en .bridge/queue/TASK-022-auditoria-mvp.md |

## Prioridad media

| # | Pendiente | Responsable | Estado | Detalle |
|---|-----------|-------------|--------|---------|
| 6 | **Fix volumen Postgres persistente** | OpenCode | 🟠 En cola | Datos se pierden al rebuild Docker |
| 7 | **Habilitar botones reply/takeover/handback** | OpenCode/Claude | 🟠 En cola | APIs funcionan, UI los tiene disabled |
| 8 | **JWT Auth real** | OpenCode/Claude | 🟡 Post-MVP | Auth.js v5 con validacion JWT |
| 9 | **Settings guardar cambios** | OpenCode/Claude | 🟡 Post-MVP | Formularios solo lectura, no persisten |
| 10 | **Pagina /agenda** | OpenCode/Claude | 🟡 Por definir | Placeholder "Próximamente" — definir contenido |
| 11 | **Pagina /analytics** | OpenCode/Claude | 🟡 Por definir | Placeholder "Próximamente" — definir contenido |
| 12 | **Fix webhooks tenant resolve** | OpenCode/Claude | 🟡 Post-MVP | POST /webhooks/:channel no resuelve tenant |
| 13 | **Firmar NDA** | Carlos | 🔴 Pendiente | Antes de conectar datos reales |
| 14 | **Configurar dominio usebookia.com** | Alejandro | 🔴 Pendiente | Cloudflare + tunnel |
| 15 | **Presentacion al cliente** | Carlos | 🟡 En progreso | Preparar pitch con datos reales del piloto |

## Dependencias del cliente

| # | Item | Bloquea | Estado |
|---|------|---------|--------|
| A | Credenciales Meta (WhatsApp Business) | Canales reales | 🔴 Pendiente |
| B | API key Agenda Pro | Agendamiento nativo | 🔴 Pendiente |
| C | Plan Pro de Agenda Pro | API access | 🔴 Pendiente |
| D | Lista de servicios + precios | Catalogo real | 🟡 Parcial (placeholder en seed) |
| E | Google Maps URL del negocio | Reseñas post-servicio | 🔴 Pendiente |

## Dependencias internas

| # | Item | Bloquea | Estado |
|---|------|---------|--------|
| F | Plantilla de flujos (Carlos) | Hiperpersonalizacion | 🔴 Pendiente |
| G | Juan Pablo define participacion | Marca Bukia/Bookia | 🔴 Pendiente |
| H | Costos operativos (10k, 100k msgs) | Pricing final | 🔴 Pendiente |

---

## Riesgos detectados

- Acceso a developers.facebook.com requiere permisos del dueno
- Agenda Pro API solo en plan Pro (cliente debe actualizar)
- TikTok API es nueva y menos estable (post-MVP)
- Volumen Postgres no persistente (riesgo de perder datos en dev)
- JWT Auth no implementado (seguridad en produccion)
- Si Juan Pablo no se compromete, perderian marca Bukia
- El tio aceptara el precio de ~3.5M COP/mes?

---

## Criterios de listo para produccion

- [ ] Credenciales Meta conectadas
- [ ] API key Agenda Pro funcionando
- [ ] Plantilla de flujos importada
- [ ] JWT Auth implementado
- [ ] Volumen Postgres persistente
- [ ] Wompi configurado (opcional)
- [ ] NDA firmado
- [ ] Dominio configurado
- [ ] Tests E2E pasando
- [ ] Monitoreo (Sentry/PostHog) activo

---

## Notas

- El MVP es funcional con datos simulados. El cliente puede ver el producto funcionando antes de comprar.
- El modelo de venta es "producto terminado esperando credenciales".
- Los workers de recordatorios, re-engagement y CRM están listos pero no se ejecutan automáticamente (requieren cron externo o ejecución manual).
- El dashboard de inteligencia ya muestra datos reales calculados desde la DB.
