import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env.js";
import { checkDbConnection, db } from "./db/client.js";
import { sim } from "./api/sim.js";
import { webhooks } from "./api/webhooks.js";
import { dashboard } from "./api/dashboard.js";
import { workers } from "./api/workers.js";
import { resolveTenant } from "./api/middleware.js";
import { sql } from "drizzle-orm";
import { tenants, users } from "./db/schema.js";
import postgres from "postgres";

const app = new Hono();
const startTime = Date.now();

app.use("*", cors());

app.get("/health", async (c) => {
  const dbConnected = await checkDbConnection();
  const statusCode = dbConnected ? 200 : 503;

  let tenantCount = 0;
  let catalogCount = 0;
  let convCount = 0;
  if (dbConnected) {
    try {
      const [tc] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM tenants`);
      tenantCount = (tc as any)?.c ?? 0;
      const [cc] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM catalog_items`);
      catalogCount = (cc as any)?.c ?? 0;
      const [cvc] = await db.execute(sql`SELECT COUNT(*)::int AS c FROM conversations`);
      convCount = (cvc as any)?.c ?? 0;
    } catch {}
  }

  return c.json(
    {
      status: dbConnected ? "ok" : "degraded",
      db: dbConnected ? "connected" : "disconnected",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      tenants: tenantCount,
      catalogItems: catalogCount,
      conversations: convCount,
      llmProvider: env.LLM_PROVIDER,
      timestamp: new Date().toISOString(),
    },
    statusCode
  );
});

app.get("/", (c) => c.json({ name: "Bookia API", version: "0.1.0" }));

// ── POST /api/auth/register — crear tenant + user ──
app.post("/api/auth/register", async (c) => {
  const { businessName, email, password } = await c.req.json<{ businessName: string; email: string; password: string }>();
  if (!businessName || !email || !password || password.length < 6) {
    return c.json({ error: "Invalid fields" }, 400);
  }
  const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");
  try {
    const adminSql = postgres(env.DATABASE_URL, { max: 1, connect_timeout: 5 });
    const [tenant] = await adminSql`INSERT INTO tenants (name, slug) VALUES (${businessName}, ${slug}) RETURNING id`;
    await adminSql`SELECT set_config('app.current_tenant', ${tenant.id}, true)`;
    await adminSql`
      INSERT INTO users (tenant_id, email, name, role)
      VALUES (${tenant.id}, ${email}, ${businessName}, 'owner')
    `;
    await adminSql.end();
    return c.json({ success: true, slug, tenantId: tenant.id }, 201);
  } catch (err: any) {
    return c.json({ error: err?.message ?? "Registration failed" }, 500);
  }
});

// ── GET /images/:key — serve Santa María service images ──
app.get("/images/:key", async (c) => {
  const key = c.req.param("key");
  // Security: only allow known image keys from manifest
  const allowed = new Set([
    "image1.jpeg","image2.jpeg","image3.jpeg","image4.jpeg","image5.jpeg",
    "image6.jpeg","image7.jpeg","image8.jpeg","image9.jpeg","image10.jpeg",
    "image11.jpeg","image12.jpeg","image13.jpeg","image14.jpeg","image15.jpeg",
    "image16.jpeg","image17.jpeg","image18.jpeg","image19.jpeg","image20.jpeg",
    "image21.jpeg","image22.jpeg","image23.jpeg","image24.jpeg","image25.jpeg",
    "image26.jpeg","image27.jpeg","image28.jpeg",
  ]);
  if (!allowed.has(key)) return c.json({ error: "Not found" }, 404);
  const filePath = join(import.meta.dirname, "flows", "santa-maria", "images", key);
  try {
    const buf = await readFile(filePath);
    return c.newResponse(buf, 200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" });
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
});

app.use("/api/*", resolveTenant);

app.route("/api/sim", sim);
app.route("/api", dashboard);
app.route("/api/workers", workers);
app.route("/webhooks", webhooks);

if (process.env.NODE_ENV !== "test") {
  serve(
    { fetch: app.fetch, port: env.PORT },
    (info: { port: number }) => {
      console.log(`Bookia API running on http://localhost:${info.port}`);
    }
  );
}

export { app };
export type AppType = typeof app;
