import { LlmProvider, LlmCompleteParams, LlmResult } from "./types.js";

function isRouterCall(system: string): boolean {
  const s = system.toLowerCase();
  return s.includes("clasificador de intenciones") || s.includes("intención exacta") || s.includes("intenciones válidas");
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
    const lower = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // queja / escalation — check FIRST (emergency keywords override everything)
    if (lower.includes("emergencia") || lower.includes("reaccion") || lower.includes("alergia") || lower.includes("molesto") || lower.includes("insatisfecho") || lower.includes("reclamo") || lower.includes("queja") || lower.includes("cancelar") || lower.includes("demanda") || lower.includes("abogado") || lower.includes("me duele") || lower.includes("me hinche")) {
      return JSON.stringify({ intent: "queja", confidence: 0.9, extractedSlots: {} });
    }

    // specific service intents
    if (lower.includes("rinomodelacion") || lower.includes("nariz")) {
      return JSON.stringify({ intent: "rinomodelacion", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("full face") || lower.includes("armonizacion") || lower.includes("armonización") || lower.includes("diseño facial")) {
      return JSON.stringify({ intent: "armonizacion_facial", confidence: 0.9, extractedSlots: {} });
    }

    // topic-specific intents
    if (lower.includes("ubicacion") || lower.includes("direccion") || lower.includes("donde") || lower.includes("sede") || lower.includes("como llego") || lower.includes("cómo llego")) {
      return JSON.stringify({ intent: "ubicacion", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("horario") || lower.includes("atienden") || lower.includes("abren") || lower.includes("cierran") || lower.includes("que dias") || lower.includes("qué días") || lower.includes("sabado") || lower.includes("sábado") || lower.includes("domingo")) {
      return JSON.stringify({ intent: "horarios", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("pago") || lower.includes("pagar") || lower.includes("transferencia") || lower.includes("tarjeta") || lower.includes("nequi") || lower.includes("bancolombia") || lower.includes("zelle") || lower.includes("metodos de pago") || lower.includes("medios de pago")) {
      return JSON.stringify({ intent: "pago", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("valoracion") || lower.includes("valoración")) {
      return JSON.stringify({ intent: "valoracion", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("duele") || lower.includes("dolor") || lower.includes("cuanto dura") || lower.includes("cuánto dura") || lower.includes("cuidados") || lower.includes("anestesia") || lower.includes("efecto") || lower.includes("recomendacion") || lower.includes("recomendación")) {
      return JSON.stringify({ intent: "dudas_medicas", confidence: 0.88, extractedSlots: {} });
    }
    if (lower.includes("descuento") || lower.includes("canje") || lower.includes("negocio") || lower.includes("publicidad") || lower.includes("colaboracion") || lower.includes("colaboración") || lower.includes("propuesta")) {
      return JSON.stringify({ intent: "solicitud_comercial", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("reembolso") || lower.includes("devolucion") || lower.includes("devolución") || lower.includes("garantia") || lower.includes("garantía")) {
      return JSON.stringify({ intent: "devolucion", confidence: 0.9, extractedSlots: {} });
    }
    if (lower.includes("doctor") || lower.includes("doctora") || lower.includes("especialista") || lower.includes("medico") || lower.includes("médico") || lower.includes("quien atiende") || lower.includes("quién atiende")) {
      return JSON.stringify({ intent: "nombres_doctores", confidence: 0.88, extractedSlots: {} });
    }
    if (lower.includes("reagendar") || lower.includes("reprogramar") || lower.includes("control")) {
      return JSON.stringify({ intent: "reagendamiento_control", confidence: 0.88, extractedSlots: {} });
    }

    // agendamiento — check before precio (both can mention "cita")
    if (lower.includes("agendar") || lower.includes("reservar") || lower.includes("separar") || lower.includes("programar") || (lower.includes("cita") && !lower.includes("cancelar"))) {
      return JSON.stringify({ intent: "agendamiento", confidence: 0.95, extractedSlots: {} });
    }

    // precio
    if (lower.includes("precio") || lower.includes("costo") || lower.includes("cuanto") || lower.includes("cuánto") || lower.includes("vale") || lower.includes("valor") || lower.includes("tarifa") || lower.includes("presupuesto")) {
      return JSON.stringify({ intent: "precio", confidence: 0.92, extractedSlots: {} });
    }

    // charla
    if (lower.includes("hola") || lower.includes("buenos") || lower.includes("buenas") || lower.includes("gracias") || lower.includes("perfecto") || lower.includes("ok") || lower.trim() === "si" || lower.trim() === "sí") {
      return JSON.stringify({ intent: "charla", confidence: 0.85, extractedSlots: {} });
    }

    // faq — general service questions
    if (lower.includes("servicio") || lower.includes("tratamiento") || lower.includes("procedimiento") || lower.includes("que hacen") || lower.includes("qué hacen") || lower.includes("ofrecen")) {
      return JSON.stringify({ intent: "faq", confidence: 0.8, extractedSlots: {} });
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
