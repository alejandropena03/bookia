// Model pricing in USD per 1M tokens (approximate, as of 2026-06)
// Source: DeepSeek official pricing / OpenRouter pricing page
// These are CONFIGURABLE — update when rates change or add new models.
export const MODEL_PRICING: Record<string, { input: number; output: number; note: string }> = {
  "deepseek-chat": {
    input: 0.27,
    output: 1.10,
    note: "DeepSeek-V3 actual. Barato y capaz.",
  },
  "deepseek-reasoner": {
    input: 0.55,
    output: 2.19,
    note: "DeepSeek-R1 con razonamiento visible. Más caro pero mejor en lógica.",
  },
  "mock": {
    input: 0,
    output: 0,
    note: "Proveedor mock para tests — sin costo.",
  },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}
