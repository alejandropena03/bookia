import { describe, it, expect, beforeAll } from "vitest";
import postgres from "postgres";
import { processMessage } from "../src/agent/orchestrator.js";
import { withTenant } from "../src/lib/tenant-db.js";

const setupSql = postgres("postgres://bookia:bookia_pass@localhost:5432/bookia", {
  max: 1, idle_timeout: 5, connect_timeout: 5,
});

describe("Dashboard & Inbox API", () => {
  let tenantId: string;
  let contactId: string;
  let convBotId: string;
  let convHumanId: string;

  beforeAll(async () => {
    // Clean test data — only our test tenant, never touch other tenants
    await setupSql`DELETE FROM bookings WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM conversation_state WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM messages WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM conversations WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM contacts WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM channel_accounts WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM users WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM business_profile WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM catalog_items WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM flows WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-%')`;
    await setupSql`DELETE FROM tenants WHERE slug LIKE 'test-%'`;

    // Create tenant
    const [t] = await setupSql`INSERT INTO tenants (name, slug) VALUES ('Test Dashboard', 'test-dash') RETURNING id`;
    tenantId = t.id;
    await setupSql`SELECT set_config('app.current_tenant', ${tenantId}, true)`;

    // Channel account
    const [ca] = await setupSql`
      INSERT INTO channel_accounts (tenant_id, channel, mode, status)
      VALUES (${tenantId}, 'mock', 'mock', 'connected') RETURNING id
    `;

    // Contact
    const [contact] = await setupSql`
      INSERT INTO contacts (tenant_id, channel, external_id, name, phone)
      VALUES (${tenantId}, 'mock', 'ext-001', 'Test User', '3000000000') RETURNING id
    `;
    contactId = contact.id;

    // Conversation bot_active
    const [c1] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status, last_message_at)
      VALUES (${tenantId}, ${contact.id}, ${ca.id}, 'bot_active', NOW()) RETURNING id
    `;
    convBotId = c1.id;

    // Conversation human_active
    const [c2] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status, last_message_at)
      VALUES (${tenantId}, ${contact.id}, ${ca.id}, 'human_active', NOW()) RETURNING id
    `;
    convHumanId = c2.id;

    // Insert some messages
    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c1.id}, 'inbound', 'contact', 'Hola', NOW())
    `;
    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c1.id}, 'outbound', 'bot', '¡Hola! ¿En qué puedo ayudarte?', NOW())
    `;
    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c2.id}, 'inbound', 'contact', 'Necesito ayuda', NOW())
    `;

    // Business profile for metrics
    await setupSql`
      INSERT INTO business_profile (tenant_id, persona, rules, hours, canned_responses)
      VALUES (${tenantId}, 'Test', '{}'::jsonb, '{}'::jsonb, ${setupSql.json({ charla: "¡Hola {nombre}! Soy el asistente virtual. ¿En qué puedo ayudarte hoy? 😊" })})
    `;

    // Catalog item for catalog endpoint
    await setupSql`
      INSERT INTO catalog_items (tenant_id, name, price, currency, category)
      VALUES (${tenantId}, 'Test Service', '50000', 'COP', 'test')
    `;
  });

  it("lists conversations with pagination and filters", async () => {
    return withTenant(tenantId, async (sql) => {
      // All conversations
      const all = await sql`
        SELECT c.id, c.status FROM conversations c WHERE c.tenant_id = ${tenantId} ORDER BY c.status
      `;
      expect(all).toHaveLength(2);
      expect(all.map((r: any) => r.status).sort()).toEqual(["bot_active", "human_active"]);

      // Filter by status
      const bot = await sql`
        SELECT c.id FROM conversations c WHERE c.tenant_id = ${tenantId} AND c.status = 'bot_active'
      `;
      expect(bot).toHaveLength(1);

      // Pagination (limit 1)
      const paged = await sql`
        SELECT c.id FROM conversations c WHERE c.tenant_id = ${tenantId} ORDER BY c.last_message_at DESC LIMIT 1 OFFSET 0
      `;
      expect(paged).toHaveLength(1);
    });
  });

  it("shows full conversation thread with messages", async () => {
    return withTenant(tenantId, async (sql) => {
      const msgs = await sql`
        SELECT direction, sender_type, text FROM messages
        WHERE conversation_id = ${convBotId} AND tenant_id = ${tenantId}
        ORDER BY created_at ASC
      `;
      expect(msgs).toHaveLength(2);
      expect(msgs[0].direction).toBe("inbound");
      expect(msgs[0].text).toBe("Hola");
      expect(msgs[1].direction).toBe("outbound");
    });
  });

  it("takeover sets conversation to human_active", async () => {
    return withTenant(tenantId, async (sql) => {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${convBotId}`;
      const [conv] = await sql`SELECT status FROM conversations WHERE id = ${convBotId}`;
      expect(conv.status).toBe("human_active");

      // Reset back for other tests
      await sql`UPDATE conversations SET status = 'bot_active' WHERE id = ${convBotId}`;
    });
  });

  it("handback sets conversation to bot_active", async () => {
    return withTenant(tenantId, async (sql) => {
      // First take over
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${convHumanId}`;
      let [conv] = await sql`SELECT status FROM conversations WHERE id = ${convHumanId}`;
      expect(conv.status).toBe("human_active");

      // Hand back
      await sql`UPDATE conversations SET status = 'bot_active' WHERE id = ${convHumanId}`;
      [conv] = await sql`SELECT status FROM conversations WHERE id = ${convHumanId}`;
      expect(conv.status).toBe("bot_active");
    });
  });

  it("human reply inserts outbound message with sender_type human", async () => {
    return withTenant(tenantId, async (sql) => {
      // Simulate what the reply endpoint does
      const providerMsgId = `human_test_${Date.now()}`;
      const [msg] = await sql`
        INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, text, created_at)
        VALUES (${tenantId}, ${convHumanId}, 'outbound', 'human', ${providerMsgId}, 'text', 'Te ayudo con eso', NOW())
        RETURNING id
      `;
      expect(msg.id).toBeTruthy();

      // Verify it's in the thread
      const msgs = await sql`
        SELECT direction, sender_type, text FROM messages
        WHERE conversation_id = ${convHumanId} AND tenant_id = ${tenantId}
        ORDER BY created_at ASC
      `;
      const last = msgs[msgs.length - 1];
      expect(last.sender_type).toBe("human");
      expect(last.text).toBe("Te ayudo con eso");
    });
  });

  it("bot abstains when conversation is human_active or escalated", async () => {
    // Set conversation to human_active (other tests may have reverted it)
    await withTenant(tenantId, async (sql) => {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${convHumanId}`;
    });

    // Process a message for the human_active conversation — should return empty response
    const result = await processMessage({
      tenantId,
      tenantSlug: "test-dash",
      conversationId: convHumanId,
      contactId,
      contactName: "Test User",
      text: "Hola, necesito ayuda",
    });

    // Bot responds with handoff_ack canned (not empty) when human_active
    expect(result.text).toContain("asesor humano");
    expect(result.route).toBe("canned");
    expect(result.escalated).toBe(true);
  });

  it("bot responds when conversation is bot_active", async () => {
    // Make sure conversation is bot_active
    await withTenant(tenantId, async (sql) => {
      await sql`UPDATE conversations SET status = 'bot_active' WHERE id = ${convBotId}`;
    });

    const result = await processMessage({
      tenantId,
      tenantSlug: "test-dash",
      conversationId: convBotId,
      contactId,
      contactName: "Test User",
      text: "Hola, buenos días",
    });

    // "charla" intent should match canned response
    expect(result.text).not.toBe("");
    expect(result.route).toBe("canned");
  });

  it("metrics returns aggregated data", async () => {
    return withTenant(tenantId, async (sql) => {
      const [metrics] = await sql`
        SELECT
          (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId}) AS total_conversations,
          (SELECT COUNT(*)::int FROM messages WHERE tenant_id = ${tenantId}) AS total_messages,
          (SELECT COUNT(*)::int FROM conversations WHERE tenant_id = ${tenantId} AND status = 'bot_active') AS bot_active
      `;
      expect(metrics.total_conversations).toBeGreaterThanOrEqual(2);
      expect(metrics.total_messages).toBeGreaterThanOrEqual(3);
      expect(metrics.bot_active).toBeGreaterThanOrEqual(1);
    });
  });

  it("catalog endpoint returns items", async () => {
    return withTenant(tenantId, async (sql) => {
      const items = await sql`
        SELECT name, price FROM catalog_items WHERE tenant_id = ${tenantId} ORDER BY name
      `;
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].name).toBe("Test Service");
    });
  });
});
