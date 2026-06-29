import type { MemoryRepository } from "../memory-repository.js";
import type { PersistedPatientMemory, PatientConversationMemory } from "../memory-types.js";
import { createDefaultPersistedMemory, mergeMemory } from "./memory-merge-helper.js";

export function createMockMemoryRepository(): MemoryRepository {
  const store = new Map<string, PersistedPatientMemory>();

  return {
    async get(tenantId: string, contactId: string): Promise<PersistedPatientMemory> {
      const key = `${tenantId}::${contactId}`;
      return store.get(key) ?? createDefaultPersistedMemory(tenantId, contactId);
    },

    async merge(tenantId: string, contactId: string, conversationId: string, updates: Partial<PatientConversationMemory>): Promise<{ memory: PersistedPatientMemory; conflict: boolean }> {
      const key = `${tenantId}::${contactId}`;
      const current = store.get(key) ?? createDefaultPersistedMemory(tenantId, contactId);
      const merged = mergeMemory(current, updates);
      store.set(key, merged);
      return { memory: merged, conflict: false };
    },

    async delete(tenantId: string, contactId: string): Promise<void> {
      const key = `${tenantId}::${contactId}`;
      store.delete(key);
    },
  };
}
