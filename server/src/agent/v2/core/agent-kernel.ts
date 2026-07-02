import crypto from "crypto";
import type { AgentKernelInput, AgentKernelOutput, AgentEvent, AgentEventType, MemoryUpdate } from "../types/agent-kernel.js";
import type { DecisionTrace, PolicyDecision, RiskFlags } from "../types/decision-trace.js";
import { ConversationSnapshotBuilder } from "./conversation-snapshot.js";
import type { AgentIntent, ExtractedEntities, MediaItem, RouterDecision } from "../types/agent-intent.js";
import { detectSentiment } from "../../../lib/sentiment.js";
import { criticize, type ResponseCriticResult } from "../response/response-critic.js";

export interface KernelProviders {
  classifyIntent: (text: string) => Promise<RouterDecision>;
  getCannedResponse: (key: string, vars?: Record<string, string>) => string | null;
  generateLlmResponse: (text: string, context: Record<string, unknown>) => Promise<string>;
  evaluateFlow: (conversationId: string, intent: AgentIntent, text: string, entities?: ExtractedEntities) => Promise<{ response: string; route: string; media?: MediaItem[] } | null>;
  evaluatePolicy: (text: string, intent: AgentIntent, riskFlags: RiskFlags) => PolicyDecision;
  detectRisks: (text: string, intent: AgentIntent) => RiskFlags;
  loadContext: (input: AgentKernelInput) => Promise<Record<string, unknown>>;
  resolveMedia?: (serviceName: string | undefined, intent: AgentIntent, city?: string) => MediaItem[] | undefined;
}

// ── Push 3 — recomendaciones por zona corporal ──────────────────────────────
// Cada entrada mapea una zona/preocupación estética a los servicios reales del
// catálogo de Santa María que la resuelven. La respuesta NO da precio final (varía
// por ciudad; lo resuelve el flow de precio) y siempre cierra invitando a la
// valoración — coherente con la política (no prometer resultados, no diagnosticar).
const BODY_ZONE_RECOMMENDATIONS: Array<{ pattern: RegExp; response: string }> = [
  {
    // Líneas de expresión / arrugas dinámicas → Botox
    pattern: /l[íi]neas?\s+de\s+expresi[óo]n|arrugas?\s+(de\s+expresi[óo]n|din[áa]micas?|del?\s+(entrecejo|frente|ojos))|patas?\s+de\s+gallo|entrecejo|frente\s+arrugad/i,
    response:
      "Para líneas de expresión lo que mejor funciona es el Botox 💉 Puede aplicarse por zona (entrecejo, frente, patas de gallo) o como Full Face Botox si quieres trabajar todo el rostro de una vez para una apariencia más fresca y descansada.\n\n¿Desde qué ciudad nos escribes? Así te doy el valor exacto y, si quieres, agendamos una valoración con el doctor para revisar tu caso 🤍",
  },
  {
    // Papada / grasa submentoniana
    pattern: /papada|grasa\s+(en\s+el\s+|del?\s+)?(cuello|ment[óo]n|submentoniana)|doble\s+ment[óo]n/i,
    response:
      "Para la papada tenemos la Lipopapada enzimática 💧 Reduce la grasa localizada de esa zona con enzimas (incluye dos aplicaciones, la segunda a los 8 días). Se complementa con la Faja mentonera para potenciar el resultado durante las noches.\n\n¿Desde qué ciudad nos escribes? Así te confirmo el valor según tu ubicación y te ayudo a agendar tu valoración 🤍",
  },
  {
    // Ojeras
    pattern: /ojeras?|bolsas?\s+(en\s+los\s+|debajo\s+de\s+los\s+)?ojos|c[íi]rculos?\s+oscuros/i,
    response:
      "Para las ojeras manejamos dos opciones según lo que necesites 👀\n• Ojeras con ácido hialurónico — mejora el hundimiento, hidrata y disminuye las bolsitas.\n• NCTF — Ojeras — hidratación profunda y mejora de la pigmentación de la ojera.\n\nEn una valoración el doctor define cuál te conviene. ¿Desde qué ciudad nos escribes para darte el valor? 🤍",
  },
  {
    // Pómulos
    pattern: /p[óo]mulos?|realzar\s+(los\s+)?(cachetes|mejillas)|volumen\s+en\s+(los\s+)?p[óo]mulos/i,
    response:
      "Para los pómulos tenemos la Proyección de pómulos con ácido hialurónico ✨ Realza y define los pómulos aportando volumen y soporte al rostro de forma armónica y natural.\n\n¿Desde qué ciudad nos escribes? Con gusto te doy el valor exacto y agendamos tu valoración 🤍",
  },
  {
    // Mentón / perfil
    pattern: /ment[óo]n|perfil(ar)?|proyectar\s+(el\s+)?ment[óo]n|barbilla/i,
    response:
      "Para el mentón tenemos la Proyección de mentón con ácido hialurónico ✨ Equilibra el rostro y proyecta el mentón de forma natural, mejorando el perfil y la simetría facial.\n\n¿Desde qué ciudad nos escribes? Así te doy el valor y, si deseas, agendamos tu valoración con el doctor 🤍",
  },
  {
    // Labios
    pattern: /labios?|boca|aumentar?\s+(los\s+)?labios|volumen\s+en\s+(los\s+)?labios|relleno\s+de\s+labios/i,
    response:
      "Para labios tenemos tres estilos según lo que busques 💋\n• Russian Lips — efecto más elevado y definido, con proyección del arco de cupido.\n• Doll Lips — volumen marcado, estilo muñeca, mayor proyección.\n• Red Lips — resultado natural y equilibrado con ácido hialurónico.\n\nEn la valoración el doctor te ayuda a elegir el que mejor va contigo. ¿Desde qué ciudad nos escribes para darte el valor? 🤍",
  },
];

