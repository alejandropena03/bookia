import { Hono } from "hono";
import { stream, streamSSE } from "hono/streaming";
import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getAdapter } from "../channels/registry.js";
import { ingestInbound } from "../conversations/service.js";
import { processMessage } from "../agent/orchestrator.js";
import { eventBus } from "../lib/event-bus.js";

const sim = new Hono();

sim.post("/message", async (c) => {
  const body = await c.req.json<{ tenantSlug: string; from: string; text: string; name?: string; timestamp?: string; providerMessageId?: string }>();

  if (!body.tenantSlug || !body.from) {
    return c.json({ error: "tenantSlug and from are required" }, 400);
  }

  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, body.tenantSlug)).limit(1);
  if (!tenant) {
    return c.json({ error: `Tenant not found: ${body.tenantSlug}` }, 404);
  }

  const adapter = getAdapter("mock");
  const normalized = adapter.parseInbound(body, tenant.id);
  const persistResult = await ingestInbound(normalized[0]);

  if (persistResult.duplicated) {
    return c.json(persistResult);
  }

  // Process message with agent brain
  const agentResponse = await processMessage({
    tenantId: tenant.id,
    tenantSlug: body.tenantSlug,
    conversationId: persistResult.conversationId,
    contactName: body.name,
    text: body.text,
  });

  c.status(201);
  return c.json({
    ...persistResult,
    agentResponse,
  });
});

sim.get("/stream", (c) => {
  const tenantSlug = c.req.query("tenantSlug");
  if (!tenantSlug) {
    return c.json({ error: "tenantSlug query param required" }, 400);
  }

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");

  return streamSSE(c, async (stream) => {
    const unsubscribe = eventBus.onMessage(tenantSlug, (event) => {
      stream.writeSSE({
        data: JSON.stringify(event),
        event: "message",
      }).catch(() => {});
    });

    stream.onAbort(() => {
      unsubscribe();
    });
  });
});

export { sim };
