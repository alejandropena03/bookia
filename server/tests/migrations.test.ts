import { describe, it, expect } from "vitest";
import postgres from "postgres";

const sql = postgres(
  "postgres://bookia:bookia_pass@localhost:5432/bookia",
  { max: 1, idle_timeout: 5, connect_timeout: 5 }
);

const EXPECTED_TABLES = [
  "tenants",
  "channel_accounts",
  "contacts",
  "users",
  "conversations",
  "conversation_state",
  "messages",
  "flows",
  "catalog_items",
  "business_profile",
  "worker_logs",
  "patient_memory",
  "bookings",
];

// Tables that must have RLS enabled (tenant-scoped business tables)
const RLS_TABLES = [
  "channel_accounts",
  "contacts",
  "users",
  "conversations",
  "conversation_state",
  "messages",
  "flows",
  "catalog_items",
  "business_profile",
  "patient_memory",
  "bookings",
];

describe("Migrations — schema state", () => {
  it("has the bookia_migrations control table", async () => {
    const rows = await sql`
      SELECT count(*)::int AS n FROM information_schema.tables
      WHERE table_name = 'bookia_migrations'
    `;
    expect(rows[0].n).toBe(1);
  });

  it("has all 12 migration files registered", async () => {
    const rows = await sql`SELECT count(*)::int AS n FROM bookia_migrations`;
    expect(rows[0].n).toBeGreaterThanOrEqual(12);
  });

  it("has all 13 critical tables", async () => {
    const rows = await sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename = ANY(${EXPECTED_TABLES})
    `;
    const found = rows.map((r) => r.tablename).sort();
    expect(found).toEqual([...EXPECTED_TABLES].sort());
  });

  it("has RLS enabled on tenant-scoped tables", async () => {
    const rows = await sql`
      SELECT relname, relrowsecurity AS rls, relforcerowsecurity AS force_rls
      FROM pg_class
      WHERE relname = ANY(${RLS_TABLES}) AND relnamespace = 'public'::regnamespace
    `;
    expect(rows.length).toBe(RLS_TABLES.length);
    for (const row of rows) {
      expect(row.rls, `${row.relname} should have RLS enabled`).toBe(true);
      expect(row.force_rls, `${row.relname} should have FORCE RLS`).toBe(true);
    }
  });

  it("has the bookia_app role", async () => {
    const rows = await sql`
      SELECT count(*)::int AS n FROM pg_roles WHERE rolname = 'bookia_app'
    `;
    expect(rows[0].n).toBe(1);
  });

  it("bookings.datetime column exists (even if text type — known smell)", async () => {
    const rows = await sql`
      SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_name = 'bookings' AND column_name = 'datetime'
    `;
    expect(rows[0].n).toBe(1);
  });

  it("patient_memory has version column for optimistic concurrency", async () => {
    const rows = await sql`
      SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_name = 'patient_memory' AND column_name = 'version'
    `;
    expect(rows[0].n).toBe(1);
  });
});
