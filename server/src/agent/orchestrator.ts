import crypto from "crypto";
import { isAgentKernelV2 } from "../env.js";
import { withTenant } from "../lib/tenant-db.js";
import { isOutOfHours } from "../lib/hours.js";
import { evaluateFlow, startFlow, FlowDefinition, CatalogItem, formatPrice } from "../flows/engine.js";
import { evaluateEscalation } from "./escalation.js";
import { getCannedResponse, generateLlmResponse, BusinessContext, addValidationPrefix } from "./responder.js";
import { classifyIntent } from "./router.js";
import { getBookingProvider } from "../booking/index.js";
import { getPaymentProvider } from "../payment/index.js";
import { summarizeConversation } from "./summarizer.js";
import { eventBus } from "../lib/event-bus.js";
import { detectSentiment, type SentimentLabel } from "../lib/sentiment.js";
import { segmentResponse } from "../lib/segmentation.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface AgentRequest {
  tenantId: string;
  tenantSlug: string;
  conversationId: string;
  contactId?: string;
  contactName?: string;
  text: string;
}

export interface MediaItem {
  url: string;
  type: "image" | "video" | "document";
  imageKey: string;
  alt: string;
  service?: string;
  currency?: string;
}

export interface AgentResponse {
  text: string;
  messageId: string;
  route: "flow" | "llm" | "canned" | "escalated" | "booking";
  escalated: boolean;
  escalationReason?: string;
  media?: MediaItem[];
}

