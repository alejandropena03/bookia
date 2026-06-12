import { describe, it, expect } from "vitest";
import { MockLlmProvider } from "../src/agent/llm/mock.js";
import { getLlm, resetLlm } from "../src/agent/llm/index.js";

describe("MockLlmProvider", () => {
  const mock = new MockLlmProvider();

  it("returns a non-empty response", async () => {
    const result = await mock.complete({
      system: "Eres un asistente útil",
      messages: [{ role: "user", content: "Hola" }],
    });
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.usage.inputTokens).toBeGreaterThan(0);
    expect(result.usage.outputTokens).toBeGreaterThan(0);
  });

  it("returns JSON with intent for agendamiento", async () => {
    const result = await mock.complete({
      system: "",
      messages: [{ role: "user", content: "Quiero agendar una cita" }],
    });
    const parsed = JSON.parse(result.text);
    expect(parsed.intent).toBe("agendamiento");
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("returns JSON with intent for precio", async () => {
    const result = await mock.complete({
      system: "",
      messages: [{ role: "user", content: "¿Cuánto cuesta?" }],
    });
    const parsed = JSON.parse(result.text);
    expect(parsed.intent).toBe("precio");
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("returns JSON with intent for queja", async () => {
    const result = await mock.complete({
      system: "",
      messages: [{ role: "user", content: "Me duele mucho" }],
    });
    const parsed = JSON.parse(result.text);
    expect(parsed.intent).toBe("queja");
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("returns JSON with intent for charla", async () => {
    const result = await mock.complete({
      system: "",
      messages: [{ role: "user", content: "Buenos días" }],
    });
    const parsed = JSON.parse(result.text);
    expect(parsed.intent).toBe("charla");
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("uses system prompt context in fallback response", async () => {
    const result = await mock.complete({
      system: "Contexto específico de clínica estética",
      messages: [{ role: "user", content: "¿Qué servicios tienen?" }],
    });
    expect(result.text.includes("Contexto específico")).toBe(true);
  });
});

describe("getLlm factory", () => {
  afterEach(() => resetLlm());

  it("returns MockLlmProvider by default", () => {
    const llm = getLlm();
    expect(llm.constructor.name).toBe("MockLlmProvider");
  });
});
