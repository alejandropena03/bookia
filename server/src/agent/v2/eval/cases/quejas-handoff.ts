import type { EvalCase } from "../types.js";

export const QUEJAS_HANDOFF_CASES: EvalCase[] = [
  // ── Complaints (should escalate) ──
  { name: "qh_queja_molesto", input: "Estoy muy molesto con el servicio que recibí", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_reclamo", input: "Quiero poner un reclamo formal", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_maltrato", input: "La doctora me trató muy mal", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_no_gusto", input: "No me gustó cómo quedó el tratamiento", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_demora", input: "Me hicieron esperar mucho tiempo", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_precio_injusto", input: "Me cobraron de más, quiero que me devuelvan", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_resultados", input: "No vi ningún resultado después del tratamiento", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_comunicacion", input: "Nadie me responde los mensajes", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_cancelacion", input: "Me cancelaron la cita sin avisar", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_queja_atencion", input: "La atención al cliente es pésima", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },

  // ── Request human (should handoff) ──
  { name: "qh_handoff_basico", input: "Quiero hablar con un asesor humano", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_handoff_persona_real", input: "Necesito hablar con una persona real, no con un bot", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_handoff_elkin", input: "Por favor comunícame con Elkin directamente", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_handoff_doctor", input: "Quiero que me atienda el doctor personalmente", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_handoff_insist", input: "No quiero hablar con una máquina, quiero un humano YA", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_handoff_asesor", input: "Necesito un asesor que me ayude con esto", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_handoff_gerente", input: "Quiero hablar con el gerente", expectedIntent: "hablar_humano", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },

  // ── Emotional escalation ──
  { name: "qh_emocional_frustrado", input: "Estoy harto, esto es una pérdida de tiempo", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_emocional_enojado", input: "Estoy furioso con el servicio que recibí", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_emocional_decepcionado", input: "Muy decepcionado con la clínica", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_emocional_estafa", input: "Siento que me estafaron, esto no es lo que me prometieron", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_emocional_no_vuelvo", input: "No vuelvo a poner un pie en esa clínica", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },

  // ── Cancel booking ──
  { name: "qh_cancelar_cita", input: "Quiero cancelar mi cita", expectedIntent: "cancelacion_reprogramacion", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_cancelar_reprogramar", input: "Necesito cancelar y reprogramar mi cita", expectedIntent: "cancelacion_reprogramacion", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_cancelar_emergencia", input: "Tengo una emergencia, debo cancelar mi cita de hoy", expectedIntent: "cancelacion_reprogramacion", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },

  // ── Handoff due to complexity ──
  { name: "qh_complejo_presupuesto", input: "Necesito un presupuesto detallado por escrito", expectedIntent: "precio", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_complejo_personalizado", input: "Quiero un plan de tratamiento personalizado", expectedIntent: "valoracion", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_complejo_convenio", input: "¿Tienen convenio con mi EPS?", expectedIntent: "pago", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_complejo_seguro", input: "¿Mi seguro médico cubre esto?", expectedIntent: "pago", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_complejo_financiero", input: "Necesito opciones de financiación especiales", expectedIntent: "pago", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },
  { name: "qh_complejo_grupo", input: "Quiero agendar para un grupo de 5 personas", expectedIntent: "agendamiento", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "high" } },

  // ── Legal / compliance ──
  { name: "qh_legal_derecho_reembolso", input: "Exijo mi derecho a reembolso", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_legal_danos", input: "Voy a demandar por los daños", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_legal_abogado", input: "Mi abogado se va a comunicar con ustedes", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
  { name: "qh_legal_proteccion_datos", input: "Quiero ejercer mi derecho de eliminación de datos", expectedIntent: "queja", category: "quejas-handoff", meta: { generated: false, reviewStatus: "reviewed", criticality: "critical" } },
];