async function loadBusinessContext(tenantId: string, sql: any): Promise<BusinessContext & { bookingMode: string; escalationConfig: Record<string, unknown> | null }> {
  const [profile] = await sql`
    SELECT persona, rules, hours, booking_mode, system_prompt_overrides, canned_responses, off_hours_message
    FROM business_profile WHERE tenant_id = ${tenantId}
  `;
  const items: any[] = await sql`
    SELECT name, description, price, currency, category, COALESCE(cities, '[]') AS cities, COALESCE(image_keys, '[]') AS image_keys, promo_label
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
    hoursRaw: (profile?.hours as Record<string, { open: string | null; close: string | null }>) ?? {},
    bookingMode: profile?.booking_mode ?? "mock",
    escalationConfig: profile?.rules as Record<string, unknown> | null ?? null,
    systemPromptOverrides: profile?.system_prompt_overrides ?? null,
    cannedResponses: (profile?.canned_responses as Record<string, string>) ?? {},
    offHoursMessage: profile?.off_hours_message ?? null,
  };
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
    VALUES (${tenantId}, ${conversationId}, 'outbound', ${senderType}, ${providerMsgId}, 'text', ${text}, clock_timestamp())
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

async function emitTypingIndicator(tenantSlug: string, conversationId: string, tenantId: string): Promise<void> {
  eventBus.emit(tenantSlug, {
    tenantId,
    conversationId,
    message: {
      id: `typing_${crypto.randomUUID()}`,
      direction: "outbound",
      senderType: "bot",
      text: null,
      contentType: "typing",
      createdAt: new Date().toISOString(),
    },
  });
}

async function persistAndEmitSegmented(
  sql: any,
  tenantId: string,
  conversationId: string,
  tenantSlug: string,
  text: string,
  senderType: "bot" | "human",
  route: string,
  media?: MediaItem[]
): Promise<string> {
  const segments = segmentResponse(text);
  let lastId = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (i === 0) {
      await emitTypingIndicator(tenantSlug, conversationId, tenantId);
    }

    await sleep(seg.delayMs);

    const providerMsgId = `bot_${crypto.randomUUID()}`;
    const [msg] = await sql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, text, created_at)
      VALUES (${tenantId}, ${conversationId}, 'outbound', ${senderType}, ${providerMsgId}, 'text', ${seg.text}, clock_timestamp())
      RETURNING id, created_at
    `;

    eventBus.emit(tenantSlug, {
      tenantId,
      conversationId,
      message: {
        id: msg.id,
        direction: "outbound",
        senderType,
        text: seg.text,
        createdAt: msg.created_at,
      },
    });

    lastId = msg.id;
  }

  for (const item of media ?? []) {
    const providerMsgId = `bot_${crypto.randomUUID()}`;
    const [msg] = await sql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, media_url, created_at)
      VALUES (${tenantId}, ${conversationId}, 'outbound', ${senderType}, ${providerMsgId}, 'image', ${item.url}, clock_timestamp())
      RETURNING id, created_at
    `;

    eventBus.emit(tenantSlug, {
      tenantId,
      conversationId,
      message: {
        id: msg.id,
        direction: "outbound",
        senderType,
        text: null,
        mediaUrl: item.url,
        createdAt: msg.created_at,
      },
    });

    lastId = msg.id;
  }

  return lastId;
}

function withValidation(text: string, sentimentLabel: SentimentLabel | undefined): string {
  return addValidationPrefix(text, sentimentLabel);
}

async function persistAndEmitBotResponse(
  sql: any,
  tenantId: string,
  conversationId: string,
  tenantSlug: string,
  text: string,
  route: string,
  sentimentLabel?: SentimentLabel
): Promise<string> {
  const finalText = withValidation(text, sentimentLabel);
  return persistAndEmitSegmented(sql, tenantId, conversationId, tenantSlug, finalText, "bot", route);
}

async function sendServiceImages(
  sql: any,
  tenantId: string,
  conversationId: string,
  tenantSlug: string,
  catalogItems: CatalogItem[],
  slots: Record<string, string>
): Promise<string[]> {
  const rawName = slots.service || slots.service_name || "";
  if (!rawName) return [];
  const clean = rawName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
    .replace(/^(quiero |me gustaria |quisiera |necesito |el |la |un |una |los |las )/, "");
  const selected = catalogItems.find((c) => {
    const cn = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return clean.includes(cn) || cn.includes(clean);
  });
  if (!selected?.imageKeys?.length) return [];
  const imageIds: string[] = [];
  for (const key of selected.imageKeys) {
    const providerMsgId = `img_${crypto.randomUUID()}`;
    const [msg] = await sql`
      INSERT INTO messages (tenant_id, conversation_id, direction, sender_type, provider_message_id, content_type, text, media_url, created_at)
      VALUES (${tenantId}, ${conversationId}, 'outbound', 'bot', ${providerMsgId}, 'image', ${selected.name}, ${`/images/${key}`}, NOW())
      RETURNING id, created_at
    `;
    eventBus.emit(tenantSlug, {
      tenantId,
      conversationId,
      message: {
        id: msg.id,
        direction: "outbound",
        senderType: "bot",
        contentType: "image",
        mediaUrl: `/images/${key}`,
        text: selected.name,
        createdAt: msg.created_at,
      },
    });
    imageIds.push(msg.id);
  }
  return imageIds;
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
      const stateDef = definition.states[currentContext.currentState];
      // Estado terminal one-shot (sin next y sin transitions): no debería persistir
      // — pero si llegó aquí es porque un startFlow viejo lo guardó. Borrar y dejar
      // caer al router sin devolver el mismo saludo como respuesta "farewell".
      const isTerminal =
        stateDef &&
        !stateDef.transitions &&
        (stateDef.next == null || stateDef.next === "farewell" || !definition.states[stateDef.next ?? ""]);
      if (isTerminal) {
        await sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
        return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false, completed: true };
      }
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

async function injectPaymentLink(
  response: string,
  currentState: string,
  slots: Record<string, string>,
  catalogItems: CatalogItem[]
): Promise<string> {
  if (currentState !== "payment_instructions" && currentState !== "ask_payment") return response;
  try {
    const provider = getPaymentProvider();
    const svc = catalogItems.find((c) =>
      slots.service?.toLowerCase().includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(slots.service?.toLowerCase() ?? "")
    );
    const amount = svc ? parseFloat(svc.price) : 0;
    if (amount <= 0) return response;
    const result = await provider.createPaymentLink({
      amount,
      currency: "COP",
      reference: `bookia_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      description: svc?.name ?? "Servicio",
    });
    if (result.url) {
      return `💰 Para confirmar tu cita, realiza el pago de $${amount.toLocaleString("es-CO")} COP aquí:\n\n${result.url}\n\nUna vez confirmado el pago, te notificaremos automáticamente.`;
    }
  } catch {}
  return response;
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
  const [conv] = await sql`
    SELECT tenant_id FROM conversations WHERE id = ${conversationId} LIMIT 1
  `;
  if (!conv) return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false };

  const [flow] = await sql`
    SELECT key, definition FROM flows
    WHERE tenant_id = ${conv.tenant_id}
      AND is_active = 1
      AND key = ${intent}
    LIMIT 1
  `;

  if (flow) {
    const rawDef = flow.definition as Record<string, unknown>;
    const definition = rawDef as unknown as FlowDefinition;
    const result = startFlow(definition, contactName, catalogItems);
    const context = { ...result.context, flowKey: flow.key as string };

    // Flow terminal (one-shot, p.ej. first_contact saludo): no persistimos state.
    // El siguiente mensaje pasará tryExecuteFlow → ejecuta:false → router.
    if (!result.completed) {
      await sql`
        INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots)
        VALUES (${conv.tenant_id}, ${conversationId}, ${flow.key}, ${result.context.currentState}, ${context.slots})
        ON CONFLICT (conversation_id) DO UPDATE
          SET flow_key = EXCLUDED.flow_key, current_state = EXCLUDED.current_state, slots = EXCLUDED.slots, updated_at = NOW()
      `;
    }

    return { response: result.response, context, executed: true };
  }

  return { response: "", context: { flowKey: "", currentState: "", slots: {} }, executed: false };
}

