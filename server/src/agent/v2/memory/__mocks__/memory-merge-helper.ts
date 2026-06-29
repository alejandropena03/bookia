import type { PersistedPatientMemory, PatientConversationMemory, MemoryValue, ConcernType, ObjectionType, PaymentStatus, HandoffStatus } from "../memory-types.js";
import type { FunnelStage, NextBestAction } from "../../types/funnel.js";

export function createDefaultPersistedMemory(tenantId: string, contactId: string): PersistedPatientMemory {
  return {
    tenantId,
    contactId,
    version: 0,
    serviceInterest: { value: [], confidence: 1, source: "derived", updatedAt: new Date().toISOString() },
    funnelStage: { value: "unknown", confidence: 1, source: "derived", updatedAt: new Date().toISOString() },
    providedData: {},
  };
}

const FUNNEL_ADVANCEMENT: Record<FunnelStage, FunnelStage[]> = {
  unknown: ["new_lead", "asking_price", "exploring_services", "complaint", "handoff"],
  new_lead: ["exploring_services", "asking_price", "ready_to_book", "complaint", "handoff"],
  exploring_services: ["asking_price", "considering", "ready_to_book", "complaint", "handoff"],
  asking_price: ["considering", "ready_to_book", "complaint", "handoff"],
  considering: ["ready_to_book", "complaint", "handoff"],
  ready_to_book: ["collecting_data", "complaint", "handoff"],
  collecting_data: ["ready_to_book", "complaint", "handoff"],
  awaiting_payment: ["booked", "complaint", "handoff"],
  booked: ["post_booking", "complaint", "handoff"],
  post_booking: ["complaint", "handoff"],
  complaint: ["handoff"],
  handoff: [],
};

function canAdvanceFunnel(current: FunnelStage, next: FunnelStage): boolean {
  if (current === next) return true;
  if (next === "complaint" || next === "handoff") return true;
  const allowed = FUNNEL_ADVANCEMENT[current] ?? [];
  return allowed.includes(next);
}

const PAYMENT_ADVANCEMENT: Record<PaymentStatus, PaymentStatus[]> = {
  not_started: ["requested", "sent_proof", "confirmed"],
  requested: ["sent_proof", "confirmed"],
  sent_proof: ["confirmed"],
  confirmed: [],
};

function canAdvancePayment(current: PaymentStatus | undefined, next: PaymentStatus): boolean {
  if (!current) return true;
  if (current === next) return true;
  const allowed = PAYMENT_ADVANCEMENT[current] ?? [];
  return allowed.includes(next);
}

const HANDOFF_ADVANCEMENT: Record<HandoffStatus, HandoffStatus[]> = {
  none: ["requested", "escalated"],
  requested: ["escalated", "resolved"],
  escalated: ["resolved"],
  resolved: [],
};

function canAdvanceHandoff(current: HandoffStatus | undefined, next: HandoffStatus): boolean {
  if (!current) return true;
  if (current === next) return true;
  if (current === "escalated" && next === "none") return false;
  const allowed = HANDOFF_ADVANCEMENT[current] ?? [];
  return allowed.includes(next);
}

export function mergeMemory(
  current: PersistedPatientMemory,
  updates: Partial<PatientConversationMemory>,
): PersistedPatientMemory {
  const merged = { ...current };

  if (updates.city !== undefined) {
    merged.city = {
      value: updates.city,
      confidence: 1.0,
      source: "user_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.serviceInterest !== undefined) {
    const existing = current.serviceInterest.value ?? [];
    const combined = [...new Set([...existing, ...(updates.serviceInterest ?? [])])];
    merged.serviceInterest = {
      value: combined,
      confidence: 1.0,
      source: "user_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.funnelStage !== undefined) {
    const currentStage = current.funnelStage.value;
    if (!currentStage || currentStage === "unknown" || canAdvanceFunnel(currentStage, updates.funnelStage)) {
      merged.funnelStage = {
        value: updates.funnelStage,
        confidence: 1.0,
        source: "derived",
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (updates.lastConcern !== undefined) {
    merged.lastConcern = {
      value: updates.lastConcern as ConcernType,
      confidence: 1.0,
      source: "user_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.lastObjection !== undefined) {
    merged.lastObjection = {
      value: updates.lastObjection as ObjectionType,
      confidence: 1.0,
      source: "user_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.providedData) {
    merged.providedData = {
      name: (current.providedData.name || updates.providedData.name) ?? undefined,
      phone: (current.providedData.phone || updates.providedData.phone) ?? undefined,
      email: (current.providedData.email || updates.providedData.email) ?? undefined,
      birthDate: (current.providedData.birthDate || updates.providedData.birthDate) ?? undefined,
      idNumber: (current.providedData.idNumber || updates.providedData.idNumber) ?? undefined,
    };
  }

  if (updates.paymentStatus !== undefined) {
    const currentPs = current.paymentStatus;
    if (canAdvancePayment(currentPs?.value, updates.paymentStatus)) {
      merged.paymentStatus = {
        value: updates.paymentStatus as PaymentStatus,
        confidence: 1.0,
        source: "derived",
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (updates.humanHandoffStatus !== undefined) {
    const currentHs = current.humanHandoffStatus;
    if (canAdvanceHandoff(currentHs?.value, updates.humanHandoffStatus)) {
      merged.humanHandoffStatus = {
        value: updates.humanHandoffStatus as HandoffStatus,
        confidence: 1.0,
        source: "derived",
        updatedAt: new Date().toISOString(),
      };
    }
  }

  if (updates.lastBotSummary !== undefined) {
    merged.lastBotSummary = {
      value: updates.lastBotSummary,
      confidence: 1.0,
      source: "bot_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.lastUserSummary !== undefined) {
    merged.lastUserSummary = {
      value: updates.lastUserSummary,
      confidence: 1.0,
      source: "user_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.lastNextBestAction !== undefined) {
    merged.lastNextBestAction = {
      value: updates.lastNextBestAction as NextBestAction,
      confidence: 1.0,
      source: "derived",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.lastQuotedService !== undefined) {
    merged.lastQuotedService = {
      value: updates.lastQuotedService,
      confidence: 1.0,
      source: "bot_message",
      updatedAt: new Date().toISOString(),
    };
  }

  if (updates.lastDisclaimerApplied !== undefined) {
    merged.lastDisclaimerApplied = {
      value: updates.lastDisclaimerApplied,
      confidence: 1.0,
      source: "bot_message",
      updatedAt: new Date().toISOString(),
    };
  }

  return merged;
}
