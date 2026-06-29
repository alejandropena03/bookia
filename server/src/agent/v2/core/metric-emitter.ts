import fs from "fs";
import path from "path";
import type { MetricEvent, QualityScore, ReviewQueueEntry } from "../types/quality-score.js";

const METRICS_LOG = path.resolve(process.cwd(), "data", "metrics.json");
const REVIEW_QUEUE = path.resolve(process.cwd(), "data", "agent-review-queue.jsonl");
const MAX_METRICS_FILE_SIZE = 10 * 1024 * 1024;

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function emitMetric(event: MetricEvent): void {
  const line = JSON.stringify(event) + "\n";
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;

  if (process.env.LOG_METRICS === "stdout" || !process.env.LOG_METRICS) {
    process.stdout.write(`[METRIC] ${line}`);
  }

  if (process.env.LOG_METRICS === "file" || process.env.LOG_METRICS_FILE) {
    try {
      ensureDir(METRICS_LOG);
      if (fs.existsSync(METRICS_LOG) && fs.statSync(METRICS_LOG).size > MAX_METRICS_FILE_SIZE) {
        const rotated = METRICS_LOG.replace(".json", `-${Date.now()}.json`);
        fs.renameSync(METRICS_LOG, rotated);
      }
      const existing = fs.existsSync(METRICS_LOG)
        ? JSON.parse(fs.readFileSync(METRICS_LOG, "utf-8"))
        : [];
      existing.push(event);
      fs.writeFileSync(METRICS_LOG, JSON.stringify(existing, null, 2));
    } catch {
      // best effort — no romper el flujo por errores de metricas
    }
  }
}

export function pushToReviewQueue(entry: ReviewQueueEntry): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;

  try {
    ensureDir(REVIEW_QUEUE);
    fs.appendFileSync(REVIEW_QUEUE, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // best effort
  }

  emitMetric({
    type: "review_queue",
    timestamp: entry.timestamp,
    tenantId: entry.tenantId,
    traceId: entry.id,
    conversationId: entry.conversationId,
    payload: {
      intent: entry.intent,
      confidence: entry.confidence,
      qualityScore: entry.qualityScore.overall,
      reviewReason: entry.qualityScore.reviewReason ?? "",
      safetyLevel: entry.safetyLevel,
    },
  });
}

export function emitRouterDecision(params: {
  traceId: string;
  tenantId: string;
  conversationId: string;
  input: string;
  intent: string;
  confidence: number;
  safetyLevel: string;
  riskFlags: Record<string, boolean>;
  qualityScore?: QualityScore;
}): void {
  emitMetric({
    type: "router_decision",
    timestamp: new Date().toISOString(),
    tenantId: params.tenantId,
    traceId: params.traceId,
    conversationId: params.conversationId,
    payload: {
      inputPreview: params.input.slice(0, 120),
      intent: params.intent,
      confidence: params.confidence,
      safetyLevel: params.safetyLevel,
      riskFlags: params.riskFlags,
      qualityScore: params.qualityScore?.overall,
      requiresReview: params.qualityScore?.requiresReview,
    },
  });
}

export function emitSafetyTrigger(params: {
  traceId: string;
  tenantId: string;
  conversationId: string;
  triggerType: string;
  detail: string;
  safetyLevel: string;
}): void {
  emitMetric({
    type: "safety_trigger",
    timestamp: new Date().toISOString(),
    tenantId: params.tenantId,
    traceId: params.traceId,
    conversationId: params.conversationId,
    payload: {
      triggerType: params.triggerType,
      detail: params.detail,
      safetyLevel: params.safetyLevel,
    },
  });
}

export function emitAgentError(params: {
  traceId: string;
  tenantId: string;
  conversationId: string;
  error: string;
  phase: string;
}): void {
  emitMetric({
    type: "agent_error",
    timestamp: new Date().toISOString(),
    tenantId: params.tenantId,
    traceId: params.traceId,
    conversationId: params.conversationId,
    payload: {
      error: params.error,
      phase: params.phase,
    },
  });
}
