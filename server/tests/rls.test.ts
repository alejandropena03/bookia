import { describe, it, expect, beforeAll } from "vitest";
import postgres from "postgres";

// Setup connection: superuser — can bypass RLS for test data creation
const setupSql = postgres("postgres://bookia:bookia_pass@localhost:5432/bookia", {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
});

// App connection: limited role — subject to RLS (superuser bypasses RLS even with FORCE)
const appSql = postgres("postgres://bookia_app:bookia_app_pass@localhost:5432/bookia", {
  max: 1,
  idle_timeout: 5,
  connect_timeout: 5,
});

describe("RLS multi-tenant isolation", () => {
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    // Clean slate via superuser connection — only our test tenants
    await setupSql`DELETE FROM users WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM business_profile WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM catalog_items WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM flows WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM messages WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM conversations WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM contacts WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM channel_accounts WHERE tenant_id IN (SELECT id FROM tenants WHERE slug LIKE 'test-rls-%')`;
    await setupSql`DELETE FROM tenants WHERE slug LIKE 'test-rls-%'`;

    // Create 2 tenants (tenants has NO RLS)
    const [t1] = await setupSql`INSERT INTO tenants (name, slug) VALUES ('Test Tenant Alpha', 'test-rls-alpha') RETURNING id`;
    const [t2] = await setupSql`INSERT INTO tenants (name, slug) VALUES ('Test Tenant Beta', 'test-rls-beta') RETURNING id`;
    tenant1Id = t1.id;
    tenant2Id = t2.id;

    // Insert data for tenant 1
    await setupSql`SELECT set_config('app.current_tenant', ${tenant1Id}, true)`;
    await setupSql`INSERT INTO catalog_items (tenant_id, name, price, currency) VALUES (${tenant1Id}, 'Item A1', '100', 'COP')`;
    await setupSql`INSERT INTO catalog_items (tenant_id, name, price, currency) VALUES (${tenant1Id}, 'Item A2', '200', 'COP')`;

    // Insert data for tenant 2
    await setupSql`SELECT set_config('app.current_tenant', ${tenant2Id}, true)`;
    await setupSql`INSERT INTO catalog_items (tenant_id, name, price, currency) VALUES (${tenant2Id}, 'Item B1', '300', 'COP')`;
  });

  it("tenant 1 sees only its own catalog_items", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenant1Id}, false)`;
    const items = await appSql`SELECT name FROM catalog_items ORDER BY name`;
    expect(items).toHaveLength(2);
    expect(items.map((r: any) => r.name)).toEqual(["Item A1", "Item A2"]);
  });

  it("tenant 2 sees only its own catalog_items", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenant2Id}, false)`;
    const items = await appSql`SELECT name FROM catalog_items ORDER BY name`;
    expect(items).toHaveLength(1);
    expect(items.map((r: any) => r.name)).toEqual(["Item B1"]);
  });

  it("tenant 1 cannot INSERT with tenant 2's tenant_id", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenant1Id}, false)`;
    await expect(
      appSql`INSERT INTO catalog_items (tenant_id, name, price, currency) VALUES (${tenant2Id}, 'Should Fail', '999', 'COP')`
    ).rejects.toThrow();
  });

  it("tenant 1 cannot UPDATE a row to tenant 2's tenant_id", async () => {
    await appSql`SELECT set_config('app.current_tenant', ${tenant1Id}, false)`;
    // WITH CHECK catches the cross-tenant UPDATE: the row IS visible to
    // tenant 1 (USING policy passes) but changing tenant_id to tenant 2's
    // violates the WITH CHECK policy
    await expect(
      appSql`UPDATE catalog_items SET tenant_id = ${tenant2Id} WHERE name = 'Item A1'`
    ).rejects.toThrow();
  });

  it("non-matching GUC returns 0 rows (fail-safe)", async () => {
    await appSql`SELECT set_config('app.current_tenant', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', false)`;
    const items = await appSql`SELECT name FROM catalog_items`;
    expect(items).toHaveLength(0);
  });

  it("FORCE RLS is enabled on catalog_items", async () => {
    const [row] = await setupSql`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'catalog_items'`;
    expect(row.relrowsecurity).toBe(true);
    expect(row.relforcerowsecurity).toBe(true);
  });
});
