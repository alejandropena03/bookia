import { describe, it, expect } from "vitest";
import { renderTemplate } from "../src/flows/template.js";
import { classifyIntent } from "../src/agent/router.js";
import { evaluateFlow, startFlow } from "../src/flows/engine.js";
import { evaluateEscalation } from "../src/agent/escalation.js";
import { getCannedResponse } from "../src/agent/responder.js";
import type { FlowDefinition, FlowContext } from "../src/flows/engine.js";

const mockFlow: FlowDefinition = {
  initial: "greeting",
  states: {
    greeting: {
      prompt: "¡Hola {nombre}! ¿En qué puedo ayudarte?",
      collects: "need",
      next: "farewell",
    },
    farewell: {
      prompt: "¡Gracias {nombre}, que tengas un buen día!",
      collects: null,
      next: null,
    },
  },
};

const agendamientoFlow: FlowDefinition = {
  initial: "ask_city",
  states: {
    ask_city: {
      prompt: "¡Hola {nombre}! ¿De qué ciudad nos escribes?",
      collects: "city",
      next: "show_service",
    },
    show_service: {
      prompt: "Tenemos estos servicios disponibles en {city}:\n- Limpieza facial\n- Relleno\n¿Cuál te interesa?",
      collects: "service",
      next: "confirm_service",
    },
    confirm_service: {
      prompt: "Has elegido: {service}. ¿Te gustaría agendar una cita?",
      collects: "confirmation",
      transitions: {
        si: "ask_datetime",
        no: "farewell",
      },
    },
    ask_datetime: {
      prompt: "Perfecto. ¿Qué día y hora te gustaría agendar?",
      collects: "datetime",
      next: "payment_instructions",
    },
    payment_instructions: {
      prompt: "Para confirmar tu cita del {datetime}, realizamos el pago anticipado. ¿Cómo prefieres pagar?",
      collects: "payment_method",
      next: "farewell",
    },
    farewell: {
      prompt: "¡Gracias {nombre}! Si necesitas algo más, aquí estamos.",
      collects: null,
      next: null,
    },
  },
};

describe("renderTemplate", () => {
  it("replaces variables", () => {
    const result = renderTemplate("Hola {nombre}, tu cita en {city}", { nombre: "Maria", city: "Bogotá" });
    expect(result).toBe("Hola Maria, tu cita en Bogotá");
  });

  it("replaces missing variables with empty string", () => {
    const result = renderTemplate("Hola {nombre}", {});
    expect(result).toBe("Hola ");
  });

  it("ignores unknown variables", () => {
    const result = renderTemplate("Texto sin variables", { nombre: "Test" });
    expect(result).toBe("Texto sin variables");
  });
});

describe("classifyIntent", () => {
  it("classifies agendamiento intent", async () => {
    const result = await classifyIntent("Quiero agendar una cita");
    expect(result.intent).toBe("agendamiento");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("classifies charla intent", async () => {
    const result = await classifyIntent("Hola, buenos días");
    expect(result.intent).toBe("charla");
  });

  it("handles unknown intents", async () => {
    const result = await classifyIntent("xyz1234test");
    expect(result.intent).toBe("otro");
  });
});

describe("startFlow", () => {
  it("returns first state prompt", () => {
    const result = startFlow(mockFlow, "Maria");
    expect(result.response).toBe("¡Hola Maria! ¿En qué puedo ayudarte?");
    expect(result.context.currentState).toBe("greeting");
    expect(result.completed).toBe(false);
  });

  it("handles missing initial state gracefully", () => {
    const result = startFlow({ initial: "nonexistent", states: {} });
    expect(result.completed).toBe(true);
  });
});

describe("evaluateFlow", () => {
  it("advances to next state", () => {
    const context: FlowContext = { flowKey: "test", currentState: "greeting", slots: { nombre: "Maria" } };
    const result = evaluateFlow(mockFlow, context, "Quiero info");
    expect(result.context.currentState).toBe("farewell");
    expect(result.response).toBe("¡Gracias Maria, que tengas un buen día!");
    expect(result.completed).toBe(true);
  });

  it("handles agendamiento flow with transitions", () => {
    const initial = startFlow(agendamientoFlow, "Carlos");
    expect(initial.response).toContain("ciudad");

    // Step 2: provide city
    const step2 = evaluateFlow(agendamientoFlow, initial.context, "Bogotá");
    expect(step2.response).toContain("Bogotá");
    expect(step2.context.currentState).toBe("show_service");

    // Step 3: provide service
    const step3 = evaluateFlow(agendamientoFlow, step2.context, "Limpieza facial");
    expect(step3.response).toContain("Limpieza facial");
    expect(step3.context.currentState).toBe("confirm_service");

    // Step 4: confirm with "si"
    const step4 = evaluateFlow(agendamientoFlow, step3.context, "sí, quiero");
    expect(step4.response).toContain("Qué día");
    expect(step4.context.currentState).toBe("ask_datetime");

    // Step 5: provide datetime
    const step5 = evaluateFlow(agendamientoFlow, step4.context, "Mañana a las 3pm");
    expect(step5.context.currentState).toBe("payment_instructions");

    // Step 6: payment
    const step6 = evaluateFlow(agendamientoFlow, step5.context, "Transferencia");
    expect(step6.completed).toBe(true);
    expect(step6.response).toContain("Carlos");
  });

  it("handles 'no' transition to farewell", () => {
    const initial = startFlow(agendamientoFlow, "Maria");

    const step2 = evaluateFlow(agendamientoFlow, initial.context, "Bogotá");
    const step3 = evaluateFlow(agendamientoFlow, step2.context, "Limpieza");
    const step4 = evaluateFlow(agendamientoFlow, step3.context, "no gracias");
    expect(step4.completed).toBe(true);
    expect(step4.response).toContain("Gracias");
  });
});

describe("evaluateEscalation", () => {
  it("escalates on keyword match (high confidence)", () => {
    const result = evaluateEscalation("Necesito hablar con un humano", 1);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toContain("humano");
  });

  it("escalates on keyword match even with LOW confidence (fixed order)", () => {
    const result = evaluateEscalation("tuve una reacción alérgica", 0.15);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toContain("Reacción");
  });

  it("escalates on emergency keyword with low confidence", () => {
    const result = evaluateEscalation("emergencia, me duele mucho", 0.1);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toContain("Emergencia");
  });

  it("does not escalate normal messages", () => {
    const result = evaluateEscalation("¿Qué servicios tienen?", 0.95);
    expect(result.shouldEscalate).toBe(false);
  });

  it("returns low confidence signal (not escalation) for gibberish", () => {
    const result = evaluateEscalation("xyz123", 0.2);
    expect(result.shouldEscalate).toBe(false);
    expect(result.reason).toBe("confianza_baja");
  });

  it("uses custom rules from config", () => {
    const config = { rules: { escalation: [{ keyword: "descuento", reason: "Cliente pidió descuento" }] } };
    const result = evaluateEscalation("¿me dan un descuento?", 0.9, config);
    expect(result.shouldEscalate).toBe(true);
    expect(result.reason).toContain("descuento");
  });
});

describe("getCannedResponse", () => {
  it("returns null for unknown intent", () => {
    const result = getCannedResponse("unknown", {});
    expect(result).toBeNull();
  });

  it("renders canned response with template", () => {
    const result = getCannedResponse("charla", { nombre: "Ana" }, { charla: "¡Hola {nombre}! ¿En qué puedo ayudarte?" });
    expect(result).toBe("¡Hola Ana! ¿En qué puedo ayudarte?");
  });
});
