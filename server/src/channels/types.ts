export interface NormalizedInboundMessage {
  channel: "whatsapp" | "instagram" | "messenger" | "mock";
  providerMessageId: string;
  conversationKey: string;
  account: { channelAccountId: string };
  contact: { externalId: string; name?: string; phone?: string };
  content: { type: string; text?: string; mediaUrl?: string; raw?: unknown };
  timestamp: string;
  replyWindowExpiresAt?: string;
  tenantId: string;
}

export interface NormalizedOutboundMessage {
  channel: string;
  conversationId: string;
  contactExternalId: string;
  content: { type: string; text?: string; mediaUrl?: string };
  tenantId: string;
}

export interface ChannelAdapter {
  readonly channel: string;
  verifyWebhook(query: Record<string, string>, headers: Record<string, string>, rawBody: string): boolean;
  parseInbound(rawBody: unknown, tenantId: string): NormalizedInboundMessage[];
  sendMessage(out: NormalizedOutboundMessage): Promise<{ providerMessageId: string }>;
  canSendFreeForm(conversation: { status: string }): boolean;
}
