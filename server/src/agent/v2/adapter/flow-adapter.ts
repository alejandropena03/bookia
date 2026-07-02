import type postgres from "postgres";
import * as chrono from "chrono-node";
import { evaluateFlow, startFlow, type FlowDefinition, type FlowContext, type FlowResult, type CatalogItem } from "../../../flows/engine.js";
import { renderTemplate } from "../../../flows/template.js";
import { SANTA_MARIA_CANNED } from "../../../flows/santa-maria/canned-responses.js";
import { type MemoryService } from "../memory/memory-service.js";
import type { MediaItem, ExtractedEntities } from "../../v2/types/agent-intent.js";
import { filterImagesByMarket } from "../../../flows/santa-maria/pricing.js";

// Convierte texto libre ("el sábado a las 3pm", "próximo miércoles en la tarde") a un
// datetime ISO real. Si no se puede parsear con confianza, deja el texto original —
// mejor un texto claro para revisión humana que una fecha inventada.
function parseBookingDateTime(text: string, refDate: Date): string {
  const parsed = chrono.es.parseDate(text, refDate, { forwardDate: true });
  return parsed ? parsed.toISOString() : text;
}

const INTENT_TO_FLOW_KEY: Record<string, string> = {
  saludo: "first_contact",
  agendamiento: "agendamiento",
  precio: "precio",
};

// ── A6.5 — guías post-tratamiento (canned) disparadas por service slot ──
// Service pattern → canned key en SANTA_MARIA_CANNED.
const POST_TREATMENT_GUIDES: Array<{ servicePattern: RegExp; guideKey: string }> = [
  { servicePattern: /rinomodela/i, guideKey: "guia_rinomodelacion" },
];

function resolvePostTreatmentGuide(slots: Record<string, string>, contactName?: string): string {
  const serviceName = (slots.service_name || slots.service || "").toLowerCase();
  if (!serviceName) return "";
  const match = POST_TREATMENT_GUIDES.find((g) => g.servicePattern.test(serviceName));
  if (!match) return "";
  const template = SANTA_MARIA_CANNED[match.guideKey];
  if (!template) return "";
  return renderTemplate(template, { nombre: contactName ?? "" });
}

export interface FlowAdapterResult {
  response: string;
  route: "flow";
  media?: MediaItem[];
}

function resolveMedia(catalogItems: CatalogItem[], slots: Record<string, string>): MediaItem[] | undefined {
  const serviceName = slots.service_name || slots.service;
  if (!serviceName) return undefined;
  const match = catalogItems.find(
    (c) => serviceName.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(serviceName.toLowerCase()),
  );
  if (!match?.imageKeys?.length) return undefined;
  const filteredKeys = filterImagesByMarket(match.imageKeys, slots.city);
  return filteredKeys.map((key: string) => ({
    url: `/images/${key}`,
    type: "image" as const,
    imageKey: key,
    alt: match.name,
    service: match.name,
    currency: match.currency,
  }));
}

export class FlowAdapter {
  constructor(
    private sql: postgres.Sql,
    private memoryService: MemoryService,
    private catalogItems: CatalogItem[] = [],
  ) {}

  async evaluateFlow(
    conversationId: string,
    intent: string,
    text: string,
    tenantId: string,
    contactId: string,
    contactName?: string,
    entities?: ExtractedEntities,
  ): Promise<FlowAdapterResult | null> {
    // A6.5: si pregunta directamente por cuidados post-tratamiento de un
    // servicio con guía, devolvemos la canned sin iniciar/resumir flow.
    if (intent === "post_tratamiento") {
      const direct = POST_TREATMENT_GUIDES.find((g) => g.servicePattern.test(text));
      if (direct && SANTA_MARIA_CANNED[direct.guideKey]) {
        return { response: renderTemplate(SANTA_MARIA_CANNED[direct.guideKey], { nombre: contactName ?? "" }), route: "flow" };
      }
    }

    const activeFlow = await this.loadActiveFlow(conversationId);

    if (activeFlow) {
      return this.handleResume(activeFlow, text, tenantId, conversationId, contactId);
    }

    const flowKey = this.resolveFlowKey(intent);
    if (!flowKey) return null;

    return this.handleStart(flowKey, intent, text, tenantId, conversationId, contactId, contactName, entities);
  }

