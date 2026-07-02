import { describe, it, expect } from "vitest";
import { renderTemplate } from "../src/flows/template.js";
import { evaluateFlow, startFlow, formatPrice } from "../src/flows/engine.js";
import { getCannedResponse } from "../src/agent/responder.js";
import { evaluateEscalation } from "../src/agent/escalation.js";
import { AGENDAMIENTO_FLOW, FIRST_CONTACT_FLOW } from "../src/flows/santa-maria/flows.js";
import { SANTA_MARIA_CANNED, SANTA_MARIA_ESCALATION_RULES } from "../src/flows/santa-maria/canned-responses.js";
import { SANTA_MARIA_CATALOG } from "../src/flows/santa-maria/catalog.js";
import { resolveServicePrice } from "../src/flows/santa-maria/pricing.js";
import { PRECIO_FLOW } from "../src/flows/santa-maria/flows.js";
import type { CatalogItem } from "../src/flows/engine.js";

const catalog: CatalogItem[] = SANTA_MARIA_CATALOG.map((c) => ({
  name: c.name,
  description: c.description,
  price: c.price,
  currency: c.currency,
  cities: c.cities,
  imageKeys: c.imageKeys,
  promoLabel: c.promoLabel,
}));

// ──────────────────────────────────────────────
// formatPrice
// ──────────────────────────────────────────────

describe("formatPrice", () => {
  it("formats COP with thousands separators", () => {
    expect(formatPrice("2999000", "COP")).toBe("$2.999.000 COP");
  });

  it("formats small COP amounts", () => {
    expect(formatPrice("50000", "COP")).toBe("$50.000 COP");
  });

  it("formats USD", () => {
    expect(formatPrice("350", "USD")).toBe("$350 USD");
  });

  it("handles non-numeric gracefully", () => {
    expect(formatPrice("consultar", "COP")).toBe("consultar");
  });
});

// ──────────────────────────────────────────────
// Santa María canned responses — all 24 render correctly
// ──────────────────────────────────────────────

