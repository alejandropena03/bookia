import postgres from "postgres";
import { eventBus } from "../lib/event-bus.js";
import { withTenant } from "../lib/tenant-db.js";

export interface CrmResult {
  postService: number;
  repurchase: number;
  errors: string[];
}

export async function runCrm(sql: postgres.Sql): Promise<CrmResult> {
  const result: CrmResult = { postService: 0, repurchase: 0, errors: [] };

  // ── Post-servicio: 7 días después del booking ──
  const postServiceEligible = await sql`
    SELECT b.id, b.tenant_id, b.conversation_id, b.contact_id, b.service_name, b.datetime,
           co.name AS contact_name, t.slug AS tenant_slug, bp.google_maps_url
    FROM bookings b
    JOIN contacts co ON co.id = b.contact_id
    JOIN tenants t ON t.id = b.tenant_id
    LEFT JOIN business_profile bp ON bp.tenant_id = b.tenant_id
    WHERE b.status = 'confirmed'
      AND b.post_service_sent_at IS NULL
      AND b.datetime >= NOW() - INTERVAL '8 days'
      AND b.datetime < NOW() - INTERVAL '6 days'
  `;

  for (const row of postServiceEligible) {
    try {
      const nombre = row.contact_name ?? "estimado cliente";
      const mapsUrl = row.google_maps_url ?? "nuestra página";
      const text = `¡Hola ${nombre}! 🌟 Esperamos que hayas disfrutado tu ${row.service_name}. ¿Cómo te fue? Si tienes un momento, nos encantaría tu reseña: ${mapsUrl}. ¡Gracias!`;

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
        await sqlCtx`UPDATE bookings SET post_service_sent_at = NOW() WHERE id = ${row.id}`;
      });
      result.postService++;
    } catch (err: any) {
      result.errors.push(`Post-service ${row.id}: ${err.message}`);
    }
  }

  // ── Recompra: 90 días sin booking ──
  const repurchaseEligible = await sql`
    SELECT co.id AS contact_id, co.name AS contact_name, co.tenant_id,
           b2.conversation_id, b2.service_name, t.slug AS tenant_slug
    FROM contacts co
    JOIN tenants t ON t.id = co.tenant_id
    JOIN LATERAL (
      SELECT b.conversation_id, b.service_name, b.created_at
      FROM bookings b
      WHERE b.contact_id = co.id AND b.status = 'confirmed'
      ORDER BY b.created_at DESC LIMIT 1
    ) b2 ON true
    WHERE co.repurchase_sent_at IS NULL
      AND b2.created_at >= NOW() - INTERVAL '95 days'
      AND b2.created_at < NOW() - INTERVAL '85 days'
  `;

  for (const row of repurchaseEligible) {
    try {
      const nombre = row.contact_name ?? "estimado cliente";
      const text = `¡Hola ${nombre}! Ya pasaron unos meses desde tu último tratamiento. ¿Te gustaría agendar una sesión de seguimiento? 😊`;

      await withTenant(row.tenant_id, async (sqlCtx) => {
        const [conv] = await sqlCtx`
          SELECT id FROM conversations WHERE contact_id = ${row.contact_id} ORDER BY created_at DESC LIMIT 1
        `;
        if (conv) {
          const [msg] = await sqlCtx`
            INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, content_type, text, created_at)
            VALUES (${row.tenant_id}, ${conv.id}, 'outbound', 'bot', 'text', ${text}, NOW())
            RETURNING id, created_at
          `;
          eventBus.emit(row.tenant_slug, {
            tenantId: row.tenant_id,
            conversationId: conv.id,
            message: { id: msg.id, direction: "outbound", senderType: "bot", text, createdAt: msg.created_at },
          });
        }
        await sqlCtx`UPDATE contacts SET repurchase_sent_at = NOW() WHERE id = ${row.contact_id}`;
      });
      result.repurchase++;
    } catch (err: any) {
      result.errors.push(`Repurchase ${row.contact_id}: ${err.message}`);
    }
  }

  return result;
}
