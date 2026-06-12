# Pendientes compartidos

Lista viva de pendientes que cualquiera de los dos agentes puede agregar/atender.

## Técnicos (afectan construcción)
- [x] Validar si **Agenda Pro** expone API para agendar. ✅ RESUELTO 2026-06-11: SÍ tiene API REST v3 pública/self-service (`connect.agendapro.com/v3`, Bearer auth). Crear cita (`POST /v3/bookings`), disponibilidad (`GET /v3/available_slots`), clientes y webhooks confirmados. Requiere plan Pro. Ver §5.5 del TDD.
- [ ] Validar con cuenta Pro real el **esquema exacto del body de `POST /v3/bookings`** y la lista completa de eventos de webhook de Agenda Pro (páginas de referencia son SPA, no legibles automáticamente). — owner: OpenCode/Alejandro cuando haya credenciales.
- [ ] **Prerrequisito onboarding:** cliente debe estar en **plan Pro de Agenda Pro** (la API solo está ahí). Plantearlo junto con tokens de Meta.
- [ ] Recibir la **plantilla de Carlos** llena para rellenar el "hueco" de hiperpersonalización (§3.bis del TDD).
- [ ] Decidir **modelo LLM final** tras el eval harness (TASK-008). No casarse con premium; probar DeepSeek/baratos.
- [ ] **Rotar el token de GitHub** embebido en el remote (riesgo de seguridad detectado 2026-06-11).
- [ ] Cifrado de credenciales en reposo (deuda para fase producción).
- [ ] **Deuda menor (TASK-002):** `flows.is_active` y `catalog_items.is_active` son `integer` (0/1); migrar a `boolean` cuando se toquen esas tablas en una tarea futura.
- [ ] **Integrar `SET app.current_tenant` en el middleware** de la app cuando haya endpoints autenticados (el RLS depende de que la app setee el GUC por request/transacción).
- [ ] **DEUDA CRÍTICA producción (TASK-007):** el middleware `resolveTenant` solo resuelve tenant si `DEV_AUTH=true`. En producción (`DEV_AUTH=false`) NO valida JWT real ni rechaza requests sin auth — deja pasar sin tenantId. Implementar validación real del JWT de Auth.js v5 (compartir AUTH_SECRET) y rechazar (401) si no hay sesión válida ANTES de exponer en producción.

## De negocio (no técnicos, contexto)
- [ ] Firmar NDA antes de conectar datos reales del cliente.
- [ ] Conseguir credenciales Meta (WhatsApp/Instagram) del cliente.
- [ ] Lista completa de servicios y precios de Santa María.
