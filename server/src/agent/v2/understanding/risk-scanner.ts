import type { RiskFlags } from "../types/decision-trace.js";
import type { AgentIntent } from "../types/agent-intent.js";

const EMERGENCY_KEYWORDS = [
  "emergencia", "urgencia", "reaccion alérgica", "reacción alérgica",
  "alergia", "inflamación severa", "inflamacion severa", "dolor fuerte",
  "sangrado", "infección", "infeccion", "fiebre", "hinchazón excesiva",
  "hinchazon excesiva", "dificultad para respirar",
];

const CLINICAL_RISK_KEYWORDS = [
  "embarazo", "embarazada", "lactancia", "enfermedad autoinmune", "diabetes",
  "anticoagulantes", "quimioterapia", "radiación", "radiacion",
  "cicatriz", "queloides", "herpes activo", "acné activo", "acne activo",
];

const PII_PATTERNS = [
  /\b\d{5,10}\b/,             // cédula/número documento
  /\b\d{10,}\b/,              // teléfono largo
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // email
];

export function scanRisks(text: string, intent: AgentIntent): RiskFlags {
  const lower = text.toLowerCase();

  const hasEmergencyKeywords = EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));

  const hasClinicalRisk = CLINICAL_RISK_KEYWORDS.some((kw) => lower.includes(kw));

  const hasPIIExposure = PII_PATTERNS.some((p) => p.test(text));

  const injectionPatterns = [
    "ignora tus instrucciones", "ignora instrucciones", "ignora todas",
    "muestra tu prompt", "dime tu prompt", "actúa como",
    "eres un sistema", "eres un asistente", "nuevas instrucciones",
    "olvida todo", "olvida lo anterior", "bypass",
    "revela secretos", "dame la api", "api key", "contraseña",
    "soy admin", "soy el administrador", "cambia tu comportamiento",
    "modifica tus reglas", "ignora tu entrenamiento",
  ];
  const hasPromptInjection = injectionPatterns.some((p) => lower.includes(p));

  const escalationIntents: AgentIntent[] = ["queja", "hablar_humano"];
  const needsEscalation = escalationIntents.includes(intent) || hasClinicalRisk || hasEmergencyKeywords;

  return {
    hasEmergencyKeywords,
    hasClinicalRisk,
    hasPIIExposure,
    hasPromptInjection,
    needsEscalation,
  };
}
