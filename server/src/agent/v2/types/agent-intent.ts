export const AGENT_INTENTS = [
  "saludo",
  "agendamiento",
  "precio",
  "ubicacion",
  "horarios",
  "pago",
  "valoracion",
  "dudas_medicas",
  "queja",
  "charla",
  "faq_servicios",
  "faq_contacto",
  "post_tratamiento",
  "contraindicaciones",
  "resultados_esperados",
  "cancelacion_reprogramacion",
  "hablar_humano",
  "otro",
] as const;

export type AgentIntent = (typeof AGENT_INTENTS)[number];

export interface ExtractedEntities {
  city?: string;
  service?: string;
  datePreference?: string;
  budgetSignal?: "low" | "medium" | "high" | "unknown";
  urgency?: "low" | "medium" | "high";
}

export interface RouterDecision {
  intent: AgentIntent;
  confidence: number;
  secondaryIntents: AgentIntent[];
  entities: ExtractedEntities;
  reasoningSummary: string;
  riskFlags?: {
    hasEmergencyKeywords: boolean;
    hasClinicalRisk: boolean;
    hasPIIExposure: boolean;
    hasPromptInjection: boolean;
    needsEscalation: boolean;
  };
  safetyLevel?: "safe" | "caution" | "handoff" | "blocked";
  policyAction?: "allow" | "constrain" | "handoff" | "block";
  detectedPII?: string[];
}

export interface MediaItem {
  url: string;
  type: "image" | "video" | "document";
  imageKey: string;
  alt: string;
  service?: string;
  currency?: string;
}
