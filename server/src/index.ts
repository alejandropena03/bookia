import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { checkDbConnection } from "./db/client.js";
import { sim } from "./api/sim.js";
import { webhooks } from "./api/webhooks.js";
import { dashboard } from "./api/dashboard.js";
import { workers } from "./api/workers.js";
import { resolveTenant } from "./api/middleware.js";

const app = new Hono();

app.use("*", cors());

app.get("/health", async (c) => {
  const dbConnected = await checkDbConnection();
  const statusCode = dbConnected ? 200 : 503;
  return c.json(
    {
      status: dbConnected ? "ok" : "degraded",
      db: dbConnected ? "connected" : "disconnected",
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
