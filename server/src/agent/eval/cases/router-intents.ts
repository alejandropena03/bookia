// Comprehensive eval cases for Santa María agent router.
// Each case tests that classifyIntent returns the correct intent.
// Covers all 17 router intents + escalation + edge cases.

export interface RouterEvalCase {
  name: string;
  input: string;
  expectedIntent: string;
  minConfidence?: number;
  category: "intent" | "escalation" | "edge";
}

export const ROUTER_EVAL_CASES: RouterEvalCase[] = [

  // ── agendamiento ──
  { name: "agendamiento_basico", input: "Hola, quiero agendar una cita para una consulta", expectedIntent: "agendamiento", minConfidence: 0.9, category: "intent" },
  { name: "agendamiento_reservar", input: "Quisiera reservar un espacio para la próxima semana", expectedIntent: "agendamiento", minConfidence: 0.85, category: "intent" },
  { name: "agendamiento_separar", input: "Quiero separar una cita para botox", expectedIntent: "agendamiento", minConfidence: 0.85, category: "intent" },

  // ── precio ──
  { name: "precio_basico", input: "¿Cuánto vale el tratamiento facial?", expectedIntent: "precio", minConfidence: 0.9, category: "intent" },
  { name: "precio_costo_general", input: "¿Cuál es el costo de los servicios?", expectedIntent: "precio", minConfidence: 0.85, category: "intent" },
  { name: "precio_tarifa_general", input: "Me das la tarifa general por favor", expectedIntent: "precio", minConfidence: 0.8, category: "intent" },

  // ── ubicacion ──
  { name: "ubicacion_donde", input: "¿Dónde quedan ubicados en Medellín?", expectedIntent: "ubicacion", minConfidence: 0.85, category: "intent" },
  { name: "ubicacion_direccion", input: "Necesito la dirección de la sede de Bogotá", expectedIntent: "ubicacion", minConfidence: 0.85, category: "intent" },
  { name: "ubicacion_sede", input: "¿Cómo llego a la sede de Cali?", expectedIntent: "ubicacion", minConfidence: 0.8, category: "intent" },

  // ── horarios ──
  { name: "horarios_basico", input: "¿Qué horarios de atención tienen?", expectedIntent: "horarios", minConfidence: 0.85, category: "intent" },
  { name: "horarios_sabado", input: "¿Atienden los sábados?", expectedIntent: "horarios", minConfidence: 0.85, category: "intent" },
  { name: "horarios_abren", input: "¿A qué hora abren?", expectedIntent: "horarios", minConfidence: 0.8, category: "intent" },

  // ── pago ──
  { name: "pago_metodos", input: "¿Qué medios de pago aceptan?", expectedIntent: "pago", minConfidence: 0.85, category: "intent" },
  { name: "pago_tarjeta", input: "¿Puedo pagar con tarjeta de crédito?", expectedIntent: "pago", minConfidence: 0.8, category: "intent" },
  { name: "pago_transferencia", input: "¿Aceptan transferencia bancolombia?", expectedIntent: "pago", minConfidence: 0.8, category: "intent" },

  // ── valoracion ──
  { name: "valoracion_basico", input: "¿En qué consiste la valoración?", expectedIntent: "valoracion", minConfidence: 0.85, category: "intent" },
  { name: "valoracion_gratis", input: "¿La valoración es gratis?", expectedIntent: "valoracion", minConfidence: 0.8, category: "intent" },

  // ── dudas_medicas ──
  { name: "dudas_medicas_duele", input: "¿Duele el botox?", expectedIntent: "dudas_medicas", minConfidence: 0.8, category: "intent" },
  { name: "dudas_medicas_dura", input: "¿Cuánto dura el efecto del ácido hialurónico?", expectedIntent: "dudas_medicas", minConfidence: 0.8, category: "intent" },
  { name: "dudas_medicas_cuidados", input: "¿Qué cuidados debo tener después del procedimiento?", expectedIntent: "dudas_medicas", minConfidence: 0.8, category: "intent" },

  // ── solicitud_comercial ──
  { name: "solicitud_comercial_descuento", input: "¿Me pueden dar un descuento?", expectedIntent: "solicitud_comercial", minConfidence: 0.8, category: "intent" },
  { name: "solicitud_comercial_canje", input: "Quiero hacer un canje con ustedes", expectedIntent: "solicitud_comercial", minConfidence: 0.8, category: "intent" },

  // ── devolucion ──
  { name: "devolucion_reembolso", input: "Quiero solicitar un reembolso", expectedIntent: "devolucion", minConfidence: 0.8, category: "intent" },
  { name: "devolucion_garantia", input: "¿Tienen garantía los procedimientos?", expectedIntent: "devolucion", minConfidence: 0.8, category: "intent" },

  // ── nombres_doctores ──
  { name: "nombres_doctores_quien", input: "¿Quién es el doctor que atiende en Cali?", expectedIntent: "nombres_doctores", minConfidence: 0.8, category: "intent" },
  { name: "nombres_doctores_especialista", input: "¿Cómo se llama la especialista de Medellín?", expectedIntent: "nombres_doctores", minConfidence: 0.75, category: "intent" },

  // ── reagendamiento_control ──
  { name: "reagendamiento_control", input: "Necesito reagendar mi cita de control", expectedIntent: "reagendamiento_control", minConfidence: 0.8, category: "intent" },
  { name: "reagendamiento_reprogramar", input: "Quiero reprogramar mi cita", expectedIntent: "reagendamiento_control", minConfidence: 0.75, category: "intent" },

  // ── rinomodelacion ──
  { name: "rinomodelacion_basico", input: "¿Cuánto cuesta la rinomodelación?", expectedIntent: "rinomodelacion", minConfidence: 0.8, category: "intent" },
  { name: "rinomodelacion_nariz", input: "Me interesa la nariz sin cirugía", expectedIntent: "rinomodelacion", minConfidence: 0.75, category: "intent" },

  // ── armonizacion_facial ──
  { name: "armonizacion_facial_fullface", input: "¿Cuánto cuesta el Full Face?", expectedIntent: "armonizacion_facial", minConfidence: 0.8, category: "intent" },
  { name: "armonizacion_facial_diseno", input: "Me interesa la armonización facial", expectedIntent: "armonizacion_facial", minConfidence: 0.8, category: "intent" },

  // ── queja (escalation) ──
  { name: "queja_molesto", input: "Estoy muy molesto con el servicio que recibí", expectedIntent: "queja", minConfidence: 0.85, category: "escalation" },
  { name: "queja_reclamo", input: "Quiero poner un reclamo formal", expectedIntent: "queja", minConfidence: 0.85, category: "escalation" },
  { name: "queja_cancelar", input: "Quiero cancelar mi cita", expectedIntent: "queja", minConfidence: 0.8, category: "escalation" },

  // ── charla ──
  { name: "charla_hola", input: "Hola, buenos días", expectedIntent: "charla", minConfidence: 0.8, category: "intent" },
  { name: "charla_gracias", input: "Muchas gracias por la información", expectedIntent: "charla", minConfidence: 0.8, category: "intent" },

  // ── faq ──
  { name: "faq_servicios", input: "¿Qué servicios tienen disponibles?", expectedIntent: "faq", minConfidence: 0.75, category: "intent" },
  { name: "faq_tratamientos", input: "¿Hacen tratamientos faciales?", expectedIntent: "faq", minConfidence: 0.75, category: "intent" },

  // ── edge cases ──
  { name: "edge_gibberish", input: "xyz1234test", expectedIntent: "otro", minConfidence: 0, category: "edge" },
  { name: "edge_empty", input: "", expectedIntent: "otro", minConfidence: 0, category: "edge" },
  { name: "edge_short", input: "ok", expectedIntent: "charla", minConfidence: 0.5, category: "edge" },
  { name: "edge_multiword_price", input: "Hola, quisiera saber el precio del botox en Bogotá", expectedIntent: "precio", minConfidence: 0.7, category: "edge" },
];
