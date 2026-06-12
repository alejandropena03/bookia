import { env } from "../../env.js";
import { LlmProvider } from "./types.js";
import { DeepSeekProvider } from "./deepseek.js";
import { MockLlmProvider } from "./mock.js";

let provider: LlmProvider | null = null;

export function getLlm(): LlmProvider {
  if (provider) return provider;

  switch (env.LLM_PROVIDER) {
    case "deepseek":
      provider = new DeepSeekProvider(env.DEEPSEEK_API_KEY);
      break;
    case "mock":
    default:
      provider = new MockLlmProvider();
      break;
  }

  return provider;
}

export function resetLlm(): void {
  provider = null;
}
