import { withTenant } from "../lib/tenant-db.js";
import { evaluateFlow, startFlow, FlowDefinition } from "../flows/engine.js";
import { evaluateEscalation } from "./escalation.js";
import { getCannedResponse, generateLlmResponse, BusinessContext } from "./responder.js";
import { classifyIntent } from "./router.js";
import { eventBus } from "../lib/event-bus.js";
import { db } from "../db/client.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface AgentRequest {
  tenantId: string;
  tenantSlug: string;
  conversationId: string;
  contactName?: string;
  text: string;
}

export interface AgentResponse {
  text: string;
  route: "flow" | "llm" | "canned" | "escalated";
  escalated: boolean;
  escalationReason?: string;
}

async function loadBusinessContext(tenantId: string, sql: any): Promise<BusinessContext> {
  const [profile] = await sql`
    SELECT persona, rules, hours FROM business_profile WHERE tenant_id = ${tenantId}
  `;
  const items = await sql`
    SELECT name, description, price, currency, category
    FROM catalog_items WHERE tenant_id = ${tenantId} AND is_active = 1
    ORDER BY category, name
  `;

  const catalog = items.map((i: any) =>
    `- ${i.name}${i.category ? ` (${i.category})` : ""}: ${i.price} ${i.currency}${i.description ? ` — ${i.description}` : ""}`
  ).join("\n");

  return {
    persona: profile?.persona ?? "Asistente virtual profesional y cordial",
    catalog: catalog || "(Sin servicios cargados)",
    rules: typeof profile?.rules === "object" ? JSON.stringify(profile.rules) : (profile?.rules ?? "Sin reglas especiales"),
    hours: typeof profile?.hours === "object" ? JSON.stringify(profile.hours) : (profile?.hours ?? "Horario no especificado"),
  };
}

async function tryExecuteFlow(
  sql: any,
  conversationId: string,
  text: string,
  contactName?: string
): Promise<{
  response: string;
  context: { flowKey: string; currentState: string; slots: Record<string, string> };
  executed: boolean;
  completed: boolean;
}> {
  const [state] = await sql`
    SELECT flow_key, current_state, slots FROM conversation_state
    WHERE conversation_id = ${conversationId}
    LIMIT 1
  `;

  if (state?.flow_key && state?.current_state) {
    const [flow] = await sql`
      SELECT definition FROM flows
      WHERE tenant_id = (SELECT tenant_id FROM conversations WHERE id = ${conversationId})
        AND key = ${state.flow_key}
        AND is_active = 1
      LIMIT 1
    `;
    if (flow) {
      const rawDef = flow.definition as Record<string, unknown>;
      const definition = rawDef as unknown as FlowDefinition;
      const currentContext = {
        flowKey: state.flow_key as string,
        currentState: state.current_state as string,
        slots: state.slots as Record<string, string>,
      };
      const result = evaluateFlow(definition, currentContext, text);

      if (result.completed) {
        await sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
      } else {
        await sql`
          UPDATE conversation_state
          SET current_state = ${result.context.currentState}, slots = ${JSON.stringify(result.context.slots)}, updated_at = NOW()
          WHERE conversation_id = ${conversationId}
        `;
      }

      return { ...result, executed: true };
    }
  }

  return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false, completed: false };
}

async function tryStartFlow(
  sql: any,
  conversationId: string,
  intent: string,
  contactName?: string
): Promise<{
  response: string;
  context: { flowKey: string; currentState: string; slots: Record<string, string> };
  executed: boolean;
}> {
  if (intent !== "agendamiento") {
    return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false };
  }

  const [conv] = await sql`
    SELECT tenant_id FROM conversations WHERE id = ${conversationId} LIMIT 1
  `;
  if (!conv) return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false };

  const [flow] = await sql`
    SELECT key, definition FROM flows
    WHERE tenant_id = ${conv.tenant_id}
      AND is_active = 1
      AND key = 'agendamiento'
    LIMIT 1
  `;

  if (flow) {
    const rawDef = flow.definition as Record<string, unknown>;
    const definition = rawDef as unknown as FlowDefinition;
    const result = startFlow(definition, contactName);
    const context = { ...result.context, flowKey: flow.key as string };

    await sql`
      INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots)
      VALUES (${conv.tenant_id}, ${conversationId}, ${flow.key}, ${result.context.currentState}, ${JSON.stringify(context.slots)})
      ON CONFLICT (conversation_id) DO UPDATE
        SET flow_key = EXCLUDED.flow_key, current_state = EXCLUDED.current_state, slots = EXCLUDED.slots, updated_at = NOW()
    `;

    return { response: result.response, context, executed: true };
  }

  return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false };
}

export async function processMessage(req: AgentRequest): Promise<AgentResponse> {
  return withTenant(req.tenantId, async (sql) => {
    const { text, conversationId, contactName, tenantSlug } = req;

    // 1. Try resume active flow first
    const resumeResult = await tryExecuteFlow(sql, conversationId, text, contactName);
    if (resumeResult.executed) {
      const response: AgentResponse = {
        text: resumeResult.response,
        route: "flow",
        escalated: false,
      };
      emitResponse(tenantSlug, conversationId, response);
      return response;
    }

    // 2. Classify intent
    const routerResult = await classifyIntent(text);

    // 3. Check escalation
    const escalation = evaluateEscalation(text, routerResult.confidence);
    if (escalation.shouldEscalate) {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;
      const response: AgentResponse = {
        text: "Tu consulta será atendida por un asesor humano en breve.",
        route: "escalated",
        escalated: true,
        escalationReason: escalation.reason,
      };
      emitResponse(tenantSlug, conversationId, response);
      return response;
    }

    // 4. Try start a flow (e.g. agendamiento)
    const startResult = await tryStartFlow(sql, conversationId, routerResult.intent, contactName);
    if (startResult.executed) {
      const response: AgentResponse = {
        text: startResult.response,
        route: "flow",
        escalated: false,
      };
      emitResponse(tenantSlug, conversationId, response);
      return response;
    }

    // 5. Try canned response
    const canned = getCannedResponse(routerResult.intent, { nombre: contactName ?? "" });
    if (canned) {
      const response: AgentResponse = {
        text: canned,
        route: "canned",
        escalated: false,
      };
      emitResponse(tenantSlug, conversationId, response);
      return response;
    }

    // 6. LLM responder (open question)
    const businessContext = await loadBusinessContext(req.tenantId, sql);
    const llmText = await generateLlmResponse(text, businessContext);

    const response: AgentResponse = {
      text: llmText,
      route: "llm",
      escalated: false,
    };
    emitResponse(tenantSlug, conversationId, response);
    return response;
  });
}

function emitResponse(tenantSlug: string, conversationId: string, response: AgentResponse): void {
  eventBus.emit(tenantSlug, {
    tenantId: "",
    conversationId,
    message: {
      id: crypto.randomUUID(),
      direction: "outbound",
      senderType: "bot",
      text: response.text,
      createdAt: new Date().toISOString(),
    },
  });
}
