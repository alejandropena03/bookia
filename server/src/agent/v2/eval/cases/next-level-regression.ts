import type { EvalCase } from "../types.js";

// Casos de regresión para los fixes conversacionales del handoff "next-level"
// (los 6 pushes + endurecimientos). Sirven para MEDIR, con DB + DeepSeek reales,
// dónde el router LLM sigue fallando HOY sin reescribir su SYSTEM_PROMPT
// (feature-freeze). Cada caso es una intención esperada verificable a nivel router.
//
// reviewStatus: "reviewed" porque el comportamiento esperado fue verificado
// manualmente (node/tsx) al implementar cada push; criticality alta porque son
// exactamente los bugs de conversación que se corrigieron y no deben re-aparecer.
const reviewed = (criticality: "high" | "medium" = "high") =>
  ({ generated: false, reviewStatus: "reviewed", criticality, reviewedBy: "fable5-next-level" } as const);

export const NEXT_LEVEL_REGRESSION_CASES: EvalCase[] = [
  // ── Push 4 — "cuánto dura X" (tratamiento nombrado) → dudas_medicas, NO resultados_esperados ──
  { name: "nl_dura_botox", input: "¿cuánto dura el botox?", expectedIntent: "dudas_medicas", category: "next-level", meta: reviewed() },
  { name: "nl_dura_ah_sin_tilde", input: "cuanto dura el ácido hialurónico", expectedIntent: "dudas_medicas", category: "next-level", meta: reviewed() },
  { name: "nl_dura_rino", input: "¿cuánto dura la rinomodelación?", expectedIntent: "dudas_medicas", category: "next-level", meta: reviewed() },
  // Contraste: "cuánto dura el EFECTO" sí es resultados_esperados (no debe pisarse).
  { name: "nl_dura_efecto", input: "¿cuánto dura el efecto del botox?", expectedIntent: "resultados_esperados", category: "next-level", meta: reviewed() },

  // ── Push 5 — competencia y descuento → intent precio (el kernel intercepta el opener) ──
  { name: "nl_competencia_clinica", input: "¿son mejores que la clínica Belleza Total?", expectedIntent: "precio", category: "next-level", meta: reviewed() },
  { name: "nl_competencia_generica", input: "¿por qué son mejores que la competencia?", expectedIntent: "precio", category: "next-level", meta: reviewed() },
  { name: "nl_descuento_especial", input: "¿me hacen un descuento especial?", expectedIntent: "precio", category: "next-level", meta: reviewed() },
  { name: "nl_descuento_algun", input: "¿tienen algún descuento?", expectedIntent: "precio", category: "next-level", meta: reviewed() },

  // ── Push 3 — preguntas por zona corporal → faq_servicios (el kernel da la recomendación real) ──
  { name: "nl_zona_papada", input: "tengo papada, ¿qué me sirve?", expectedIntent: "faq_servicios", category: "next-level", meta: reviewed() },
  { name: "nl_zona_lineas", input: "¿qué recomiendan para líneas de expresión?", expectedIntent: "faq_servicios", category: "next-level", meta: reviewed() },
  { name: "nl_zona_ojeras", input: "¿qué me sirve para las ojeras?", expectedIntent: "faq_servicios", category: "next-level", meta: reviewed() },

  // ── Push 4 (doctor) — "¿quién es el doctor?" no es intent propio; el router suele mandarlo
  //    a dudas_medicas y el kernel devuelve el canned nombres_doctores. Medimos el ruteo base. ──
  { name: "nl_doctor_quien", input: "¿quién es el doctor?", expectedIntent: "dudas_medicas", category: "next-level", meta: reviewed("medium") },
  { name: "nl_doctor_atiende", input: "¿qué doctora me atiende?", expectedIntent: "dudas_medicas", category: "next-level", meta: reviewed("medium") },

  // ── Push 2 — despedida de cierre → charla (el kernel cierra cálido) ──
  { name: "nl_gracias", input: "gracias", expectedIntent: "charla", category: "next-level", meta: reviewed("medium") },
  { name: "nl_ok_gracias", input: "ok gracias", expectedIntent: "charla", category: "next-level", meta: reviewed("medium") },
  // Contraste: "gracias, también quiero saber X" NO es cierre — lleva intención de servicio.
  { name: "nl_gracias_con_intencion", input: "gracias, también quiero saber cuánto cuesta el botox", expectedIntent: "precio", category: "next-level", meta: reviewed("medium") },

  // ── Push 1 — servicio + precio en una frase → precio (entities.service ya extraído) ──
  { name: "nl_precio_russian", input: "¿cuánto cuesta el Russian Lips?", expectedIntent: "precio", category: "next-level", meta: reviewed() },
];