describe("SANTA_MARIA_CANNED — all canned responses", () => {
  const ctx = {
    nombre: "María",
    catalog_list: "- Botox por zona: $630.000 COP\n- Russian Lips: $820.000 COP",
  };

  it("bienvenida contains Carlos name and city question", () => {
    const result = getCannedResponse("bienvenida", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Santa María");
    expect(result).toContain("Carlos");
    expect(result).toContain("ciudad");
  });

  it("charla offers help", () => {
    const result = getCannedResponse("charla", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("ayudo");
  });

  it("precio includes catalog_list with formatted prices", () => {
    const result = getCannedResponse("precio", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("María");
    expect(result).toContain("Botox");
    expect(result).toContain("ciudad");
  });

  it("agendamiento offers personalized valuation", () => {
    const result = getCannedResponse("agendamiento", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("valoración");
    expect(result).toContain("reservar");
  });

  it("ubicacion contains all 7 city addresses", () => {
    const result = getCannedResponse("ubicacion", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Medellín");
    expect(result).toContain("Bogotá");
    expect(result).toContain("Cali");
    expect(result).toContain("Bucaramanga");
    expect(result).toContain("Barranquilla");
    expect(result).toContain("CDMX");
    expect(result).toContain("Miami");
  });

  it("horarios shows 9am-7pm Mon-Sat", () => {
    const result = getCannedResponse("horarios", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("9:00");
    expect(result).toContain("7:00");
    expect(result).toContain("sábado");
  });

  it("pago lists all 3 country methods", () => {
    const result = getCannedResponse("pago", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Colombia");
    expect(result).toContain("Estados Unidos");
    expect(result).toContain("México");
    expect(result).toContain("Zelle");
  });

  it("valoracion explains $50.000 discountable", () => {
    const result = getCannedResponse("valoracion", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("50.000");
    expect(result).toContain("GRATIS");
    expect(result).toContain("descuentan");
  });

  it("dudas_medicas covers durations + care + anesthesia", () => {
    const result = getCannedResponse("dudas_medicas", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Full Face");
    expect(result).toContain("Botox");
    expect(result.toLowerCase()).toContain("anestesia");
    expect(result).toContain("valoración");
  });

  it("solicitud_comercial routes to Elkin", () => {
    const result = getCannedResponse("solicitud_comercial", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Elkin");
    expect(result).toContain("318 735 4841");
  });

  it("devolucion routes to email with 5-15 days", () => {
    const result = getCannedResponse("devolucion", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("esteticasantamariabga@gmail.com");
    expect(result).toContain("5 a 15 días");
  });

  it("nombres_doctores lists all 3 doctors by city", () => {
    const result = getCannedResponse("nombres_doctores", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Natalia Benavides");
    expect(result).toContain("Ronald de la Rosa");
    expect(result).toContain("Raúl Ramírez");
  });

  it("reagendamiento_control explains 30 days + $50.000", () => {
    const result = getCannedResponse("reagendamiento_control", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("30 días");
    expect(result).toContain("50.000");
  });

  it("rinomodelacion has price $820.000 COP / $8.500 MXN", () => {
    const result = getCannedResponse("rinomodelacion", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("820.000");
    expect(result).toContain("8.500");
  });

  it("armonizacion_facial describes Full Face personalized", () => {
    const result = getCannedResponse("armonizacion_facial", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Full Face");
    expect(result).toContain("natural");
  });

  it("comprobante_pago has Bancolombia account + NIT", () => {
    const result = getCannedResponse("comprobante_pago", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Bancolombia");
    expect(result).toContain("090 00005573");
    expect(result).toContain("901916939");
  });

  it("confirmacion_cita has exact Carlos text with document requirement", () => {
    const result = getCannedResponse("confirmacion_cita", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("programada exitosamente");
    expect(result).toContain("documento de identidad");
    expect(result).toContain("24 horas");
  });

  it("recordatorio_cita asks to confirm", () => {
    const result = getCannedResponse("recordatorio_cita", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("María");
    expect(result).toContain("confirmar");
  });

  it("caso_alergia suggests valuation with doctor", () => {
    const result = getCannedResponse("caso_alergia", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("valoración");
    expect(result).toContain("doctor");
  });

  it("rechazo_fecha_nacimiento justifies with medical safety", () => {
    const result = getCannedResponse("rechazo_fecha_nacimiento", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("representante legal");
    expect(result).toContain("seguridad");
  });

  it("follow_up asks if they have doubts", () => {
    const result = getCannedResponse("follow_up", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("duda");
  });

  it("reengagement_info_enviada pushes for valuation", () => {
    const result = getCannedResponse("reengagement_info_enviada", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("valoración");
  });

  it("off_hours mentions 9am-7pm Mon-Sat", () => {
    const result = getCannedResponse("off_hours", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("9:00");
    expect(result).toContain("lunes a sábado");
  });

  it("datos_agendamiento lists all required fields", () => {
    const result = getCannedResponse("datos_agendamiento", ctx, SANTA_MARIA_CANNED);
    expect(result).toContain("Nombre completo");
    expect(result).toContain("Fecha de nacimiento");
    expect(result).toContain("Documento");
    expect(result).toContain("Teléfono");
    expect(result).toContain("Correo");
    expect(result).toContain("50.000");
  });
});

// ──────────────────────────────────────────────
// Agendamiento flow E2E — textos exactos de Carlos
// ──────────────────────────────────────────────

describe("AGENDAMIENTO_FLOW — E2E with exact Carlos text", () => {
  it("starts with city question (not full welcome)", () => {
    const result = startFlow(AGENDAMIENTO_FLOW, "Carlos", catalog);
    expect(result.response).toContain("ciudad");
    expect(result.response).not.toContain("Bienvenido");
    expect(result.completed).toBe(false);
  });

  it("full agendamiento flow 9 steps with exact text assertions", () => {
    // Step 1: start → ask_city
    const s1 = startFlow(AGENDAMIENTO_FLOW, "María", catalog);
    expect(s1.context.currentState).toBe("ask_city");
    expect(s1.response).toContain("ciudad");

    // Step 2: city → show_service (catalog filtered by city)
    const s2 = evaluateFlow(AGENDAMIENTO_FLOW, s1.context, "Medellín", catalog);
    expect(s2.context.currentState).toBe("show_service");
    expect(s2.context.slots.city).toBe("Medellín");
    expect(s2.response).toContain("Medellín");
    // Catalog should contain services
    expect(s2.response).toContain("Botox");

    // Step 3: service → confirm_service (with price)
    const s3 = evaluateFlow(AGENDAMIENTO_FLOW, s2.context, "Russian Lips", catalog);
    expect(s3.context.currentState).toBe("confirm_service");
    expect(s3.response).toContain("Russian Lips");
    expect(s3.response).toContain("$820.000"); // formatPrice applied
    expect(s3.response).toContain("valoración");

    // Step 4: confirm "sí" → ask_datetime
    const s4 = evaluateFlow(AGENDAMIENTO_FLOW, s3.context, "sí, quiero", catalog);
    expect(s4.context.currentState).toBe("ask_datetime");
    expect(s4.response).toContain("día");
    expect(s4.response).toContain("hora");

    // Step 5: datetime → collect_data
    const s5 = evaluateFlow(AGENDAMIENTO_FLOW, s4.context, "mañana a las 3pm", catalog);
    expect(s5.context.currentState).toBe("collect_data");
    expect(s5.response).toContain("Nombre completo");
    expect(s5.response).toContain("Fecha de nacimiento");
    expect(s5.response).toContain("Documento");
    expect(s5.response).toContain("50.000");

    // Step 6: client data → payment_info
    const s6 = evaluateFlow(AGENDAMIENTO_FLOW, s5.context, "María López, 1990-05-15, 12345678, 3001112233, maria@test.com", catalog);
    expect(s6.context.currentState).toBe("payment_info");
    expect(s6.response).toContain("Bancolombia");
    expect(s6.response).toContain("50.000");
    expect(s6.response).toContain("no reembolsables");

    // Step 7: payment method → await_proof
    const s7 = evaluateFlow(AGENDAMIENTO_FLOW, s6.context, "transferencia", catalog);
    expect(s7.context.currentState).toBe("await_proof");
    expect(s7.response).toContain("comprobante");

    // Step 8: proof → confirm_booking (exact Carlos confirmation text)
    const s8 = evaluateFlow(AGENDAMIENTO_FLOW, s7.context, "aquí está el comprobante", catalog);
    expect(s8.completed).toBe(true);
    expect(s8.response).toContain("programada exitosamente");
    expect(s8.response).toContain("documento de identidad");
    expect(s8.response).toContain("24 horas");
    expect(s8.response).toContain("🤍");
  });
});

// ──────────────────────────────────────────────
// Multi-city catalog filtering
// ──────────────────────────────────────────────

describe("Multi-city catalog filtering", () => {
  it("Medellín shows all CO + ALL_CITIES services (31)", () => {
    const result = startFlow(AGENDAMIENTO_FLOW, "Test", catalog);
    const s2 = evaluateFlow(AGENDAMIENTO_FLOW, result.context, "Medellín", catalog);
    // Medellín has access to most services including Micropigmentación (exclusive)
    expect(s2.response).toContain("Micropigmentación");
    expect(s2.response).toContain("Botox");
  });

  it("CDMX shows only ALL_CITIES services (no CO-only)", () => {
    const result = startFlow(AGENDAMIENTO_FLOW, "Test", catalog);
    const s2 = evaluateFlow(AGENDAMIENTO_FLOW, result.context, "CDMX", catalog);
    // CDMX should NOT have Micropigmentación (Medellín only) or Barbie Botox (CO only,
    // confirmado por Carlos — Botox por zona ya se confirmó disponible en CDMX/Miami).
    expect(s2.response).not.toContain("Micropigmentación");
    expect(s2.response).not.toContain("Barbie Botox");
    // But should have Full Face (ALL_CITIES)
    expect(s2.response).toContain("Full Face");
  });

  it("Miami shows only ALL_CITIES services", () => {
    const result = startFlow(AGENDAMIENTO_FLOW, "Test", catalog);
    const s2 = evaluateFlow(AGENDAMIENTO_FLOW, result.context, "Miami", catalog);
    expect(s2.response).not.toContain("Micropigmentación");
    expect(s2.response).toContain("Full Face");
  });
});

// ──────────────────────────────────────────────
// First contact flow
// ──────────────────────────────────────────────

describe("FIRST_CONTACT_FLOW", () => {
  it("greets with Carlos name and asks how to help", () => {
    const result = startFlow(FIRST_CONTACT_FLOW, "Ana", catalog);
    expect(result.response).toContain("Carlos");
    expect(result.response).toContain("Santa María");
    expect(result.response).toContain("ayudarte");
    // One-shot flow — should be terminal (no state persisted)
    expect(result.completed).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Escalation rules — Santa María specific
// ──────────────────────────────────────────────

describe("Santa María escalation rules", () => {
  const config = {
    escalation: SANTA_MARIA_ESCALATION_RULES.keywords.map((k) => ({
      keyword: k.keyword,
      reason: k.reason,
      notify: k.notify,
    })),
  };

  it("escalates on 'Elkin' mention", () => {
    expect(evaluateEscalation("quiero hablar con Elkin", 0.9, config).shouldEscalate).toBe(true);
  });

  it("escalates on 'descuento' mention", () => {
    expect(evaluateEscalation("¿me dan un descuento?", 0.9, config).shouldEscalate).toBe(true);
  });

  it("escalates on 'canje' mention", () => {
    expect(evaluateEscalation("quiero hacer un canje", 0.9, config).shouldEscalate).toBe(true);
  });

  it("escalates on 'reembolso' mention", () => {
    expect(evaluateEscalation("quiero un reembolso", 0.9, config).shouldEscalate).toBe(true);
  });

  it("escalates on 'garantía' mention", () => {
    expect(evaluateEscalation("¿hay garantía?", 0.9, config).shouldEscalate).toBe(true);
  });

  it("escalates on 'queja' mention", () => {
    expect(evaluateEscalation("quiero poner una queja", 0.9, config).shouldEscalate).toBe(true);
  });

  it("does NOT escalate on normal price question", () => {
    expect(evaluateEscalation("¿cuánto vale el botox?", 0.95, config).shouldEscalate).toBe(false);
  });

  it("does NOT escalate on scheduling question", () => {
    expect(evaluateEscalation("quiero agendar una cita", 0.95, config).shouldEscalate).toBe(false);
  });
});

// ──────────────────────────────────────────────
// A6.6 — Hand Rejuvenation & Masculinización AH
// ──────────────────────────────────────────────

describe("A6.6 — Hand Rejuvenation y Masculinización AH", () => {
  const hrRadio = SANTA_MARIA_CATALOG.find((c) => c.name === "Hand Rejuvenation (Radiesse)")!;
  const hrSculptra = SANTA_MARIA_CATALOG.find((c) => c.name === "Hand Rejuvenation (Sculptra)")!;
  const mascAH = SANTA_MARIA_CATALOG.find((c) => c.name === "Masculinización facial con AH")!;

  it("catalog has 2 Hand Rejuvenation entries", () => {
    expect(hrRadio).toBeDefined();
    expect(hrSculptra).toBeDefined();
    expect(hrRadio.prices).toBeDefined();
    expect(hrRadio.prices!["USD"]).toBeDefined();
    expect(hrRadio.prices!["EUR"]).toBeDefined();
    // Carlos confirmó COP/MXN también (mismo precio que Radiesse/Sculptra por vial) — ya no pendiente.
    expect(hrRadio.prices!["COP"]).toBeDefined();
    expect(hrRadio.prices!["MXN"]).toBeDefined();
  });

  it("Hand Rejuvenation Radiesse Miami → $699 USD", () => {
    const rp = resolveServicePrice(hrRadio, "Miami");
    expect(rp.formattedPrice).toBe("$699 USD");
    expect(rp.currency).toBe("USD");
    expect(rp.requiresHumanConfirmation).toBeFalsy();
  });

  it("Hand Rejuvenation Radiesse Madrid → 699€ EUR", () => {
    const rp = resolveServicePrice(hrRadio, "Madrid");
    expect(rp.formattedPrice).toBe("€699 EUR");
    expect(rp.currency).toBe("EUR");
  });

  it("Hand Rejuvenation Radiesse Bogotá → $2.600.000 COP", () => {
    const rp = resolveServicePrice(hrRadio, "Bogotá");
    expect(rp.formattedPrice).toBe("$2.600.000 COP");
    expect(rp.currency).toBe("COP");
    expect(rp.requiresHumanConfirmation).toBeFalsy();
  });

  it("catalog has Masculinización facial con AH", () => {
    expect(mascAH).toBeDefined();
    expect(mascAH.prices!["COP"]).toBeDefined();
    expect(mascAH.prices!["USD"]).toBeDefined();
    expect(mascAH.prices!["EUR"]).toBeDefined();
    expect(mascAH.prices!["MXN"]).toBeDefined();
  });

  it("Masculinización facial AH Bogotá → $2.999.000 COP", () => {
    const rp = resolveServicePrice(mascAH, "Bogotá");
    expect(rp.formattedPrice).toBe("$2.999.000 COP");
    expect(rp.currency).toBe("COP");
    expect(rp.requiresHumanConfirmation).toBeFalsy();
  });

  it("show_price flow: Hand Rejuvenation Miami → $699 USD", () => {
    const catalogA6 = [
      ...SANTA_MARIA_CATALOG.map((c) => ({ ...c })),
    ] as CatalogItem[];
    const flowCtx = { flowKey: "precio", currentState: "ask_service", slots: { city: "Miami", service: "Hand Rejuvenation (Radiesse)" } };
    // Sending an empty string as user response for the terminal ask_service→show_price transition
    const r = evaluateFlow(PRECIO_FLOW, flowCtx, "", catalogA6);
    expect(r.response).toContain("699");
    expect(r.response).toContain("USD");
    expect(r.completed).toBe(true);
  });

  it("show_price flow: Hand Rejuvenation Bogotá → $2.600.000 COP", () => {
    const catalogA6 = [
      ...SANTA_MARIA_CATALOG.map((c) => ({ ...c })),
    ] as CatalogItem[];
    const flowCtx = { flowKey: "precio", currentState: "ask_service", slots: { city: "Bogotá", service: "Hand Rejuvenation (Radiesse)" } };
    const r = evaluateFlow(PRECIO_FLOW, flowCtx, "", catalogA6);
    expect(r.response).toContain("2.600.000");
    expect(r.response).toContain("COP");
    expect(r.completed).toBe(true);
  });

  it("show_price flow: Masculinización facial AH Bogotá → $2.999.000 COP", () => {
    const catalogA6 = [
      ...SANTA_MARIA_CATALOG.map((c) => ({ ...c })),
    ] as CatalogItem[];
    const flowCtx = { flowKey: "precio", currentState: "ask_service", slots: { city: "Bogotá", service: "Masculinización facial con AH" } };
    const r = evaluateFlow(PRECIO_FLOW, flowCtx, "", catalogA6);
    expect(r.response).toContain("2.999.000");
    expect(r.response).toContain("COP");
  });
});