  private resolveFlowKey(intent: string): string | null {
    return INTENT_TO_FLOW_KEY[intent] ?? null;
  }

  private async loadActiveFlow(
    conversationId: string,
  ): Promise<{ flowKey: string; currentState: string; slots: Record<string, string> } | null> {
    const [row] = await this.sql`
      SELECT flow_key, current_state, slots FROM conversation_state
      WHERE conversation_id = ${conversationId}
      LIMIT 1
    `;
    if (!row?.flow_key || !row?.current_state) return null;
    return {
      flowKey: row.flow_key as string,
      currentState: row.current_state as string,
      slots: (row.slots as Record<string, string>) ?? {},
    };
  }

  private async loadDefinition(tenantId: string, flowKey: string): Promise<FlowDefinition | null> {
    const [flow] = await this.sql`
      SELECT definition FROM flows
      WHERE tenant_id = ${tenantId} AND key = ${flowKey} AND is_active = 1
      LIMIT 1
    `;
    if (!flow) return null;
    return flow.definition as unknown as FlowDefinition;
  }

  private advanceKnownSlots(
    definition: FlowDefinition,
    flowContext: FlowContext,
    catalogItems: CatalogItem[],
  ): FlowResult {
    let context = { ...flowContext };
    let result: FlowResult = { response: "", context, completed: false };
    let safety = 5;
    while (safety-- > 0) {
      const state = definition.states[context.currentState];
      if (!state?.collects) break;
      const knownValue = context.slots[state.collects];
      if (!knownValue) break;
      result = evaluateFlow(definition, context, knownValue, catalogItems);
      context = result.context;
    }
    return result;
  }

  private async handleResume(
    active: { flowKey: string; currentState: string; slots: Record<string, string> },
    text: string,
    tenantId: string,
    conversationId: string,
    contactId: string,
  ): Promise<FlowAdapterResult | null> {
    const definition = await this.loadDefinition(tenantId, active.flowKey);
    if (!definition) {
      await this.sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
      return null;
    }

    const state = definition.states[active.currentState];
    const isTerminal =
      state && !state.transitions && (state.next == null || !definition.states[state.next]);
    if (isTerminal) {
      await this.sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
      return null;
    }

    // Solo se envían fotos justo cuando el cliente elige el servicio — transición
    // show_service → confirm_service (agendamiento) o ask_service → show_price (precio).
    // En turnos posteriores slots.service sigue presente, pero ya no hay que reenviar
    // las mismas imágenes cada vez.
    const justSelectedService = active.currentState === "show_service" || active.currentState === "ask_service";

    const result = evaluateFlow(definition, active, text, this.catalogItems);

    await this.memoryService.onDataCollected(tenantId, contactId, conversationId, result.context.slots);

    const slots = await this.memoryService.hydrateFlowSlots(tenantId, contactId, result.context.slots);
    let flowContext: FlowContext = { flowKey: active.flowKey, currentState: result.context.currentState, slots };
    const advancedResult = this.advanceKnownSlots(definition, flowContext, this.catalogItems);
    flowContext = advancedResult.context;
    const finalResult = advancedResult.response ? advancedResult : result;

    if (finalResult.completed) {
      await this.memoryService.onFlowCompleted(tenantId, contactId, conversationId, active.flowKey, flowContext.slots);
      await this.maybeCreateBooking(tenantId, conversationId, contactId, active.flowKey, flowContext.slots);
      await this.sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
    } else {
      await this.sql`
        UPDATE conversation_state
        SET current_state = ${flowContext.currentState}, slots = ${this.sql.json(flowContext.slots)}, updated_at = NOW()
        WHERE conversation_id = ${conversationId}
      `;
    }

    // A6.5: si el flow completó con comprobante (cita confirmada) y el
    // servicio tiene guía post-tratamiento, appendear la canned guide.
    let finalResponse = finalResult.response;
    if (finalResult.completed && flowContext.slots.payment_proof) {
      const guide = resolvePostTreatmentGuide(flowContext.slots);
      if (guide) finalResponse = `${finalResponse}\n\n${guide}`;
    }

    return {
      response: finalResponse,
      route: "flow",
      media: justSelectedService ? resolveMedia(this.catalogItems, flowContext.slots) : undefined,
    };
  }

