import crypto from "node:crypto";
import { env } from "../env.js";
import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";

// ── Structured logger ─────────────────────────────────────────────────────────

const REDACT_PATTERNS = [
  /token=[^&\s"]+/gi,
  /password["\s:=]+[^\s,"]+/gi,
  /api[_-]?key["\s:=]+[^\s,"]+/gi,
  /bearer\s+[^\s"]+/gi,
];

function redact(value: string): string {
  let out = value;
  for (const p of REDACT_PATTERNS) out = out.replace(p, (m) => m.split("=")[0] + "=[REDACTED]");
  return out;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    const line = { level: "info", msg, ...meta, ts: new Date().toISOString() };
    console.log(JSON.stringify(line));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    const line = { level: "warn", msg, ...meta, ts: new Date().toISOString() };
    console.warn(JSON.stringify(line));
  },
  error: (msg: string, errOrMeta?: unknown) => {
    const meta = errOrMeta instanceof Error
      ? { error: errOrMeta.message, stack: errOrMeta.stack }
      : (errOrMeta as Record<string, unknown> | undefined);
    const line = { level: "error", msg, ...meta, ts: new Date().toISOString() };
    console.error(JSON.stringify(line));
  },
};

// ── Request logging middleware ─────────────────────────────────────────────────

export async function requestLogger(c: Context, next: Next) {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  const start = Date.now();

  await next();

  const url = redact(c.req.url);
  logger.info("request", {
    requestId,
    method: c.req.method,
    path: new URL(url, "http://localhost").pathname,
    status: c.res.status,
    durationMs: Date.now() - start,
    tenantSlug: (c.get("tenantSlug") as string | undefined) ?? undefined,
  });
}

// ── Tenant resolution ─────────────────────────────────────────────────────────

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
