import type { AgentKernelInput, MemoryUpdate } from "../types/agent-kernel.js";
import type { AgentIntent } from "../types/agent-intent.js";
import type { FunnelStage } from "../types/funnel.js";

export interface ConversationSnapshot {
  tenantId: string;
  conversationId: string;
  contactId: string;
  channel: string;
  messageText: string;
  normalizedText: string;
  now: Date;
  businessContext: {
    persona: string;
    catalog: string;
    rules: string;
    hours: string;
    bookingMode: string;
    escalationConfig: Record<string, unknown> | null;
  };
  previousIntents?: AgentIntent[];
  currentFunnelStage?: FunnelStage;
  conversationMemory?: Record<string, unknown>;
  isOutOfHours: boolean;
}

export class ConversationSnapshotBuilder {
  build(input: AgentKernelInput, overrides?: Partial<ConversationSnapshot>): ConversationSnapshot {
    return {
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      contactId: input.contactId,
      channel: input.channel,
      messageText: input.messageText,
      normalizedText: input.messageText.toLowerCase().trim(),
      now: input.now,
      businessContext: {
        persona: "Asistente virtual profesional y cordial",
        catalog: "",
        rules: "",
        hours: "",
        bookingMode: "mock",
        escalationConfig: null,
        ...overrides?.businessContext,
      },
      isOutOfHours: false,
      ...overrides,
    };
  }
}

export function createMemoryUpdate(key: string, value: unknown, source: string): MemoryUpdate {
  return { key, value, source };
}
