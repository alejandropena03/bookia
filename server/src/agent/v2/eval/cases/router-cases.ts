import type { EvalCase } from "../types.js";

export const ROUTER_CASES: EvalCase[] = [
  // ── agendamiento ──
  { name: "rt_agenda_basico", input: "Quiero agendar una cita", expectedIntent: "agendamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_agenda_hora", input: "¿Tienen disponibilidad para esta semana?", expectedIntent: "agendamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_agenda_examen", input: "Necesito hacerme una valoración", expectedIntent: "agendamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_agenda_doctor", input: "Quiero que el doctor me vea", expectedIntent: "agendamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_agenda_tarde", input: "Puedo ir mañana en la tarde", expectedIntent: "agendamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_agenda_sabado", input: "¿Atención los sábados?", expectedIntent: "horarios", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── precio ──
  { name: "rt_precio_basico", input: "¿Cuánto cuesta el botox?", expectedIntent: "precio", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_precio_paquete", input: "¿Tienen paquetes o combos?", expectedIntent: "precio", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_precio_promocion", input: "¿Hay alguna promoción esta semana?", expectedIntent: "precio", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_precio_financiar", input: "¿Puedo financiar el tratamiento?", expectedIntent: "pago", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_precio_tarjeta", input: "¿Reciben tarjeta de crédito?", expectedIntent: "pago", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── dudas_medicas ──
  { name: "rt_duda_basica", input: "Tengo una duda médica", expectedIntent: "dudas_medicas", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_duda_efectos", input: "¿Duele mucho el procedimiento?", expectedIntent: "dudas_medicas", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_duda_tiempo", input: "¿Cuánto dura la sesión?", expectedIntent: "dudas_medicas", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_duda_preparacion", input: "¿Debo prepararme antes de ir?", expectedIntent: "dudas_medicas", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_duda_contra", input: "¿Quiénes no pueden hacerse esto?", expectedIntent: "dudas_medicas", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── queja ──
  { name: "rt_queja_servicio", input: "Quiero reportar una queja", expectedIntent: "queja", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_queja_tiempo", input: "Me hicieron esperar una hora", expectedIntent: "queja", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── hablar_humano ──
  { name: "rt_humano_basico", input: "Necesito hablar con alguien", expectedIntent: "hablar_humano", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_humano_asesor", input: "Pásame con un asesor por favor", expectedIntent: "hablar_humano", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── faq_servicios ──
  { name: "rt_faq_tratamientos", input: "¿Qué tratamientos ofrecen?", expectedIntent: "faq_servicios", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_faq_especialidad", input: "¿En qué se especializan?", expectedIntent: "faq_servicios", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_ubicacion", input: "¿Dónde están ubicados?", expectedIntent: "ubicacion", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_faq_horario", input: "¿En qué horario atienden?", expectedIntent: "horarios", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_faq_parqueadero", input: "¿Tienen parqueadero?", expectedIntent: "ubicacion", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_faq_telefono", input: "¿Cuál es el teléfono de la clínica?", expectedIntent: "faq_contacto", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_faq_whatsapp", input: "¿Tienen WhatsApp?", expectedIntent: "faq_contacto", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },

  // ── post_tratamiento ──
  { name: "rt_post_cuidados", input: "¿Qué cuidados debo tener después?", expectedIntent: "post_tratamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_post_maquillaje", input: "¿Cuándo puedo maquillarme?", expectedIntent: "post_tratamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_post_dormir", input: "¿Puedo dormir boca arriba?", expectedIntent: "post_tratamiento", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── cancelacion_reprogramacion ──
  { name: "rt_cancelar", input: "Necesito cancelar una cita", expectedIntent: "cancelacion_reprogramacion", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_reprogramar", input: "¿Puedo cambiar la fecha de mi cita?", expectedIntent: "cancelacion_reprogramacion", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── charla ──
  { name: "rt_charla_saludo", input: "Hola, buenos días", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "rt_charla_gracias", input: "Muchas gracias por la información", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "rt_charla_clima", input: "Qué buen día hace hoy", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "rt_charla_presentacion", input: "Soy María, mucho gusto", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "rt_charla_despedida", input: "Ok, gracias, hasta luego", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "rt_charla_si", input: "Sí", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "rt_charla_no", input: "No, gracias", expectedIntent: "charla", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },

  // ── valoracion ──
  { name: "rt_valoracion_piel", input: "¿Pueden evaluar mi tipo de piel?", expectedIntent: "valoracion", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_valoracion_gratis", input: "¿La valoración es gratis?", expectedIntent: "valoracion", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── resultados_esperados ──
  { name: "rt_resultados_duracion", input: "¿Cuánto duran los resultados?", expectedIntent: "resultados_esperados", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_resultados_fotos", input: "¿Tienen fotos de resultados reales?", expectedIntent: "resultados_esperados", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_resultados_antes_despues", input: "Quiero ver casos de antes y después", expectedIntent: "resultados_esperados", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_resultados_natural", input: "¿Se ve natural?", expectedIntent: "resultados_esperados", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "rt_resultados_mantenimiento", input: "¿Requiere mantenimiento?", expectedIntent: "resultados_esperados", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── other / out of scope ──
  { name: "rt_other_recommendation", input: "¿Qué me recomiendas para verme más joven?", expectedIntent: "faq_servicios", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "rt_other_comparison", input: "¿Qué es mejor, mesoterapia o radiofrecuencia?", expectedIntent: "dudas_medicas", category: "router", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
];
