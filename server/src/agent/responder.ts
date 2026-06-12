import { getLlm } from "./llm/index.js";
import { env } from "../env.js";
import { renderTemplate } from "./template.js";

export interface BusinessContext {
  persona: string;
  catalog: string;
  rules: string;
  hours: string;
}

export async function generateLlmResponse(
  text: string,
  context: BusinessContext
): Promise<string> {
  const systemPrompt = `Eres un asistente virtual de una clínica estética.
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

// Respuestas predefinidas para intenciones comunes
const CANNED_RESPONSES: Record<string, string> = {
  charla: "¡Hola {nombre}! Soy el asistente virtual de la clínica. ¿En qué puedo ayudarte hoy? 😊",
  faq: "Con gusto te ayudamos con esa información. ¿Podrías darme más detalles para orientarte mejor?",
  precio: "Con gusto te damos información sobre nuestros precios. ¿Qué servicio te interesa?",
};

export function getCannedResponse(intent: string, context: Record<string, string>): string | null {
  const template = CANNED_RESPONSES[intent];
  if (!template) return null;
  return renderTemplate(template, context);
}
