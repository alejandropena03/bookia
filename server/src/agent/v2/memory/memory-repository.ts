import type postgres from "postgres";
import type {
  PatientConversationMemory,
  PersistedPatientMemory,
  MemoryValue,
  ConcernType,
  ObjectionType,
  PaymentStatus,
  HandoffStatus,
} from "./memory-types.js";
import type { FunnelStage, NextBestAction } from "../types/funnel.js";

const DEFAULT_MEMORY_TTL_DAYS = 7;
const MAX_RETRIES = 2;

export interface MemoryRepository {
  get(tenantId: string, contactId: string): Promise<PersistedPatientMemory>;
  merge(tenantId: string, contactId: string, conversationId: string, updates: Partial<PatientConversationMemory>): Promise<{ memory: PersistedPatientMemory; conflict: boolean }>;
  delete(tenantId: string, contactId: string): Promise<void>;
}

export function createMemoryRepository(sql: postgres.Sql): MemoryRepository {
  return new PostgresMemoryRepository(sql);
}

class PostgresMemoryRepository implements MemoryRepository {
  constructor(private sql: postgres.Sql) {}

  async get(tenantId: string, contactId: string): Promise<PersistedPatientMemory> {
    const [row] = await this.sql`
      SELECT memory_json, version, updated_at, expires_at
      FROM patient_memory
      WHERE tenant_id = ${tenantId} AND contact_id = ${contactId}
    `;

    if (!row) return createDefaultPersistedMemory(tenantId, contactId);

    const memory = row.memory_json as Record<string, unknown>;
    const dbVersion = row.version as number;
    const updatedAt = new Date(row.updated_at as string);
    const expiresAt = row.expires_at ? new Date(row.expires_at as string) : null;

    const base = createDefaultPersistedMemory(tenantId, contactId);

    if (expiresAt && expiresAt < new Date()) {
      const stale = applyTtlDecay(memory as Partial<PersistedPatientMemory>, updatedAt);
      return { ...base, ...stale, version: dbVersion };
    }

    return { ...base, ...memory, version: dbVersion };
  }

  async merge(
    tenantId: string,
    contactId: string,
    conversationId: string,
    updates: Partial<PatientConversationMemory>,
  ): Promise<{ memory: PersistedPatientMemory; conflict: boolean }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.tryMerge(tenantId, contactId, conversationId, updates);
      } catch (err) {
        lastError = err as Error;
        if (attempt < MAX_RETRIES) continue;
      }
    }

    console.warn(`memory_merge_failed tenant=${tenantId} contact=${contactId} error=${lastError?.message}`);
    return { memory: createDefaultPersistedMemory(tenantId, contactId), conflict: true };
  }

  async delete(tenantId: string, contactId: string): Promise<void> {
    await this.sql`
      DELETE FROM patient_memory
      WHERE tenant_id = ${tenantId} AND contact_id = ${contactId}
    `;
  }

  private async tryMerge(
    tenantId: string,
    contactId: string,
    conversationId: string,
    updates: Partial<PatientConversationMemory>,
  ): Promise<{ memory: PersistedPatientMemory; conflict: boolean }> {
    const current = await this.get(tenantId, contactId);

    const merged = mergeMemory(current, updates);
    const safeForStorage = maskSensitiveData(merged);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_MEMORY_TTL_DAYS);

    const existingVersion = current.version ?? 0;
    const newVersion = existingVersion + 1;
    if (existingVersion === 0) {
      await this.sql`
        INSERT INTO patient_memory (tenant_id, contact_id, memory_json, version, updated_at, expires_at, last_conversation_id)
        VALUES (${tenantId}, ${contactId}, ${this.sql.json(safeForStorage as any)}, ${newVersion}, ${now}, ${expiresAt}, ${conversationId})
        ON CONFLICT (tenant_id, contact_id) DO UPDATE SET
          memory_json = EXCLUDED.memory_json,
          version = patient_memory.version + 1,
          updated_at = EXCLUDED.updated_at,
          expires_at = EXCLUDED.expires_at,
          last_conversation_id = EXCLUDED.last_conversation_id
      `;
    } else {
      const result = await this.sql`
        UPDATE patient_memory SET
          memory_json = ${this.sql.json(safeForStorage as any)},
          version = version + 1,
          updated_at = ${now},
          expires_at = ${expiresAt},
          last_conversation_id = ${conversationId}
        WHERE tenant_id = ${tenantId} AND contact_id = ${contactId} AND version = ${existingVersion}
      `;
      if (result.count === 0) {
        throw new Error("version_conflict");
      }
    }

    return { memory: merged, conflict: false };
  }
}

function createDefaultPersistedMemory(tenantId: string, contactId: string): PersistedPatientMemory {
  return {
    tenantId,
    contactId,
    version: 0,
    serviceInterest: { value: [], confidence: 1, source: "derived", updatedAt: new Date().toISOString() },
    funnelStage: { value: "unknown", confidence: 1, source: "derived", updatedAt: new Date().toISOString() },
    providedData: {},
  };
}

function applyTtlDecay(memory: Partial<PersistedPatientMemory>, updatedAt: Date): Partial<PersistedPatientMemory> {
  const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < DEFAULT_MEMORY_TTL_DAYS) return memory;

  const decayed: Partial<PersistedPatientMemory> = { ...memory };
  for (const [key, val] of Object.entries(decayed)) {
    if (val && typeof val === "object" && "confidence" in val) {
      const mv = val as MemoryValue<unknown>;
      mv.confidence = Math.max(0.1, mv.confidence * Math.exp(-daysSinceUpdate / DEFAULT_MEMORY_TTL_DAYS));
    }
  }
  return decayed;
}

function maskSensitiveData(memory: PersistedPatientMemory): PersistedPatientMemory {
  const masked = { ...memory };
  if (masked.lastBotSummary?.value) {
    const summary = masked.lastBotSummary.value;
    masked.lastBotSummary.value = summary
      .replace(/\b\d{6,}\b/g, "[ID]")
      .replace(/\b[\w.+-]+@[\w-]+\.[\w]{2,}\b/g, "[EMAIL]")
      .replace(/\b\d{10,}\b/g, "[PHONE]");
  }
  if (masked.lastUserSummary?.value) {
    const summary = masked.lastUserSummary.value;
    masked.lastUserSummary.value = summary
      .replace(/\b\d{6,}\b/g, "[ID]")
      .replace(/\b[\w.+-]+@[\w-]+\.[\w]{2,}\b/g, "[EMAIL]")
      .replace(/\b\d{10,}\b/g, "[PHONE]");
  }
  return masked;
}

function mergeMemory(
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
