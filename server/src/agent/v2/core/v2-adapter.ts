import type postgres from "postgres";
import type { AgentResponse } from "../../orchestrator.js";
import type { AgentKernelInput } from "../../v2/types/agent-kernel.js";
import { AgentKernel } from "./agent-kernel.js";
import type { RouterDecision, AgentIntent, ExtractedEntities } from "../../v2/types/agent-intent.js";
import type { RiskFlags, PolicyDecision } from "../../v2/types/decision-trace.js";
import { createMemoryRepository } from "../../v2/memory/memory-repository.js";
import { MemoryService } from "../../v2/memory/memory-service.js";
import { FlowAdapter } from "../../v2/adapter/flow-adapter.js";
import type { CatalogItem } from "../../../flows/engine.js";
import { SANTA_MARIA_CATALOG, type CatalogItem as SantaMariaItem } from "../../../flows/santa-maria/catalog.js";
import type { MediaItem } from "../types/agent-intent.js";
import { getCannedResponse as _getCannedResponse } from "../../responder.js";
import { evaluatePolicy as _evaluatePolicy } from "../../v2/policy/policy-engine.js";
import { scanRisks as _scanRisks } from "../../v2/understanding/risk-scanner.js";
import { isOutOfHours } from "../../../lib/hours.js";
import { segmentResponse } from "../../../lib/segmentation.js";
import { filterImagesByMarket } from "../../../flows/santa-maria/pricing.js";

const MEDIA_INTENTS: AgentIntent[] = ["precio", "faq_servicios", "resultados_esperados", "contraindicaciones", "post_tratamiento", "dudas_medicas"];

function resolveMediaForIntent(serviceName: string | undefined, intent: AgentIntent, city: string | undefined): MediaItem[] | undefined {
  if (!MEDIA_INTENTS.includes(intent)) return undefined;
  if (!serviceName) return undefined;
  const lower = serviceName.toLowerCase();
  const match = SANTA_MARIA_CATALOG.find(
    (c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower),
  ) as SantaMariaItem | undefined;
  if (!match?.imageKeys?.length) return undefined;
  const filteredKeys = filterImagesByMarket(match.imageKeys, city);
  return filteredKeys.map((key) => ({
    url: `/images/${key}`,
    type: "image" as const,
    imageKey: key,
    alt: match.name,
    service: match.name,
    currency: match.currency,
  }));
}

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

const REPEAT_FALLBACK_TEXT =
  "Ya te compartí esa información 😊 Cuéntame más específico qué te gustaría lograr o qué tratamiento te interesa y te doy el detalle exacto 🤍";

function createV2Providers(
  sql: postgres.Sql,
  tenantId: string,
  contactId: string,
  contactName: string | undefined,
  catalogItems: CatalogItem[],
  cannedResponses: Record<string, string>,
  priorBotTexts: Set<string>,
  rememberedCity: string | undefined,
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
      const candidate = _getCannedResponse(key, vars ?? {}, cannedResponses);
      // Los mensajes largos se guardan segmentados (persistAndEmitSegmented), así que
      // comparamos contra el primer segmento — es el fragmento que quedaría idéntico
      // en `messages` si este mismo canned ya se envió antes en la conversación.
      if (candidate) {
        const firstSegment = segmentResponse(candidate)[0]?.text;
        if (firstSegment && priorBotTexts.has(firstSegment)) return REPEAT_FALLBACK_TEXT;
      }
      return candidate;
    },
    generateLlmResponse: async (text: string, context: Record<string, unknown>): Promise<string> => {
      const { generateLlmResponse } = await import("../../responder.js");
      return generateLlmResponse(text, context as any);
    },
    evaluateFlow: async (conversationId: string, intent: string, text: string, entities?: ExtractedEntities): Promise<{ response: string; route: string } | null> => {
      return flowAdapter.evaluateFlow(conversationId, intent, text, tenantId, contactId, contactName, entities);
    },
    evaluatePolicy: (text: string, intent: string, riskFlags: RiskFlags): PolicyDecision => {
      return _evaluatePolicy(text, intent as AgentIntent, riskFlags);
    },
    detectRisks: (text: string, intent: string): RiskFlags => {
      return _scanRisks(text, intent as AgentIntent);
    },
    resolveMedia: (serviceName: string | undefined, intent: AgentIntent, city?: string): MediaItem[] | undefined => {
      return resolveMediaForIntent(serviceName, intent as AgentIntent, city ?? rememberedCity);
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
    SELECT name, price::text, currency, category, COALESCE(cities, '[]') AS cities, COALESCE(image_keys, '[]') AS "imageKeys", promo_label AS "promoLabel",
           prices, requires_human_confirmation AS "requiresHumanConfirmation"
    FROM catalog_items WHERE tenant_id = ${req.tenantId} AND is_active = 1 ORDER BY name
  `;
  const [profileRow] = await req.sql`
    SELECT canned_responses FROM business_profile WHERE tenant_id = ${req.tenantId}
  `;
  const cannedResponses = (profileRow?.canned_responses as Record<string, string>) ?? {};

  const priorBotTexts = new Set(
    (await req.sql`
      SELECT text FROM messages
      WHERE conversation_id = ${req.conversationId} AND direction = 'outbound' AND sender_type = 'bot' AND text IS NOT NULL
    `).map((r: any) => r.text as string),
  );

  const memoryRepo = createMemoryRepository(req.sql);
  const rememberedCity = (await new MemoryService(memoryRepo).getUserContext(req.tenantId, req.contactId ?? "unknown")).city;

  const providers = createV2Providers(req.sql, req.tenantId, req.contactId ?? "unknown", req.contactName, catalogItems, cannedResponses, priorBotTexts, rememberedCity);
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
