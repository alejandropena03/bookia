export interface EscalationRule {
  keyword: string;
  reason: string;
}

export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string;
}

const DEFAULT_RULES: EscalationRule[] = [
  { keyword: "humano", reason: "Cliente pidió hablar con un humano" },
  { keyword: "operador", reason: "Cliente pidió hablar con un operador" },
  { keyword: "emergencia", reason: "Emergencia reportada por el cliente" },
  { keyword: "reacción", reason: "Reacción adversa reportada por el cliente" },
  { keyword: "abogado", reason: "Mención de acción legal" },
  { keyword: "demanda", reason: "Mención de demanda" },
];

export function evaluateEscalation(
  text: string,
  routerConfidence: number,
  customRules: EscalationRule[] = DEFAULT_RULES
): EscalationResult {
  const lower = text.toLowerCase();

  // Low confidence → suggest escalation but don't force
  if (routerConfidence < 0.4) {
    return { shouldEscalate: false, reason: "confianza_baja" };
  }

  for (const rule of customRules) {
    if (lower.includes(rule.keyword)) {
      return { shouldEscalate: true, reason: rule.reason };
    }
  }

  // If no user input (empty), don't escalate
  if (!text.trim()) {
    return { shouldEscalate: false, reason: "" };
  }

  return { shouldEscalate: false, reason: "" };
}
