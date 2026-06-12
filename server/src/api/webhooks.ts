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

  // Wompi payment webhook
  if (channel === "wompi") {
    const rawBody = await c.req.text();
    const checksum = c.req.header("x-event-checksum") ?? "";
    const { env } = await import("../env.js");

    if (!env.WOMPI_EVENTS_KEY) {
      return c.json({ error: "Wompi not configured" }, 501);
    }

    const { getPaymentProvider } = await import("../payment/index.js");
    const { WompiProvider } = await import("../payment/wompi.js");
    const provider = getPaymentProvider();
    if (!(provider instanceof WompiProvider) || !provider.verifyWebhookSignature(rawBody, checksum)) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(rawBody);
    const transaction = event?.data?.transaction;
    if (!transaction) return c.json({ error: "Invalid payload" }, 400);

    const { queryClient } = await import("../db/client.js");

    if (transaction.status === "APPROVED") {
      const [booking] = await queryClient`
        UPDATE bookings SET payment_status = 'paid', status = 'confirmed'
        WHERE booking_provider_ref = ${transaction.reference} AND tenant_id IS NOT NULL
        RETURNING id, conversation_id, tenant_id, service_name
      `;

      if (booking) {
        const [tenant] = await queryClient`SELECT slug FROM tenants WHERE id = ${booking.tenant_id} LIMIT 1`;
        const msgText = `✅ ¡Pago confirmado! Tu cita de ${booking.service_name} está confirmada.`;
        const { eventBus } = await import("../lib/event-bus.js");
        await queryClient`
          INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, content_type, text, created_at)
          VALUES (${booking.tenant_id}, ${booking.conversation_id}, 'outbound', 'bot', 'text', ${msgText}, NOW())
        `;
        if (tenant) {
          eventBus.emit(tenant.slug, {
            tenantId: booking.tenant_id,
            conversationId: booking.conversation_id,
            message: { id: crypto.randomUUID(), direction: "outbound", senderType: "bot", text: msgText, createdAt: new Date().toISOString() },
          });
        }
      }
    }

    return c.json({ ok: true });
  }

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
