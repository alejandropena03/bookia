import { getLlm } from "./llm/index.js";
import { env } from "../env.js";

interface MessageForSummary {
  senderType: string;
  text: string | null;
  createdAt: string;
}

export async function summarizeConversation(
  messages: MessageForSummary[],
  contactName: string
): Promise<string> {
  const recent = messages.slice(-20);
  const transcript = recent
    .map((m) => `[${m.senderType}] ${m.text ?? ""}`)
    .join("\n");

  const systemPrompt = `Eres un asistente que genera resúmenes de conversaciones para un operador humano.
Genera un resumen estructurado en 3-5 líneas con:
- Qué quiere el cliente
- Qué se le ofreció
- Por qué escaló
- Datos capturados (servicio de interés, ciudad, horario preferido)
- Tono del cliente (molesto / curioso / listo para comprar)

Formato: texto plano, sin markdown, sin títulos.`;

  const llm = getLlm();
  const result = await llm.complete({
    system: systemPrompt,
    messages: [
      { role: "user", content: `Cliente: ${contactName}\n\nConversación:\n${transcript}` },
    ],
    model: env.MODEL_RESPONDER,
    temperature: 0.2,
    maxTokens: 256,
  });

  return result.text.trim();
}
