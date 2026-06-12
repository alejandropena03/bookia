import { describe, it, expect, beforeAll } from "vitest";
import postgres from "postgres";
import { withTenant } from "../src/lib/tenant-db.js";
import { computeIntelligence } from "../src/metrics/intelligence.js";

const setupSql = postgres("postgres://bookia:bookia_pass@localhost:5432/bookia", {
  max: 1, idle_timeout: 5, connect_timeout: 5,
});

describe("Intelligence Metrics", () => {
  let tenantId: string;
  let contactId: string;
  let convId: string;
  let convWithBookingId: string;
  let catalogItemId: string;

  beforeAll(async () => {
    // Clean data
    await setupSql`DELETE FROM bookings`;
    await setupSql`DELETE FROM conversation_state`;
    await setupSql`DELETE FROM messages`;
    await setupSql`DELETE FROM conversations`;
    await setupSql`DELETE FROM contacts`;
    await setupSql`DELETE FROM channel_accounts`;
    await setupSql`DELETE FROM catalog_items`;
    await setupSql`DELETE FROM business_profile`;
    await setupSql`DELETE FROM users`;
    await setupSql`DELETE FROM flows`;
    await setupSql`DELETE FROM tenants`;

    // Create tenant
    const [t] = await setupSql`INSERT INTO tenants (name, slug) VALUES ('Test Intel', 'test-intel') RETURNING id`;
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
      VALUES (${tenantId}, 'mock', 'ext-intel-01', 'María López', '3001111111') RETURNING id
    `;
    contactId = contact.id;

    // Contact 2
    const [contact2] = await setupSql`
      INSERT INTO contacts (tenant_id, channel, external_id, name, phone)
      VALUES (${tenantId}, 'mock', 'ext-intel-02', 'Ana García', '3002222222') RETURNING id
    `;

    // Catalog items
    const [ci] = await setupSql`
      INSERT INTO catalog_items (tenant_id, name, price, currency, category)
      VALUES (${tenantId}, 'Depilación láser', '350000', 'COP', 'laser') RETURNING id
    `;
    catalogItemId = ci.id;

    await setupSql`
      INSERT INTO catalog_items (tenant_id, name, price, currency, category)
      VALUES (${tenantId}, 'Consulta dermatológica', '150000', 'COP', 'consulta')
    `;

    // Conversation 1: bot_active with conversation_state (pricing discussed, no booking)
    const [c1] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status, last_message_at)
      VALUES (${tenantId}, ${contact.id}, ${ca.id}, 'bot_active', NOW()) RETURNING id
    `;
    convId = c1.id;

    // Messages for conversation 1
    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c1.id}, 'inbound', 'contact', 'Hola, quiero saber cuánto cuesta la depilación', NOW())
    `;
    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c1.id}, 'outbound', 'bot', 'La depilación láser cuesta $350.000', NOW())
    `;

    // Conversation state for conversation 1
    await setupSql`
      INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots, created_at)
      VALUES (${tenantId}, ${c1.id}, 'agendamiento', 'precio', ${setupSql.json({ servicio: "Depilación láser" })}, NOW())
    `;

    // Conversation 2: has a booking (confirmed)
    const [c2] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id, status, last_message_at)
      VALUES (${tenantId}, ${contact2.id}, ${ca.id}, 'closed', NOW()) RETURNING id
    `;
    convWithBookingId = c2.id;

    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c2.id}, 'inbound', 'contact', 'Quiero agendar consulta dermatológica', NOW())
    `;
    await setupSql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, text, created_at)
      VALUES (${tenantId}, ${c2.id}, 'outbound', 'bot', 'Claro, tenemos disponible el martes', NOW())
    `;

    // Booking on conversation 2
    await setupSql`
      INSERT INTO bookings (tenant_id, conversation_id, contact_id, service_name, service_price, status, created_at)
      VALUES (${tenantId}, ${c2.id}, ${contact2.id}, 'Consulta dermatológica', '150000', 'confirmed', NOW())
    `;

    // Business profile
    await setupSql`
      INSERT INTO business_profile (tenant_id, persona, rules, hours)
      VALUES (${tenantId}, 'Centro de estética', '{}'::jsonb, '{}'::jsonb)
    `;
  });

  it("computes KPIs with revenue values", async () => {
    return withTenant(tenantId, async (sql) => {
      const result = await computeIntelligence(sql, tenantId);
      expect(result.kpis).toHaveLength(3);

      // Ingreso potencial: debería encontrar el servicio mencionado en slots (Depilación láser $350K)
      expect(result.kpis[0].title).toContain("Ingreso potencial");
      expect(result.kpis[0].value).toContain("$");

      // Citas agendadas: booking confirmed de $150K
      expect(result.kpis[1].title).toContain("Citas agendadas");
      // Dinero sobre la mesa
      expect(result.kpis[2].title).toContain("Dinero sobre la mesa");
    });
  });

  it("computes funnel with 5 stages", async () => {
    return withTenant(tenantId, async (sql) => {
      const result = await computeIntelligence(sql, tenantId);
      expect(result.funnel).toHaveLength(5);

      // Stage 1: mensajes recibidos >= conversations with inbound messages
      expect(result.funnel[0].count).toBeGreaterThanOrEqual(2);
      expect(result.funnel[0].label).toBe("Mensajes recibidos");

      // Stage 2: mostraron interés (conversations with >1 exchange)
      expect(result.funnel[1].count).toBeGreaterThanOrEqual(1);

      // Stage 3: pidieron precio (conversations with price keywords)
      expect(result.funnel[2].count).toBeGreaterThanOrEqual(1);

      // Stage 4: agendaron cita
      expect(result.funnel[3].count).toBeGreaterThanOrEqual(1);

      // Stage 5: confirmaron pago
      expect(result.funnel[4].count).toBeGreaterThanOrEqual(1);

      // Drop percentages
      result.funnel.forEach((step) => {
        expect(step).toHaveProperty("dropPercent");
        expect(step).toHaveProperty("count");
      });
    });
  });

  it("computes service demand from catalog_items", async () => {
    return withTenant(tenantId, async (sql) => {
      const result = await computeIntelligence(sql, tenantId);
      expect(result.services.length).toBeGreaterThanOrEqual(2);

      const depilacion = result.services.find((s) => s.name.includes("Depilación"));
      expect(depilacion).toBeDefined();
      if (depilacion) {
        expect(depilacion.price).toBe(350000);
        expect(depilacion.inquiries).toBeGreaterThanOrEqual(1);
      }

      const consulta = result.services.find((s) => s.name.includes("Consulta"));
      expect(consulta).toBeDefined();
      if (consulta) {
        expect(consulta.price).toBe(150000);
        expect(consulta.bookings).toBeGreaterThanOrEqual(1);
      }
    });
  });

  it("computes heatmap with 7 days × 7 hour slots", async () => {
    return withTenant(tenantId, async (sql) => {
      const result = await computeIntelligence(sql, tenantId);
      expect(result.heatmap).toHaveLength(49); // 7 × 7

      // All entries have valid intensity 0-4
      result.heatmap.forEach((slot) => {
        expect([0, 1, 2, 3, 4]).toContain(slot.intensity);
        expect(slot.count).toBeGreaterThanOrEqual(0);
      });

      // Should have some entries with count > 0 (we inserted messages today)
      const nonZero = result.heatmap.filter((s) => s.count > 0);
      expect(nonZero.length).toBeGreaterThan(0);
    });
  });

  it("computes ROI metrics", async () => {
    return withTenant(tenantId, async (sql) => {
      const result = await computeIntelligence(sql, tenantId);

      expect(result.roi).toHaveProperty("resolvedPercent");
      expect(result.roi).toHaveProperty("resolvedCount");
      expect(result.roi).toHaveProperty("hoursSaved");
      expect(result.roi).toHaveProperty("afterHoursMessages");
      expect(result.roi).toHaveProperty("estimatedValue");

      // Hours saved should be >= 0
      expect(result.roi.hoursSaved).toBeGreaterThanOrEqual(0);
      // Estimated value should be >= 0
      expect(result.roi.estimatedValue).toBeGreaterThanOrEqual(0);
    });
  });

  it("returns recent activity with last 6 conversations", async () => {
    return withTenant(tenantId, async (sql) => {
      const result = await computeIntelligence(sql, tenantId);
      expect(result.recent.length).toBeLessThanOrEqual(6);

      result.recent.forEach((item) => {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("contact");
        expect(item).toHaveProperty("avatar");
        expect(item).toHaveProperty("channel");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("summary");
        expect(item).toHaveProperty("time");
      });
    });
  });

  it("returns empty/zero data when DB has no data for a different tenant", async () => {
    // Create a clean tenant with no data
    const [emptyTenant] = await setupSql`
      INSERT INTO tenants (name, slug) VALUES ('Empty Intel', 'empty-intel') RETURNING id
    `;
    const emptyTenantId = emptyTenant.id;

    // Set GUC
    await setupSql`SELECT set_config('app.current_tenant', ${emptyTenantId}, true)`;
    // Need a channel_account for queries that join through conversations
    const [ca] = await setupSql`
      INSERT INTO channel_accounts (tenant_id, channel, mode, status)
      VALUES (${emptyTenantId}, 'mock', 'mock', 'connected') RETURNING id
    `;

    return withTenant(emptyTenantId, async (sql) => {
      const result = await computeIntelligence(sql, emptyTenantId);

      // KPIs should have 0 values
      expect(result.kpis).toHaveLength(3);
      expect(result.kpis[0].value).toBe("$0");

      // Funnel: all counts 0
      expect(result.funnel[0].count).toBe(0);
      expect(result.funnel[4].count).toBe(0);

      // Services: empty
      expect(result.services).toHaveLength(0);

      // Heatmap: all 0
      const allZero = result.heatmap.every((s) => s.count === 0);
      expect(allZero).toBe(true);

      // ROI: 0 values
      expect(result.roi.resolvedCount).toBe(0);
      expect(result.roi.resolvedPercent).toBe(0);

      // Recent: empty
      expect(result.recent).toHaveLength(0);
    });
  });
});
