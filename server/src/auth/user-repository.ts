import type postgres from "postgres";

export interface UserRecord {
  id: string;
  tenantId: string;
  tenantSlug: string;
  businessName: string;
  email: string;
  passwordHash: string | null;
  name: string;
  role: string;
}

export async function findUserByEmail(
  sql: postgres.Sql,
  email: string
): Promise<UserRecord | null> {
  const rows = await sql`
    SELECT u.id, u.tenant_id, u.email, u.password_hash, u.name, u.role,
           t.slug AS tenant_slug, t.name AS business_name
    FROM users u
    JOIN tenants t ON t.id = u.tenant_id
    WHERE u.email = ${email}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as any;
  return {
    id: r.id,
    tenantId: r.tenant_id,
    tenantSlug: r.tenant_slug,
    businessName: r.business_name,
    email: r.email,
    passwordHash: r.password_hash,
    name: r.name,
    role: r.role,
  };
}
