import { z } from "zod";
import { getLlm } from "./llm/index.js";
import { env } from "../env.js";

const RouterResultSchema = z.object({
  intent: z.enum(["agendamiento", "precio", "faq", "queja", "charla", "otro"]),
  confidence: z.number().min(0).max(1),
  extractedSlots: z.record(z.string()).default({}),
});

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

Responde SOLO con JSON SIN markdown fences:
{"intent": "...", "confidence": 0.xx, "extractedSlots": {"...": "..."}}`;

function stripFences(text: string): string {
  return text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "").trim();
}

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
    const cleaned = stripFences(result.text);
    const parsed = RouterResultSchema.parse(JSON.parse(cleaned));
    return parsed;
  } catch {
    return { intent: "otro", confidence: 0, extractedSlots: {} };
  }
}
