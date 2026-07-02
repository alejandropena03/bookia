import type { PolicyDecision } from "../types/decision-trace.js";
import type { AgentIntent } from "../types/agent-intent.js";

export type CriticAction =
  | "send"
  | "revise_deterministically"
  | "regenerate_with_constraints"
  | "handoff"
  | "block";

export interface ResponseCriticIssue {
  type:
    | "hallucination_risk"
    | "clinical_risk"
    | "privacy_risk"
    | "prompt_leak"
    | "tone_issue"
    | "too_long"
    | "missing_cta"
    | "wrong_next_step"
    | "policy_mismatch"
    | "guarantee_or_promise"
    | "diagnosis_or_prescription";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  fixSuggestion?: string;
}

export interface ResponseCriticResult {
  passed: boolean;
  action: CriticAction;
  issues: ResponseCriticIssue[];
  revisedResponse?: string;
}

export interface CriticInput {
  text: string;
  intent: AgentIntent;
  policyAction: "allow" | "constrain" | "handoff" | "block";
  safetyLevel: "safe" | "caution" | "handoff" | "blocked";
  route: string;
}

const CLINICAL_RISK_PATTERNS: [RegExp, string][] = [
  [/\b(tienes|tiene|presenta|sufre[s]? de)\s+(un[oa]?\s+)?(diagn[oó]stic[oó]|enfermedad|condici[oó]n|padecimiento)\b/i, "direct diagnosis"],
  [/\b(te\s+)?(diagn[oó]stic[oó]|diagnosticad[ao])\b/i, "diagnosis claim"],
  [/\b(debes?\s+)?(tomar|toma|tome)\s+\w+\s+(mg|ml|unidades?|gotas?|comprimidos?|tabletas?|pastillas?|inyecciones?)\b/i, "dosage prescription"],
  [/\b(rec[eé]t[ao]|prescrib[oi]|recetar|prescribir|medicar|medicaci[oó]n|medicament[oó])\b/i, "prescription"],
  [/\b(toma|tome|tomas?|debes? tomar|usa[st]e?)\s+(ibuprofeno|paracetamol|acetaminof[eé]n|naproxeno|aspirina|antib[ií]otic[oó]|antihistam[ií]nic[oó]|cortic[oó]ide|analg[eé]sic[oó])\b/i, "medication recommendation"],
  [/\b(necesitas?\s+)\d{1,3}\s+(unidades?|sesiones?|aplicaciones?|mg|ml)\s+(de|para)\b/i, "specific dosage"],
  [/\b(apl[ií]cate|ponte|usa[st]e?|iny[eé]ctate)\s+\w+\s+(en|para|sobre)\b/i, "application instruction"],
  [/\b\d{1,3}\s*(mg|ml|ui|unidades?)\s+(de|por|aplicaci[oó]n)\b/i, "unit dosage"],
];

const GUARANTEE_PATTERNS: [RegExp, string][] = [
  [/\bte\s+garantizamos?\b/i, "guarantee"],
  [/\b100%\s+segur[oa]\b/i, "absolute safety"],
  [/\b(resultado|resultados)\s+(perfectos?|asegurados?|garantizados?|excelentes?|incre[ií]bles)\b/i, "result guarantee"],
  [/\b(s[ií]\s+o\s+[síi]|seguro\s+seguro)\b/i, "absolute certainty"],
  [/\bsin\s+(ning[uú]n|nada\s+de)\s+(riesgo|riesgos|efecto)\b/i, "no risk claim"],
  [/\bte\s+va\s+(a\s+)?servir\b/i, "will work guarantee"],
  [/\b(queda|quedar[áa])\s+(exact[oa]|perfect[oa]|incre[ií]ble)\b/i, "perfect result"],
  [/\bno\s+duele\s+nada\b/i, "no pain absolute"],
  [/\bprometemos?\s+(que\s+)?(no\s+)?(duele|funciona|resulta)\b/i, "promise"],
];

