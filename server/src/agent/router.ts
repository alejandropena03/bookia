import { z } from "zod";
import { getLlm } from "./llm/index.js";
import { env } from "../env.js";

const INTENTS = [
  "agendamiento",
  "precio",
  "ubicacion",
  "horarios",
  "pago",
  "valoracion",
  "dudas_medicas",
  "solicitud_comercial",
  "devolucion",
  "nombres_doctores",
  "reagendamiento_control",
  "rinomodelacion",
  "armonizacion_facial",
  "queja",
  "charla",
  "faq",
  "otro",
] as const;

const RouterResultSchema = z.object({
  intent: z.enum(INTENTS),
  confidence: z.number().min(0).max(1),
  extractedSlots: z.record(z.string()).default({}),
});

export interface RouterResult {
  intent: string;
  confidence: number;
  extractedSlots: Record<string, string>;
}

export const ROUTER_INTENTS = INTENTS;

const SYSTEM_PROMPT = `Clasifica en UNA intención exacta. Intenciones válidas:
agendamiento: agendar/reservar/separar cita
precio: costos/tarifas/cuánto vale
ubicacion: dirección/dónde están/sedes
horarios: horario atención/abren/sábados
pago: métodos de pago/tarjeta/transferencia
valoracion: cita de valoración
dudas_medicas: preguntas técnicas/duele/dura/cuidados
solicitud_comercial: descuento/canje/propuesta
devolucion: reembolso/garantía
nombres_doctores: quién atiende/especialistas
reagendamiento_control: reagendar/reprogramar (NO booking nuevo)
rinomodelacion: nariz/sin cirugía
armonizacion_facial: Full Face/diseño facial
queja: molesto/reacción/emergencia/cancelar/reclamo
charla: saludo/gracias/casual
faq: preguntas generales sobre servicios
otro: sin intención clara/vacío/gibberish

REGLAS:
- Si menciona servicio ESPECÍFICO + precio → clasifica como el servicio (rinomodelacion/armonizacion_facial), NO como precio
- Si dice "reagendar" o "reprogramar" → reagendamiento_control (nunca agendamiento)
- "cancelar cita" → queja
- "gratis" referido a valoración → valoracion (no precio)

JSON SIN markdown: {"intent":"...", "confidence":0.xx}`;

const INTENT_ALIASES: Record<string, string> = {
  price_inquiry: "precio",
  pricing: "precio",
  cost: "precio",
  consultar_precio: "precio",
  schedule: "agendamiento",
  booking: "agendamiento",
  appointment: "agendamiento",
  book_appointment: "agendamiento",
  schedule_appointment: "agendamiento",
  agendar_cita: "agendamiento",
  location: "ubicacion",
  ubicacion_consulta: "ubicacion",
  hours: "horarios",
  horarios_consulta: "horarios",
  payment: "pago",
  payment_method: "pago",
  consultar_medios_pago: "pago",
  medios_pago: "pago",
  valuation: "valoracion",
  valoracion_consulta: "valoracion",
  medical_questions: "dudas_medicas",
  medical_info: "dudas_medicas",
  consulta_medica: "dudas_medicas",
  commercial: "solicitud_comercial",
  solicitud_comercial: "solicitud_comercial",
  business_proposal: "solicitud_comercial",
  refund: "devolucion",
  warranty_refund: "devolucion",
  complaint: "queja",
  cancel: "queja",
  queja_reclamo: "queja",
  cancel_appointment: "queja",
  doctors: "nombres_doctores",
  ask_doctor_info: "nombres_doctores",
  doctor_info: "nombres_doctores",
  reschedule: "reagendamiento_control",
  reprogramar_cita: "reagendamiento_control",
  reagendar: "reagendamiento_control",
  reprogramar: "reagendamiento_control",
  greeting: "charla",
  greeting_charla: "charla",
  thanks: "charla",
  farewell: "charla",
  casual: "charla",
  faq_services: "faq",
  general_faq: "faq",
  services_faq: "faq",
  treatments_faq: "faq",
  rinomodelacion_consulta: "rinomodelacion",
  armonizacion_facial_consulta: "armonizacion_facial",
  full_face_consulta: "armonizacion_facial",
  unknown: "otro",
  no_intent: "otro",
  error: "otro",
  none: "otro",
};

function normalizeIntent(raw: string): string {
  let intent = raw.toLowerCase().trim();
  if (INTENT_ALIASES[intent]) return INTENT_ALIASES[intent];

  // Try partial match: if any alias key is contained in the returned intent, use it
  for (const [alias, target] of Object.entries(INTENT_ALIASES)) {
    if (intent.includes(alias) || alias.includes(intent)) {
      return target;
    }
  }

  // Try against known intents list
  for (const known of INTENTS) {
    if (intent.includes(known) || known.includes(intent)) {
      return known;
    }
  }

  return intent;
}

function extractJson(text: string): string {
  const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "").trim();
  const braceStart = cleaned.indexOf("{");
  const braceEnd = cleaned.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return cleaned.slice(braceStart, braceEnd + 1);
  }
  return cleaned;
}

export async function classifyIntent(text: string): Promise<RouterResult> {
  if (!text || text.trim().length === 0) {
    return { intent: "otro", confidence: 1, extractedSlots: {} };
  }

  const llm = getLlm();
  const result = await llm.complete({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
    model: env.MODEL_ROUTER,
    temperature: 0,
    maxTokens: 512,
  });

  if (!result.text || result.text.trim().length === 0) {
    return { intent: "otro", confidence: 0, extractedSlots: {} };
  }

  try {
    const cleaned = extractJson(result.text);
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    parsed.intent = normalizeIntent(parsed.intent as string);
    if (!INTENTS.includes(parsed.intent as typeof INTENTS[number])) {
      return { intent: "otro", confidence: 0, extractedSlots: {} };
    }
    // Keyword overrides: LLM tend to confuse certain intents, correct those here
    let finalIntent = parsed.intent as string;
    const lowerInput = text.toLowerCase();
    if ((lowerInput.includes("reagendar") || lowerInput.includes("reprogramar")) && finalIntent === "agendamiento") {
      finalIntent = "reagendamiento_control";
    }
    if (lowerInput.includes("gratis") && (lowerInput.includes("valoracion") || lowerInput.includes("valoración")) && finalIntent === "precio") {
      finalIntent = "valoracion";
    }
    const validated = RouterResultSchema.parse({ ...parsed, intent: finalIntent });
    return validated;
  } catch {
    return { intent: "otro", confidence: 0, extractedSlots: {} };
  }
}
