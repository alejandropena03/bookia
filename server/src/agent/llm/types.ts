export interface Msg {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LlmCompleteParams {
  system: string;
  messages: Msg[];
  tools?: Tool[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResult {
  text: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

export interface LlmProvider {
  complete(params: LlmCompleteParams): Promise<LlmResult>;
}
