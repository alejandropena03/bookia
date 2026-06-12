import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eventBus } from "../lib/event-bus.js";
import { withTenant } from "../lib/tenant-db.js";
import { computeIntelligence } from "../metrics/intelligence.js";

const dashboard = new Hono();

function ctx(c: any) {
  return { tenantId: c.get("tenantId") as string, tenantSlug: c.get("tenantSlug") as string };
}

// ── GET /api/conversations ──
dashboard.get("/conversations", async (c) => {
  const { tenantId } = ctx(c);
  const status = c.req.query("status");
  const channel = c.req.query("channel");
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = 20;
  const offset = (page - 1) * limit;

  return withTenant(tenantId, async (sql) => {
    let where = sql`WHERE c.tenant_id = ${tenantId}`;
    if (status) where = sql`${where} AND c.status = ${status}`;
    if (channel) where = sql`${where} AND ca.channel = ${channel}`;

    const rows = await sql`
      SELECT
        c.id, c.status, c.created_at, c.last_message_at,
        ct.name AS contact_name, ct.phone AS contact_phone, ct.external_id,
        ca.channel,
        (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      JOIN channel_accounts ca ON ca.id = c.channel_account_id
      ${where}
      ORDER BY c.last_message_at DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM conversations c ${where}`;
    return c.json({ data: rows, page, limit, total: count });
  });
});

// ── GET /api/conversations/:id ──
dashboard.get("/conversations/:id", async (c) => {
  const { tenantId } = ctx(c);
  const convId = c.req.param("id");

  return withTenant(tenantId, async (sql) => {
    const [conv] = await sql`
      SELECT
        c.id, c.status, c.created_at, c.last_message_at, c.assigned_user_id,
        ct.id AS contact_id, ct.name AS contact_name, ct.phone AS contact_phone, ct.external_id,
        ca.channel
      FROM conversations c
      JOIN contacts ct ON ct.id = c.contact_id
      JOIN channel_accounts ca ON ca.id = c.channel_account_id
      WHERE c.id = ${convId} AND c.tenant_id = ${tenantId}
      LIMIT 1
    `;
    if (!conv) return c.json({ error: "Conversation not found" }, 404);

    const messages = await sql`
      SELECT id, direction, sender_type, text, created_at
      FROM messages
      WHERE conversation_id = ${convId} AND tenant_id = ${tenantId}
      ORDER BY created_at ASC
    `;

    return c.json({ conversation: conv, messages });
  });
});

// ── POST /api/conversations/:id/reply ──
dashboard.post(
  "/conversations/:id/reply",
  zValidator("json", z.object({ text: z.string().min(1) })),
  async (c) => {
    const { tenantId, tenantSlug } = ctx(c);
    const convId = c.req.param("id");
    const { text } = c.req.valid("json");

    return withTenant(tenantId, async (sql) => {
      const [conv] = await sql`
        SELECT id, status FROM conversations WHERE id = ${convId} AND tenant_id = ${tenantId} LIMIT 1
      `;
      if (!conv) return c.json({ error: "Conversation not found" }, 404);
      if (conv.status !== "human_active") {
        return c.json({ error: "Conversation is not in human_active state" }, 400);
      }

      const providerMsgId = `human_${crypto.randomUUID()}`;
      const [msg] = await sql`
        INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, text, created_at)
        VALUES (${tenantId}, ${convId}, 'outbound', 'human', ${providerMsgId}, 'text', ${text}, NOW())
        RETURNING id, created_at
      `;

      await sql`UPDATE conversations SET last_message_at = NOW() WHERE id = ${convId}`;

      eventBus.emit(tenantSlug, {
        tenantId,
        conversationId: convId,
        message: {
          id: msg.id,
          direction: "outbound",
          senderType: "human",
          text,
          createdAt: msg.created_at,
        },
      });

      return c.json({ messageId: msg.id }, 201);
    });
  }
);

// ── POST /api/conversations/:id/takeover ──
dashboard.post("/conversations/:id/takeover", async (c) => {
  const { tenantId } = ctx(c);
  const convId = c.req.param("id");

  return withTenant(tenantId, async (sql) => {
    const [conv] = await sql`
      SELECT id, status FROM conversations WHERE id = ${convId} AND tenant_id = ${tenantId} LIMIT 1
    `;
    if (!conv) return c.json({ error: "Conversation not found" }, 404);

    await sql`UPDATE conversations SET status = 'human_active', last_message_at = NOW() WHERE id = ${convId}`;
    return c.json({ status: "human_active" });
  });
});

