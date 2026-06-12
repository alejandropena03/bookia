import { getLlm } from "./llm/index.js";
import { env } from "../env.js";

export interface RouterResult {
  intent: string;
  confidence: number;
  extractedSlots: Record<string, string>;
}

const SYSTEM_PROMPT = `Eres un clasificador de intenciones para una clínica estética.
Clasifica el mensaje del cliente en UNA de estas intenciones:
- "agendamiento": el cliente quiere agendar, reservar, programar una cita
- "precio": pregunta por costos, tarifas, cuánto vale
- "faq": pregunta general sobre servicios, horarios, ubicación
- "queja": está molesto, tuvo reacción, emergencia, quiere cancelar
- "charla": saludo, agradecimiento, conversación casual
- "otro": no encaja en ninguna anterior

Responde SOLO con JSON:
{"intent": "...", "confidence": 0.xx, "extractedSlots": {"...": "..."}}`;

export async function classifyIntent(text: string): Promise<RouterResult> {
  const llm = getLlm();
  const result = await llm.complete({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
    model: env.MODEL_ROUTER,
    temperature: 0.1,
    maxTokens: 256,
  });

  try {
    const parsed = JSON.parse(result.text);
    return {
      intent: parsed.intent ?? "otro",
      confidence: parsed.confidence ?? 0,
      extractedSlots: parsed.extractedSlots ?? {},
    };
  } catch {
    return { intent: "otro", confidence: 0, extractedSlots: {} };
  }
}