function resolveBodyZoneRecommendation(text: string): string | null {
  const normalized = text.normalize("NFC");
  for (const { pattern, response } of BODY_ZONE_RECOMMENDATIONS) {
    if (pattern.test(normalized)) return response;
  }
  return null;
}

export class AgentKernel {
  private snapshotBuilder = new ConversationSnapshotBuilder();
  private providers: KernelProviders;

  constructor(providers: KernelProviders) {
    this.providers = providers;
  }

  private applyCritic(
    text: string,
    route: string,
    intent: AgentIntent,
    policyDecision: PolicyDecision,
    trace: DecisionTrace,
  ): { text: string; route: string } {
    const result: ResponseCriticResult = criticize({
      text,
      intent,
      policyAction: policyDecision.action,
      safetyLevel: policyDecision.safetyLevel,
      route,
    });

    trace.quality.criticPassed = result.passed;
    trace.quality.criticNotes = result.issues.map((i) => `[${i.severity}] ${i.message}`);
    trace.quality.criticIssues = result.issues;
    trace.quality.criticAction = result.action;

    const finalText = result.revisedResponse ?? text;

    switch (result.action) {
      case "block":
        trace.generation.route = "refusal";
        return { text: "Prefiero no responder a eso. ¿Hay algo más en lo que pueda ayudarte?", route: "refusal" };
      case "handoff":
        trace.generation.route = "handoff";
        return { text: finalText, route: "handoff" };
      case "revise_deterministically":
        return { text: finalText, route: route as any };
      case "regenerate_with_constraints":
        return { text: finalText, route: route as any };
      case "send":
      default:
        return { text: finalText, route: route as any };
    }
  }