async function isFirstMessage(sql: any, conversationId: string): Promise<boolean> {
  // Cuenta solo respuestas previas del bot (outbound). Si el bot nunca respondió,
  // es la primera interacción — el inbound actual ya está persistido por
  // ingestInbound antes de processMessage, así que no podemos usar COUNT(*)=0.
  const [result] = await sql`
    SELECT COUNT(*)::int AS count FROM messages
    WHERE conversation_id = ${conversationId} AND direction = 'outbound'
  `;
  return (result?.count ?? 0) === 0;
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
  const servicePrice = selected ? formatPrice(selected.price, selected.currency) : undefined;

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

  const [booking] = await sql`
    INSERT INTO bookings (tenant_id, conversation_id, contact_id, service_name, service_price, city, datetime, status, booking_provider_ref, data)
    VALUES (${tenantId}, ${conversationId}, ${contactId}, ${serviceName}, ${servicePrice ?? null}, ${slots.city ?? null}, ${slots.datetime ?? null}, ${result.success ? "confirmed" : "failed"}, ${result.providerRef ?? null}, ${slots})
    RETURNING id
  `;

  if (bookingMode === "handoff") {
    await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;
    // Log handoff for Elkin
    await sql`
      INSERT INTO worker_logs (worker, started_at, finished_at, status, summary)
      VALUES ('handoff', NOW(), NOW(), 'completed', ${sql.json({
        type: "booking_handoff",
        conversationId,
        contactId,
        serviceName,
        datetime: slots.datetime,
        contactName: contactName ?? "Anónimo",
        message: "Requiere carga manual a Agenda Pro",
      })})
    `;
    return { text: result.message, escalated: true, escalationReason: "handoff_booking" };
  }

  return { text: result.message, escalated: false };
}

