import type { EvalCase } from "../types.js";

export const PRICING_CASES: EvalCase[] = [
  // ── Simple price inquiry ──
  { name: "pr_price_botox", input: "¿Cuánto vale el botox?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_hyaluronic", input: "Precio del ácido hialurónico", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_mesoterapia", input: "¿Cuánto cuesta la mesoterapia?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_radiofrecuencia", input: "Valor de la radiofrecuencia", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_bichectomia", input: "¿Cuánto sale la bichectomía?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_peeling", input: "Precio del peeling químico", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_hilos", input: "¿Cuánto cuestan los hilos tensores?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_carboxi", input: "Valor de la carboxiterapia", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_price_plasma", input: "¿Cuánto vale el plasma rico en plaquetas?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Package / bundle pricing ──
  { name: "pr_package_face", input: "¿Tienen paquete facial completo?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_package_botox_hyal", input: "¿Cuánto cuesta botox + ácido hialurónico?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_package_corporal", input: "¿Tienen planes corporales?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_package_session", input: "¿Venden paquetes de sesiones?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_package_annual", input: "¿Tienen plan anual?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Discounts / promos ──
  { name: "pr_promo_current", input: "¿Hay alguna promoción vigente?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_promo_first", input: "¿Tienen descuento para primera vez?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_promo_referral", input: "¿Dan descuento por recomendación?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_promo_loyalty", input: "¿Hay descuento para pacientes frecuentes?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_promo_month", input: "¿Qué promociones tienen este mes?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_promo_seasonal", input: "¿Tienen ofertas de fin de año?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Payment methods ──
  { name: "pr_pay_cash", input: "¿Aceptan efectivo?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_card", input: "¿Reciben tarjetas débito y crédito?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_transfer", input: "¿Aceptan transferencia bancaria?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_installments", input: "¿Puedo pagar en cuotas?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_credit", input: "¿Tienen crédito directo?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_nequi", input: "¿Aceptan Nequi?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_daviplata", input: "¿Reciben Daviplata?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_pay_crypto", input: "¿Aceptan criptomonedas?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "low" } },
  { name: "pr_pay_invoice", input: "¿Dan factura para empresas?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "medium" } },

  // ── Deposit / advance ──
  { name: "pr_deposit_amount", input: "¿Cuánto hay que dejar de anticipo?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_deposit_refund", input: "¿El anticipo es reembolsable?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_deposit_hold", input: "¿Puedo reservar con un anticipo?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Currency / city ──
  { name: "pr_currency_mexico", input: "Estoy en México, ¿cuánto cuesta en pesos?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_currency_usa", input: "Vivo en Estados Unidos, precio en dólares?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_currency_colombia", input: "Estoy en Medellín, ¿cuánto vale en COP?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Price comparison / negotiation ──
  { name: "pr_compare_cheaper", input: "En otra clínica es más barato", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_compare_price_match", input: "¿Igualan el precio de la competencia?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_negotiate", input: "¿Me puede hacer un mejor precio?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_negotiate_bulk", input: "Si agendo varios tratamientos, ¿hay descuento?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_negotiate_quote", input: "¿Me pueden dar un presupuesto personalizado?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_negotiate_bundle", input: "Si hago dos tratamientos juntos, ¿sale más barato?", expectedIntent: "precio", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },

  // ── Insurance / coverage ──
  { name: "pr_insurance_eps", input: "¿Cubren esto las EPS?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_insurance_medicare", input: "¿Aceptan seguro médico internacional?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
  { name: "pr_insurance_prepago", input: "¿Tienen convenio con medicina prepagada?", expectedIntent: "pago", category: "pricing", meta: { generated: true, reviewStatus: "unreviewed", criticality: "high" } },
];
