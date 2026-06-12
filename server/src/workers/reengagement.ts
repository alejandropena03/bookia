import postgres from "postgres";
import { eventBus } from "../lib/event-bus.js";
import { withTenant } from "../lib/tenant-db.js";

const REENGAGEMENT_MESSAGES: Record<number, string> = {
  1: "¡Hola {nombre}! ¿Aún te interesa {servicio}? Tenemos disponibilidad esta semana. 😊",
  7: "¡Hola {nombre}! Solo queríamos saber si resolviste tu consulta sobre {servicio}. ¡Aquí estamos!",
  30: "¡Hola {nombre}! Actualizamos nuestros servicios. ¿Te gustaría conocer las novedades?",
};

export interface ReengagementResult {
  processed: number;
  sent: number;
  errors: string[];
}

export async function runReengagement(sql: postgres.Sql): Promise<ReengagementResult> {
  const result: ReengagementResult = { processed: 0, sent: 0, errors: [] };

  const eligible = await sql`
    SELECT cs.id, cs.tenant_id, cs.conversation_id, cs.slots, cs.reengagement_step, cs.updated_at,
           co.name AS contact_name, t.slug AS tenant_slug
    FROM conversation_state cs
    JOIN conversations c ON c.id = cs.conversation_id
    JOIN contacts co ON co.id = c.contact_id
    JOIN tenants t ON t.id = cs.tenant_id
    WHERE cs.current_state = 'precio'
      AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.conversation_id = cs.conversation_id)
  `;
  result.processed = eligible.length;

  for (const row of eligible) {
    try {
      const step = row.reengagement_step ?? 0;
      const targetDays = [1, 7, 30];
      const nextIndex = targetDays.findIndex((d) => d > step);
      const nextDay = nextIndex >= 0 ? targetDays[nextIndex] : null;

      if (!nextDay) continue; // All steps done

      // Verify enough days have passed since last reengagement (or since conversation updated_at for step 0)
      const referenceDate = step === 0 ? row.updated_at : row.last_reengagement_at ?? row.updated_at;
      const daysSince = referenceDate
        ? Math.floor((Date.now() - new Date(referenceDate).getTime()) / (24 * 60 * 60 * 1000))
        : 999;
      if (daysSince < nextDay - 1) continue; // Not enough days yet

      const tmpl = REENGAGEMENT_MESSAGES[nextDay];
      if (!tmpl) continue;

      const nombre = row.contact_name ?? "estimado cliente";
      const slots = row.slots as Record<string, string> || {};
      const servicio = slots.servicio ?? "nuestros servicios";

      const text = tmpl.replace("{nombre}", nombre).replace("{servicio}", servicio);

      await withTenant(row.tenant_id, async (sqlCtx) => {
        const [msg] = await sqlCtx`
          INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, content_type, text, created_at)
          VALUES (${row.tenant_id}, ${row.conversation_id}, 'outbound', 'bot', 'text', ${text}, NOW())
          RETURNING id, created_at
        `;

        eventBus.emit(row.tenant_slug, {
          tenantId: row.tenant_id,
          conversationId: row.conversation_id,
          message: { id: msg.id, direction: "outbound", senderType: "bot", text, createdAt: msg.created_at },
        });

        await sqlCtx`
          UPDATE conversation_state SET reengagement_step = ${nextDay}, last_reengagement_at = NOW(), updated_at = NOW()
          WHERE id = ${row.id}
        `;
      });

      result.sent++;
    } catch (err: any) {
      result.errors.push(`Row ${row.id}: ${err.message}`);
    }
  }

  return result;
}