// ── POST /api/conversations/:id/handback ──
dashboard.post("/conversations/:id/handback", async (c) => {
  const { tenantId } = ctx(c);
  const convId = c.req.param("id");

  return withTenant(tenantId, async (sql) => {
    const [conv] = await sql`
      SELECT id, status FROM conversations WHERE id = ${convId} AND tenant_id = ${tenantId} LIMIT 1
    `;
    if (!conv) return c.json({ error: "Conversation not found" }, 404);

    await sql`UPDATE conversations SET status = 'bot_active', assigned_user_id = NULL, last_message_at = NOW() WHERE id = ${convId}`;
    return c.json({ status: "bot_active" });
  });
});

// ── GET /api/metrics ──
dashboard.get("/metrics", async (c) => {
  const { tenantId } = ctx(c);
  const from = c.req.query("from") || "1970-01-01";
  const to = c.req.query("to") || "2099-12-31";

  return withTenant(tenantId, async (sql) => {
    const [totals] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId}) AS total_conversations,
        (SELECT COUNT(*)::int FROM messages WHERE tenant_id = ${tenantId} AND direction = 'inbound' AND created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp) AS inbound_messages,
        (SELECT COUNT(*)::int FROM messages WHERE tenant_id = ${tenantId} AND direction = 'outbound' AND created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp) AS outbound_messages,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND status = 'bot_active') AS bot_active,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND status = 'human_active') AS human_active,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND status = 'escalated') AS escalated,
        (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND status = 'closed') AS closed,
        (SELECT COUNT(*)::int FROM bookings WHERE tenant_id = ${tenantId}) AS total_bookings
    `;

    const byChannel = await sql`
      SELECT ca.channel, COUNT(*)::int AS count
      FROM conversations c
      JOIN channel_accounts ca ON ca.id = c.channel_account_id
      WHERE c.tenant_id = ${tenantId}
      GROUP BY ca.channel
    `;

    const dailyTrend = await sql`
      SELECT created_at::date AS date, COUNT(*)::int AS count
      FROM conversations
      WHERE tenant_id = ${tenantId} AND created_at >= ${from}::timestamp AND created_at <= ${to}::timestamp
      GROUP BY created_at::date
      ORDER BY date ASC
    `;

    return c.json({
      ...totals,
      by_channel: byChannel,
      daily_trend: dailyTrend,
    });
  });
});

// ── GET /api/metrics/intelligence ──
dashboard.get("/metrics/intelligence", async (c) => {
  const { tenantId } = ctx(c);
  return withTenant(tenantId, async (sql) => {
    const data = await computeIntelligence(sql, tenantId);
    return c.json({ ...data, _shape_doc: "DashboardData shape from server/src/metrics/intelligence.ts" });
  });
});

// ── GET /api/catalog ──
dashboard.get("/catalog", async (c) => {
  const { tenantId } = ctx(c);
  return withTenant(tenantId, async (sql) => {
    const items = await sql`
      SELECT id, name, description, price, currency, category, duration_minutes, is_active
      FROM catalog_items WHERE tenant_id = ${tenantId}
      ORDER BY category, name
    `;
    return c.json({ data: items });
  });
});

// ── GET /api/profile ──
dashboard.get("/profile", async (c) => {
  const { tenantId } = ctx(c);
  return withTenant(tenantId, async (sql) => {
    const [profile] = await sql`
      SELECT persona, rules, hours, booking_mode, system_prompt_overrides
      FROM business_profile WHERE tenant_id = ${tenantId}
      LIMIT 1
    `;
    if (!profile) return c.json({ error: "Profile not found" }, 404);
    return c.json(profile);
  });
});

// ── GET /api/flows ──
dashboard.get("/flows", async (c) => {
  const { tenantId } = ctx(c);
  return withTenant(tenantId, async (sql) => {
    const flows = await sql`
      SELECT key, name, definition, is_active, version
      FROM flows WHERE tenant_id = ${tenantId}
      ORDER BY key
    `;
    return c.json({ data: flows });
  });
});

export { dashboard };
