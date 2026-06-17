import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { checkDbConnection, db } from "./db/client.js";
import { sim } from "./api/sim.js";
import { webhooks } from "./api/webhooks.js";
import { dashboard } from "./api/dashboard.js";
import { workers } from "./api/workers.js";
import { resolveTenant } from "./api/middleware.js";
import { sql } from "drizzle-orm";
import { tenants } from "./db/schema.js";

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
