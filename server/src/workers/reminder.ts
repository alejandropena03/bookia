import postgres from "postgres";
import { eventBus } from "../lib/event-bus.js";
import { withTenant } from "../lib/tenant-db.js";

export interface ReminderResult {
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}

async function sendReminderMessage(
  sql: postgres.Sql,
  booking: any,
  tenantSlug: string,
  tenantId: string
): Promise<boolean> {
  const [conv] = await sql`
    SELECT contact_id, channel_account_id FROM conversations WHERE id = ${booking.conversation_id} LIMIT 1
  `;
  if (!conv) return false;

  const [contact] = await sql`
    SELECT name FROM contacts WHERE id = ${conv.contact_id} LIMIT 1
  `;
  const name = contact?.name ?? "estimado cliente";

  const bookingDate = booking.datetime ? new Date(booking.datetime) : null;
  const hour = bookingDate
    ? bookingDate.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "la hora acordada";

  const text = `¡Hola ${name}! 🌟 Te recordamos tu cita de ${booking.service_name} mañana a las ${hour}. ¿Confirmas tu asistencia? Responde SÍ para confirmar o NO si necesitas reagendar.`;

  const [msg] = await sql`
    INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, content_type, text, created_at)
    VALUES (${tenantId}, ${booking.conversation_id}, 'outbound', 'bot', 'text', ${text}, NOW())
    RETURNING id, created_at
  `;

  eventBus.emit(tenantSlug, {
    tenantId,
    conversationId: booking.conversation_id,
    message: {
      id: msg.id,
      direction: "outbound",
      senderType: "bot",
      text,
      createdAt: msg.created_at,
    },
  });

  await sql`
    UPDATE bookings SET reminder_sent_at = NOW(), reminder_status = 'sent'
    WHERE id = ${booking.id}
  `;

  return true;
}

export async function runReminders(sql: postgres.Sql): Promise<ReminderResult> {
  const result: ReminderResult = { processed: 0, sent: 0, skipped: 0, errors: [] };

  const now = new Date();
  const future24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const future26h = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  const eligible = await sql`
    SELECT b.id, b.tenant_id, b.conversation_id, b.contact_id, b.service_name, b.datetime,
           t.slug AS tenant_slug
    FROM bookings b
    JOIN tenants t ON t.id = b.tenant_id
    WHERE b.status IN ('confirmed', 'scheduled')
      AND b.reminder_status = 'none'
      AND b.datetime >= ${future24h.toISOString()}
      AND b.datetime < ${future26h.toISOString()}
  `;

  result.processed = eligible.length;

  for (const booking of eligible) {
    try {
      await withTenant(booking.tenant_id, async (sqlCtx) => {
        const ok = await sendReminderMessage(sqlCtx, booking, booking.tenant_slug, booking.tenant_id);
        if (ok) result.sent++;
        else result.skipped++;
      });
    } catch (err: any) {
      result.errors.push(`Booking ${booking.id}: ${err.message}`);
      result.skipped++;
    }
  }

  return result;
}
