---
task_id: TASK-021
status: PROPUESTA
owner: claude
created_by: alejandro (vía opencode)
priority: BAJA (post-aceptación del cliente)
---

## Contexto
Alejandro comenta: "esto ya sería para producción si nos acepta el cliente". No es para ahora, pero quiere dejar planteada la dirección.

## 1. Infraestructura objetivo
- **VPS:** AWS Lightsail (para el backend + frontend)
- **Dominio:** Cloudflare (ya tiene cuenta)
- **Email:** AWS SES para comunicaciones transaccionales
- **DB:** PostgreSQL en el mismo Lightsail o RDS si escala

## 2. Feature: Email transaccional via AWS SES
Agregar un `EmailChannel` que extienda `ChannelAdapter` (igual que MockAdapter):
- Envío de confirmaciones de booking por correo
- Recordatorios de cita (hoy solo van por chat)
- Facturas / comprobantes de pago
- Post-servicio: link de reseña

**Integración:** el worker de reminders y CRM ya existen — solo agregar un `email` provider paralelo al pipeline.

## 3. Pregunta abierta
¿Usar el mismo worker pipeline (sendMessage → channel adapter) como ya existe para WhatsApp/Messenger? O ¿lista separada de emails con SendGrid/SES SDK directo?

## Nota
Esto NO es urgente. Solo dejar planteado para cuando el cliente piloto dé luz verde.
