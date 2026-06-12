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

## De negocio (no técnicos, contexto)
- [ ] Firmar NDA antes de conectar datos reales del cliente.
- [ ] Conseguir credenciales Meta (WhatsApp/Instagram) del cliente.
- [ ] Lista completa de servicios y precios de Santa María.