export async function processMessage(req: AgentRequest): Promise<AgentResponse> {
  return withTenant(req.tenantId, async (sql) => {
    const { text, conversationId, contactName, tenantSlug } = req;

    if (isAgentKernelV2()) {
      // Si un humano ya tomó el caso, el bot no vuelve a responder — el mensaje
      // entrante queda en el hilo para que el humano lo vea y conteste él mismo.
      const [convStatus] = await sql`SELECT status FROM conversations WHERE id = ${conversationId} LIMIT 1`;
      if (convStatus?.status === "human_active") {
        return { text: "", messageId: "", route: "canned", escalated: true, escalationReason: "already_handoff" };
      }

      const { processMessageV2 } = await import("./v2/core/v2-adapter.js");
      const v2Result = await processMessageV2({ ...req, sql });
      // A2: persist outbound + emit SSE (parity with V1's persistAndEmitSegmented).
      // The kernel/adapters compute the response; the orchestrator owns persistence.
      const msgId = await persistAndEmitSegmented(
        sql, req.tenantId, conversationId, tenantSlug, v2Result.text, "bot", v2Result.route, v2Result.media
      );

      if (v2Result.escalated) {
        await sql`
          UPDATE conversations
          SET status = 'human_active', handoff_summary = ${v2Result.escalationReason ?? "Requiere atención de un asesor humano."}
          WHERE id = ${conversationId} AND status != 'human_active'
        `;
      }

      return { ...v2Result, messageId: msgId };
    }

    const sentiment = detectSentiment(text);
    const sentimentLabel = sentiment.isNegative ? sentiment.label : undefined;

    const bizContext = await loadBusinessContext(req.tenantId, sql);

    const [convStatus] = await sql`SELECT status FROM conversations WHERE id = ${conversationId} LIMIT 1`;
    if (convStatus && (convStatus.status === "human_active" || convStatus.status === "escalated")) {
      // En vez de silencio, respondemos un canned claro. Así el usuario sabe que
      // un humano lo atenderá y la conversación no parece colgada.
      const handoffText =
        bizContext.cannedResponses?.handoff_ack ??
        "🙌 Gracias por escribir. Un asesor humano está revisando tu caso y te responderá en breve. Gracias por tu paciencia 🤍";
      const msgId = await persistAndEmit(
        sql, req.tenantId, conversationId, tenantSlug, handoffText, "bot", "canned"
      );
      return { text: handoffText, messageId: msgId, route: "canned", escalated: true,
        escalationReason: convStatus.status === "human_active" ? "already_handoff" : "already_escalated" };
    }

    // Check if out of hours — only if tenant explicitly configured an off-hours message
    // DOCX §9: Carlos prefiere "responde normal, sin mencionar el horario" (off_hours_message = null)
    if (bizContext.offHoursMessage && Object.keys(bizContext.hoursRaw).length > 0 && isOutOfHours(bizContext.hoursRaw)) {
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, bizContext.offHoursMessage, "bot", "canned");
      return { text: bizContext.offHoursMessage, messageId: msgId, route: "canned", escalated: false };
    }

    const catalogItems: CatalogItem[] = await sql`
      SELECT name, price::text, currency, COALESCE(cities, '[]') AS cities, COALESCE(image_keys, '[]') AS "imageKeys", promo_label AS "promoLabel",
             prices, requires_human_confirmation AS "requiresHumanConfirmation"
      FROM catalog_items WHERE tenant_id = ${req.tenantId} AND is_active = 1 ORDER BY name
    `;

    // ⚡ Check escalation FIRST — keywords like "emergencia", "cancelar", "humano"
    // must escalate even on the first message, before first_contact flow hooks it
    const earlyEscalation = evaluateEscalation(text, 1.0, bizContext.escalationConfig);
    if (earlyEscalation.shouldEscalate) {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;
      try {
        const rawMsgs = await sql`
          SELECT sender_type, text, created_at FROM messages
          WHERE conversation_id = ${conversationId} AND tenant_id = ${req.tenantId}
          ORDER BY created_at DESC LIMIT 20
        `;
        const msgs = rawMsgs.reverse().map((r: any) => ({
          senderType: r.sender_type as string,
          text: r.text as string | null,
          createdAt: r.created_at as string,
        }));
        const summary = await summarizeConversation(msgs, contactName ?? "Cliente");
        await sql`UPDATE conversations SET handoff_summary = ${summary} WHERE id = ${conversationId}`;
      } catch { /* best-effort */ }
      const escText = "Tu consulta será atendida por un asesor humano en breve.";
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, escText, "bot", "escalated");
      return { text: escText, messageId: msgId, route: "escalated", escalated: true, escalationReason: earlyEscalation.reason };
    }

    // Check if first message — trigger first_contact flow
    if (await isFirstMessage(sql, conversationId)) {
      const firstResult = await tryStartFlow(sql, conversationId, "first_contact", catalogItems, contactName);
      if (firstResult.executed) {
        const msgId = await persistAndEmitBotResponse(sql, req.tenantId, conversationId, tenantSlug, firstResult.response, "flow", sentimentLabel);
        return { text: firstResult.response, messageId: msgId, route: "flow", escalated: false };
      }
    }

    // 1. Try resume active flow
    const resumeResult = await tryExecuteFlow(sql, conversationId, text, catalogItems, contactName);
    if (resumeResult.executed) {
      if (resumeResult.completed) {
        const slots = resumeResult.context.slots;
        if (slots.service || slots.service_name) {
          const [conv] = await sql`SELECT contact_id FROM conversations WHERE id = ${conversationId} LIMIT 1`;
          const bookingResult = await completeBooking(sql, req.tenantId, conversationId, conv.contact_id, slots, bizContext.bookingMode, catalogItems, contactName);
          const msgId = await persistAndEmitBotResponse(sql, req.tenantId, conversationId, tenantSlug, bookingResult.text, "booking", sentimentLabel);
          return { text: bookingResult.text, messageId: msgId, route: "booking", escalated: bookingResult.escalated, escalationReason: bookingResult.escalationReason };
        }
      }
      const textWithPayment = await injectPaymentLink(resumeResult.response, resumeResult.context.currentState, resumeResult.context.slots, catalogItems);
      const msgId = await persistAndEmitBotResponse(sql, req.tenantId, conversationId, tenantSlug, textWithPayment, "flow", sentimentLabel);
      // Fire-and-forget send service images
      sendServiceImages(sql, req.tenantId, conversationId, tenantSlug, catalogItems, resumeResult.context.slots).catch(() => {});
      return { text: textWithPayment, messageId: msgId, route: "flow", escalated: false };
    }

    // 2. Classify intent
    const routerResult = await classifyIntent(text);

    // 2b. If router classifies as "queja", ALWAYS escalate — even without keyword match.
    // The LLM detects complaints the keyword list might miss (e.g. "no me gustó el trato").
    if (routerResult.intent === "queja") {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;
      try {
        const rawMsgs = await sql`
          SELECT sender_type, text, created_at FROM messages
          WHERE conversation_id = ${conversationId} AND tenant_id = ${req.tenantId}
          ORDER BY created_at DESC LIMIT 20
        `;
        const msgs = rawMsgs.reverse().map((r: any) => ({
          senderType: r.sender_type as string,
          text: r.text as string | null,
          createdAt: r.created_at as string,
        }));
        const summary = await summarizeConversation(msgs, contactName ?? "Cliente");
        await sql`UPDATE conversations SET handoff_summary = ${summary} WHERE id = ${conversationId}`;
      } catch { /* best-effort */ }
      const escText = "Tu consulta será atendida por un asesor humano en breve.";
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, escText, "bot", "escalated");
      return { text: escText, messageId: msgId, route: "escalated", escalated: true, escalationReason: "intento_queja" };
    }

    // 3. Check escalation (low-confidence fallback — keywords already caught above)
    const escalation = evaluateEscalation(text, routerResult.confidence, bizContext.escalationConfig);
    if (escalation.shouldEscalate) {
      await sql`UPDATE conversations SET status = 'human_active' WHERE id = ${conversationId}`;

      // Generate handoff summary
      try {
        const rawMsgs = await sql`
          SELECT sender_type, text, created_at FROM messages
          WHERE conversation_id = ${conversationId} AND tenant_id = ${req.tenantId}
          ORDER BY created_at DESC LIMIT 20
        `;
        const msgs = rawMsgs.reverse().map((r: any) => ({
          senderType: r.sender_type as string,
          text: r.text as string | null,
          createdAt: r.created_at as string,
        }));
        const summary = await summarizeConversation(msgs, contactName ?? "Cliente");
        await sql`UPDATE conversations SET handoff_summary = ${summary} WHERE id = ${conversationId}`;
      } catch { /* best-effort */ }

      const text_ = "Tu consulta será atendida por un asesor humano en breve.";
      const msgId = await persistAndEmit(sql, req.tenantId, conversationId, tenantSlug, text_, "bot", "escalated");
      return { text: text_, messageId: msgId, route: "escalated", escalated: true, escalationReason: escalation.reason };
    }

    // 4. Try start a flow (generic — matches flow key to intent)
    const startResult = await tryStartFlow(sql, conversationId, routerResult.intent, catalogItems, contactName);
    if (startResult.executed) {
      const textWithPayment = await injectPaymentLink(startResult.response, startResult.context.currentState, startResult.context.slots, catalogItems);
      const msgId = await persistAndEmitBotResponse(sql, req.tenantId, conversationId, tenantSlug, textWithPayment, "flow", sentimentLabel);
      return { text: textWithPayment, messageId: msgId, route: "flow", escalated: false };
    }

    // 5. Try canned response (from DB) with catalog prices
    // Filter catalog by conversation city slot if available (multi-city hyper-personalization)
    const [stateRow] = await sql`SELECT slots::text FROM conversation_state WHERE conversation_id = ${conversationId} LIMIT 1`;
    let sessionCity = "";
    try {
      if (stateRow?.slots) sessionCity = (JSON.parse(stateRow.slots).city || JSON.parse(stateRow.slots).ciudad || "") as string;
    } catch { /* ignore parse errors */ }
    const filterCity = sessionCity.trim();
    const cityItems = filterCity
      ? catalogItems.filter((c) => !Array.isArray(c.cities) || c.cities.length === 0 || c.cities.some((city) => city.toLowerCase() === filterCity.toLowerCase()))
      : catalogItems;
    const cannedCtx: Record<string, string> = { nombre: contactName ?? "" };
    for (const ci of cityItems) {
      const key = ci.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30);
      cannedCtx[`precio_${key}`] = formatPrice(ci.price, ci.currency);
    }
    cannedCtx["catalog_list"] = cityItems.map((c) => `- ${c.name}: ${formatPrice(c.price, c.currency)}`).join("\n");
    const canned = getCannedResponse(routerResult.intent, cannedCtx, bizContext.cannedResponses);
    if (canned) {
      const msgId = await persistAndEmitBotResponse(sql, req.tenantId, conversationId, tenantSlug, canned, "canned", sentimentLabel);
      return { text: canned, messageId: msgId, route: "canned", escalated: false };
    }

    // 6. LLM responder — with conversation context (last 10 messages + active flow slots)
    const histRows = await sql`
      SELECT sender_type, text FROM messages
      WHERE conversation_id = ${conversationId} AND tenant_id = ${req.tenantId}
        AND (direction = 'inbound' OR (direction = 'outbound' AND sender_type = 'bot'))
      ORDER BY created_at DESC LIMIT 10
    `;
    let historyMessages: { role: "user" | "assistant"; text: string }[] = [];
    let historySlots: Record<string, string> = {};
    try {
      if (histRows && Array.isArray(histRows)) {
        historyMessages = (histRows as any[]).reverse().map((r) => ({
          role: r.sender_type === "contact" ? "user" as const : "assistant" as const,
          text: r.text ?? "",
        })).filter((m) => m.text.length > 0);
      }
    } catch { /* ignore */ }
    try {
      const [slotsRow] = await sql`SELECT slots FROM conversation_state WHERE conversation_id = ${conversationId} LIMIT 1`;
      if (slotsRow?.slots) historySlots = slotsRow.slots as Record<string, string>;
    } catch { /* ignore */ }

    const llmText = await generateLlmResponse(text, bizContext, {
      messages: historyMessages,
      slots: historySlots,
      contactName,
      sentiment: sentimentLabel,
    });
    const msgId = await persistAndEmitBotResponse(sql, req.tenantId, conversationId, tenantSlug, llmText, "llm", sentimentLabel);
    return { text: llmText, messageId: msgId, route: "llm", escalated: false };
  });
}
