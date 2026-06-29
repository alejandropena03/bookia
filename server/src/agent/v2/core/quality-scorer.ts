import crypto from "crypto";
import type { RouterDecision } from "../types/agent-intent.js";
import type {
  QualityScore,
  QualityDimension,
  DimensionScore,
  ReviewQueueEntry,
} from "../types/quality-score.js";

const WEIGHTS: Record<QualityDimension, number> = {
  intent_accuracy: 0.25,
  response_completeness: 0.20,
  safety_compliance: 0.20,
  tone_appropriateness: 0.10,
  pii_handling: 0.10,
  escalation_appropriateness: 0.10,
  confidence_calibration: 0.05,
};

function scoreIntentAccuracy(input: string, response: string, routerDecision: RouterDecision): DimensionScore {
  const intentResponsePatterns: Record<string, RegExp[]> = {
    agendamiento: [/\b(agendar|cita|reservar|turno|separar|disponible)\b/i],
    precio: [/\b(precio|cuesta|vale|costo|tarifa)\b/i],
    queja: [/\b(lamento|sentimos|disculpa|queja|escalar)\b/i],
    charla: [/\b(gracias|claro|gusto|encantado|bienvenido)\b/i],
    dudas_medicas: [/\b(tratamiento|procedimiento|funciona|[aá]cido|botox|efecto)\b/i],
    contraindicaciones: [/\b(contraindicación|recomendamos|consulta|especialista)\b/i],
    post_tratamiento: [/\b(cuidado|despu[eé]s|recomendamos|aplicar|usar)\b/i],
    saludo: [/\b(buenas|hola|bienvenido|saludos)\b/i],
    ubicacion: [/\b(dirección|ubicación|estamos|sede)\b/i],
    horarios: [/\b(horario|atiendo|abrimos)[a-z]*\b/i],
    pago: [/\b(pago|tarjeta|transferencia|cuota|financiación)\b/i],
    valoracion: [/\b(valoración|consulta|plan|personalizado)\b/i],
    faq_servicios: [/\b(servicio|tratamiento|ofrece|recomendación|zona)\b/i],
    faq_contacto: [/\b(tel[eé]fono|whatsapp|correo|email|contacto)\b/i],
    resultados_esperados: [/\b(resultado|duración|efecto|sesión|frecuencia)\b/i],
    cancelacion_reprogramacion: [/\b(cancelar|reprogramar|reagendar|cancelación)\b/i],
    hablar_humano: [/\b(asesor|persona|humano|transferir|comunicar)\b/i],
    otro: [],
  };

  const patterns = intentResponsePatterns[routerDecision.intent];
  if (!patterns || patterns.length === 0) {
    return { score: 0.8, weight: WEIGHTS.intent_accuracy, reason: "intent sin señales de validación específicas" };
  }

  const matchCount = patterns.filter((p) => p.test(response)).length;
  const ratio = matchCount / patterns.length;
  const score = 0.5 + ratio * 0.5;

  return {
    score: Math.min(score, 1.0),
    weight: WEIGHTS.intent_accuracy,
    reason: ratio >= 0.5 ? "responde coherente con intent" : "pocas señales del intent en la respuesta",
  };
}

function scoreResponseCompleteness(input: string, response: string): DimensionScore {
  const inputWords = input
    .toLowerCase()
    .replace(/[¿?¡!.,;:()]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["para", "como", "con", "por", "las", "los", "una", "uno"].includes(w));

  if (inputWords.length === 0) {
    return { score: 0.9, weight: WEIGHTS.response_completeness, reason: "input sin palabras significativas" };
  }

  const matched = inputWords.filter((w) => response.toLowerCase().includes(w)).length;
  const ratio = matched / inputWords.length;
  const score = Math.min(0.3 + ratio * 0.7, 1.0);

  return {
    score,
    weight: WEIGHTS.response_completeness,
    reason: ratio > 0.3
      ? `responde a ${matched}/${inputWords.length} términos clave del input`
      : "pocos términos del input reflejados en la respuesta",
  };
}