const PROMPT_LEAK_PATTERNS: RegExp[] = [
  /\b(system\s+)?prompt\b/i,
  /\bdeveloper\s+message\b/i,
  /\breglas?\s+internas?\b/i,
  /\bAPI[_\s]?key\b/i,
  /\binstrucciones?\s+internas?\b/i,
  /\bherramientas?\s+internas?\b/i,
  /\bestructura\s+privada\b/i,
  /\btoken\s+secreto\b/i,
  /\bcontraseña\s+(del|de\s+la)\s+(sistema|base|db)\b/i,
  /\bcredenciales?\s+de\s+acceso\b/i,
  /\bconfiguración\s+interna?\b/i,
];

const TONE_COLD_PATTERNS: RegExp[] = [
  /\bno\s+puedo\b/i,
  /\bseg[uú]n\s+mi\s+programaci[oó]n\b/i,
  /\bcomo\s+(soy\s+)?(ia|inteligencia\s+artificial|asistente\s+virtual)\b/i,
];

const ESCALATION_KEYWORDS = [
  "asesor", "humano", "persona", "especialista", "doctor", "médico",
  "transferir", "derivar", "escalar", "comunicar",
];

const CTA_BOOKING_KEYWORDS = [
  "agendar", "reservar", "separar", "cita", "turno", "valoración",
];

const MAX_RESPONSE_LENGTH = 450;

export function maskCedula(value: string): string {
  return value.replace(/\b(\d{4,})(\d{4})\b/g, "****$2");
}

export function maskPhone(value: string): string {
  return value.replace(/\b(\d{3})\s*\d{3}\s*(\d{4})\b/g, "*** *** $2");
}

export function maskEmail(value: string): string {
  return value.replace(/\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, (_, local, domain) => {
    return `${local[0]}***@${domain}`;
  });
}

export function maskPII(text: string): string {
  let masked = maskCedula(text);
  masked = maskPhone(masked);
  masked = maskEmail(masked);
  return masked;
}

