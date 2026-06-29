import type { AgentIntent } from "../types/agent-intent.js";

export type ClinicalCategory = "general_info" | "needs_evaluation" | "urgent_handoff" | "refuse_medical_advice";

export interface ClinicalSafetyDecision {
  category: ClinicalCategory;
  allowedClaims: string[];
  forbiddenClaims: string[];
  requiredDisclaimer?: string;
  escalate: boolean;
}

const PREDEFINED_ALLOWED_CLAIMS: Record<string, string[]> = {
  botox: [
    "El botox (toxina botulínica) es un tratamiento que suaviza arrugas de expresión",
    "Los resultados duran aproximadamente 3-6 meses",
    "El procedimiento dura aproximadamente 15-20 minutos",
    "La valoración define si eres candidato ideal",
  ],
  acido_hialuronico: [
    "El ácido hialurónico es un relleno que devuelve volumen",
    "Los resultados duran aproximadamente 6-18 meses según el producto",
    "Se aplica con microinyecciones en la zona a tratar",
  ],
  rinomodelacion: [
    "La rinomodelación con ácido hialurónico mejora la forma de la nariz sin cirugía",
    "Es un procedimiento temporal con resultados que duran 12-18 meses",
    "Debe ser realizada por un profesional médico especializado",
  ],
  valoracion: [
    "La valoración es una cita donde el médico evalúa tu caso",
    "En la valoración se definen las opciones más adecuadas para ti",
    "No hay compromiso después de la valoración",
  ],
};

const URGENT_HANDOFF_KEYWORDS = [
  "dolor fuerte", "dolor intenso", "hinchazón excesiva", "hinchazon excesiva",
  "fiebre", "sangrado", "infección", "infeccion", "pus",
  "dificultad para respirar", "reacción alérgica", "reaccion alergica",
  "inflamación severa", "inflamacion severa", "asimetría", "asimetria",
];

const EVALUATION_KEYWORDS = [
  "embarazo", "embarazada", "lactancia", "enfermedad autoinmune",
  "anticoagulantes", "diabetes no controlada", "quimioterapia",
  "alergia", "herpes activo", "cicatriz", "queloides",
  "menor de edad", "menor edad",
];

const REFUSAL_PATTERNS = [
  "garantizas resultados", "resultado garantizado", "100% seguro",
  "sin riesgos", "ningún riesgo", "dosis", "cantidad de unidades",
  "diagnóstico", "diagnostica", "qué tengo", "que tengo",
  "recomienda un medicamento", "recetar", "reemplazar valoración",
  "reemplazar cita", "sin necesidad de cita",
];

export function evaluateClinicalSafety(
  text: string,
  intent: AgentIntent,
): ClinicalSafetyDecision {
  const lower = text.toLowerCase();
  const forbiddenClaims: string[] = [];
  const allowedClaims: string[] = [];

  if (REFUSAL_PATTERNS.some((p) => lower.includes(p))) {
    return {
      category: "refuse_medical_advice",
      allowedClaims: [],
      forbiddenClaims: [
        "No puedo diagnosticar tu condición",
        "No puedo prometer resultados específicos",
        "Esto debe evaluarlo un médico en persona",
      ],
      requiredDisclaimer: "Esta información no reemplaza una valoración médica presencial.",
      escalate: true,
    };
  }

  if (URGENT_HANDOFF_KEYWORDS.some((p) => lower.includes(p))) {
    return {
      category: "urgent_handoff",
      allowedClaims: [
        "Esto debe ser evaluado por un médico inmediatamente",
        "Te recomiendo contactar a tu especialista o ir a urgencias",
      ],
      forbiddenClaims: [
        "No puedo dar un diagnóstico sin evaluación presencial",
        "Solo un médico puede determinar la gravedad",
      ],
      requiredDisclaimer: "Si tienes síntomas graves, busca atención médica presencial de inmediato.",
      escalate: true,
    };
  }

  if (EVALUATION_KEYWORDS.some((p) => lower.includes(p))) {
    return {
      category: "needs_evaluation",
      allowedClaims: [
        "Esta condición debe ser evaluada por un médico en la valoración",
        "El médico determinará si el tratamiento es adecuado para ti",
        "Puedes consultar esta información con el especialista durante tu cita",
      ],
      forbiddenClaims: [
        "No puedo determinar si puedes hacerte el tratamiento sin evaluación médica",
      ],
      requiredDisclaimer: "Esta información es general. Cada caso debe ser evaluado por un médico.",
      escalate: true,
    };
  }

  for (const [service, claims] of Object.entries(PREDEFINED_ALLOWED_CLAIMS)) {
    if (lower.includes(service.replace(/_/g, " "))) {
      allowedClaims.push(...claims);
    }
  }

  return {
    category: "general_info",
    allowedClaims,
    forbiddenClaims: [
      "No prometer resultados específicos",
      "No dar diagnósticos",
      "No recomendar dosis",
    ],
    escalate: false,
  };
}

export function getServiceDisclaimer(): string {
  return "La información proporcionada es general. Los resultados varían según cada persona. Se requiere valoración médica presencial.";
}
