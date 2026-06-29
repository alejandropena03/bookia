import { describe, it, expect } from "vitest";
import { createMockMemoryRepository } from "../src/agent/v2/memory/__mocks__/memory-repository.js";
import type { PatientConversationMemory } from "../src/agent/v2/memory/memory-types.js";
import { createEmptyMemory } from "../src/agent/v2/memory/memory-types.js";

const TENANT_A = "tenant-alpha";
const TENANT_B = "tenant-beta";
const CONTACT_1 = "contact-001";
const CONTACT_2 = "contact-002";
const CONV_ID = "conv-001";

describe("V2 Memory Persistence (mock DB) — Basic CRUD", () => {
  it("returns default memory for unknown contact", async () => {
    const repo = createMockMemoryRepository();
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.tenantId).toBe(TENANT_A);
    expect(mem.contactId).toBe(CONTACT_1);
    expect(mem.funnelStage.value).toBe("unknown");
    expect(mem.serviceInterest.value).toEqual([]);
    expect(mem.providedData).toEqual({});
  });

  it("merges city and persists it", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { city: "Medellín" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.city?.value).toBe("Medellín");
  });

  it("merges service interest (union, not replace)", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { serviceInterest: ["botox"] });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { serviceInterest: ["ácido hialurónico"] });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.serviceInterest.value).toContain("botox");
    expect(mem.serviceInterest.value).toContain("ácido hialurónico");
    expect(mem.serviceInterest.value).toHaveLength(2);
  });

  it("does not duplicate service interest", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { serviceInterest: ["botox"] });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { serviceInterest: ["botox"] });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.serviceInterest.value).toEqual(["botox"]);
  });

  it("merges providedData with OR logic", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { providedData: { name: true, phone: true } });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { providedData: { email: true } });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.providedData.name).toBe(true);
    expect(mem.providedData.phone).toBe(true);
    expect(mem.providedData.email).toBe(true);
  });

  it("deletes memory", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { city: "Medellín" });
    await repo.delete(TENANT_A, CONTACT_1);
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.city).toBeUndefined();
  });
});

describe("V2 Memory Persistence (mock DB) — Cross-conversation", () => {
  it("remembers city across conversations", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, "conv-001", { city: "Medellín" });
    await repo.merge(TENANT_A, CONTACT_1, "conv-002", { serviceInterest: ["botox"] });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.city?.value).toBe("Medellín");
    expect(mem.serviceInterest.value).toContain("botox");
  });

  it("remembers concern across conversations", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, "conv-001", { lastConcern: "pain" });
    await repo.merge(TENANT_A, CONTACT_1, "conv-002", { city: "Medellín" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.lastConcern?.value).toBe("pain");
  });

  it("does not re-ask city already known", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, "conv-001", { city: "Medellín" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.city?.value).toBe("Medellín");
  });
});

describe("V2 Memory Persistence (mock DB) — Tenant isolation", () => {
  it("does not mix tenants", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { city: "Medellín" });
    await repo.merge(TENANT_B, CONTACT_1, CONV_ID, { city: "Bogotá" });
    const memA = await repo.get(TENANT_A, CONTACT_1);
    const memB = await repo.get(TENANT_B, CONTACT_1);
    expect(memA.city?.value).toBe("Medellín");
    expect(memB.city?.value).toBe("Bogotá");
  });

  it("does not mix contacts within same tenant", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { city: "Medellín" });
    await repo.merge(TENANT_A, CONTACT_2, CONV_ID, { city: "Bogotá" });
    const mem1 = await repo.get(TENANT_A, CONTACT_1);
    const mem2 = await repo.get(TENANT_A, CONTACT_2);
    expect(mem1.city?.value).toBe("Medellín");
    expect(mem2.city?.value).toBe("Bogotá");
  });
});

describe("V2 Memory Persistence (mock DB) — Funnel advancement rules", () => {
  it("advances funnel forward", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "new_lead" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "asking_price" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.funnelStage.value).toBe("asking_price");
  });

  it("does not regress funnel without clear signal", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "ready_to_book" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "new_lead" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.funnelStage.value).toBe("ready_to_book");
  });

  it("allows complaint from any funnel stage", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "ready_to_book" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "complaint" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.funnelStage.value).toBe("complaint");
  });

  it("allows handoff from any funnel stage", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "exploring_services" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { funnelStage: "handoff" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.funnelStage.value).toBe("handoff");
  });
});

describe("V2 Memory Persistence (mock DB) — Payment status rules", () => {
  it("advances payment status forward", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { paymentStatus: "requested" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { paymentStatus: "sent_proof" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.paymentStatus?.value).toBe("sent_proof");
  });

  it("does not regress payment status", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { paymentStatus: "sent_proof" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { paymentStatus: "requested" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.paymentStatus?.value).toBe("sent_proof");
  });
});

describe("V2 Memory Persistence (mock DB) — Handoff status rules", () => {
  it("does not regress escalated to none", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { humanHandoffStatus: "escalated" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { humanHandoffStatus: "none" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.humanHandoffStatus?.value).toBe("escalated");
  });

  it("advances from none to requested", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { humanHandoffStatus: "requested" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.humanHandoffStatus?.value).toBe("requested");
  });
});

describe("V2 Memory Persistence (mock DB) — LastBotSummary fields", () => {
  it("stores and retrieves last bot summary", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { lastBotSummary: "Usuario preguntó por botox, se le dió precio" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.lastBotSummary?.value).toBe("Usuario preguntó por botox, se le dió precio");
  });

  it("stores last next best action", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { lastNextBestAction: "ask_booking_date" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.lastNextBestAction?.value).toBe("ask_booking_date");
  });
});

describe("V2 Memory Persistence (mock DB) — Objections and concerns", () => {
  it("stores last objection", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { lastObjection: "price" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.lastObjection?.value).toBe("price");
  });

  it("stores last concern", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { lastConcern: "pain" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.lastConcern?.value).toBe("pain");
  });

  it("updates concern when more recent", async () => {
    const repo = createMockMemoryRepository();
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { lastConcern: "pain" });
    await repo.merge(TENANT_A, CONTACT_1, CONV_ID, { lastConcern: "price" });
    const mem = await repo.get(TENANT_A, CONTACT_1);
    expect(mem.lastConcern?.value).toBe("price");
  });
});
