import { LlmProvider, LlmCompleteParams, LlmResult, Msg } from "./types.js";

const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-v4-flash";

interface DeepSeekMessage {
  role: string;
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
}

interface DeepSeekChoice {
  message: DeepSeekMessage;
  finish_reason: string;
}

interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

export class DeepSeekProvider implements LlmProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = DEEPSEEK_BASE) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async complete(params: LlmCompleteParams): Promise<LlmResult> {
    const model = params.model ?? DEFAULT_MODEL;
    const messages: DeepSeekMessage[] = [
      { role: "system", content: params.system },
      ...params.messages.map((m: Msg) => ({
        role: m.role,
        content: m.content,
        tool_call_id: m.tool_call_id,
        tool_calls: m.tool_calls,
      })),
    ];

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 1024,
    };
    if (params.tools?.length) {
      body.tools = params.tools;
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepSeek API error ${res.status}: ${errText}`);
    }

    const json = await res.json() as {
      choices: DeepSeekChoice[];
      usage: DeepSeekUsage;
    };

    const choice = json.choices[0];
    return {
      text: choice.message.content ?? "",
      toolCalls: choice.message.tool_calls,
      usage: {
        inputTokens: json.usage.prompt_tokens,
        outputTokens: json.usage.completion_tokens,
      },
      model,
    };
  }
}
