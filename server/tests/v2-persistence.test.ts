import { describe, it, expect, afterEach } from "vitest";
import postgres from "postgres";
import { processMessage } from "../src/agent/orchestrator.js";
import { withTenant } from "../src/lib/tenant-db.js";

const adminSql = postgres(
  "postgres://bookia:bookia_pass@localhost:5432/bookia",
  { max: 1, idle_timeout: 5, connect_timeout: 5 }
);

async function getTenantId(slug: string): Promise<string> {
  const [t] = await adminSql`SELECT id FROM tenants WHERE slug = ${slug}`;
  return t.id;
}

describe("A2 — V2 message persistence + SSE", () => {
  let tenantId: string;
  let contactId: string;
  let conversationId: string;
  let savedV2: string | undefined;

  afterEach(async () => {
    if (savedV2 !== undefined) process.env.AGENT_KERNEL_V2 = savedV2;
    else delete process.env.AGENT_KERNEL_V2;
    if (conversationId) {
      await adminSql`DELETE FROM messages WHERE conversation_id = ${conversationId}`;
      await adminSql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
      await adminSql`DELETE FROM conversations WHERE id = ${conversationId}`;
    }
    if (contactId) {
      await adminSql`DELETE FROM contacts WHERE id = ${contactId}`;
    }
  });

  it("V2 persists outbound message to DB with real messageId (not v2_ fake)", async () => {
    tenantId = await getTenantId("santa-maria");

    await withTenant(tenantId, async (sql) => {
      const [c] = await sql`
        INSERT INTO contacts (tenant_id, channel, external_id, name)
        VALUES (${tenantId}, 'mock', 'test-v2-persist', 'Test V2 Persist')
        RETURNING id
      `;
      contactId = c.id;
      const [conv] = await sql`
        INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status)
        SELECT ${tenantId}, ${contactId}, id, 'bot_active'
        FROM channel_accounts WHERE tenant_id = ${tenantId} AND channel = 'mock' LIMIT 1
        RETURNING id
      `;
      conversationId = conv.id;
    });

    savedV2 = process.env.AGENT_KERNEL_V2;
    process.env.AGENT_KERNEL_V2 = "true";

    const result = await processMessage({
      tenantId,
      tenantSlug: "santa-maria",
      conversationId,
      contactId,
      contactName: "Test V2 Persist",
      text: "Hola, buenos días",
    });

    expect(result.messageId).toBeTruthy();
    expect(result.messageId).not.toMatch(/^v2_/);
    expect(result.text).toBeTruthy();

    const msgs = await adminSql`
      SELECT direction, sender_type, text FROM messages
      WHERE conversation_id = ${conversationId} AND tenant_id = ${tenantId}
      AND direction = 'outbound' AND sender_type = 'bot'
    `;
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs.some((m: any) => m.text && m.text.length > 0)).toBe(true);
  });

  it("V2 emits SSE event via eventBus", async () => {
    tenantId = await getTenantId("santa-maria");
    const { eventBus } = await import("../src/lib/event-bus.js");

    await withTenant(tenantId, async (sql) => {
      const [c] = await sql`
        INSERT INTO contacts (tenant_id, channel, external_id, name)
        VALUES (${tenantId}, 'mock', 'test-v2-sse', 'Test V2 SSE')
        RETURNING id
      `;
      contactId = c.id;
      const [conv] = await sql`
        INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status)
        SELECT ${tenantId}, ${contactId}, id, 'bot_active'
        FROM channel_accounts WHERE tenant_id = ${tenantId} AND channel = 'mock' LIMIT 1
        RETURNING id
      `;
      conversationId = conv.id;
    });

    const received: any[] = [];
    const handler = (e: any) => {
      if (e.conversationId === conversationId) received.push(e);
    };
    const unsub = eventBus.onMessage("santa-maria", handler);

    savedV2 = process.env.AGENT_KERNEL_V2;
    process.env.AGENT_KERNEL_V2 = "true";

    await processMessage({
      tenantId,
      tenantSlug: "santa-maria",
      conversationId,
      contactId,
      contactName: "Test V2 SSE",
      text: "Hola",
    });

    unsub();

    expect(received.length).toBeGreaterThan(0);
    const outboundEvents = received.filter(
      (e) => e.message?.direction === "outbound"
    );
    expect(outboundEvents.length).toBeGreaterThan(0);
  });
});
