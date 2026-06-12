---
task_id: TASK-016
status: PROPUESTA
owner: claude
created_by: opencode
priority: MEDIA
created_at: 2026-06-12T23:45:00Z
---

## Propuesta: 4 features para cerrar el loop de valor (post-TASK-015)

Contexto: TASK-015 completada (motor hiperpersonalización a la espera de plantilla de Carlos). Esto libera capacidad. Propongo 4 features ordenados por impacto × esfuerzo para hacer Bookia único y cerrar el ciclo de ingresos.

---

### 🥇 FEAT-A: Pasarela de pagos integrada (recomendado como próximo hito)

**Problema que resuelve:** El flow de agendamiento llega a "envía tu comprobante" y se frena — un humano debe verificar manualmente. Ese es el cuello de botella #1 de toda clínica.

**Solución:** Integrar Wompi (API REST colombiana, webhooks, acepta Nequi/transferencia/tarjeta).
1. Bot calcula monto exacto del servicio desde `catalog_items.price`
2. Crea link de pago vía `POST /v1/transactions`
3. Envía link al chat del cliente
4. Webhook `transaction.updated` con status `APPROVED` → bot continúa solo → booking `confirmed` automáticamente
5. Si rechazada → bot ofrece otro método o escalar

**Archivos a crear/modificar:**
- `booking/payment.ts` — `PaymentProvider` interface + `WompiProvider`
- `booking/types.ts` — extender `CreateBookingParams` con `paymentUrl`, `paymentStatus`
- `agent/orchestrator.ts` — hookear en etapa `payment_instructions`
- Endpoint `POST /webhooks/wompi` — recibir eventos
- Dashboard: nuevo KPI "recaudado vs agendado"

**Esfuerzo estimado:** 3-5 días
**Impacto:** 🔥🔥🔥🔥🔥 — cierra el loop completo. Dueño no toca una cuenta bancaria.

---

### 🥈 FEAT-B: Recordatorios inteligentes + reducción de no-shows

**Problema:** Clínicas pierden 20-30% de citas por no-show. El flow dice "te enviaremos un recordatorio" pero no hay worker.

**Solución:** Cron semilla o worker interno:
1. Worker diario: `SELECT * FROM bookings WHERE datetime BETWEEN NOW()+23h AND NOW()+25h AND status='confirmed'`
2. Bot envía al canal original: *"Hola {nombre}, recordamos tu cita de {servicio} mañana a las {hora} en {dirección}. ¿Confirmas?"*
3. Si responde "no" → bot ofrece reagendar ahí mismo → booking.status → `rescheduled`, dispara flujo agendamiento
4. Si no responde en 4h → escalar a humano para llamada

**Datos existentes usados:** `bookings`, `contacts.phone`, `messages` (canal original)
**No requiere nueva tabla.** Solo un worker + el pipeline del agente reutilizado.

**Esfuerzo estimado:** 1-2 días
**Impacto:** 🔥🔥🔥🔥 — impacto directo en revenue protegido

---

### 🥉 FEAT-C: Secuencia de re-engagement para leads perdidos

**Problema:** El dashboard identifica "dinero sobre la mesa" (leads que pidieron precio pero no agendaron) pero no se hace nada.

**Solución:** Worker diario + bot con secuencia programada:
1. Query: `conversation_state.current_state = 'precio'` SIN booking asociado
2. Día 1: *"¿Aún te interesa {servicio}? Podemos agendarte esta semana."*
3. Día 7: *"Tenemos disponibilidad especial para {servicio}..."*
4. Día 30: *"Actualizamos nuestro catálogo, ahora con nuevos precios..."*

**Datos:** `conversation_state.slots.servicio`, `catalog_items.price` (el monto de oportunidad)
**Basado en:** El KPI de "dinero sobre la mesa" que ya existe en el dashboard de inteligencia.

**Esfuerzo estimado:** 1 día
**Impacto:** 🔥🔥🔥 — recupera leads fríos sin costo de adquisición

---

### 🎁 FEAT-D: CRM de cumpleaños + post-servicio

**Problema:** Zero fidelización post-compra. Sin seguimiento emocional.

**Solución:** Worker diario + bot:
- **Post-servicio (7 días después):** `bookings WHERE status=confirmed AND datetime < NOW()-7d`
  - *"¿Cómo te fue con tu {servicio}? Nos encantaría tu reseña en Google Maps 🌟"*
- **Cumpleaños:** `contacts` (phone) sin fecha aún, pero se puede pedir en flujo first_contact o collect_data
  - *"Feliz cumpleaños {nombre}! 🎂 Te regalamos 15% en tu próxima consulta."*
- **Recompra (90 días):** `bookings WHERE datetime < NOW()-90d AND contact_id NOT IN (recent bookings)`
  - *"Ya pasaron 3 meses de tu último tratamiento. ¿Quieres agendar un retoque?"*

**Datos:** `contacts`, `bookings` (todo existe, solo falta la fecha de cumpleaños que se agrega en collect_data)

**Esfuerzo estimado:** 0.5 días
**Impacto:** 🔥🔥 — bajo esfuerzo, alto impacto emocional, diferenciador

---

### 📊 Resumen de la hoja de ruta propuesta

| Orden | Feature | Esfuerzo | Impacto | Dato clave |
|---|---|---|---|---|
| 1 | FEAT-A: Pasarela pagos | 3-5 días | 🔥🔥🔥🔥🔥 | Cierra el loop de ingresos |
| 2 | FEAT-B: Recordatorios | 1-2 días | 🔥🔥🔥🔥 | Reduce no-shows 20-30% |
| 3 | FEAT-C: Re-engagement | 1 día | 🔥🔥🔥 | Recupera leads sin costo |
| 4 | FEAT-D: CRM cumpleaños | 0.5 días | 🔥🔥 | Fidelización, bajo esfuerzo |

Todas son server-side (backend + workers). No tocan front ni landing. Reutilizan el 100% de los datos que ya capturamos en el schema actual.

**Pendiente para decisión:** ¿Arrancamos con FEAT-A (pagos) como próximo hito, o esperamos primero la plantilla de Carlos y hacemos ambas en paralelo?
