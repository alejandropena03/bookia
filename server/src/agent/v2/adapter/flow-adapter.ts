import type postgres from "postgres";
import { evaluateFlow, startFlow, type FlowDefinition, type FlowContext, type FlowResult, type CatalogItem } from "../../../flows/engine.js";
import { type MemoryService } from "../memory/memory-service.js";

const INTENT_TO_FLOW_KEY: Record<string, string> = {
  saludo: "first_contact",
  agendamiento: "agendamiento",
};

export interface FlowAdapterResult {
  response: string;
  route: "flow";
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
  ): Promise<FlowAdapterResult | null> {
    const activeFlow = await this.loadActiveFlow(conversationId);

    if (activeFlow) {
      return this.handleResume(activeFlow, text, tenantId, conversationId, contactId);
    }

    const flowKey = this.resolveFlowKey(intent);
    if (!flowKey) return null;

    return this.handleStart(flowKey, intent, text, tenantId, conversationId, contactId, contactName);
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

    const result = evaluateFlow(definition, active, text, this.catalogItems);

    await this.memoryService.onDataCollected(tenantId, contactId, conversationId, result.context.slots);

    if (result.completed) {
      await this.memoryService.onFlowCompleted(tenantId, contactId, conversationId, active.flowKey, result.context.slots);
      await this.maybeCreateBooking(tenantId, conversationId, contactId, active.flowKey, result.context.slots);
      await this.sql`DELETE FROM conversation_state WHERE conversation_id = ${conversationId}`;
    } else {
      await this.sql`
        UPDATE conversation_state
        SET current_state = ${result.context.currentState}, slots = ${this.sql.json(result.context.slots)}, updated_at = NOW()
        WHERE conversation_id = ${conversationId}
      `;
    }

    return { response: result.response, route: "flow" };
  }

  private async handleStart(
    flowKey: string,
    intent: string,
    text: string,
    tenantId: string,
    conversationId: string,
    contactId: string,
    contactName?: string,
  ): Promise<FlowAdapterResult | null> {
    const definition = await this.loadDefinition(tenantId, flowKey);
    if (!definition) return null;

    const result = startFlow(definition, contactName, this.catalogItems);
    const slots = await this.memoryService.hydrateFlowSlots(tenantId, contactId, result.context.slots);

    // Auto-advance through states whose collected data is already known from memory
    let flowContext: FlowContext = { flowKey, currentState: result.context.currentState, slots };
    let flowResult: FlowResult = { ...result, context: flowContext };
    let safety = 5;
    while (safety-- > 0 && !flowResult.completed) {
      const state = definition.states[flowContext.currentState];
      if (!state?.collects) break;
      const knownValue = flowContext.slots[state.collects];
      if (!knownValue) break;
      flowResult = evaluateFlow(definition, flowContext, knownValue, this.catalogItems);
      flowContext = flowResult.context;
    }

    if (!flowResult.completed) {
      await this.sql`
        INSERT INTO conversation_state (tenant_id, conversation_id, flow_key, current_state, slots)
        VALUES (${tenantId}, ${conversationId}, ${flowKey}, ${flowContext.currentState}, ${this.sql.json(flowContext.slots)})
        ON CONFLICT (conversation_id) DO UPDATE
          SET flow_key = EXCLUDED.flow_key, current_state = EXCLUDED.current_state, slots = EXCLUDED.slots, updated_at = NOW()
      `;
    }

    return { response: flowResult.response, route: "flow" };
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

    await this.sql`
      INSERT INTO bookings (tenant_id, conversation_id, contact_id, service_name, service_price, city, datetime, status, data)
      VALUES (
        ${tenantId},
        ${conversationId},
        ${contactId},
        ${serviceName},
        ${selected ? selected.price : null},
        ${slots.city ?? null},
        ${slots.datetime ?? null},
        'pending',
        ${this.sql.json(slots)}
      )
      ON CONFLICT DO NOTHING
    `;
  }
}
