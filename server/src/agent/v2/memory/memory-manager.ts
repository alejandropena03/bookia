import type { PatientConversationMemory, ConcernType } from "./memory-types.js";
import type { AgentIntent, ExtractedEntities } from "../types/agent-intent.js";
import type { FunnelStage } from "../types/funnel.js";

export function extractMemoryFromMessage(
  text: string,
  intent: AgentIntent,
  entities: ExtractedEntities,
  existingMemory: PatientConversationMemory,
): Partial<PatientConversationMemory> {
  const updates: Partial<PatientConversationMemory> = {};

  if (entities.city && entities.city !== existingMemory.city) {
    updates.city = entities.city;
  }

  if (entities.service) {
    const prev = existingMemory.serviceInterest ?? [];
    if (!prev.includes(entities.service)) {
      updates.serviceInterest = [...prev, entities.service];
    }
  }

  const lower = text.toLowerCase();
  const concernKeywords: Record<ConcernType, string[]> = {
    price: ["caro", "costo", "precio", "económico", "barato", "presupuesto", "costoso"],
    pain: ["duele", "duela", "dolor", "molestia", "pinchazo", "lastima", "arde"],
    safety: ["seguro", "peligroso", "riesgo", "daño", "complicación", "efecto secundario"],
    results: ["resultado", "funciona", "efecto", "dura", "veo", "cambio"],
    time: ["tiempo", "demora", "rápido", "sesión", "sesiones", "cuanto dura"],
    trust: ["confianza", "experiencia", "especialista", "doctor", "reputación", "recomendado"],
  };

  for (const [concern, keywords] of Object.entries(concernKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      updates.lastConcern = concern as ConcernType;
      break;
    }
  }

  if (intent === "queja") {
    updates.lastConcern = "trust";
  }

  return updates;
}

export function deriveFunnelStage(
  intent: AgentIntent,
  memory: PatientConversationMemory,
): FunnelStage {
  if (intent === "queja") return "complaint";
  if (memory.humanHandoffStatus === "requested" || memory.humanHandoffStatus === "escalated") return "handoff";

  if (memory.paymentStatus === "confirmed") return "booked";
  if (memory.paymentStatus === "sent_proof") return "awaiting_payment";

  if (memory.providedData.idNumber) return "collecting_data";

  if (intent === "agendamiento" || memory.funnelStage === "ready_to_book" || memory.funnelStage === "collecting_data") {
    return "ready_to_book";
  }

  if (intent === "precio" || memory.funnelStage === "asking_price" || memory.funnelStage === "considering") {
    if (memory.lastConcern === "price") return "considering";
    return "asking_price";
  }

  if (intent === "dudas_medicas" || memory.funnelStage === "exploring_services") {
    return "exploring_services";
  }

  if (intent === "saludo" || intent === "charla") return "new_lead";

  return memory.funnelStage ?? "unknown";
}

export function markDataProvided(
  field: keyof PatientConversationMemory["providedData"],
  memory: PatientConversationMemory,
): PatientConversationMemory {
  return {
    ...memory,
    providedData: { ...memory.providedData, [field]: true },
  };
}