export function criticize(input: CriticInput): ResponseCriticResult {
  const issues: ResponseCriticIssue[] = [];
  const lower = input.text.toLowerCase();

  // 1. Prompt leak — highest priority, always block
  for (const pattern of PROMPT_LEAK_PATTERNS) {
    if (pattern.test(input.text)) {
      issues.push({
        type: "prompt_leak",
        severity: "critical",
        message: `Posible fuga de información interna: "${pattern.source.slice(0, 40)}"`,
        fixSuggestion: "Reemplazar con respuesta genérica segura",
      });
    }
  }
  if (issues.some((i) => i.type === "prompt_leak")) {
    return {
      passed: false,
      action: "block",
      issues,
    };
  }

  // 2. Clinical risk — diagnosis, prescription, dosage
  for (const [pattern, name] of CLINICAL_RISK_PATTERNS) {
    const match = pattern.exec(input.text);
    // Frases como "esto no es un diagnóstico", "no tienes ninguna condición grave" o
    // "para un diagnóstico certero ve al doctor" son lenguaje seguro (negación o
    // remisión al médico), no un reclamo real de diagnóstico — no deben bloquear la respuesta.
    if (match && (name === "direct diagnosis" || name === "diagnosis claim")) {
      const before = input.text.slice(Math.max(0, match.index - 25), match.index).toLowerCase();
      if (/\bno\s+(\w+\s+){0,2}$|\bpara\s+(un[oa]?\s+)?$|\bsin\s+(\w+\s+){0,2}$/.test(before)) continue;
    }
    if (match) {
      const isCritical = name === "diagnosis claim" || name === "direct diagnosis";
      issues.push({
        type: "diagnosis_or_prescription",
        severity: isCritical ? "critical" : "high",
        message: `Riesgo clínico: ${name}`,
        fixSuggestion: isCritical ? "Bloquear respuesta — no dar diagnósticos" : "Revisar y eliminar dosificación/prescripción",
      });
    }
  }

  if (issues.some((i) => i.type === "diagnosis_or_prescription" && i.severity === "critical")) {
    return {
      passed: false,
      action: "block",
      issues,
    };
  }
  if (issues.some((i) => i.type === "diagnosis_or_prescription")) {
    return {
      passed: false,
      action: "regenerate_with_constraints",
      issues,
    };
  }

  // 3. Guarantees / promises
  for (const [pattern, name] of GUARANTEE_PATTERNS) {
    if (pattern.test(input.text)) {
      issues.push({
        type: "guarantee_or_promise",
        severity: "high",
        message: `Promesa/garantía: ${name}`,
      });
    }
  }
  if (issues.some((i) => i.type === "guarantee_or_promise")) {
    return {
      passed: false,
      action: "regenerate_with_constraints",
      issues,
    };
  }

  // 4. Privacy / PII
  const beforeMask = input.text;
  const afterMask = maskPII(beforeMask);
  if (beforeMask !== afterMask) {
    issues.push({
      type: "privacy_risk",
      severity: "high",
      message: "PII detectado en respuesta (será enmascarado)",
      fixSuggestion: "Enmascarar PII deterministicamente",
    });
  }

  // 5. Policy mismatch
  if (input.policyAction === "handoff") {
    const hasEscalation = ESCALATION_KEYWORDS.some((k) => lower.includes(k));
    if (!hasEscalation) {
      issues.push({
        type: "policy_mismatch",
        severity: "high",
        message: "policyAction=handoff pero respuesta no escala a humano",
        fixSuggestion: "Agregar ofrecimiento de escalación a asesor humano",
      });
    }
  }

  if (input.policyAction === "block" && input.route !== "refusal") {
    issues.push({
      type: "policy_mismatch",
      severity: "critical",
      message: "policyAction=block pero respuesta no es refusal",
      fixSuggestion: "Usar respuesta de negativa segura",
    });
  }

  if (input.safetyLevel === "blocked" && input.policyAction !== "block") {
    issues.push({
      type: "policy_mismatch",
      severity: "critical",
      message: "safetyLevel=blocked pero policyAction no es block",
      fixSuggestion: "Forzar block en policy",
    });
  }

  // 6. Length and tone
  if (input.text.length > MAX_RESPONSE_LENGTH && input.route !== "handoff") {
    issues.push({
      type: "too_long",
      severity: "low",
      message: `Respuesta excede ${MAX_RESPONSE_LENGTH} caracteres (${input.text.length})`,
      fixSuggestion: "Acortar a menos de 450 caracteres",
    });
  }

  if (input.intent === "queja") {
    const hasAcknowledgment = /(lamento|sentimos|disculpa|entiendo|comprendo|siento|lo siento)/i.test(input.text);
    if (!hasAcknowledgment) {
      issues.push({
        type: "tone_issue",
        severity: "medium",
        message: "Queja sin validación/empatía en la respuesta",
        fixSuggestion: "Agregar disculpa o validación antes de responder",
      });
    }
  }

  if (TONE_COLD_PATTERNS.some((p) => p.test(input.text))) {
    issues.push({
      type: "tone_issue",
      severity: "low",
      message: "Tono frío/robótico detectado",
      fixSuggestion: "Usar tono más cálido y personal",
    });
  }

  if (input.intent === "agendamiento") {
    const hasCTA = CTA_BOOKING_KEYWORDS.some((k) => lower.includes(k));
    if (!hasCTA) {
      issues.push({
        type: "missing_cta",
        severity: "medium",
        message: "Intento de agendamiento sin siguiente paso claro",
        fixSuggestion: "Incluir llamado a agendar o preguntar preferencia de fecha",
      });
    }
  }

  // Determine action
  const maxSeverity = getMaxSeverity(issues);

  if (issues.some((i) => i.severity === "critical")) {
    if (issues.some((i) => i.type === "policy_mismatch" && i.severity === "critical")) {
      return { passed: false, action: "block", issues };
    }
    return { passed: false, action: "handoff", issues };
  }

  if (issues.some((i) => i.severity === "high")) {
    if (issues.some((i) => i.type === "privacy_risk")) {
      const revised = maskPII(input.text);
      return {
        passed: true,
        action: "revise_deterministically",
        issues,
        revisedResponse: revised,
      };
    }
    return {
      passed: false,
      action: "handoff",
      issues,
      revisedResponse: maskPII(input.text),
    };
  }

  // Low/medium issues → send with revised PII
  if (issues.length > 0) {
    return {
      passed: true,
      action: "send",
      issues,
      revisedResponse: maskPII(input.text),
    };
  }

  return {
    passed: true,
    action: "send",
    issues: [],
  };
}

function getMaxSeverity(issues: ResponseCriticIssue[]): "low" | "medium" | "high" | "critical" {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.some((i) => i.severity === "high")) return "high";
  if (issues.some((i) => i.severity === "medium")) return "medium";
  return "low";
}
