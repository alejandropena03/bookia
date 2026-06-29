import type { MemoryRepository } from "./memory-repository.js";
import type { PersistedPatientMemory, PatientConversationMemory } from "./memory-types.js";
import type { FunnelStage } from "../types/funnel.js";

export interface MemoryUserContext {
  city?: string;
  serviceInterest?: string[];
  providedData: {
    name: boolean;
    phone: boolean;
    email: boolean;
    birthDate: boolean;
    idNumber: boolean;
  };
  lastService?: string;
  paymentStatus?: string;
}

export interface DataCollectionResult {
  updated: boolean;
  fields: string[];
}

const PROVIDED_DATA_KEYS = ["name", "phone", "email", "birthDate", "idNumber"] as const;
type ProvidedDataKey = (typeof PROVIDED_DATA_KEYS)[number];

const SLOT_PROVIDED_MAP: Record<string, ProvidedDataKey> = {
  nombre: "name",
  name: "name",
  client_name: "name",
  phone: "phone",
  telefono: "phone",
  email: "email",
  correo: "email",
  birthDate: "birthDate",
  fecha_nacimiento: "birthDate",
  idNumber: "idNumber",
  documento: "idNumber",
  cedula: "idNumber",
  cédula: "idNumber",
};

export class MemoryService {
  constructor(private repo: MemoryRepository) {}

  async getUserContext(tenantId: string, contactId: string): Promise<MemoryUserContext> {
    const memory = await this.repo.get(tenantId, contactId);
    return this.toUserContext(memory);
  }

  async hydrateFlowSlots(tenantId: string, contactId: string, existingSlots: Record<string, string>): Promise<Record<string, string>> {
    const memory = await this.repo.get(tenantId, contactId);
    const slots = { ...existingSlots };
    if (memory.city?.value && !slots.city) slots.city = memory.city.value;
    if (memory.serviceInterest?.value?.length && !slots.service) {
      slots.service = memory.serviceInterest.value[0];
    }
    if (memory.lastQuotedService?.value && !slots.service_name) {
      slots.service_name = memory.lastQuotedService.value;
    }
    return slots;
  }

  async onDataCollected(
    tenantId: string,
    contactId: string,
    conversationId: string,
    slots: Record<string, string>,
  ): Promise<DataCollectionResult> {
    const updates = this.slotsToMemoryUpdates(slots);
    if (Object.keys(updates).length === 0) return { updated: false, fields: [] };

    await this.repo.merge(tenantId, contactId, conversationId, updates);
    const fields = Object.keys(updates).filter((k) => k !== "providedData");
    if (updates.providedData) {
      for (const [k, v] of Object.entries(updates.providedData)) {
        if (v) fields.push(k);
      }
    }
    return { updated: true, fields };
  }

  async onFlowCompleted(
    tenantId: string,
    contactId: string,
    conversationId: string,
    flowKey: string,
    slots: Record<string, string>,
  ): Promise<void> {
    const updates: Partial<PatientConversationMemory> = {};

    if (flowKey === "agendamiento") {
      updates.funnelStage = "awaiting_payment";
      if (slots.service) updates.lastQuotedService = slots.service;
    }

    if (flowKey === "first_contact") {
      updates.funnelStage = "new_lead";
    }

    if (Object.keys(updates).length > 0) {
      await this.repo.merge(tenantId, contactId, conversationId, updates);
    }
  }

  async onBookingConfirmed(
    tenantId: string,
    contactId: string,
    conversationId: string,
  ): Promise<void> {
    await this.repo.merge(tenantId, contactId, conversationId, {
      paymentStatus: "confirmed",
      funnelStage: "booked",
    });
  }

  private toUserContext(memory: PersistedPatientMemory): MemoryUserContext {
    return {
      city: memory.city?.value,
      serviceInterest: memory.serviceInterest?.value,
      providedData: {
        name: memory.providedData?.name ?? false,
        phone: memory.providedData?.phone ?? false,
        email: memory.providedData?.email ?? false,
        birthDate: memory.providedData?.birthDate ?? false,
        idNumber: memory.providedData?.idNumber ?? false,
      },
      lastService: memory.lastQuotedService?.value,
      paymentStatus: memory.paymentStatus?.value,
    };
  }

  private slotsToMemoryUpdates(slots: Record<string, string>): Partial<PatientConversationMemory> {
    const updates: Partial<PatientConversationMemory> = {};
    const providedData: PatientConversationMemory["providedData"] = {};
    let hasProvidedData = false;

    for (const [key, value] of Object.entries(slots)) {
      if (!value) continue;

      switch (key) {
        case "city":
          updates.city = value;
          break;
        case "service":
        case "service_name":
          updates.serviceInterest = [value];
          break;
        case "payment_method":
          updates.paymentStatus = "requested";
          break;
        case "payment_proof":
          updates.paymentStatus = "sent_proof";
          break;
        default: {
          const pdKey = SLOT_PROVIDED_MAP[key];
          if (pdKey) {
            providedData[pdKey] = true;
            hasProvidedData = true;
          }
          break;
        }
      }
    }

    if (hasProvidedData) {
      updates.providedData = providedData;
    }

    return updates;
  }
}
