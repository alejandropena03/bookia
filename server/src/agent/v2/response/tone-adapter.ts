import type { ToneProfile } from "../types/response-contract.js";
import type { AgentIntent } from "../types/agent-intent.js";
import type { FunnelStage } from "../types/funnel.js";
import type { SentimentLabel } from "../../../lib/sentiment.js";

export interface ToneDecision {
  profile: ToneProfile;
  instructions: string;
  prefix?: string;
}

const TONE_MAP: Record<SentimentLabel, ToneProfile> = {
  frustrated: "apologetic",
  anxious: "reassuring",
  urgent: "direct_booking",
  happy: "warm_brief",
  neutral: "warm_brief",
  confused: "clarifying",
};

const NEGATIVE_SENTIMENTS: SentimentLabel[] = ["frustrated", "anxious", "urgent"];

export function selectTone(
  sentiment: SentimentLabel,
  intent: AgentIntent,
  funnelStage: FunnelStage,
): ToneDecision {
  let profile: ToneProfile;

  if (funnelStage === "complaint") {
    profile = "apologetic";
  } else if (NEGATIVE_SENTIMENTS.includes(sentiment)) {
    profile = TONE_MAP[sentiment];
  } else if (intent === "agendamiento" || intent === "pago") {
    profile = "direct_booking";
  } else if (intent === "dudas_medicas" || intent === "contraindicaciones") {
    profile = "professional_clinical";
  } else {
    profile = TONE_MAP[sentiment];
  }

  const instructions = getToneInstructions(profile);
  const prefix = getTonePrefix(profile);

  return { profile, instructions, prefix };
}

function getToneInstructions(profile: ToneProfile): string {
  switch (profile) {
    case "warm_brief":
      return "TONO: Responde cálido pero breve. Como WhatsApp, una idea por mensaje. Usa emojis con moderación (✨).";
    case "warm_detailed":
      return "TONO: Explica con calidez pero con más detalle. Puedes dar información completa pero manteniendo un tono cercano.";
    case "reassuring":
      return "TONO: Tranquiliza al paciente. Valida su preocupación, explica con claridad, destaca la seguridad y la evaluación personal del médico.";
    case "professional_clinical":
      return "TONO: Responde con precisión técnica pero accesible. No des diagnósticos. Ofrece valoración para casos particulares.";
    case "apologetic":
      return "TONO: Valida la molestia. Sé empático y serio. No seas excesivamente alegre. Ofrece solución o escalación.";
    case "direct_booking":
      return "TONO: Ve al grano. Prioriza coordinar la cita. Pregunta la info necesaria sin rodeos.";
    case "clarifying":
      return "TONO: Paciente y claro. Pregunta si necesita más aclaración. Evita tecnicismos.";
    default:
      return "TONO: Cordial, natural, profesional.";
  }
}

function getTonePrefix(profile: ToneProfile): string | undefined {
  switch (profile) {
    case "apologetic":
      return "Entiendo tu molestia. Déjame ayudarte con esto.";
    case "reassuring":
      return "Entiendo tu preocupación. Déjame contarte con más detalle.";
    case "direct_booking":
      return "Entendido, veamos cómo agendarlo.";
    case "clarifying":
      return "Déjame explicarte mejor.";
    default:
      return undefined;
  }
}
