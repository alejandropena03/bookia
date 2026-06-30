import crypto from "node:crypto";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getAdapter } from "../channels/registry.js";
import { ingestInbound } from "../conversations/service.js";
import { processMessage } from "../agent/orchestrator.js";
import { eventBus } from "../lib/event-bus.js";
import { env } from "../env.js";

const sim = new Hono();

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, maxRequests: number, windowSec: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// ── SSE stream token (HMAC-SHA256, short-lived) ──────────────────────────────

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function signStreamToken(tenantSlug: string, expiresAt: number): string {
  const payload = `${tenantSlug}:${expiresAt}`;
  const sig = crypto
    .createHmac("sha256", env.SSE_STREAM_SECRET || "dev-insecure")
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

function verifyStreamToken(token: string | undefined, tenantSlug: string): boolean {
  // When no secret is configured (dev/local) the stream is open.
  if (!env.SSE_STREAM_SECRET) return true;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length < 3) return false;
    const [slug, expiresAtStr, sig] = parts;
    if (slug !== tenantSlug) return false;
    if (Date.now() > Number(expiresAtStr)) return false;
    const expected = crypto
      .createHmac("sha256", env.SSE_STREAM_SECRET)
      .update(`${slug}:${expiresAtStr}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

// ── POST /api/sim/stream-token ────────────────────────────────────────────────

sim.post("/stream-token", async (c) => {
  const body = await c.req.json<{ tenantSlug?: string }>().catch(() => ({ tenantSlug: undefined }));
  const tenantSlug = (c.get("tenantSlug" as never) as string | undefined) ?? body.tenantSlug;

  if (!tenantSlug) return c.json({ error: "tenantSlug required" }, 400);

  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, tenantSlug)).limit(1);
  if (!tenant) return c.json({ error: `Tenant not found: ${tenantSlug}` }, 404);

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return c.json({ token: signStreamToken(tenantSlug, expiresAt), expiresAt });
});

// ── POST /api/sim/message ─────────────────────────────────────────────────────

sim.post("/message", async (c) => {
  const body = await c.req.json<{ tenantSlug: string; from: string; text: string; name?: string; timestamp?: string; providerMessageId?: string }>();

  if (!body.tenantSlug || !body.from) {
    return c.json({ error: "tenantSlug and from are required" }, 400);
  }

  // Rate limit: max 20 requests per 10s per sender
  if (!rateLimit(`sim:${body.from}`, 20, 10)) {
    return c.json({ error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." }, 429);
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

  const agentResponse = await processMessage({
    tenantId: tenant.id,
    tenantSlug: body.tenantSlug,
    conversationId: persistResult.conversationId,
    contactId: persistResult.contactId,
    contactName: body.name,
    text: body.text,
  });

  c.status(201);
  return c.json({
    ...persistResult,
    agentResponse,
  });
});

// ── GET /api/sim/stream ───────────────────────────────────────────────────────

sim.get("/stream", (c) => {
  const tenantSlug = c.req.query("tenantSlug");
  if (!tenantSlug) {
    return c.json({ error: "tenantSlug query param required" }, 400);
  }

  const token = c.req.query("token");
  if (!verifyStreamToken(token, tenantSlug)) {
    return c.json({ error: "Unauthorized" }, 401);
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
