import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { eventBus } from "../lib/event-bus.js";
import { withTenant } from "../lib/tenant-db.js";
import { NormalizedInboundMessage } from "../channels/types.js";

export async function ingestInbound(normalized: NormalizedInboundMessage) {
  const { tenantId, channel, contact: contactData, content, providerMessageId } = normalized;
  const now = new Date();

  return withTenant(tenantId, async (sql) => {
    // Upsert contact (unique on tenant_id + channel + external_id)
    const [contact] = await sql`
      INSERT INTO contacts (tenant_id, channel, external_id, name, phone)
      VALUES (${tenantId}, ${channel}, ${contactData.externalId}, ${contactData.name ?? null}, ${contactData.phone ?? null})
      ON CONFLICT (tenant_id, channel, external_id)
      DO UPDATE SET name = COALESCE(EXCLUDED.name, contacts.name), phone = COALESCE(EXCLUDED.phone, contacts.phone)
      RETURNING id
    `;

    // Find or create conversation
    let [conv] = await sql`
      SELECT id FROM conversations
      WHERE tenant_id = ${tenantId} AND contact_id = ${contact.id} AND status != 'closed'
      ORDER BY created_at DESC LIMIT 1
    `;
    if (!conv) {
      const [ca] = await sql`
        SELECT id FROM channel_accounts WHERE tenant_id = ${tenantId} AND channel = ${channel} AND mode = 'mock' LIMIT 1
      `;
      [conv] = await sql`
        INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status, reply_window_expires_at, last_message_at)
        VALUES (${tenantId}, ${contact.id}, ${ca.id}, 'bot_active', ${normalized.replyWindowExpiresAt ?? null}, ${now})
        RETURNING id
      `;
    } else {
      await sql`UPDATE conversations SET last_message_at = ${now} WHERE id = ${conv.id}`;
    }

    // Idempotent message insert
    const [msg] = await sql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, text, raw, created_at)
      VALUES (${tenantId}, ${conv.id}, 'inbound', 'contact', ${providerMessageId}, ${content.type}, ${content.text ?? null}, ${content.raw ? JSON.stringify(content.raw) : null}, ${now})
      ON CONFLICT (tenant_id, provider_message_id) DO NOTHING
      RETURNING id, created_at
    `;
    if (!msg) {
      return { duplicated: true, conversationId: conv.id };
    }

    // Emit SSE event
    const [tenantRow] = await db.select({ slug: tenants.slug }).from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (tenantRow) {
      eventBus.emit(tenantRow.slug, {
        tenantId,
        conversationId: conv.id,
        message: {
          id: msg.id,
          direction: "inbound",
          senderType: "contact",
          text: content.text ?? null,
          createdAt: msg.created_at,
        },
      });
    }

    return { duplicated: false, conversationId: conv.id, messageId: msg.id, contactId: contact.id };
  });
}
