import crypto from "crypto";
import type { AgentKernelInput, AgentKernelOutput, AgentEvent, AgentEventType, MemoryUpdate } from "../types/agent-kernel.js";
import type { DecisionTrace, PolicyDecision, RiskFlags } from "../types/decision-trace.js";
import { ConversationSnapshotBuilder } from "./conversation-snapshot.js";
import type { AgentIntent, MediaItem, RouterDecision } from "../types/agent-intent.js";
import { detectSentiment } from "../../../lib/sentiment.js";
import { criticize, type ResponseCriticResult } from "../response/response-critic.js";

export interface KernelProviders {
  classifyIntent: (text: string) => Promise<RouterDecision>;
  getCannedResponse: (key: string, vars?: Record<string, string>) => string | null;
  generateLlmResponse: (text: string, context: Record<string, unknown>) => Promise<string>;
  evaluateFlow: (conversationId: string, intent: AgentIntent, text: string) => Promise<{ response: string; route: string; media?: MediaItem[] } | null>;
  evaluatePolicy: (text: string, intent: AgentIntent, riskFlags: RiskFlags) => PolicyDecision;
  detectRisks: (text: string, intent: AgentIntent) => RiskFlags;
  loadContext: (input: AgentKernelInput) => Promise<Record<string, unknown>>;
  resolveMedia?: (serviceName: string | undefined, intent: AgentIntent, city?: string) => MediaItem[] | undefined;
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

    const flowResult = await this.providers.evaluateFlow(input.conversationId, routerDecision.intent, input.messageText);
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
