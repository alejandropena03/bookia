import { Hono } from "hono";
import { getAdapter } from "../channels/registry.js";
import { ingestInbound } from "../conversations/service.js";

const webhooks = new Hono();

webhooks.get("/:channel", async (c) => {
  const channel = c.req.param("channel");
  let adapter;
  try {
    adapter = getAdapter(channel);
  } catch {
    return c.json({ error: `Unknown channel: ${channel}` }, 501);
  }

  const query: Record<string, string> = {};
  const queries = c.req.queries();
  for (const k of Object.keys(queries)) {
    query[k] = queries[k]?.[0] ?? "";
  }
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((v, k) => { headers[k] = v; });
  const rawBody = await c.req.text();

  if (adapter.verifyWebhook(query, headers, rawBody)) {
    const challenge = c.req.query("hub.challenge");
    if (challenge) return c.text(challenge);
    return c.text("OK");
  }
  return c.text("Verification failed", 403);
});

webhooks.post("/:channel", async (c) => {
  const channel = c.req.param("channel");
  let adapter;
  try {
    adapter = getAdapter(channel);
  } catch {
    return c.json({ error: `Unknown channel: ${channel}` }, 501);
  }

  const rawBody = await c.req.json();
  const normalized = adapter.parseInbound(rawBody, "resolve-later");

  for (const msg of normalized) {
    await ingestInbound(msg);
  }

  return c.text("OK");
});

export { webhooks };
