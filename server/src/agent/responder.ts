import { getLlm } from "./llm/index.js";
import { env } from "../env.js";
import { renderTemplate } from "../flows/template.js";

export interface BusinessContext {
  persona: string;
  catalog: string;
  rules: string;
  hours: string;
  hoursRaw: Record<string, { open: string | null; close: string | null }>;
  systemPromptOverrides: string | null;
  cannedResponses: Record<string, string>;
  offHoursMessage: string | null;
}

function buildSystemPrompt(context: BusinessContext): string {
  if (context.systemPromptOverrides) {
    return context.systemPromptOverrides;
  }
  return `Eres un asistente virtual de un negocio local.
Personalidad: ${context.persona}

Catálogo de servicios:
${context.catalog}

Reglas importantes:
${context.rules}

Horarios:
${context.hours}

IMPORTANTE:
- NO inventes precios que no estén en el catálogo
- NO des consejos médicos
- Si el cliente pregunta algo fuera de tu alcance, sugiere contactar a un asesor
- Responde en español, de forma cordial y profesional
- No uses markdown`;
}

export async function generateLlmResponse(
  text: string,
  context: BusinessContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const llm = getLlm();
  const result = await llm.complete({
    system: systemPrompt,
    messages: [{ role: "user", content: text }],
    model: env.MODEL_RESPONDER,
    temperature: 0.5,
    maxTokens: 512,
  });

  return result.text;
}

export function getCannedResponse(
  intent: string,
  context: Record<string, string>,
  cannedFromDb: Record<string, string> = {}
): string | null {
  const template = cannedFromDb[intent];
  if (!template) return null;
  return renderTemplate(template, context);
}
