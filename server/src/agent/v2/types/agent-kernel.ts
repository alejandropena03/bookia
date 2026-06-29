import type { DecisionTrace } from "./decision-trace.js";

export interface AgentKernelInput {
  tenantId: string;
  conversationId: string;
  contactId: string;
  channel: string;
  messageText: string;
  now: Date;
  metadata?: Record<string, unknown>;
}

export interface MemoryUpdate {
  key: string;
  value: unknown;
  source: string;
}

export interface AgentKernelOutput {
  response: {
    text: string;
    route: "canned" | "flow" | "llm" | "hybrid" | "handoff" | "refusal";
    messageId?: string;
  };
  decisionTrace: DecisionTrace;
  memoryUpdates: MemoryUpdate[];
  escalation?: {
    reason: string;
    urgency: "low" | "medium" | "high";
    summary: string;
  };
}

export type AgentEventType =
  | "agent.message.received"
  | "agent.snapshot.created"
  | "agent.intent.detected"
  | "agent.policy.evaluated"
  | "agent.memory.updated"
  | "agent.plan.created"
  | "agent.response.composed"
  | "agent.critic.completed"
  | "agent.escalation.created"
  | "agent.response.sent"
  | "agent.eval.failed";

export interface AgentEvent {
  type: AgentEventType;
  traceId: string;
  conversationId: string;
  tenantId: string;
  timestamp: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}