  async process(input: AgentKernelInput): Promise<AgentKernelOutput> {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();
    const events: AgentEvent[] = [];
    const memoryUpdates: MemoryUpdate[] = [];

    const emit = (type: AgentEventType) => {
      events.push({
        type,
        traceId,
        conversationId: input.conversationId,
        tenantId: input.tenantId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });
    };

    emit("agent.message.received");

    const snapshot = this.snapshotBuilder.build(input, {
      businessContext: await this.providers.loadContext(input) as any,
    });

    emit("agent.snapshot.created");

    const sentiment = detectSentiment(input.messageText);

    const routerDecision = await this.providers.classifyIntent(snapshot.normalizedText);

    emit("agent.intent.detected");

    const riskFlags = this.providers.detectRisks(input.messageText, routerDecision.intent);

    const policyDecision = this.providers.evaluatePolicy(input.messageText, routerDecision.intent, riskFlags);

    emit("agent.policy.evaluated");

    const trace: DecisionTrace = {
      traceId,
      timestamp: new Date().toISOString(),
      input: {
        normalizedText: snapshot.normalizedText,
        language: "es",
        detectedPII: [],
      },
      understanding: {
        routerDecision,
        riskFlags,
        sentimentLabel: sentiment.label,
      },
      policy: policyDecision,
      funnelStage: "unknown",
      nextBestAction: "clarify_ambiguous_request",
      generation: {
        route: "llm",
      },
      quality: {
        criticPassed: true,
        criticNotes: [],
        criticIssues: [],
        criticAction: "send",
      },
    };

    // Embarazo/lactancia: Carlos confirmó que es un NO tajante (restricción médica sin
    // excepciones), no un "hay que evaluarlo" — respuesta fija, sin pasar por LLM libre.
    if (/\b(embarazo|embarazada|lactancia|dando\s+pecho|amamantando)\b/i.test(input.messageText)) {
      const pregnancyText =
        "No realizamos ningún tratamiento estético durante el embarazo o la lactancia — es una restricción de nuestro equipo médico, sin excepciones. Con gusto te cuento todo lo que necesites para cuando ya no aplique 🤍";
      const { text: finalText, route: finalRoute } = this.applyCritic(
        pregnancyText, "canned", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "canned";
      emit("agent.response.composed");
      emit("agent.response.sent");
      return {
        response: { text: finalText, route: finalRoute as any },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    // Rellenos/implantes previos de otra clínica: requiere valoración médica previa
    // (confirmado por Carlos) — respuesta fija, no dejar que el LLM improvise.
    if (/\b(implante|relleno)s?\s+(previo|anterior)|otra\s+cl[íi]nica.*(relleno|implante|bótox|botox)/i.test(input.messageText)) {
      const priorWorkText =
        "Si ya tienes rellenos o implantes de un procedimiento anterior (en otra clínica o con nosotros), necesitamos hacerte una valoración médica previa para confirmar que el tratamiento es viable en tu caso 🤍 ¿Te gustaría agendarla?";
      const { text: finalText, route: finalRoute } = this.applyCritic(
        priorWorkText, "canned", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "canned";
      emit("agent.response.composed");
      emit("agent.response.sent");
      return {
        response: { text: finalText, route: finalRoute as any },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    // Despedida / agradecimiento de cierre: "gracias", "ok gracias", "muchas gracias".
    // El bot repetía el prompt genérico ("¿qué servicio te interesa?") en vez de cerrar
    // cálidamente. Regex estricto anclado (^...$) para NO capturar "gracias, también
    // quiero saber X" — eso sí lleva intención y debe seguir por el pipeline normal.
    if (/^(ok\s+)?(muchas\s+)?gracias\.?!?$/i.test(input.messageText.trim())) {
      const farewellText = "¡Con gusto! Cuando quieras, aquí estoy 😊🤍";
      const { text: finalText, route: finalRoute } = this.applyCritic(
        farewellText, "canned", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "canned";
      emit("agent.response.composed");
      emit("agent.response.sent");
      return {
        response: { text: finalText, route: finalRoute as any },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    if (policyDecision.action === "block") {
      const refusalText = "Prefiero no responder a eso. ¿Hay algo más en lo que pueda ayudarte?";
      const { text: finalText, route: finalRoute } = this.applyCritic(
        refusalText, "refusal", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "refusal";
      emit("agent.response.composed");
      emit("agent.response.sent");
      return {
        response: { text: finalText, route: finalRoute as any },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    // Casos de handoff van con un texto fijo y correcto (no LLM libre): habla en primera
    // persona plural ("nuestro equipo"), porque Carlos SÍ representa a la clínica — no es
    // un tercero que solo "conecta" con ella. El texto varía según la razón real del
    // escalamiento: si hay señal clínica genuina, menciona síntomas/urgencias; si es solo
    // una solicitud de humano o una queja sin señal clínica, NO se inventan síntomas.
    if (policyDecision.action === "handoff") {
      const isClinicalRisk = riskFlags.hasEmergencyKeywords || riskFlags.hasClinicalRisk;
      const escalationText = isClinicalRisk
        ? "Entiendo tu preocupación 💛 Voy a escalar tu caso ahora mismo a nuestro equipo médico para que te contacten directamente y revisen lo que comentas. Si notas dificultad para respirar o el malestar empeora, por favor acude a urgencias de inmediato."
        : "Entendido, voy a escalar tu solicitud a nuestro equipo humano para que te contacten directamente. Gracias por tu paciencia 🤍";
      const { text: finalText, route: finalRoute } = this.applyCritic(
        escalationText, "handoff", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "handoff";
      emit("agent.response.composed");
      emit("agent.response.sent");
      return {
        response: { text: finalText, route: finalRoute as any },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    // Preguntas por zona corporal ("¿qué me sirve para la papada?", "para líneas de
    // expresión?"). Antes caían en el canned genérico faq_servicios (efecto secundario
    // del fix de alucinación: todo lo que el router determinístico clasifica como
    // faq_servicios por zona corporal terminaba en la misma respuesta genérica).
    // Aquí devolvemos una recomendación REAL del catálogo por zona, sin LLM libre y sin
    // dar precio final ambiguo (los precios varían por ciudad → el flow de precio los
    // resuelve). Solo aplica a intents informativos, nunca a booking/queja/riesgo.
    if (routerDecision.intent === "faq_servicios") {
      const zoneAnswer = resolveBodyZoneRecommendation(input.messageText);
      if (zoneAnswer) {
        const { text: finalText, route: finalRoute } = this.applyCritic(
          zoneAnswer, "canned", routerDecision.intent, policyDecision, trace,
        );
        trace.generation.route = "canned";
        emit("agent.response.composed");
        emit("agent.response.sent");
        return {
          response: { text: finalText, route: finalRoute as any },
          decisionTrace: trace,
          memoryUpdates,
        };
      }
    }

    // "¿Quién es el doctor?" / "¿qué doctor me atiende?" → nombres de especialistas.
    // nombres_doctores es solo una clave de canned (mapeada a dudas_medicas en el
    // router), no un intent que el LLM pueda emitir, así que sin este caso especial
    // la pregunta caía en el canned genérico de dudas_medicas (duraciones). Lo
    // resolvemos determinísticamente devolviendo el canned nombres_doctores.
    // Se excluye "mal/maltrato/trató mal" para no robarle una queja al pipeline.
    if (
      /\b(qui[eé]n\s+es\s+el\s+doctor|qui[eé]nes?\s+son\s+(los|las)\s+(doctores?|m[eé]dicos?|especialistas?)|qu[eé]\s+doctor(a)?\s+(me\s+)?(atiende|ver[áa]|va\s+a\s+atender)|nombre\s+del?\s+(doctor|m[eé]dico|especialista)|c[óo]mo\s+se\s+llama\s+el\s+(doctor|m[eé]dico|especialista))\b/i.test(input.messageText) &&
      !/\b(mal|maltrat|grosero|p[eé]sim|trat[óo]\s+mal)\b/i.test(input.messageText)
    ) {
      const doctorsCanned = this.providers.getCannedResponse("nombres_doctores");
      if (doctorsCanned) {
        const { text: finalText, route: finalRoute } = this.applyCritic(
          doctorsCanned, "canned", routerDecision.intent, policyDecision, trace,
        );
        trace.generation.route = "canned";
        emit("agent.response.composed");
        emit("agent.response.sent");
        return {
          response: { text: finalText, route: finalRoute as any },
          decisionTrace: trace,
          memoryUpdates,
        };
      }
    }

    // Casos sensibles que matchean intent "precio" y arrancaban el precio_flow, cuyo
    // primer estado abre con "¡Claro!" — un opener que sonaba como si CONFIRMÁRAMOS la
    // comparación o el descuento. Los interceptamos ANTES del dispatch a flow con un
    // canned que NO empieza confirmando.
    if (routerDecision.intent === "precio") {
      // Comparación con la competencia ("¿son mejores que la clínica X?"). Política:
      // nunca hablar de/comparar con la competencia. Reencuadramos hacia nuestro valor.
      if (/\bmejor(es)?\s+que\b|\bcompit(en|encia)\b|otra\s+cl[íi]nica|otras?\s+cl[íi]nicas?/i.test(input.messageText)) {
        const competitorText =
          "No me gusta compararnos con otras clínicas 🙂 Lo que sí puedo contarte es cómo trabajamos en Santa María: valoración personalizada con el doctor, productos y protocolos que cuidamos al detalle, y un acompañamiento cercano en todo tu proceso. ¿Te gustaría que te cuente sobre algún tratamiento en particular o agendamos tu valoración? 🤍";
        const { text: finalText, route: finalRoute } = this.applyCritic(
          competitorText, "canned", routerDecision.intent, policyDecision, trace,
        );
        trace.generation.route = "canned";
        emit("agent.response.composed");
        emit("agent.response.sent");
        return {
          response: { text: finalText, route: finalRoute as any },
          decisionTrace: trace,
          memoryUpdates,
        };
      }
      // Descuento especial / negociación de precio. Política: descuentos/canjes se
      // manejan con Elkin, no se confirman en el chat. Nada de "¡Claro!" de apertura.
      if (/descuento\s+especial|me\s+hacen?\s+(un\s+)?descuento|rebaja|negociar\s+(el\s+)?precio|me\s+lo\s+dejan?\s+m[áa]s\s+barato/i.test(input.messageText)) {
        const discountText =
          "Los descuentos y promociones especiales los maneja directamente Elkin 🙂 Con gusto te paso el contacto para que revisen tu caso:\n📞 Elkin Acevedo: 318 735 4841\n📧 esteticasantamariabga@gmail.com\n\nMientras tanto, ¿te gustaría que te cuente sobre el tratamiento que te interesa o agendamos tu valoración? 🤍";
        const { text: finalText, route: finalRoute } = this.applyCritic(
          discountText, "canned", routerDecision.intent, policyDecision, trace,
        );
        trace.generation.route = "canned";
        emit("agent.response.composed");
        emit("agent.response.sent");
        return {
          response: { text: finalText, route: finalRoute as any },
          decisionTrace: trace,
          memoryUpdates,
        };
      }
    }

    const flowResult = await this.providers.evaluateFlow(input.conversationId, routerDecision.intent, input.messageText, routerDecision.entities);
    if (flowResult) {
      const { text: finalText, route: finalRoute } = this.applyCritic(
        flowResult.response, "flow", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "flow";
      emit("agent.response.composed");
      emit("agent.response.sent");
      return {
        response: { text: finalText, route: finalRoute as any, media: flowResult.media },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    const canned = this.providers.getCannedResponse(routerDecision.intent);
    if (canned) {
      const { text: finalText, route: finalRoute } = this.applyCritic(
        canned, "canned", routerDecision.intent, policyDecision, trace,
      );
      trace.generation.route = "canned";
      emit("agent.response.composed");
      emit("agent.response.sent");
      const cannedMedia = this.providers.resolveMedia?.(routerDecision.entities?.service, routerDecision.intent, routerDecision.entities?.city);
      return {
        response: { text: finalText, route: finalRoute as any, media: cannedMedia },
        decisionTrace: trace,
        memoryUpdates,
      };
    }

    const llmText = await this.providers.generateLlmResponse(input.messageText, {
      intent: routerDecision.intent,
      sentiment: sentiment.label,
      context: snapshot.businessContext,
    });

    const { text: finalText, route: finalRoute } = this.applyCritic(
      llmText, "llm", routerDecision.intent, policyDecision, trace,
    );
    trace.generation.route = "llm";
    emit("agent.response.composed");
    emit("agent.response.sent");

    const llmMedia = this.providers.resolveMedia?.(routerDecision.entities?.service, routerDecision.intent, routerDecision.entities?.city);
    return {
      response: { text: finalText, route: finalRoute as any, media: llmMedia },
      decisionTrace: trace,
      memoryUpdates,
    };
  }
}

export function createAgentKernel(providers: KernelProviders): AgentKernel {
  return new AgentKernel(providers);
}
