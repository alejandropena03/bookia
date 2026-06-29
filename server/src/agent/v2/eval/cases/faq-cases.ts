import type { EvalCase } from "../types.js";

export const FAQ_CASES: EvalCase[] = [
  // ── Services ──
  { name: "faq_svc_list", input: "¿Qué servicios ofrecen?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_svc_facial", input: "¿Qué tratamientos faciales tienen?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_svc_corporal", input: "¿Qué tratamientos corporales ofrecen?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_svc_new", input: "¿Tienen algún tratamiento nuevo?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_svc_most_requested", input: "¿Cuál es el tratamiento más solicitado?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_svc_specialized", input: "¿En qué se especializa la clínica?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_svc_home", input: "¿Hacen visitas a domicilio?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },

  // ── Location ──
  { name: "faq_loc_address", input: "¿Cuál es la dirección?", expectedIntent: "ubicacion", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_loc_city", input: "¿En qué ciudad están?", expectedIntent: "ubicacion", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_loc_neighborhood", input: "¿En qué barrio quedan?", expectedIntent: "ubicacion", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_loc_transport", input: "¿Cómo llego en transporte público?", expectedIntent: "ubicacion", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_loc_parking", input: "¿Tienen estacionamiento?", expectedIntent: "ubicacion", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_loc_map", input: "¿Me puede enviar la ubicación en Google Maps?", expectedIntent: "ubicacion", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },

  // ── Hours ──
  { name: "faq_hours_weekdays", input: "¿En qué horario atienden entre semana?", expectedIntent: "horarios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_hours_saturday", input: "¿Abren los sábados?", expectedIntent: "horarios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_hours_sunday", input: "¿Abren domingos y festivos?", expectedIntent: "horarios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_hours_lunch", input: "¿Cierran al mediodía?", expectedIntent: "horarios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_hours_emergency", input: "¿Tienen horario de emergencia?", expectedIntent: "horarios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_hours_extended", input: "¿Atención nocturna?", expectedIntent: "horarios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },

  // ── Contact ──
  { name: "faq_contact_phone", input: "¿Cuál es el número de teléfono?", expectedIntent: "faq_contacto", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_contact_whatsapp", input: "¿Cuál es su WhatsApp?", expectedIntent: "faq_contacto", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_contact_email", input: "¿Cuál es el correo electrónico?", expectedIntent: "faq_contacto", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_contact_social", input: "¿Tienen Instagram?", expectedIntent: "faq_contacto", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_contact_web", input: "¿Cuál es su página web?", expectedIntent: "faq_contacto", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_contact_online", input: "¿Puedo agendar desde la página web?", expectedIntent: "faq_contacto", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },

  // ── General about clinic ──
  { name: "faq_gen_years", input: "¿Cuántos años llevan en el mercado?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_gen_certifications", input: "¿Tienen certificaciones?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_gen_team", input: "¿Quiénes son los doctores?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_gen_experience", input: "¿Cuánta experiencia tienen los especialistas?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_gen_satisfaction", input: "¿Cuál es el nivel de satisfacción de los pacientes?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "faq_gen_hygiene", input: "¿Qué medidas de bioseguridad tienen?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_gen_guarantee", input: "¿Los tratamientos tienen garantía?", expectedIntent: "faq_servicios", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },

  // ── Technical about procedures ──
  { name: "faq_tech_anesthesia", input: "¿Usan anestesia?", expectedIntent: "dudas_medicas", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_pain", input: "¿Duele?", expectedIntent: "resultados_esperados", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_needles", input: "¿Usan agujas?", expectedIntent: "dudas_medicas", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_recovery", input: "¿Cuánto dura la recuperación?", expectedIntent: "post_tratamiento", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_visible", input: "¿Se nota que me hice algo?", expectedIntent: "resultados_esperados", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_side_effects", input: "¿Qué efectos secundarios puedo tener?", expectedIntent: "dudas_medicas", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_natural", input: "¿Se ve natural?", expectedIntent: "resultados_esperados", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_results_when", input: "¿Cuándo se ven los resultados finales?", expectedIntent: "resultados_esperados", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_permanent", input: "¿Los resultados son permanentes?", expectedIntent: "resultados_esperados", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_num_sessions", input: "¿Cuántas sesiones necesito?", expectedIntent: "dudas_medicas", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "faq_tech_interval", input: "¿Cada cuánto debo hacerme el tratamiento?", expectedIntent: "dudas_medicas", category: "faq", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
];
