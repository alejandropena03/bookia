import type { FunnelStage, NextBestAction } from "../types/funnel.js";

export type ConcernType = "price" | "pain" | "safety" | "results" | "time" | "trust";
export type ObjectionType = "price" | "pain" | "trust" | "time" | "results" | "discount" | "payment";
export type PaymentStatus = "not_started" | "requested" | "sent_proof" | "confirmed";
export type HandoffStatus = "none" | "requested" | "escalated" | "resolved";

export interface MemoryValue<T> {
  value: T;
  confidence: number;
  source: "user_message" | "bot_message" | "human_update" | "flow_state" | "derived";
  updatedAt: string;
}

export interface PatientConversationMemory {
  city?: string;
  serviceInterest?: string[];
  funnelStage?: FunnelStage;
  lastObjection?: string;
  lastConcern?: ConcernType;
  preferredTone?: "direct" | "warm" | "detailed" | "brief";
  providedData: {
    name?: boolean;
    phone?: boolean;
    email?: boolean;
    birthDate?: boolean;
    idNumber?: boolean;
  };
  paymentStatus?: PaymentStatus;
  humanHandoffStatus?: HandoffStatus;
  lastBotSummary?: string;
  lastUserSummary?: string;
  lastNextBestAction?: NextBestAction;
  lastQuotedService?: string;
  lastDisclaimerApplied?: boolean;
  turnCount: number;
  startTime: string;
  lastActivity: string;
}

export interface PersistedPatientMemory {
  tenantId: string;
  contactId: string;
  version: number;
  conversationId?: string;
  city?: MemoryValue<string>;
  serviceInterest: MemoryValue<string[]>;
  funnelStage: MemoryValue<FunnelStage>;
  lastObjection?: MemoryValue<ObjectionType>;
  lastConcern?: MemoryValue<ConcernType>;
  providedData: {
    name?: boolean;
    phone?: boolean;
    email?: boolean;
    birthDate?: boolean;
    idNumber?: boolean;
  };
  paymentStatus?: MemoryValue<PaymentStatus>;
  humanHandoffStatus?: MemoryValue<HandoffStatus>;
  lastBotSummary?: MemoryValue<string>;
  lastUserSummary?: MemoryValue<string>;
  lastNextBestAction?: MemoryValue<NextBestAction>;
  lastQuotedService?: MemoryValue<string>;
  lastDisclaimerApplied?: MemoryValue<boolean>;
}

export function createEmptyMemory(): PatientConversationMemory {
  return {
    providedData: {},
    paymentStatus: "not_started",
    humanHandoffStatus: "none",
    turnCount: 0,
    startTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };
}

export function memoryValue<T>(value: T, source: MemoryValue<T>["source"] = "user_message"): MemoryValue<T> {
  return { value, confidence: 1.0, source, updatedAt: new Date().toISOString() };
}

export function mergeMemoryValues<T>(existing?: MemoryValue<T>, incoming?: MemoryValue<T>): MemoryValue<T> | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (incoming.confidence >= existing.confidence) return incoming;
  return existing;
}
