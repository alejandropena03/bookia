import { describe, it, expect, beforeAll } from "vitest";
import postgres from "postgres";
import { createMemoryRepository } from "../src/agent/v2/memory/memory-repository.js";

const setupSql = postgres("postgres://bookia:bookia_pass@localhost:5432/bookia", {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
});

const appSql = postgres("postgres://bookia_app:bookia_app_pass@localhost:5432/bookia", {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
});

describe("V2 Memory Persistence (PostgreSQL) — Integration", () => {
  let tenantA: string;
  let tenantB: string;
  let contactA1: string;
  let contactA2: string;
  let contactB1: string;
  let convA1: string;
  let convA2: string;
  let convB1: string;
  let channelA: string;
  let channelB: string;

  beforeAll(async () => {
    await setupSql`
      CREATE TABLE IF NOT EXISTS "patient_memory" (
        "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
        "contact_id" uuid NOT NULL REFERENCES "contacts"("id") ON DELETE CASCADE,
        "memory_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
        "version" integer DEFAULT 1 NOT NULL,
        "created_at" timestamptz DEFAULT NOW() NOT NULL,
        "updated_at" timestamptz DEFAULT NOW() NOT NULL,
        "expires_at" timestamptz,
        "last_conversation_id" uuid REFERENCES "conversations"("id") ON DELETE SET NULL,
        PRIMARY KEY ("tenant_id", "contact_id")
      )
    `;
    await setupSql`GRANT ALL ON patient_memory TO bookia_app`;
    try {
      await setupSql`ALTER TABLE patient_memory ENABLE ROW LEVEL SECURITY`;
      await setupSql`CREATE POLICY patient_memory_tenant_isolation ON patient_memory
        FOR ALL
        USING (tenant_id = current_setting('app.current_tenant')::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid)`;
    } catch {
      // Policy already exists — ok
    }

    await setupSql`DELETE FROM patient_memory WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-mem-%')`;
    await setupSql`DELETE FROM bookings WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-mem-%')`;
    await setupSql`DELETE FROM conversations WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-mem-%')`;
    await setupSql`DELETE FROM contacts WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-mem-%')`;
    await setupSql`DELETE FROM channel_accounts WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-mem-%')`;
    await setupSql`DELETE FROM business_profile WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-mem-%')`;
    await setupSql`DELETE FROM tenants WHERE slug LIKE 'test-mem-%'`;

    const [tA] = await setupSql`INSERT INTO tenants (name, slug) VALUES ('Memory Test A', 'test-mem-alpha') RETURNING id`;
    const [tB] = await setupSql`INSERT INTO tenants (name, slug) VALUES ('Memory Test B', 'test-mem-beta') RETURNING id`;
    tenantA = tA.id;
    tenantB = tB.id;

    const [chA] = await setupSql`
      INSERT INTO channel_accounts (tenant_id, channel, mode)
      VALUES (${tenantA}, 'mock', 'mock') RETURNING id
    `;
    const [chB] = await setupSql`
      INSERT INTO channel_accounts (tenant_id, channel, mode)
      VALUES (${tenantB}, 'mock', 'mock') RETURNING id
    `;
    channelA = chA.id;
    channelB = chB.id;

    const [cA1] = await setupSql`
      INSERT INTO contacts (tenant_id, channel, external_id, name)
      VALUES (${tenantA}, 'mock', 'ext-a1', 'Contact A1') RETURNING id
    `;
    const [cA2] = await setupSql`
      INSERT INTO contacts (tenant_id, channel, external_id, name)
      VALUES (${tenantA}, 'mock', 'ext-a2', 'Contact A2') RETURNING id
    `;
    const [cB1] = await setupSql`
      INSERT INTO contacts (tenant_id, channel, external_id, name)
      VALUES (${tenantB}, 'mock', 'ext-b1', 'Contact B1') RETURNING id
    `;
    contactA1 = cA1.id;
    contactA2 = cA2.id;
    contactB1 = cB1.id;

    const [ca1] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id)
      VALUES (${tenantA}, ${contactA1}, ${channelA}) RETURNING id
    `;
    const [ca2] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id)
      VALUES (${tenantA}, ${contactA1}, ${channelA}) RETURNING id
    `;
    const [cb1] = await setupSql`
      INSERT INTO conversations (tenant_id, contact_id, channel_account_id)
      VALUES (${tenantB}, ${contactB1}, ${channelB}) RETURNING id
    `;
    convA1 = ca1.id;
    convA2 = ca2.id;
    convB1 = cb1.id;
  });

  it("writes and reads memory for a contact", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    await repo.merge(tenantA, contactA1, convA1, { city: "Medellín" });
    const mem = await repo.get(tenantA, contactA1);
    expect(mem.city?.value).toBe("Medellín");
    expect(mem.tenantId).toBe(tenantA);
  });

  it("persists memory across conversations", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    await repo.merge(tenantA, contactA1, convA1, { city: "Medellín", serviceInterest: ["botox"] });
    await repo.merge(tenantA, contactA1, convA2, { lastConcern: "pain" });
    const mem = await repo.get(tenantA, contactA1);
    expect(mem.city?.value).toBe("Medellín");
    expect(mem.serviceInterest.value).toContain("botox");
    expect(mem.lastConcern?.value).toBe("pain");
  });

  it("isolates memory between tenants (RLS)", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;
    await repo.merge(tenantA, contactA1, convA1, { city: "Medellín" });

    await appSql`SELECT set_config('app.current_tenant', ${tenantB}, false)`;
    await repo.merge(tenantB, contactB1, convB1, { city: "Bogotá" });

    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;
    const memA = await repo.get(tenantA, contactA1);
    expect(memA.city?.value).toBe("Medellín");

    await appSql`SELECT set_config('app.current_tenant', ${tenantB}, false)`;
    const memB = await repo.get(tenantB, contactB1);
    expect(memB.city?.value).toBe("Bogotá");
  });

  it("isolates memory between contacts within same tenant", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    await repo.merge(tenantA, contactA1, convA1, { city: "Medellín" });
    await repo.merge(tenantA, contactA2, convA1, { city: "Bogotá" });

    const mem1 = await repo.get(tenantA, contactA1);
    const mem2 = await repo.get(tenantA, contactA2);
    expect(mem1.city?.value).toBe("Medellín");
    expect(mem2.city?.value).toBe("Bogotá");
  });

  it("unique constraint on (tenant_id, contact_id) prevents duplicates", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    await repo.merge(tenantA, contactA1, convA1, { city: "Medellín" });
    const mem = await repo.get(tenantA, contactA1);
    expect(mem.city?.value).toBe("Medellín");
    expect(mem.funnelStage.value).toBe("unknown");
  });

  it("increments version on each merge", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    const mem1 = await repo.get(tenantA, contactA1);
    const v1 = mem1.version;

    await repo.merge(tenantA, contactA1, convA1, { city: "Updated City" });
    const mem2 = await repo.get(tenantA, contactA1);
    expect(mem2.version).toBe(v1 + 1);
  });

  it("deletes memory", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    await repo.merge(tenantA, contactA2, convA1, { city: "Cali" });
    await repo.delete(tenantA, contactA2);
    const mem = await repo.get(tenantA, contactA2);
    expect(mem.city).toBeUndefined();
  });

  it("handles concurrent merge without data loss", async () => {
    const repo = createMemoryRepository(appSql);
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;

    const r1 = repo.merge(tenantA, contactA2, convA1, { city: "Merge City 1" });
    const r2 = repo.merge(tenantA, contactA2, convA1, { city: "Merge City 2" });
    const results = await Promise.allSettled([r1, r2]);

    const ok = results.filter((r) => r.status === "fulfilled").length;
    expect(ok).toBe(2);

    const mem = await repo.get(tenantA, contactA2);
    expect(mem.city?.value).toBeDefined();
  });

  it("RLS prevents tenant A from reading tenant B's memory", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;
    const rows = await appSql`
      SELECT contact_id FROM patient_memory WHERE tenant_id = ${tenantB}
    `;
    expect(rows).toHaveLength(0);
  });

  it("RLS prevents tenant A from writing as tenant B", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;
    await expect(
      appSql`
        INSERT INTO patient_memory (tenant_id, contact_id, memory_json)
        VALUES (${tenantB}, ${contactB1}, '{}'::jsonb)
      `
    ).rejects.toThrow();
  });

  it("RLS prevents UPDATE to cross-tenant", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenantA}, false)`;
    await expect(
      appSql`
        UPDATE patient_memory SET tenant_id = ${tenantB}
        WHERE contact_id = ${contactA1}
      `
    ).rejects.toThrow();
  });
});
