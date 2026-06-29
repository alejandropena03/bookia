const COLOMBIAN_ID_PATTERN = /\b\d{5,10}\b/;

const PHONE_PATTERN = /\b\d{7,10}\b/;

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const PII_PATTERNS = [
  { pattern: COLOMBIAN_ID_PATTERN, label: "id_number" },
  { pattern: PHONE_PATTERN, label: "phone" },
  { pattern: EMAIL_PATTERN, label: "email" },
];

export interface PIIItem {
  type: "id_number" | "phone" | "email" | "full_name" | "address" | "payment_proof";
  label: string;
  original: string;
  masked: string;
}

export interface PrivacyCheckResult {
  detectedPII: PIIItem[];
  hasSensitiveData: boolean;
  sanitizedText: string;
  safeSummary: string;
}

export function detectPII(text: string): PIIItem[] {
  const items: PIIItem[] = [];

  for (const { pattern, label } of PII_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, "g");
    while ((match = regex.exec(text)) !== null) {
      items.push({
        type: label as PIIItem["type"],
        label,
        original: match[0],
        masked: maskValue(label, match[0]),
      });
    }
  }

  return items;
}

export function maskValue(type: string, value: string): string {
  switch (type) {
    case "id_number":
      return `****${value.slice(-4)}`;
    case "phone":
      return `*** *** ${value.slice(-4)}`;
    case "email": {
      const [name, domain] = value.split("@");
      if (!domain) return value;
      return `${name[0]}***@${domain}`;
    }
    default:
      return value;
  }
}

export function sanitizeText(text: string, piiItems: PIIItem[]): string {
  let sanitized = text;
  for (const item of piiItems) {
    sanitized = sanitized.replace(item.original, `[${item.type}]`);
  }
  return sanitized;
}

export function summarizeForTrace(text: string): string {
  const pii = detectPII(text);
  return sanitizeText(text, pii);
}

export function validateDataCollection(
  requestedFields: string[],
  funnelStage: string,
): { allowed: string[]; rejected: string[]; reason?: string } {
  const stageFields: Record<string, string[]> = {
    new_lead: ["city", "serviceInterest"],
    exploring_services: ["city", "serviceInterest"],
    asking_price: ["city", "serviceInterest"],
    considering: ["city", "serviceInterest", "name"],
    ready_to_book: ["name", "phone", "email", "city", "serviceInterest"],
    collecting_data: ["name", "phone", "email", "birthDate", "idNumber"],
    awaiting_payment: ["name", "phone", "email", "birthDate", "idNumber", "paymentProof"],
    booked: [],
    post_booking: [],
    complaint: ["name", "phone"],
    handoff: [],
    unknown: [],
  };

  const allowedFields = stageFields[funnelStage] ?? [];
  const rejected = requestedFields.filter((f) => !allowedFields.includes(f));

  return {
    allowed: requestedFields.filter((f) => allowedFields.includes(f)),
    rejected,
    reason: rejected.length > 0
      ? `Los campos ${rejected.join(", ")} no son necesarios en la etapa actual del funnel`
      : undefined,
  };
}
