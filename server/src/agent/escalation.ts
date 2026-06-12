export interface EscalationRule {
  keyword: string;
  reason: string;
}

export interface EscalationConfig {
  rules: EscalationRule[];
}

export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string;
  notify: boolean;
}

const DEFAULT_RULES: EscalationRule[] = [
  { keyword: "humano", reason: "Cliente pidió hablar con un humano" },
  { keyword: "operador", reason: "Cliente pidió hablar con un operador" },
  { keyword: "asistente", reason: "Cliente pidió hablar con un asistente humano" },
  { keyword: "emergencia", reason: "Emergencia reportada por el cliente" },
  { keyword: "reacción", reason: "Reacción adversa reportada por el cliente" },
  { keyword: "alergia", reason: "Reacción alérgica reportada por el cliente" },
  { keyword: "abogado", reason: "Mención de acción legal" },
  { keyword: "demanda", reason: "Mención de demanda" },
  { keyword: "cancelar", reason: "Cliente quiere cancelar" },
];

function extractRules(config: EscalationConfig | Record<string, unknown> | undefined | null): EscalationRule[] {
  if (!config) return DEFAULT_RULES;
  if (typeof config !== "object") return DEFAULT_RULES;

  const obj = config as Record<string, unknown>;

  // Direct: { escalation: [...] }
  if (obj.escalation && Array.isArray(obj.escalation)) {
    return obj.escalation as EscalationRule[];
  }
  // Direct: { rules: [...] }
  if (obj.rules && Array.isArray(obj.rules)) {
    return obj.rules as EscalationRule[];
  }
  // Wrapped: { rules: { escalation: [...] } } (DB format)
  if (obj.rules && typeof obj.rules === "object") {
    const inner = obj.rules as Record<string, unknown>;
    if (inner.escalation && Array.isArray(inner.escalation)) {
      return inner.escalation as EscalationRule[];
    }
    if (inner.rules && Array.isArray(inner.rules)) {
      return inner.rules as EscalationRule[];
    }
  }

  return DEFAULT_RULES;
}

export function evaluateEscalation(
  text: string,
  routerConfidence: number,
  rulesConfig?: EscalationConfig | Record<string, unknown> | null
): EscalationResult {
  const lower = text.toLowerCase().trim();

  // 1. Check keywords/reglas SIEMPRE primero (independiente de confianza)
  const rules = rulesConfig ? extractRules(rulesConfig) : DEFAULT_RULES;
  for (const rule of rules) {
    if (lower.includes(rule.keyword)) {
      return { shouldEscalate: true, reason: rule.reason, notify: true };
    }
  }

  // 2. Baja confianza como señal adicional (no cortocircuito)
  if (routerConfidence < 0.3) {
    return { shouldEscalate: false, reason: "confianza_baja", notify: false };
  }

  return { shouldEscalate: false, reason: "", notify: false };
}
