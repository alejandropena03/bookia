import { LlmProvider, LlmCompleteParams, LlmResult } from "./types.js";

function isRouterCall(system: string): boolean {
  return system.toLowerCase().includes("clasificador de intenciones");
}

export class MockLlmProvider implements LlmProvider {
  async complete(params: LlmCompleteParams): Promise<LlmResult> {
    const lastMsg = params.messages[params.messages.length - 1]?.content ?? "";
    const text = isRouterCall(params.system)
      ? this.classifyIntent(lastMsg)
      : this.generateResponse(lastMsg, params.system);

    return {
      text,
      usage: { inputTokens: 50, outputTokens: 20 },
      model: params.model ?? "mock",
    };
  }

  private classifyIntent(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes("agendar") || lower.includes("cita") || lower.includes("reservar")) {
      return JSON.stringify({ intent: "agendamiento", confidence: 0.95, extractedSlots: {} });
    }
    if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuánto") || lower.includes("vale")) {
      return JSON.stringify({ intent: "precio", confidence: 0.92, extractedSlots: {} });
    }
    if (lower.includes("emergencia") || lower.includes("reacción") || lower.includes("alergia") || lower.includes("molesto") || lower.includes("dolor") || lower.includes("duele")) {
      return JSON.stringify({ intent: "queja", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("hola") || lower.includes("buenos") || lower.includes("gracias")) {
      return JSON.stringify({ intent: "charla", confidence: 0.85, extractedSlots: {} });
    }
    return JSON.stringify({ intent: "otro", confidence: 0.3, extractedSlots: {} });
  }

  private generateResponse(input: string, system: string): string {
    const lower = input.toLowerCase();
    if (lower.includes("hola") || lower.includes("buenos")) {
      return "¡Hola! Encantado de atenderte. ¿En qué puedo ayudarte hoy?";
    }
    if (lower.includes("agendar") || lower.includes("cita") || lower.includes("reservar")) {
      return "Claro, con gusto te ayudo a agendar una cita. ¿Qué servicio te interesa?";
    }
    if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuánto") || lower.includes("vale")) {
      return "Claro, nuestros servicios tienen los siguientes precios:\n- Consulta inicial: $100.000 COP\n- Tratamiento facial: $250.000 COP\n- Depilación láser: $180.000 COP\n- Masaje relajante: $150.000 COP\n- Paquete bienestar: $1.200.000 COP\n\n¿Te gustaría agendar alguno de ellos?";
    }
    if (lower.includes("gracias")) {
      return "¡De nada! Que tengas un excelente día. 😊";
    }
    return `Entendido. Déjame consultar eso para ti. Por los datos que me das, creo que lo mejor será que hables con un asesor que pueda darte información más detallada.`;
  }
}