function scoreSafetyCompliance(routerDecision: RouterDecision): DimensionScore {
  const rf = routerDecision.riskFlags;
  if (!rf) {
    return { score: 1.0, weight: WEIGHTS.safety_compliance, reason: "sin risk flags — seguro por defecto" };
  }

  let penalty = 0;
  const reasons: string[] = [];

  if (rf.hasPromptInjection) {
    penalty += 0.4;
    reasons.push("injection detectado — requiere revisión");
  }
  if (rf.hasClinicalRisk && routerDecision.safetyLevel !== "handoff" && routerDecision.safetyLevel !== "caution") {
    penalty += 0.3;
    reasons.push("riesgo clínico sin precaución adecuada");
  }
  if (rf.needsEscalation && routerDecision.safetyLevel !== "handoff") {
    penalty += 0.2;
    reasons.push("necesita escalación pero no se marcó handoff");
  }

  const score = Math.max(1.0 - penalty, 0.1);
  return {
    score,
    weight: WEIGHTS.safety_compliance,
    reason: reasons.length > 0 ? reasons.join("; ") : "cumple con política de seguridad",
  };
}

function scoreToneAppropriateness(response: string): DimensionScore {
  const coldIndicators = [
    /no puedo|no estoy autorizado|según mi programación|como IA|como inteligencia artificial/i,
  ];
  const warmIndicators = [
    /claro|con gusto|encantado|por supuesto|feliz|cuenta conmigo|me alegra|entiendo/i,
  ];

  const coldHits = coldIndicators.filter((r) => r.test(response)).length;
  const warmHits = warmIndicators.filter((r) => r.test(response)).length;

  const score = Math.min(0.5 + warmHits * 0.15 - coldHits * 0.25, 1.0);
  const clamped = Math.max(score, 0.1);

  return {
    score: clamped,
    weight: WEIGHTS.tone_appropriateness,
    reason: coldHits > 0
      ? "tono frío detectado (lenguaje robótico/restrictivo)"
      : warmHits > 0
        ? "tono cálido apropiado"
        : "tono neutro",
  };
}