  private async handleStart(
    flowKey: string,
    intent: string,
    text: string,
    tenantId: string,
    conversationId: string,
    contactId: string,
    contactName?: string,
    entities?: ExtractedEntities,
  ): Promise<FlowAdapterResult | null> {
    const definition = await this.loadDefinition(tenantId, flowKey);
    if (!definition) return null;

    const result = startFlow(definition, contactName, this.catalogItems);
    const slots = await this.memoryService.hydrateFlowSlots(tenantId, contactId, result.context.slots);

    // Pre-sembrar slots con lo que el router ya extrajo del mensaje que disparó el flow.
    // Sin esto, un cliente que dice "¿cuánto cuesta el Russian Lips?" (service ya explícito)
    // igual tiene que responder "¿cuál servicio?" porque el flow arranca en ask_city/ask_service
    // sin conocer nada. `advanceKnownSlots` salta cualquier estado cuyo slot ya esté lleno,
    // así que sembrar aquí hace que el flow avance directo hasta lo que realmente falta.
    // Memoria e info hidratada tienen prioridad: solo llenamos slots que sigan vacíos.
    if (entities?.city && !slots.city) slots.city = entities.city;
    if (entities?.service && !slots.service) slots.service = entities.service;

    let flowContext: FlowContext = { flowKey, currentState: result.context.currentState, slots };
    const flowResult = this.advanceKnownSlots(definition, flowContext, this.catalogItems);
    flowContext = flowResult.context;
    const finalResponse = flowResult.response || result.response;
    const isCompleted = flowResult.response ? flowResult.completed : result.completed;

    if (!isCompleted) {
      await this.sql`
        INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots)
        VALUES (${tenantId}, ${conversationId}, ${flowKey}, ${flowContext.currentState}, ${this.sql.json(flowContext.slots)})
        ON CONFLICT (conversation_id) DO UPDATE
          SET flow_key = EXCLUDED.flow_key, current_state = EXCLUDED.current_state, slots = EXCLUDED.slots, updated_at = NOW()
      `;
    }

    return {
      response: finalResponse,
      route: "flow",
      media: flowContext.currentState === "confirm_service" ? resolveMedia(this.catalogItems, flowContext.slots) : undefined,
    };
  }

  private async maybeCreateBooking(
    tenantId: string,
    conversationId: string,
    contactId: string,
    flowKey: string,
    slots: Record<string, string>,
  ): Promise<void> {
    if (flowKey !== "agendamiento") return;
    if (!slots.service && !slots.service_name) return;

    const serviceName = slots.service_name || slots.service || "Servicio";
    const selected = this.catalogItems.find(
      (c) =>
        serviceName.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(serviceName.toLowerCase()),
    );

    const hasPaymentProof = !!slots.payment_proof;
    const bookingStatus = hasPaymentProof ? "confirmed" : "pending";
    const paymentStatus = hasPaymentProof ? "paid" : "pending";
    const parsedDatetime = slots.datetime ? parseBookingDateTime(slots.datetime, new Date()) : null;

    const [existing] = await this.sql`
      SELECT id, status FROM bookings WHERE conversation_id = ${conversationId} LIMIT 1
    `;

    if (existing) {
      if (hasPaymentProof && existing.status === "pending") {
        await this.sql`
          UPDATE bookings
          SET status = 'confirmed', payment_status = 'paid', service_name = ${serviceName},
              service_price = ${selected ? selected.price : null}, city = ${slots.city ?? null},
              datetime = ${parsedDatetime}, data = ${this.sql.json(slots)}
          WHERE id = ${existing.id}
        `;
        await this.memoryService.onBookingConfirmed(tenantId, contactId, conversationId);
      }
      return;
    }

    await this.sql`
      INSERT INTO bookings (tenant_id, conversation_id, contact_id, service_name, service_price, city, datetime, status, payment_status, data)
      VALUES (
        ${tenantId},
        ${conversationId},
        ${contactId},
        ${serviceName},
        ${selected ? selected.price : null},
        ${slots.city ?? null},
        ${parsedDatetime},
        ${bookingStatus},
        ${paymentStatus},
        ${this.sql.json(slots)}
      )
    `;

    if (hasPaymentProof) {
      await this.memoryService.onBookingConfirmed(tenantId, contactId, conversationId);
    }
  }
}
