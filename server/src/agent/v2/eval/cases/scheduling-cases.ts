import type { EvalCase } from "../types.js";

export const SCHEDULING_CASES: EvalCase[] = [
  // ── Basic booking ──
  { name: "sch_basic_weekday", input: "Quiero agendar para el martes", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_basic_tomorrow", input: "¿Puedo agendar mañana?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_basic_date", input: "Quiero agendar el 15 de julio", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_basic_morning", input: "Agenda en la mañana por favor", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_basic_afternoon", input: "Prefiero en la tarde", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_basic_asap", input: "Necesito la cita lo más pronto posible", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Specific service booking ──
  { name: "sch_service_botox", input: "Quiero agendar para botox", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_service_label", input: "Agenda para ácido hialurónico en labios", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_service_rostro", input: "Quiero hacerme el tratamiento facial", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_service_consulta", input: "Quiero una consulta sobre mesoterapia", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_service_multiple", input: "Quiero agendar para botox y ácido hialurónico", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Provider/doctor ──
  { name: "sch_doctor_elkin", input: "Quiero cita con el doctor Elkin", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_doctor_prefer", input: "Prefiero que me atienda una doctora", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_doctor_no_pref", input: "No tengo preferencia de doctor", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Reschedule ──
  { name: "sch_reschedule_simple", input: "Quiero reprogramar mi cita", expectedIntent: "cancelacion_reprogramacion", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_reschedule_date", input: "¿Puedo mover la cita del jueves al viernes?", expectedIntent: "cancelacion_reprogramacion", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_reschedule_emergency", input: "Tuve una emergencia, necesito cambiar la cita", expectedIntent: "cancelacion_reprogramacion", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Cancel ──
  { name: "sch_cancel_simple", input: "Cancela mi cita por favor", expectedIntent: "cancelacion_reprogramacion", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_cancel_reason", input: "No puedo ir, cancela la cita de mañana", expectedIntent: "cancelacion_reprogramacion", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_cancel_refund", input: "Si cancelo, ¿me devuelven el anticipo?", expectedIntent: "cancelacion_reprogramacion", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Availability ──
  { name: "sch_avail_check", input: "¿Tienen cupo para esta semana?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_avail_month", input: "¿Cómo están de disponibilidad en agosto?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_avail_first", input: "¿Cuál es la fecha más próxima disponible?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Info needed ──
  { name: "sch_info_requirements", input: "¿Qué necesito para agendar?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_info_documents", input: "¿Qué documentos debo llevar?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_info_anticipo", input: "¿Cuánto es el anticipo para agendar?", expectedIntent: "pago", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_info_arrive_early", input: "¿Debo llegar antes de la hora?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_whatsapp_confirm", input: "¿Me confirman la cita por WhatsApp?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_reminder", input: "¿Me mandan recordatorio de la cita?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_no_show", input: "¿Qué pasa si no voy a la cita?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_policy", input: "¿Cuál es la política de cancelación?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_duration", input: "¿Cuánto dura la cita?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_walk_in", input: "¿Puedo ir sin cita?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_online", input: "¿Puedo agendar por aquí mismo?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_late", input: "¿Qué pasa si llego tarde a mi cita?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_acompanante", input: "¿Puedo ir acompañado?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },
  { name: "sch_info_menor", input: "Mi hija es menor de edad, ¿puede agendar?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Group booking ──
  { name: "sch_group_two", input: "Quiero agendar para mí y mi hermana", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_group_friend", input: "¿Puedo agendar para dos personas?", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_group_family", input: "Quiero agendar para toda la familia", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "sch_group_same_time", input: "Queremos la misma hora mi hermana y yo", expectedIntent: "agendamiento", category: "scheduling", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
];