function scorePiiHandling(response: string, detectedPII: string[]): DimensionScore {
  if (detectedPII.length === 0) {
    return { score: 1.0, weight: WEIGHTS.pii_handling, reason: "sin PII detectado en input" };
  }

  const piiLeakage = /\b(\d{5,10}|\d{7,10}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/.test(response);
  if (piiLeakage) {
    return {
      score: 0.1,
      weight: WEIGHTS.pii_handling,
      reason: "posible fuga de PII en la respuesta (números/email)",
    };
  }

  return {
    score: 1.0,
    weight: WEIGHTS.pii_handling,
    reason: `PII detectado en input (${detectedPII.join(", ")}) pero no replicado en respuesta`,
  };
}

function scoreEscalationAppropriateness(routerDecision: RouterDecision): DimensionScore {
  const rf = routerDecision.riskFlags;
  if (!rf) {
    return { score: 1.0, weight: WEIGHTS.escalation_appropriateness, reason: "sin risk flags" };
  }

  if (rf.needsEscalation && routerDecision.safetyLevel === "handoff") {
    return { score: 1.0, weight: WEIGHTS.escalation_appropriateness, reason: "escalación correcta para el nivel de riesgo" };
  }

  if (rf.needsEscalation && routerDecision.safetyLevel !== "handoff") {
    return { score: 0.3, weight: WEIGHTS.escalation_appropriateness, reason: "necesita escalación pero safetyLevel no es handoff" };
  }

  if (!rf.needsEscalation && routerDecision.safetyLevel === "handoff") {
    return { score: 0.5, weight: WEIGHTS.escalation_appropriateness, reason: "handoff sin necesidad de escalación" };
  }

  return { score: 1.0, weight: WEIGHTS.escalation_appropriateness, reason: "no requiere escalación" };
}

function scoreConfidenceCalibration(confidence: number): DimensionScore {
  if (confidence >= 0.9) {
    return { score: 1.0, weight: WEIGHTS.confidence_calibration, reason: "confianza alta" };
  }
  if (confidence >= 0.7) {
    return { score: 0.8, weight: WEIGHTS.confidence_calibration, reason: "confianza media-alta" };
  }
  if (confidence >= 0.5) {
    return { score: 0.5, weight: WEIGHTS.confidence_calibration, reason: "confianza media — posible incertidumbre" };
  }
  return { score: 0.2, weight: WEIGHTS.confidence_calibration, reason: "confianza baja — requiere revisión" };
}

function shouldRequestReview(
  qualityScore: QualityScore,
  confidence: number,
  riskFlags: RouterDecision["riskFlags"],
  safetyLevel: string | undefined,
): { requiresReview: boolean; reason?: string } {
  if (confidence < 0.6) return { requiresReview: true, reason: "confianza baja" };
  if (qualityScore.overall < 0.5) return { requiresReview: true, reason: "calidad general baja" };
  if (riskFlags?.hasClinicalRisk) return { requiresReview: true, reason: "riesgo clínico detectado" };
  if (riskFlags?.hasPIIExposure) return { requiresReview: true, reason: "exposición de PII" };
  if (riskFlags?.hasPromptInjection) return { requiresReview: true, reason: "intento de inyección" };
  if (riskFlags?.needsEscalation) return { requiresReview: true, reason: "requiere escalación" };
  if (safetyLevel === "caution" || safetyLevel === "blocked") {
    return { requiresReview: true, reason: `safetyLevel: ${safetyLevel}` };
  }
  return { requiresReview: false };
}

export function scoreResponse(input: {
  text: string;
  response: string;
  routerDecision: RouterDecision;
  detectedPII: string[];
}): QualityScore {
  const dimensions: Record<string, DimensionScore> = {
    intent_accuracy: scoreIntentAccuracy(input.text, input.response, input.routerDecision),
    response_completeness: scoreResponseCompleteness(input.text, input.response),
    safety_compliance: scoreSafetyCompliance(input.routerDecision),
    tone_appropriateness: scoreToneAppropriateness(input.response),
    pii_handling: scorePiiHandling(input.response, input.detectedPII),
    escalation_appropriateness: scoreEscalationAppropriateness(input.routerDecision),
    confidence_calibration: scoreConfidenceCalibration(input.routerDecision.confidence),
  };

  let totalWeight = 0;
  let weightedSum = 0;
  for (const dim of Object.values(dimensions)) {
    weightedSum += dim.score * dim.weight;
    totalWeight += dim.weight;
  }

  const overall = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const review = shouldRequestReview(
    { overall, dimensions: dimensions as Record<QualityDimension, DimensionScore>, requiresReview: false },
    input.routerDecision.confidence,
    input.routerDecision.riskFlags,
    input.routerDecision.safetyLevel,
  );

  return {
    overall: Math.round(overall * 1000) / 1000,
    dimensions: dimensions as Record<QualityDimension, DimensionScore>,
    requiresReview: review.requiresReview,
    reviewReason: review.reason,
  };
}

export function buildReviewQueueEntry(params: {
  tenantId: string;
  conversationId: string;
  input: string;
  response: string;
  routerDecision: RouterDecision;
  qualityScore: QualityScore;
}): ReviewQueueEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    tenantId: params.tenantId,
    conversationId: params.conversationId,
    input: params.input,
    response: params.response,
    intent: params.routerDecision.intent,
    confidence: params.routerDecision.confidence,
    qualityScore: params.qualityScore,
    riskFlags: {
      hasClinicalRisk: params.routerDecision.riskFlags?.hasClinicalRisk ?? false,
      hasPIIExposure: params.routerDecision.riskFlags?.hasPIIExposure ?? false,
      hasPromptInjection: params.routerDecision.riskFlags?.hasPromptInjection ?? false,
      needsEscalation: params.routerDecision.riskFlags?.needsEscalation ?? false,
    },
    safetyLevel: params.routerDecision.safetyLevel ?? "safe",
  };
}
