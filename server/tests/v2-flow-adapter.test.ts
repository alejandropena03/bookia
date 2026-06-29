import { describe, it, expect, vi } from "vitest";
import { MemoryService } from "../src/agent/v2/memory/memory-service.js";
import { FlowAdapter } from "../src/agent/v2/adapter/flow-adapter.js";
import { AGENDAMIENTO_FLOW, FIRST_CONTACT_FLOW } from "../src/flows/santa-maria/flows.js";

function memoryValue(value: unknown, source = "user_message") {
  return { value, confidence: 1, source, updatedAt: new Date().toISOString() };
}

function createMockMemoryRepo() {
  const store = new Map<string, any>();

  async function mockGet(tenantId: string, contactId: string): Promise<any> {
    const key = `${tenantId}:${contactId}`;
    const raw = store.get(key);
    const base: any = {
      tenantId,
      contactId,
      version: raw?._version ?? 0,
      serviceInterest: memoryValue([], "derived"),
      funnelStage: memoryValue("unknown", "derived"),
      providedData: raw?._providedData ?? {},
    };
    if (raw?._city !== undefined) base.city = memoryValue(raw._city);
    if (raw?._serviceInterest !== undefined) base.serviceInterest = memoryValue(raw._serviceInterest);
    if (raw?._funnelStage !== undefined) base.funnelStage = memoryValue(raw._funnelStage);
    if (raw?._paymentStatus !== undefined) base.paymentStatus = memoryValue(raw._paymentStatus);
    if (raw?._lastQuotedService !== undefined) base.lastQuotedService = memoryValue(raw._lastQuotedService);
    return base;
  }

  async function mockMerge(tenantId: string, contactId: string, _conversationId: string, updates: any): Promise<any> {
    const key = `${tenantId}:${contactId}`;
    const existing = store.get(key) ?? {};
    const next: any = { ...existing, _version: (existing._version ?? 0) + 1 };
    if (updates.city !== undefined) next._city = updates.city;
    if (updates.serviceInterest !== undefined) next._serviceInterest = updates.serviceInterest;
    if (updates.funnelStage !== undefined) next._funnelStage = updates.funnelStage;
    if (updates.paymentStatus !== undefined) next._paymentStatus = updates.paymentStatus;
    if (updates.lastQuotedService !== undefined) next._lastQuotedService = updates.lastQuotedService;
    if (updates.providedData) next._providedData = { ...(existing._providedData || {}), ...updates.providedData };
    store.set(key, next);
    const memory = await mockGet(tenantId, contactId);
    return { memory, conflict: false };
  }

  return {
    get: vi.fn(mockGet),
    merge: vi.fn(mockMerge),
    delete: vi.fn(),
  };
}

