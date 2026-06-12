import { describe, it, expect } from "vitest";
import { MockAdapter } from "../src/channels/mock.js";
import { getAdapter } from "../src/channels/registry.js";

const adapter = new MockAdapter();

describe("MockAdapter", () => {
  it("verifyWebhook always returns true", () => {
    expect(adapter.verifyWebhook({}, {}, "")).toBe(true);
  });

  it("parseInbound returns normalized message", () => {
    const [msg] = adapter.parseInbound({ from: "573001112233", text: "Hola, quiero info", name: "Ana" }, "tenant-1");

    expect(msg.channel).toBe("mock");
    expect(msg.providerMessageId).toMatch(/^mock_/);
    expect(msg.conversationKey).toBe("mock:573001112233");
    expect(msg.contact.externalId).toBe("573001112233");
    expect(msg.contact.name).toBe("Ana");
    expect(msg.content.text).toBe("Hola, quiero info");
    expect(msg.tenantId).toBe("tenant-1");
  });

  it("generates deterministic providerMessageId for same input", () => {
    const [msg1] = adapter.parseInbound({ from: "573001112233", text: "Hola", timestamp: "2026-01-01T00:00:00Z" }, "t1");
    const [msg2] = adapter.parseInbound({ from: "573001112233", text: "Hola", timestamp: "2026-01-01T00:00:00Z" }, "t1");

    expect(msg1.providerMessageId).toBe(msg2.providerMessageId);
  });

  it("allows explicit providerMessageId for idempotency testing", () => {
    const [msg] = adapter.parseInbound({ from: "57300", text: "test", providerMessageId: "explicit-id-123" }, "t1");

    expect(msg.providerMessageId).toBe("explicit-id-123");
  });

  it("canSendFreeForm always returns true", () => {
    expect(adapter.canSendFreeForm({ status: "bot_active" })).toBe(true);
    expect(adapter.canSendFreeForm({ status: "closed" })).toBe(true);
  });

  it("sendMessage returns providerMessageId", async () => {
    const result = await adapter.sendMessage({
      channel: "mock",
      conversationId: "conv-1",
      contactExternalId: "57300",
      content: { type: "text", text: "Hola" },
      tenantId: "t1",
    });

    expect(result.providerMessageId).toMatch(/^mock_out_/);
  });
});

describe("getAdapter registry", () => {
  it("returns MockAdapter for mock channel", () => {
    const a = getAdapter("mock");
    expect(a.channel).toBe("mock");
  });

  it("throws for unknown channel", () => {
    expect(() => getAdapter("whatsapp")).toThrow("Unknown channel adapter");
  });
});
