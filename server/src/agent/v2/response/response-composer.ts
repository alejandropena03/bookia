import type { ResponseContract, ToneProfile } from "../types/response-contract.js";
import type { ResponseStrategy } from "../types/decision-trace.js";
import { selectTone } from "./tone-adapter.js";
import { detectSentiment, type SentimentLabel } from "../../../lib/sentiment.js";
import type { AgentIntent } from "../types/agent-intent.js";
import type { FunnelStage } from "../types/funnel.js";

export interface ComposerInput {
  text: string;
  route: ResponseStrategy;
  intent: AgentIntent;
  funnelStage: FunnelStage;
  contract?: ResponseContract;
  previousTone?: ToneProfile;
}

export interface ComposerOutput {
  text: string;
  tone: ToneProfile;
  hasDisclosure: boolean;
  hasDisclaimer: boolean;
  hasCTA: boolean;
  characterCount: number;
}

const AI_DISCLOSURE = "\n\n🤍 *Soy una asistente con IA* — la información que comparto está basada en los datos oficiales de la clínica. Si necesitas algo más personalizado, puedo conectar con un asesor humano.";
const MEDICAL_DISCLAIMER = "\n\n*Importante:* Esta información es referencial. Cada caso es único y requiere evaluación médica presencial. Agenda una valoración para recibir recomendaciones personalizadas.";

export function composeResponse(input: ComposerInput): ComposerOutput {
  const sentiment = detectSentiment(input.text);
  const tone = selectTone(sentiment.label, input.intent, input.funnelStage);
  const text = buildResponse(input, sentiment.label, tone);
  const contract = input.contract;

  const hasDisclosure = contract?.requireDisclosure === true;
  const hasDisclaimer = contract?.requireDisclaimer === true;
  const hasCTA = contract?.includeCTA === true;

  return {
    text,
    tone: tone.profile,
    hasDisclosure,
    hasDisclaimer,
    hasCTA,
    characterCount: text.length,
  };
}

function buildResponse(
  input: ComposerInput,
  sentimentLabel: SentimentLabel,
  tone: { profile: ToneProfile; instructions: string; prefix?: string },
): string {
  let text = input.text;

  if (tone.prefix && !text.startsWith(tone.prefix.slice(0, 10))) {
    text = `${tone.prefix} ${text}`;
  }

  if (input.contract?.requireDisclosure) {
    text += AI_DISCLOSURE;
  }

  if (input.contract?.requireDisclaimer) {
    text += MEDICAL_DISCLAIMER;
  }

  if (input.contract?.includeCTA && input.route !== "refusal" && input.route !== "handoff") {
    text += "\n\n¿Te gustaría agendar una valoración?";
  }

  return text;
}
