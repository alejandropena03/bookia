import { withTenant } from "../lib/tenant-db.js";
import { evaluateFlow, startFlow, FlowDefinition, CatalogItem } from "../flows/engine.js";
import { evaluateEscalation } from "./escalation.js";
import { getCannedResponse, generateLlmResponse, BusinessContext } from "./responder.js";
import { classifyIntent } from "./router.js";
import { getBookingProvider } from "../booking/index.js";
import { eventBus } from "../lib/event-bus.js";

export interface AgentRequest {
  tenantId: string;
  tenantSlug: string;
  conversationId: string;
  contactId?: string;
  contactName?: string;
  text: string;
}

export interface AgentResponse {
  text: string;
  messageId: string;
  route: "flow" | "llm" | "canned" | "escalated" | "booking";
  escalated: boolean;
  escalationReason?: string;
}

async function loadBusinessContext(tenantId: string, sql: any): Promise<BusinessContext & { bookingMode: string; escalationConfig: Record<string, unknown> | null }> {
  const [profile] = await sql`
    SELECT persona, rules, hours, booking_mode FROM business_profile WHERE tenant_id = ${tenantId}
  `;
  const items: any[] = await sql`
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
    bookingMode: profile?.booking_mode ?? "mock",
    escalationConfig: profile?.rules as Record<string, unknown> | null ?? null,
  };
}

function loadCatalogItems(raw: any[]): CatalogItem[] {
  return raw.map((i: any) => ({
    name: i.name,
    price: String(i.price),
    currency: i.currency,
  }));
}

async function persistAndEmit(
  sql: any,
  tenantId: string,
  conversationId: string,
  tenantSlug: string,
  text: string,
  senderType: "bot" | "human",
  route: string
): Promise<string> {
  const providerMsgId = `bot_${crypto.randomUUID()}`;
  const [msg] = await sql`
    INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, text, created_at)
    VALUES (${tenantId}, ${conversationId}, 'outbound', ${senderType}, ${providerMsgId}, 'text', ${text}, NOW())
    RETURNING id, created_at
  `;

  eventBus.emit(tenantSlug, {
    tenantId,
    conversationId,
    message: {
      id: msg.id,
      direction: "outbound",
      senderType,
      text,
      createdAt: msg.created_at,
    },
  });

  return msg.id;
}

async function tryExecuteFlow(
  sql: any,
  conversationId: string,
  text: string,
  catalogItems: CatalogItem[],
  _contactName?: string
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
      const result = evaluateFlow(definition, currentContext, text, catalogItems);

      if (result.completed) {
        await sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
      } else {
        await sql`
          UPDATE conversation_state
          SET current_state = ${result.context.currentState}, slots = ${result.context.slots}, updated_at = NOW()
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
  catalogItems: CatalogItem[],
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
    const result = startFlow(definition, contactName, catalogItems);
    const context = { ...result.context, flowKey: flow.key as string };

    await sql`
      INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots)
      VALUES (${conv.tenant_id}, ${conversationId}, ${flow.key}, ${result.context.currentState}, ${context.slots})
      ON CONFLICT (conversation_id) DO UPDATE
        SET flow_key = EXCLUDED.flow_key, current_state = EXCLUDED.current_state, slots = EXCLUDED.slots, updated_at = NOW()
    `;

    return { response: result.response, context, executed: true };
  }

  return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false };
}

