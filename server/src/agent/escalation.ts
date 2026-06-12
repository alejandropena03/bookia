export interface EscalationRule {
  keyword: string;
  reason: string;
  notify: boolean;
}

export interface EscalationResult {
  shouldEscalate: boolean;
  reason: string;
  notify: boolean;
}

const DEFAULT_RULES: EscalationRule[] = [
  { keyword: "humano", reason: "Cliente pidió hablar con un humano", notify: true },
  { keyword: "operador", reason: "Cliente pidió hablar con un operador", notify: true },
  { keyword: "asistente", reason: "Cliente pidió hablar con un asistente humano", notify: true },
  { keyword: "emergencia", reason: "Emergencia reportada por el cliente", notify: true },
  { keyword: "reacción", reason: "Reacción adversa reportada por el cliente", notify: true },
  { keyword: "alergia", reason: "Reacción alérgica reportada por el cliente", notify: true },
  { keyword: "abogado", reason: "Mención de acción legal", notify: true },
  { keyword: "demanda", reason: "Mención de demanda", notify: true },
  { keyword: "cancelar", reason: "Cliente quiere cancelar", notify: true },
];

type RuleInput =
  | { keyword: string; reason: string; notify?: boolean }
  | { condition: string; action: string; notify?: boolean };

function normalizeRule(r: RuleInput): EscalationRule {
  if ("keyword" in r && "reason" in r) {
    return { keyword: r.keyword, reason: r.reason, notify: r.notify ?? true };
  }
  if ("condition" in r && "action" in r) {
    return {
      keyword: extractKeywordFromCondition(r.condition),
      reason: r.action,
      notify: r.notify ?? true,
    };
  }
  return { keyword: "", reason: "Regla inválida", notify: false };
}

function extractKeywordFromCondition(condition: string): string {
  const lower = condition.toLowerCase();
  const known = [
    "emergencia", "reacción", "alergia", "humano", "operador",
    "asistente", "abogado", "demanda", "cancelar", "descuento",
    "promoción", "técnico", "médico", "molesto", "insatisfecho",
  ];
  for (const kw of known) {
    if (lower.includes(kw)) return kw;
  }
  return condition.split(" ").slice(0, 3).join(" ");
}

function extractRules(config: Record<string, unknown> | undefined | null): EscalationRule[] {
  if (!config) return DEFAULT_RULES;

  let raw: unknown[] | undefined;

  if (Array.isArray(config.escalation)) {
    raw = config.escalation as unknown[];
  } else if (Array.isArray(config.rules)) {
    raw = config.rules as unknown[];
  } else if (config.rules && typeof config.rules === "object") {
    const inner = config.rules as Record<string, unknown>;
    if (Array.isArray(inner.escalation)) {
      raw = inner.escalation as unknown[];
    } else if (Array.isArray(inner.rules)) {
      raw = inner.rules as unknown[];
    }
  }

  if (!raw || raw.length === 0) return DEFAULT_RULES;

  return raw.map((r) => normalizeRule(r as RuleInput)).filter((r) => r.keyword);
}

export function evaluateEscalation(
  text: string,
  routerConfidence: number,
  rulesConfig?: Record<string, unknown> | null
): EscalationResult {
  const lower = text.toLowerCase().trim();

  const rules = rulesConfig ? extractRules(rulesConfig) : DEFAULT_RULES;
  for (const rule of rules) {
    if (rule.keyword && lower.includes(rule.keyword.toLowerCase())) {
      return { shouldEscalate: true, reason: rule.reason, notify: rule.notify };
    }
  }

  if (routerConfidence < 0.3) {
    return { shouldEscalate: false, reason: "confianza_baja", notify: false };
  }

  return { shouldEscalate: false, reason: "", notify: false };
}
