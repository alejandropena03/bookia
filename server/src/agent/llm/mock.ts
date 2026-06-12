import { LlmProvider, LlmCompleteParams, LlmResult } from "./types.js";

export class MockLlmProvider implements LlmProvider {
  async complete(params: LlmCompleteParams): Promise<LlmResult> {
    const lastMsg = params.messages[params.messages.length - 1]?.content ?? "";
    const text = this.generateResponse(lastMsg, params.system);

    return {
      text,
      usage: { inputTokens: 50, outputTokens: 20 },
      model: params.model ?? "mock",
    };
  }

  private generateResponse(_input: string, system: string): string {
    const lower = _input.toLowerCase();

    if (lower.includes("agendar") || lower.includes("cita") || lower.includes("reservar")) {
      return JSON.stringify({
        intent: "agendamiento",
        confidence: 0.95,
        extractedSlots: {},
      });
    }
    if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuánto") || lower.includes("vale")) {
      return JSON.stringify({
        intent: "precio",
        confidence: 0.92,
        extractedSlots: {},
      });
    }
    if (lower.includes("emergencia") || lower.includes("reacción") || lower.includes("alergia") || lower.includes("molesto") || lower.includes("dolor") || lower.includes("duele")) {
      return JSON.stringify({
        intent: "queja",
        confidence: 0.9,
        extractedSlots: {},
      });
    }
    if (lower.includes("hola") || lower.includes("buenos") || lower.includes("gracias")) {
      return JSON.stringify({
        intent: "charla",
        confidence: 0.85,
        extractedSlots: {},
      });
    }

    return `Respuesta simulada del asistente. Basado en: ${system.slice(0, 100)}...`;
  }
}