async function completeBooking(
  sql: any,
  tenantId: string,
  conversationId: string,
  contactId: string,
  slots: Record<string, string>,
  bookingMode: string,
  catalogItems: CatalogItem[],
  contactName?: string
): Promise<{ text: string; escalated: boolean; escalationReason?: string }> {
  const selectedName = slots.service || slots.service_name || "";
  const selected = catalogItems.find((c) =>
    selectedName.toLowerCase().includes(c.name.toLowerCase()) ||
    c.name.toLowerCase().includes(selectedName.toLowerCase())
  );

  const serviceName = selected?.name ?? selectedName;
  const servicePrice = selected ? `${selected.price} ${selected.currency}` : undefined;

  const provider = getBookingProvider(bookingMode);
  const result = await provider.createBooking({
    tenantId,
    conversationId,
    contactId,
    serviceName,
    servicePrice,
    city: slots.city,
    datetime: slots.datetime,
    contactName,
  });

  // Persist booking in DB
  const [booking] = await sql`
    INSERT INTO bookings (tenant_id, conversation_id, contact_id, service_name, service_price, city, datetime, status, booking_provider_ref, data)
    VALUES (${tenantId}, ${conversationId}, ${contactId}, ${serviceName}, ${servicePrice ?? null}, ${slots.city ?? null}, ${slots.datetime ?? null}, ${result.success ? "confirmed" : "failed"}, ${result.providerRef ?? null}, ${slots})
    RETURNING id
  `;

  // If handoff mode, escalate
  if (bookingMode === "handoff") {
    await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;
    return { text: result.message, escalated: true, escalationReason: "handoff_booking" };
  }

  return { text: result.message, escalated: false };
}

export async function processMessage(req: AgentRequest): Promise<AgentResponse> {
  return withTenant(req.tenantId, async (sql) => {
    const { text, conversationId, contactName, tenantSlug } = req;

    // Check if conversation is human-controlled — bot abstains
    const [convStatus] = await sql`SELECT status FROM conversations WHERE id = ${conversationId} LIMIT 1`;
    if (convStatus && (convStatus.status === "human_active" || convStatus.status === "escalated")) {
      return { text: "", messageId: "", route: "flow", escalated: false };
    }

    // Load reusable data
    const bizContext = await loadBusinessContext(req.tenantId, sql);
    const catalogItems: CatalogItem[] = await sql`
      SELECT name, price::text, currency FROM catalog_items WHERE tenant_id = ${req.tenantId} AND is_active = 1 ORDER BY name
    `;

    // 1. Try resume active flow first
    const resumeResult = await tryExecuteFlow(sql, conversationId, text, catalogItems, contactName);
    if (resumeResult.executed) {
      if (resumeResult.completed) {
        // Flow completed — check if there's a booking to create
        // The farewell state means the flow is done; only create booking if we have service info
        const slots = resumeResult.context.slots;
        if (slots.service || slots.service_name) {
          const [conv] = await sql`SELECT contact_id FROM conversations WHERE id = ${conversationId} LIMIT 1`;
          const bookingResult = await completeBooking(sql, req.tenantId, conversationId, conv.contact_id, slots, bizContext.bookingMode, catalogItems, contactName);
          const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, bookingResult.text, "bot", "booking");
          return { text: bookingResult.text, messageId: msgId, route: "booking", escalated: bookingResult.escalated, escalationReason: bookingResult.escalationReason };
        }
      }
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, resumeResult.response, "bot", "flow");
      return { text: resumeResult.response, messageId: msgId, route: "flow", escalated: false };
    }

    // 2. Classify intent
    const routerResult = await classifyIntent(text);

    // 3. Check escalation (pass rules from business_profile)
    const escalation = evaluateEscalation(text, routerResult.confidence, bizContext.escalationConfig);
    if (escalation.shouldEscalate) {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;
      const text_ = "Tu consulta será atendida por un asesor humano en breve.";
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, text_, "bot", "escalated");
      return { text: text_, messageId: msgId, route: "escalated", escalated: true, escalationReason: escalation.reason };
    }

    // 4. Try start a flow (e.g. agendamiento)
    const startResult = await tryStartFlow(sql, conversationId, routerResult.intent, catalogItems, contactName);
    if (startResult.executed) {
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, startResult.response, "bot", "flow");
      return { text: startResult.response, messageId: msgId, route: "flow", escalated: false };
    }

    // 5. Try canned response
    const canned = getCannedResponse(routerResult.intent, { nombre: contactName ?? "" });
    if (canned) {
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, canned, "bot", "canned");
      return { text: canned, messageId: msgId, route: "canned", escalated: false };
    }

    // 6. LLM responder (open question)
    const llmText = await generateLlmResponse(text, bizContext);
    const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, llmText, "bot", "llm");
    return { text: llmText, messageId: msgId, route: "llm", escalated: false };
  });
}
