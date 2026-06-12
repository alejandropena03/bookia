import { env } from "../env.js";
import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";

export async function resolveTenant(c: Context, next: Next) {
  if (env.DEV_AUTH) {
    const slug = c.req.header("x-tenant-slug") || "santa-maria";
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) {
      return c.json({ error: `Tenant not found: ${slug}` }, 404);
    }
    c.set("tenantId", tenant.id);
    c.set("tenantSlug", tenant.slug);
  }
  await next();
}
