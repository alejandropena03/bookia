import crypto from "node:crypto";
import { ChannelAdapter, NormalizedInboundMessage, NormalizedOutboundMessage } from "./types.js";

export class MockAdapter implements ChannelAdapter {
  readonly channel = "mock";

  verifyWebhook(): boolean {
    return true;
  }

  parseInbound(rawBody: unknown, tenantId: string): NormalizedInboundMessage[] {
    const body = rawBody as { from?: string; text?: string; name?: string; timestamp?: string; providerMessageId?: string };
    const ts = body.timestamp ?? new Date().toISOString();
    const providerMessageId = body.providerMessageId ?? `mock_${crypto.createHash("md5").update(`${body.from}_${body.text}_${ts}`).digest("hex")}`;

    return [{
      channel: "mock",
      providerMessageId,
      conversationKey: `mock:${body.from}`,
      account: { channelAccountId: "mock" },
      contact: { externalId: body.from ?? "unknown", name: body.name, phone: body.from },
      content: { type: "text", text: body.text ?? "" },
      timestamp: ts,
      replyWindowExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      tenantId,
    }];
  }

  async sendMessage(out: NormalizedOutboundMessage): Promise<{ providerMessageId: string }> {
    const providerMessageId = `mock_out_${crypto.createHash("md5").update(`${out.conversationId}_${out.content.text}_${Date.now()}`).digest("hex")}`;
    return { providerMessageId };
  }

  canSendFreeForm(): boolean {
    return true;
  }
}
