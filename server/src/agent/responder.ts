import { getLlm } from "./llm/index.js";
import { env } from "../env.js";
import { renderTemplate } from "../flows/template.js";
import type { Msg } from "./llm/types.js";
import { type SentimentLabel, getToneInstruction, getValidationPrefix } from "../lib/sentiment.js";

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

export interface ConversationHistory {
  messages: { role: "user" | "assistant"; text: string }[];
  slots: Record<string, string>;
  contactName?: string;
  sentiment?: SentimentLabel;
}

function buildSystemPrompt(context: BusinessContext, history?: ConversationHistory): string {
  if (context.systemPromptOverrides) {
    return context.systemPromptOverrides;
  }

  const citySlot = history?.slots?.city || history?.slots?.ciudad || "";
  const serviceSlot = history?.slots?.service || history?.slots?.service_name || "";
  const contextLine = citySlot || serviceSlot
    ? `\n\nContexto de la conversación actual:\n- Ciudad del cliente: ${citySlot || "(no confirmada)"}\n- Servicio de interés: ${serviceSlot || "(no confirmado)"}`
    : "";

  const toneInstruction = history?.sentiment ? getToneInstruction(history.sentiment) : "";

  return `Eres Carlos, el asistente virtual con IA de Santa María Clínica Estética. No eres un humano — eres un sistema de inteligencia artificial entrenado con la información oficial de la clínica. Si el cliente pregunta, sé transparente: eres IA que ayuda con información y agendamiento, conectando con un humano cuando sea necesario.
${context.persona}

Catálogo de servicios:
${context.catalog}

Reglas importantes:
${context.rules}

Horarios:
${context.hours}
${contextLine}

${toneInstruction}

IMPORTANTE — Sigue estas reglas SIEMPRE:
- NO inventes precios que no estén en el catálogo. Si no lo sabes, di que necesitas confirmar.
- NO des diagnósticos médicos ni recomiendas qué tratamiento es "el mejor" para el cliente.
- NO confirmes que algo le va a funcionar al paciente. Solo informas y ofreces valoración.
- NO menciones a la competencia.
- NO des presupuestos sin valoración previa.
- NO suenes a bot. Nada de "¡Con gusto!", "Qué alegría", "Será un placer". Habla natural.
- Frases cortas, como texto de WhatsApp. Pregunta una cosa a la vez.
- Usa emojis con moderación (✨ 😊 🤍) pero sin exagerar.
- Si el cliente pregunta algo fuera de tu alcance (médico, legal, descuentos), sugiere contactar a un asesor.
- Siempre ofrece agendar una valoración con el doctor cuando sea relevante.
- Responde en español, cordial pero sin ser empalagoso.
- No uses markdown ni formato. Solo texto plano como WhatsApp.`;
}

export async function generateLlmResponse(
  text: string,
  context: BusinessContext,
  history?: ConversationHistory
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context, history);

  const messages: Msg[] = [];

  if (history?.messages && history.messages.length > 0) {
    const recent = history.messages.slice(-10);
    for (const m of recent) {
      messages.push({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      });
    }
  }

  messages.push({ role: "user", content: text });

  const llm = getLlm();
  const result = await llm.complete({
    system: systemPrompt,
    messages,
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

export function addValidationPrefix(text: string, sentimentLabel?: SentimentLabel): string {
  const prefix = sentimentLabel ? getValidationPrefix(sentimentLabel) : null;
  if (!prefix) return text;
  return `${prefix} ${text}`;
}

