import type postgres from "postgres";
import type { AgentResponse } from "../../orchestrator.js";
import type { AgentKernelInput } from "../../v2/types/agent-kernel.js";
import { AgentKernel } from "./agent-kernel.js";
import type { RouterDecision, AgentIntent } from "../../v2/types/agent-intent.js";
import type { RiskFlags, PolicyDecision } from "../../v2/types/decision-trace.js";
import { createMemoryRepository } from "../../v2/memory/memory-repository.js";
import { MemoryService } from "../../v2/memory/memory-service.js";
import { FlowAdapter } from "../../v2/adapter/flow-adapter.js";
import type { CatalogItem } from "../../../flows/engine.js";
import { SANTA_MARIA_CATALOG } from "../../../flows/santa-maria/catalog.js";
import { getCannedResponse as _getCannedResponse } from "../../responder.js";
import { evaluatePolicy as _evaluatePolicy } from "../../v2/policy/policy-engine.js";
import { scanRisks as _scanRisks } from "../../v2/understanding/risk-scanner.js";
import { isOutOfHours } from "../../../lib/hours.js";

function buildCatalogKnowledge(): string {
  const lines = SANTA_MARIA_CATALOG.map((item) => {
    // Multi-currency prices
    let priceStr: string;
    if (item.prices && Object.keys(item.prices).length > 0) {
      const parts = Object.entries(item.prices).map(([cur, p]) => {
        const sym = cur === "EUR" ? "€" : "$";
        const val = p.promoPrice
          ? `${sym}${Number(p.promoPrice).toLocaleString("es-CO")} PROMO (antes ${sym}${Number(p.price).toLocaleString("es-CO")})`
          : `${sym}${Number(p.price).toLocaleString("es-CO")}`;
        return `${cur} ${val}`;
      });
      if (item.requiresHumanConfirmation?.length) {
        parts.push(`[${item.requiresHumanConfirmation.join("/")} requiere confirmación]`);
      }
      priceStr = parts.join(" / ");
    } else {
      const sym = item.currency === "EUR" ? "€" : "$";
      priceStr = `${item.currency} ${sym}${Number(item.price).toLocaleString("es-CO")}`;
    }

    // First sentence of description (max 120 chars)
    const raw = item.description.split(/[.!]\s/)[0];
    const desc = raw.length > 120 ? raw.slice(0, 117) + "..." : raw;

    const dur = item.durationMinutes ? ` | ${item.durationMinutes} min` : "";
    return `• ${item.name} | ${priceStr} | ${desc}${dur}`;
  });
  return lines.join("\n");
}

function createV2Providers(
  sql: postgres.Sql,
  tenantId: string,
  contactId: string,
  contactName: string | undefined,
  catalogItems: CatalogItem[],
) {
  const memoryRepo = createMemoryRepository(sql);
  const memoryService = new MemoryService(memoryRepo);
  const flowAdapter = new FlowAdapter(sql, memoryService, catalogItems);

  return {
    classifyIntent: async (text: string): Promise<RouterDecision> => {
      const { classifyIntentStructured } = await import("../../v2/understanding/structured-router.js");
      return classifyIntentStructured(text);
    },
    getCannedResponse: (key: string, vars?: Record<string, string>): string | null => {
      return _getCannedResponse(key, vars ?? {});
    },
    generateLlmResponse: async (text: string, context: Record<string, unknown>): Promise<string> => {
      const { generateLlmResponse } = await import("../../responder.js");
      return generateLlmResponse(text, context as any);
    },
    evaluateFlow: async (conversationId: string, intent: string, text: string): Promise<{ response: string; route: string } | null> => {
      return flowAdapter.evaluateFlow(conversationId, intent, text, tenantId, contactId, contactName);
    },
    evaluatePolicy: (text: string, intent: string, riskFlags: RiskFlags): PolicyDecision => {
      return _evaluatePolicy(text, intent as AgentIntent, riskFlags);
    },
    detectRisks: (text: string, intent: string): RiskFlags => {
      return _scanRisks(text, intent as AgentIntent);
    },
    loadContext: async (_input: AgentKernelInput): Promise<Record<string, unknown>> => {
      const [profile] = await sql`
        SELECT persona, rules, hours, booking_mode, off_hours_message
        FROM business_profile WHERE tenant_id = ${tenantId}
      `;
      const catalog = buildCatalogKnowledge();
      const hoursRaw =
        (profile?.hours as Record<string, { open: string | null; close: string | null }>) ?? {};
      const offHours =
        !!profile?.off_hours_message &&
        Object.keys(hoursRaw).length > 0 &&
        isOutOfHours(hoursRaw);
      return {
        persona: profile?.persona ?? "Asistente virtual profesional y cordial",
        catalog,
        rules:
          typeof profile?.rules === "object"
            ? JSON.stringify(profile.rules)
            : profile?.rules ?? "Sin reglas especiales",
        hours:
          typeof profile?.hours === "object"
            ? JSON.stringify(profile.hours)
            : profile?.hours ?? "Horario no especificado",
        hoursRaw,
        bookingMode: profile?.booking_mode ?? "mock",
        escalationConfig: (profile?.rules as Record<string, unknown>) ?? null,
        offHoursMessage: profile?.off_hours_message ?? null,
        isOutOfHours: offHours,
      };
    },
  };
}

export async function processMessageV2(req: {
  tenantId: string;
  tenantSlug: string;
  conversationId: string;
  contactId?: string;
  contactName?: string;
  text: string;
  sql: postgres.Sql;
}): Promise<AgentResponse> {
  const catalogItems: CatalogItem[] = await req.sql`
    SELECT name, price::text, currency, COALESCE(cities, '[]') AS cities, COALESCE(image_keys, '[]') AS "imageKeys", promo_label AS "promoLabel"
    FROM catalog_items WHERE tenant_id = ${req.tenantId} AND is_active = 1 ORDER BY name
  `;

  const providers = createV2Providers(req.sql, req.tenantId, req.contactId ?? "unknown", req.contactName, catalogItems);
  const kernel = new AgentKernel(providers);

  const result = await kernel.process({
    tenantId: req.tenantId,
    conversationId: req.conversationId,
    contactId: req.contactId ?? "unknown",
    channel: "mock",
    messageText: req.text,
    now: new Date(),
  });

  return {
    text: result.response.text,
    messageId: `v2_${Date.now()}`,
    route: result.response.route as AgentResponse["route"],
    escalated: result.decisionTrace.policy.action === "handoff",
    escalationReason: result.decisionTrace.policy.reasons.join("; "),
    media: result.response.media,
  };
}