function createMockSql() {
  const stateStore = new Map<string, any>();
  const flowDefs: Record<string, any> = {
    agendamiento: AGENDAMIENTO_FLOW as any,
    first_contact: FIRST_CONTACT_FLOW as any,
  };

  function matchQuery(joined: string, pattern: string): boolean {
    const clean = (s: string) => s.replace(/\$\d+/g, "").replace(/\s+/g, " ").trim();
    return clean(joined).includes(clean(pattern));
  }

  const sql = vi.fn((strings: TemplateStringsArray, ...values: any[]) => {
    const joined = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i}` : ""), "");

    if (matchQuery(joined, "SELECT flow_key, current_state, slots FROM conversation_state")) {
      const convId = values.find((v: any) => typeof v === "string" && v.length >= 4);
      if (!convId) return [];
      const row = stateStore.get(convId);
      return row ? [row] : [];
    }

    if (matchQuery(joined, "SELECT definition FROM flows")) {
      const flowKey = values[values.length - 1] as string;
      const def = flowDefs[flowKey];
      return def ? [{ definition: def }] : [];
    }

    if (matchQuery(joined, "DELETE FROM conversation_state")) {
      const convId = values.find((v: any) => typeof v === "string" && v.length >= 4);
      if (convId) stateStore.delete(convId);
      return [];
    }

    if (matchQuery(joined, "UPDATE conversation_state")) {
      return [{ count: 1 }];
    }

    if (matchQuery(joined, "INSERT INTO conversation_state") || matchQuery(joined, "ON CONFLICT")) {
      const stringVals = values.filter((v: any) => typeof v === "string" && v.length >= 2);
      const objVals = values.filter((v: any) => v && typeof v === "object" && !Array.isArray(v));
      // values order: tenantId, conversationId, flowKey, currentState, slots
      const convId = stringVals[1];
      if (convId && objVals[0]) {
        stateStore.set(convId, {
          flow_key: stringVals[2],
          current_state: stringVals[3],
          slots: objVals[0],
        });
      }
      return [];
    }

    if (matchQuery(joined, "INSERT INTO bookings")) {
      const bookingSlots = values.find((v: any) => v && typeof v === "object" && !Array.isArray(v));
      return [{ id: "booking-1", ...(bookingSlots || {}) }];
    }

    return [];
  });

  sql.json = vi.fn((val: any) => val);
  sql.stateStore = stateStore;
  sql.flowDefs = flowDefs;

  return sql as any;
}

describe("MemoryService", () => {
  it("getUserContext returns empty context for new contact", async () => {
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const ctx = await svc.getUserContext("t1", "c1");
    expect(ctx.city).toBeUndefined();
    expect(ctx.serviceInterest).toEqual([]);
    expect(ctx.providedData).toEqual({ name: false, phone: false, email: false, birthDate: false, idNumber: false });
  });

  it("getUserContext returns known data", async () => {
    const repo = createMockMemoryRepo();
    await repo.merge("t1", "c1", "conv1", { city: "Medellín", serviceInterest: ["botox"] });
    const svc = new MemoryService(repo as any);
    const ctx = await svc.getUserContext("t1", "c1");
    expect(ctx.city).toBe("Medellín");
    expect(ctx.serviceInterest).toContain("botox");
  });

  it("hydrateFlowSlots fills empty slots from memory", async () => {
    const repo = createMockMemoryRepo();
    await repo.merge("t1", "c1", "conv1", { city: "Medellín", serviceInterest: ["botox"] });
    const svc = new MemoryService(repo as any);
    const slots = await svc.hydrateFlowSlots("t1", "c1", {});
    expect(slots.city).toBe("Medellín");
    expect(slots.service).toBe("botox");
  });

  it("hydrateFlowSlots does not override existing slots", async () => {
    const repo = createMockMemoryRepo();
    await repo.merge("t1", "c1", "conv1", { city: "Bogotá" });
    const svc = new MemoryService(repo as any);
    const slots = await svc.hydrateFlowSlots("t1", "c1", { city: "Medellín" });
    expect(slots.city).toBe("Medellín");
  });

  it("onDataCollected maps city slot to memory", async () => {
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const result = await svc.onDataCollected("t1", "c1", "conv1", { city: "Cali" });
    expect(result.updated).toBe(true);
    const mem = await repo.get("t1", "c1");
    expect(mem.city?.value).toBe("Cali");
  });

  it("onDataCollected maps provided data slots", async () => {
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const result = await svc.onDataCollected("t1", "c1", "conv1", {
      nombre: "Juan",
      phone: "3001234567",
      email: "juan@test.com",
    });
    expect(result.updated).toBe(true);
    expect(result.fields).toContain("name");
    expect(result.fields).toContain("phone");
    expect(result.fields).toContain("email");
    const mem = await repo.get("t1", "c1");
    expect(mem.providedData?.name).toBe(true);
    expect(mem.providedData?.phone).toBe(true);
    expect(mem.providedData?.email).toBe(true);
  });

  it("onDataCollected maps payment slots", async () => {
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    await svc.onDataCollected("t1", "c1", "conv1", { payment_method: "bancolombia" });
    const mem = await repo.get("t1", "c1");
    expect(mem.paymentStatus?.value).toBe("requested");
  });

  it("onFlowCompleted sets funnel stage for agendamiento", async () => {
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    await svc.onFlowCompleted("t1", "c1", "conv1", "agendamiento", { service: "botox" });
    const mem = await repo.get("t1", "c1");
    expect(mem.funnelStage?.value).toBe("awaiting_payment");
    expect(mem.lastQuotedService?.value).toBe("botox");
  });

  it("onBookingConfirmed sets booked stage", async () => {
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    await svc.onBookingConfirmed("t1", "c1", "conv1");
    const mem = await repo.get("t1", "c1");
    expect(mem.paymentStatus?.value).toBe("confirmed");
    expect(mem.funnelStage?.value).toBe("booked");
  });
});

describe("FlowAdapter", () => {
  it("returns null for unmapped intent", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc);
    const result = await adapter.evaluateFlow("conv1", "dudas_medicas", "¿qué es?", "t1", "c1");
    expect(result).toBeNull();
  });

  it("starts agendamiento flow with ask_city prompt", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc);
    const result = await adapter.evaluateFlow("conv1", "agendamiento", "quiero agendar", "t1", "c1", "Juan");
    expect(result).not.toBeNull();
    expect(result!.route).toBe("flow");
    expect(result!.response).toContain("ciudad");
  });

  it("hydrates city from memory when starting flow", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    await svc.onDataCollected("t1", "c1", "conv1", { city: "Medellín" });
    const adapter = new FlowAdapter(mockSql, svc);
    const result = await adapter.evaluateFlow("conv1", "agendamiento", "quiero agendar", "t1", "c1", "Juan");
    expect(result).not.toBeNull();
    const state = mockSql.stateStore.get("conv1");
    expect(state).not.toBeUndefined();
    expect(state!.slots.city).toBe("Medellín");
  });

  it("resumes active flow and processes input", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc);
    mockSql.stateStore.set("conv1", {
      flow_key: "agendamiento",
      current_state: "show_service",
      slots: { city: "Medellín" },
    });
    const result = await adapter.evaluateFlow("conv1", "agendamiento", "botox", "t1", "c1");
    expect(result).not.toBeNull();
    expect(result!.route).toBe("flow");
    expect(result!.response).toContain("Excelente elección");
  });

  it("clears stale terminal flow and falls through", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc);
    mockSql.stateStore.set("conv1", {
      flow_key: "agendamiento",
      current_state: "confirm_booking",
      slots: { nombre: "Juan", service: "botox" },
    });
    const result = await adapter.evaluateFlow("conv1", "agendamiento", "adiós", "t1", "c1");
    expect(result).toBeNull();
    expect(mockSql.stateStore.has("conv1")).toBe(false);
  });

  it("flows back to LLM for non-mapped intents", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc);
    const result = await adapter.evaluateFlow("conv1", "horarios", "qué horarios tienen", "t1", "c1");
    expect(result).toBeNull();
  });

  it("starts first_contact flow for saludo intent", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc);
    const result = await adapter.evaluateFlow("conv1", "saludo", "hola", "t1", "c1", "María");
    expect(result).not.toBeNull();
    expect(result!.response).toContain("Carlos");
    expect(result!.response).toContain("María");
  });

  it("completes flow and creates booking on final state transition", async () => {
    const mockSql = createMockSql();
    const repo = createMockMemoryRepo();
    const svc = new MemoryService(repo as any);
    const adapter = new FlowAdapter(mockSql, svc, [
      { name: "Botox", price: "800000", currency: "COP" },
    ]);
    mockSql.stateStore.set("conv1", {
      flow_key: "agendamiento",
      current_state: "await_proof",
      slots: {
        city: "Medellín",
        service: "botox",
        datetime: "2026-07-05 10:00",
        nombre: "Juan",
        phone: "3001234567",
      },
    });
    const result = await adapter.evaluateFlow("conv1", "agendamiento", "aquí está el comprobante", "t1", "c1");
    expect(result).not.toBeNull();
    expect(result!.response).toContain("programada exitosamente");
    expect(mockSql.stateStore.has("conv1")).toBe(false);
  });
});
