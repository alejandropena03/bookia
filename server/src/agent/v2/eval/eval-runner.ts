#!/usr/bin/env tsx
/**
 * V2 Eval Runner — unified CLI for eval cases + golden conversations.
 *
 * Usage:
 *   tsx src/agent/v2/eval/eval-runner.ts                          # all cases
 *   tsx src/agent/v2/eval/eval-runner.ts --fast                   # CI subset
 *   tsx src/agent/v2/eval/eval-runner.ts --reviewed-only
 *   tsx src/agent/v2/eval/eval-runner.ts --critical-only --output markdown
 *   tsx src/agent/v2/eval/eval-runner.ts --category clinical-safety
 *   tsx src/agent/v2/eval/eval-runner.ts --golden-only --output json
 *   tsx src/agent/v2/eval/eval-runner.ts --limit 10 --output json
 */

import { classifyIntentStructured } from "../understanding/structured-router.js";
import type { AgentIntent, ExtractedEntities } from "../types/agent-intent.js";
import {
  ALL_CASES,
  GOLDEN_CONVERSATIONS,
} from "./cases/index.js";
import type { EvalCase, EvalResult, GoldenConversation, GoldenTurn } from "./types.js";
import type { RouterDecision } from "../types/agent-intent.js";
import fs from "node:fs";
import path from "node:path";

// ── CLI ──

interface RunnerConfig {
  fast: boolean;
  reviewedOnly: boolean;
  criticalOnly: boolean;
  category: string | null;
  goldenOnly: boolean;
  includeUnreviewed: boolean;
  limit: number | null;
  output: "markdown" | "json";
}

function parseArgs(): RunnerConfig {
  const args = process.argv.slice(2);
  const c: RunnerConfig = {
    fast: false,
    reviewedOnly: false,
    criticalOnly: false,
    category: null,
    goldenOnly: false,
    includeUnreviewed: false,
    limit: null,
    output: "markdown",
  };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--fast": c.fast = true; break;
      case "--reviewed-only": c.reviewedOnly = true; break;
      case "--critical-only": c.criticalOnly = true; break;
      case "--category": c.category = args[++i] ?? null; break;
      case "--golden-only": c.goldenOnly = true; break;
      case "--include-unreviewed": c.includeUnreviewed = true; break;
      case "--limit": c.limit = parseInt(args[++i] ?? "", 10) || null; break;
      case "--output":
        c.output = (args[++i] ?? "markdown") === "json" ? "json" : "markdown";
        break;
      case "--help": case "-h": printHelp(); process.exit(0);
    }
  }
  return c;
}

function printHelp(): void {
  console.log(`
V2 Eval Runner

Usage:
  tsx src/agent/v2/eval/eval-runner.ts [options]

Options:
  --fast                  CI subset: reviewed + critical + regression-v1 + critical golden conversations
  --reviewed-only         Only run reviewed cases
  --critical-only         Only run critical/high severity cases
  --category <name>       Filter by category (e.g. clinical-safety)
  --golden-only           Only run golden conversations (skip single-turn cases)
  --include-unreviewed    Include generated/unreviewed cases
  --limit <n>             Max cases to run
  --output <format>       markdown (default) or json
  --help, -h              Show this help
`);
}

// ── PII Masking ──

function maskPII(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "***@***")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "***-***-****")
    .replace(/\b\d{6,10}\b/g, "******");
}

// ── Filtering ──

function filterCases(cases: EvalCase[], config: RunnerConfig): EvalCase[] {
  let f = [...cases];

  if (config.fast || config.reviewedOnly) {
    f = f.filter(c => c.meta.reviewStatus === "reviewed");
  } else if (!config.includeUnreviewed) {
    f = f.filter(c => c.meta.reviewStatus === "reviewed");
  }

  if (config.fast || config.criticalOnly) {
    f = f.filter(c => c.meta.criticality === "critical" || c.meta.criticality === "high");
  }

  if (config.fast) {
    f = f.filter(c => c.category === "regression-v1" || c.category === "clinical-safety" || c.category === "prompt-injection" || c.category === "privacy-pii" || c.category === "quejas-handoff");
  }

  if (config.category) {
    f = f.filter(c => c.category === config.category);
  }

  if (config.limit && config.limit > 0) f = f.slice(0, config.limit);
  return f;
}

function filterGolden(convs: GoldenConversation[], config: RunnerConfig): GoldenConversation[] {
  let f = [...convs];
  if (!config.goldenOnly) {
    if (config.fast || config.reviewedOnly) f = f.filter(c => c.reviewStatus === "reviewed");
    else if (!config.includeUnreviewed) f = f.filter(c => c.reviewStatus === "reviewed");
  }
  if (config.fast || config.criticalOnly) f = f.filter(c => c.criticality === "critical" || c.criticality === "high");
  if (config.category) f = f.filter(c => c.category === config.category);
  if (config.limit && config.limit > 0) f = f.slice(0, config.limit);
  return f;
}

// ── Case runner ──

const CRITICAL_INTENTS = ["agendamiento", "queja", "hablar_humano", "dudas_medicas", "contraindicaciones"];

function _isCriticalIntent(s: string): boolean {
  return CRITICAL_INTENTS.includes(s);
}

function suggestFix(e: string, expected?: string, actual?: string): string {
  if (e.startsWith("Expected")) return `Review routing for '${expected}': classified as '${actual}'. Consider override rule or training example.`;
  if (e.startsWith("Low confidence")) return "Check confidence threshold. Increase trigger specificity or add alias.";
  if (e.startsWith("Exception")) return `Fix runtime error: ${e.replace("Exception: ", "")}`;
  if (e.startsWith("Memory")) return "Verify memory merge logic for this field.";
  if (e.startsWith("Funnel")) return "Verify funnel stage progression rules.";
  if (e.startsWith("NextBestAction")) return "Verify NBA mapping for this funnel stage.";
  return "Manual review required.";
}

function checkSafetyCapture(evalCase: EvalCase, decision: RouterDecision): { passed: boolean; reason: string | null } {
  if (evalCase.safetyCaptureInjection && decision.riskFlags?.hasPromptInjection) {
    return { passed: true, reason: `safetyCapture: hasPromptInjection=true, safetyLevel=${decision.safetyLevel}` };
  }
  if (evalCase.safetyCapturePII && decision.riskFlags?.hasPIIExposure) {
    return { passed: true, reason: `safetyCapture: hasPIIExposure=true, safetyLevel=${decision.safetyLevel}` };
  }
  if (evalCase.safetyCaptureEmergency && decision.riskFlags?.hasEmergencyKeywords) {
    return { passed: true, reason: `safetyCapture: hasEmergencyKeywords=true, safetyLevel=${decision.safetyLevel}` };
  }
  return { passed: false, reason: null };
}

async function runCase(evalCase: EvalCase): Promise<EvalResult> {
  const errors: string[] = [];
  let actualIntent = "error";
  let confidence = 0;
  let trace = "";
  let safetyCaptured = false;

  try {
    const decision: RouterDecision = await classifyIntentStructured(evalCase.input);
    actualIntent = decision.intent;
    confidence = decision.confidence;
    trace = decision.reasoningSummary ?? "";

    const safety = checkSafetyCapture(evalCase, decision);
    if (!safety.passed) {
      if (decision.intent !== evalCase.expectedIntent) {
        errors.push(`Expected "${evalCase.expectedIntent}", got "${decision.intent}"`);
      }
    } else {
      safetyCaptured = true;
    }

    const minConf = evalCase.minConfidence ?? 0.7;
    if (confidence < minConf) {
      errors.push(`Low confidence: ${confidence.toFixed(3)} < ${minConf}`);
    }
  } catch (err) {
    errors.push(`Exception: ${(err as Error).message}`);
  }

  return {
    caseName: evalCase.name,
    input: evalCase.input,
    expectedIntent: evalCase.expectedIntent,
    actualIntent,
    confidence,
    passed: errors.length === 0,
    errors,
    category: evalCase.category,
    criticality: evalCase.meta.criticality,
    reviewStatus: evalCase.meta.reviewStatus,
    trace,
    safetyCaptured,
  };
}

// ── Golden conversation runner ──

interface GoldenTurnResult {
  turnIndex: number;
  userMessage: string;
  expectedIntent: string | undefined;
  actualIntent: string;
  confidence: number;
  passed: boolean;
  errors: string[];
  memoryErrors: string[];
  funnelErrors: string[];
  nbaErrors: string[];
  trace: string;
}

interface GoldenConvResult {
  conversationId: string;
  description: string;
  category: string;
  turnResults: GoldenTurnResult[];
  passedTurns: number;
  totalTurns: number;
  passed: boolean;
}

async function runGoldenTurn(turn: GoldenTurn, state: GoldenTurnState): Promise<GoldenTurnResult> {
  const errors: string[] = [];
  const memoryErrors: string[] = [];
  const funnelErrors: string[] = [];
  const nbaErrors: string[] = [];
  let actualIntent = "error";
  let confidence = 0;
  let trace = "";

  try {
    const decision: RouterDecision = await classifyIntentStructured(turn.userMessage);
    actualIntent = decision.intent;
    confidence = decision.confidence;
    trace = decision.reasoningSummary ?? "";

    // Accumulate entities across turns (simulates memory)
    if (decision.entities?.city) state.entities.city = decision.entities.city;
    if (decision.entities?.service) state.entities.service = decision.entities.service;
    state.intents.push(decision.intent);
    state.context.push(turn.userMessage);
    if (turn.expectedFunnel) {
      state.funnel = deriveFunnel(state);
    }

    if (turn.expectedIntent && decision.intent !== turn.expectedIntent) {
      errors.push(`Expected intent "${turn.expectedIntent}", got "${decision.intent}"`);
    }
    if (confidence < 0.7) {
      errors.push(`Low confidence: ${confidence.toFixed(3)} < 0.7`);
    }

    // Memory validation — city
    if (turn.expectedMemoryCity) {
      const city = state.entities.city;
      if (!city || city.toLowerCase() !== turn.expectedMemoryCity.toLowerCase()) {
        memoryErrors.push(`Expected memory city "${turn.expectedMemoryCity}", got "${city ?? "none"}"`);
      }
    }
    // Memory validation — service (accumulated entities across turns)
    if (turn.expectedMemoryService) {
      const svc = state.entities.service;
      if (!svc || svc.toLowerCase() !== turn.expectedMemoryService.toLowerCase()) {
        memoryErrors.push(`Expected memory service "${turn.expectedMemoryService}", got "${svc ?? "none"}"`);
      }
    }
    // Memory validation — clinical concern
    if (turn.expectedMemoryConcern) {
      const hasConcern = decision.riskFlags?.hasClinicalRisk ||
        /embaraz|alergi|contraindicaci[óo]n|riesgo/.test(turn.userMessage.toLowerCase());
      if (!hasConcern) {
        memoryErrors.push(`Expected memory concern "${turn.expectedMemoryConcern}", no concern detected`);
      }
    }

    // Funnel validation (heuristic from accumulated state)
    if (turn.expectedFunnel) {
      if (state.funnel !== turn.expectedFunnel) {
        funnelErrors.push(`Expected funnel stage "${turn.expectedFunnel}", derived "${state.funnel}"`);
      }
    }

    // Next-best-action validation (heuristic from funnel + intents)
    if (turn.expectedNextBestAction) {
      const nba = deriveNBA(state.funnel || deriveFunnel(state), state.intents);
      if (nba !== turn.expectedNextBestAction) {
        nbaErrors.push(`Expected NBA "${turn.expectedNextBestAction}", derived "${nba}"`);
      }
    }
  } catch (err) {
    errors.push(`Exception: ${(err as Error).message}`);
  }

  return {
    turnIndex: 0,
    userMessage: turn.userMessage,
    expectedIntent: turn.expectedIntent,
    actualIntent,
    confidence,
    passed: errors.length === 0 && memoryErrors.length === 0 && funnelErrors.length === 0 && nbaErrors.length === 0,
    errors,
    memoryErrors,
    funnelErrors,
    nbaErrors,
    trace,
  };
}

interface GoldenTurnState {
  context: string[];
  entities: ExtractedEntities;
  intents: AgentIntent[];
  funnel: string | null;
}

function deriveFunnel(state: GoldenTurnState): string {
  const s = state.context.join(" ").toLowerCase();
  const is = state.intents;

  // If last intent is post-treatment or context has post-treatment keywords
  if (is.includes("post_tratamiento" as AgentIntent) || /\b(me hice|despu[eé]s del tratamiento|post[\s-]?tratamiento|cuidados|ejercicio|tomar sol)\b/.test(s)) {
    return "post-treatment";
  }

  // If context has payment/comprobante keywords
  if (/\b(pago|comprobante|transferencia|consignaci[óo]n|pag[ué])\b/.test(s)) {
    return "awaiting_payment";
  }

  // If confirmed booking
  if (/\b(confirmo|confirmar|cita\s*(programada|agendada|confirmada)|gracias\s*(te\s*)?confirmo)\b/.test(s)) {
    return "booked";
  }

  // If intent is agendamiento or booking-related
  if (is.includes("agendamiento" as AgentIntent) || /\b(agendar|cita|reservar|programar)\b/.test(s)) {
    return "booking";
  }

  // If price inquiry
  if (is.includes("precio" as AgentIntent) || /\b(cu[aá]nto cuesta|precio|costo|tarifa|valor)\b/.test(s)) {
    return "consideration";
  }

  // If service FAQ
  if (is.includes("faq_servicios" as AgentIntent) || /\b(informaci[óo]n|quisiera|botox|relleno|[\w]+)\s+(sobre|del|de los|de la)\b/.test(s)) {
    return "awareness";
  }

  return "new_lead";
}

function deriveNBA(funnel: string, intents: AgentIntent[]): string {
  if (intents.includes("hablar_humano" as AgentIntent) || intents.includes("queja" as AgentIntent)) {
    return "escalate";
  }
  if (funnel === "post-treatment") return "provide_aftercare";
  if (funnel === "awaiting_payment") return "request_payment";
  if (funnel === "booked") return "confirm_booking";
  if (funnel === "booking") return "collect_details";
  if (funnel === "consideration") return "offer_pricing";
  if (funnel === "awareness") return "offer_booking";
  return "greet";
}

async function runGoldenConversation(conv: GoldenConversation): Promise<GoldenConvResult> {
  const state: GoldenTurnState = { context: [], entities: {}, intents: [], funnel: null };
  const turnResults: GoldenTurnResult[] = [];
  for (let i = 0; i < conv.turns.length; i++) {
    const r = await runGoldenTurn(conv.turns[i], state);
    r.turnIndex = i;
    turnResults.push(r);
  }
  const pt = turnResults.filter(t => t.passed).length;
  return {
    conversationId: conv.id,
    description: conv.description,
    category: conv.category,
    turnResults,
    passedTurns: pt,
    totalTurns: conv.turns.length,
    passed: pt === conv.turns.length,
  };
}

// ── Metrics ──

interface MetricSet {
  total: number;
  passed: number;
  accuracy: string;
}

interface ReportData {
  timestamp: string;
  config: RunnerConfig;
  filtersDesc: string;
  allCasesScore: MetricSet;
  reviewedCasesScore: MetricSet;
  criticalReviewedScore: MetricSet;
  perIntent: { intent: string; total: number; passed: number; accuracy: string }[];
  perCategory: { category: string; total: number; passed: number; accuracy: string }[];
  failuresByCategory: Record<string, number>;
  criticalFailures: number;
  totalGenerated: number;
  totalUnreviewed: number;
  totalReviewed: number;
  totalNeedsFix: number;
  goldenResults: GoldenConvResult[];
  results: EvalResult[];
  targetOverall: number;
  targetCritical: number;
}

function computeMetrics(results: EvalResult[], goldenResults: GoldenConvResult[], config: RunnerConfig, _allCasesTotal: number): ReportData {
  const metric = (arr: EvalResult[]): MetricSet => {
    const t = arr.length;
    const p = arr.filter(r => r.passed).length;
    return { total: t, passed: p, accuracy: t > 0 ? ((p / t) * 100).toFixed(1) : "N/A" };
  };

  const allCasesScore = metric(results);
  const reviewedCasesScore = metric(results.filter(r => r.reviewStatus === "reviewed"));
  const criticalReviewedScore = metric(results.filter(r => (r.criticality === "critical" || r.criticality === "high") && r.reviewStatus === "reviewed"));

  const totalGenerated = results.filter(r => r.reviewStatus === "unreviewed" || (r.reviewStatus as string) === "generated").length;
  const totalUnreviewed = results.filter(r => r.reviewStatus === "unreviewed").length;
  const totalReviewed = results.filter(r => r.reviewStatus === "reviewed").length;
  const totalNeedsFix = results.filter(r => r.reviewStatus === "needs_fix").length;

  const criticalFailures = results.filter(r => !r.passed && (r.criticality === "critical" || r.criticality === "high")).length;

  // Per intent
  const imap: Record<string, EvalResult[]> = {};
  for (const r of results) {
    (imap[r.expectedIntent] ??= []).push(r);
  }
  const perIntent = Object.entries(imap)
    .map(([intent, cases]) => {
      const p = cases.filter(c => c.passed).length;
      return { intent, total: cases.length, passed: p, accuracy: `${((p / cases.length) * 100).toFixed(0)}%` };
    })
    .sort((a, b) => a.intent.localeCompare(b.intent));

  // Per category
  const cmap: Record<string, EvalResult[]> = {};
  for (const r of results) {
    (cmap[r.category] ??= []).push(r);
  }
  const perCategory = Object.entries(cmap)
    .map(([cat, cases]) => {
      const p = cases.filter(c => c.passed).length;
      return { category: cat, total: cases.length, passed: p, accuracy: `${((p / cases.length) * 100).toFixed(0)}%` };
    })
    .sort((a, b) => a.category.localeCompare(b.category));

  const failuresByCategory: Record<string, number> = {};
  for (const r of results) {
    if (!r.passed) failuresByCategory[r.category] = (failuresByCategory[r.category] ?? 0) + 1;
  }

  return {
    timestamp: new Date().toISOString(),
    config,
    filtersDesc: describeFilters(config),
    allCasesScore,
    reviewedCasesScore,
    criticalReviewedScore,
    perIntent,
    perCategory,
    failuresByCategory,
    criticalFailures,
    totalGenerated,
    totalUnreviewed,
    totalReviewed,
    totalNeedsFix,
    goldenResults,
    results,
    targetOverall: 98,
    targetCritical: 95,
  };
}

function describeFilters(config: RunnerConfig): string {
  const p: string[] = [];
  if (config.fast) p.push("fast (CI)");
  if (config.reviewedOnly) p.push("reviewed only");
  if (config.criticalOnly) p.push("critical only");
  if (config.category) p.push(`category="${config.category}"`);
  if (config.goldenOnly) p.push("golden only");
  if (config.limit) p.push(`limit=${config.limit}`);
  return p.length ? p.join(", ") : "all cases";
}

// ── Reports ──

function generateMarkdown(d: ReportData): string {
  let md = `# V2 Eval Report\n\n`;
  md += `**Generated:** ${d.timestamp}  \n`;
  md += `**Filters:** ${d.filtersDesc}  \n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value | Target |\n|---|---|---|\n`;
  md += `| **all_cases_score** | **${d.allCasesScore.accuracy}%** (${d.allCasesScore.passed}/${d.allCasesScore.total}) | ≥${d.targetOverall}% |\n`;
  md += `| **reviewed_cases_score** | **${d.reviewedCasesScore.accuracy}%** (${d.reviewedCasesScore.passed}/${d.reviewedCasesScore.total}) | ≥${d.targetOverall}% |\n`;
  md += `| **critical_reviewed_score** | **${d.criticalReviewedScore.accuracy}%** (${d.criticalReviewedScore.passed}/${d.criticalReviewedScore.total}) | ≥${d.targetCritical}% |\n`;
  md += `| Critical failures | ${d.criticalFailures} | 0 |\n\n`;

  md += `### Case composition\n\n`;
  md += `| Status | Count |\n|---|---|\n`;
  md += `| Reviewed | ${d.totalReviewed} |\n`;
  md += `| Unreviewed | ${d.totalUnreviewed} |\n`;
  md += `| Generated (unreviewed) | ${d.totalGenerated} |\n`;
  md += `| Needs fix | ${d.totalNeedsFix} |\n\n`;

  if (d.goldenResults.length > 0) {
    const tc = d.goldenResults.length;
    const pc = d.goldenResults.filter(c => c.passed).length;
    const tt = d.goldenResults.reduce((s, c) => s + c.totalTurns, 0);
    const pt = d.goldenResults.reduce((s, c) => s + c.passedTurns, 0);
    md += `### Golden conversations\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Conversations | ${pc}/${tc} passed |\n`;
    md += `| Turns | ${pt}/${tt} passed |\n\n`;
  }

  md += `## Per-intent accuracy\n\n`;
  md += `| Intent | Cases | Passed | Accuracy |\n|---|---|---|---|\n`;
  for (const p of d.perIntent) md += `| ${p.intent} | ${p.total} | ${p.passed} | ${p.accuracy} |\n`;

  md += `\n## Per-category accuracy\n\n`;
  md += `| Category | Cases | Passed | Accuracy | Failures |\n|---|---|---|---|---|\n`;
  for (const c of d.perCategory) {
    const fc = d.failuresByCategory[c.category] ?? 0;
    md += `| ${c.category} | ${c.total} | ${c.passed} | ${c.accuracy} | ${fc} |\n`;
  }

  // Failed cases
  const failures = d.results.filter(r => !r.passed);
  if (failures.length > 0) {
    md += `\n## Failed cases\n\n`;
    md += `| Case | Category | Crit | Input | Expected | Actual | Conf | Errors |\n|---|---|---|---|---|---|---|---|\n`;
    for (const f of failures) {
      const inp = f.input.length > 45 ? `${f.input.slice(0, 45)}…` : f.input;
      const crit = f.criticality === "critical" ? "🔴" : f.criticality === "high" ? "🟠" : "⚪";
      md += `| ${f.caseName} | ${f.category} | ${crit} | "${inp}" | ${f.expectedIntent} | ${f.actualIntent} | ${f.confidence.toFixed(2)} | ${f.errors.join("; ")} |\n`;
    }
  }

  // Golden failures
  if (d.goldenResults.length > 0) {
    const fc = d.goldenResults.filter(c => !c.passed);
    if (fc.length > 0) {
      md += `\n## Failed golden conversations\n\n`;
      for (const conv of fc) {
        md += `### ${conv.conversationId}: ${conv.description}\n\n`;
        md += `| Turn | Input | Expected | Actual | Conf | Intent | Memory | Funnel | NBA |\n|---|---|---|---|---|---|---|---|---|\n`;
        for (const t of conv.turnResults) {
          if (!t.passed) {
            const inp = t.userMessage.length > 40 ? `${t.userMessage.slice(0, 40)}…` : t.userMessage;
            const ie = t.errors.length ? `❌ ${t.errors.join("; ")}` : "✅";
            const me = t.memoryErrors.length ? `⚠️ ${t.memoryErrors.join("; ")}` : "—";
            const fe = t.funnelErrors.length ? `⚠️ ${t.funnelErrors.join("; ")}` : "—";
            const ne = t.nbaErrors.length ? `⚠️ ${t.nbaErrors.join("; ")}` : "—";
            md += `| ${t.turnIndex} | "${inp}" | ${t.expectedIntent ?? "—"} | ${t.actualIntent} | ${t.confidence.toFixed(2)} | ${ie} | ${me} | ${fe} | ${ne} |\n`;
          }
        }
      }
    }
  }

  return md;
}

function generateJson(d: ReportData): string {
  return JSON.stringify({
    timestamp: d.timestamp,
    filters: d.filtersDesc,
    scores: {
      all_cases_score: { accuracy: d.allCasesScore.accuracy, passed: d.allCasesScore.passed, total: d.allCasesScore.total },
      reviewed_cases_score: { accuracy: d.reviewedCasesScore.accuracy, passed: d.reviewedCasesScore.passed, total: d.reviewedCasesScore.total },
      critical_reviewed_score: { accuracy: d.criticalReviewedScore.accuracy, passed: d.criticalReviewedScore.passed, total: d.criticalReviewedScore.total },
      critical_failures: d.criticalFailures,
    },
    caseComposition: {
      reviewed: d.totalReviewed,
      unreviewed: d.totalUnreviewed,
      generated: d.totalGenerated,
      needsFix: d.totalNeedsFix,
    },
    perIntent: d.perIntent,
    perCategory: d.perCategory.map(c => ({ ...c, failures: d.failuresByCategory[c.category] ?? 0 })),
    goldenConversations: {
      total: d.goldenResults.length,
      passed: d.goldenResults.filter(c => c.passed).length,
      details: d.goldenResults.map(c => ({
        id: c.conversationId,
        passed: c.passed,
        passedTurns: c.passedTurns,
        totalTurns: c.totalTurns,
      })),
    },
    failures: d.results.filter(r => !r.passed).map(r => ({
      caseName: r.caseName,
      category: r.category,
      criticality: r.criticality,
      reviewStatus: r.reviewStatus,
      input: r.input,
      expected: r.expectedIntent,
      actual: r.actualIntent,
      confidence: r.confidence,
      trace: r.trace,
      failureReasons: r.errors,
      suggestedFix: r.errors.map(e => suggestFix(e, r.expectedIntent, r.actualIntent)),
    })),
    goldenFailures: d.goldenResults.filter(c => !c.passed).map(c => ({
      id: c.conversationId,
      description: c.description,
      failedTurns: c.turnResults.filter(t => !t.passed).map(t => ({
        turnIndex: t.turnIndex,
        userMessage: t.userMessage,
        expected: t.expectedIntent,
        actual: t.actualIntent,
        confidence: t.confidence,
        errors: t.errors,
        memoryErrors: t.memoryErrors,
        funnelErrors: t.funnelErrors,
        nbaErrors: t.nbaErrors,
        trace: t.trace,
      })),
    })),
  }, null, 2);
}

// ── Failure export with PII masking ──

const FAILURES_DIR = path.join(import.meta.dirname, "failures");

function exportFailures(results: EvalResult[]): string {
  const failures = results.filter(r => !r.passed);
  if (failures.length === 0) return "";

  const dateStr = new Date().toISOString().slice(0, 10);
  const dir = path.join(FAILURES_DIR, dateStr);
  fs.mkdirSync(dir, { recursive: true });

  const byCat: Record<string, EvalResult[]> = {};
  for (const f of failures) (byCat[f.category] ??= []).push(f);

  for (const [cat, catFails] of Object.entries(byCat)) {
    const filePath = path.join(dir, `failures-${cat}.json`);
    const data = JSON.stringify({
      exportTimestamp: new Date().toISOString(),
      category: cat,
      date: dateStr,
      count: catFails.length,
      cases: catFails.map(f => ({
        id: f.caseName,
        category: f.category,
        criticality: f.criticality,
        reviewStatus: f.reviewStatus,
        input: maskPII(f.input),
        expected: f.expectedIntent,
        actual: f.actualIntent,
        confidence: f.confidence,
        trace: maskPII(f.trace ?? ""),
        failureReasons: f.errors,
        suggestedFix: f.errors.map(e => suggestFix(e, f.expectedIntent, f.actualIntent)),
        timestamp: dateStr,
      })),
    }, null, 2);
    fs.writeFileSync(filePath, data);
  }

  const summaryPath = path.join(dir, "failures-summary.json");
  const summary = {
    exportTimestamp: new Date().toISOString(),
    date: dateStr,
    totalFailures: failures.length,
    criticalFailures: failures.filter(f => f.criticality === "critical" || f.criticality === "high").length,
    byCategory: Object.fromEntries(Object.entries(byCat).map(([c, cs]) => [c, cs.length])),
    categories: Object.keys(byCat),
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  return dir;
}

// ── Console output ──

function printConsole(d: ReportData): void {
  console.log(`\n📊 all_cases_score: ${d.allCasesScore.accuracy}% (${d.allCasesScore.passed}/${d.allCasesScore.total})`);
  console.log(`📊 reviewed_cases_score: ${d.reviewedCasesScore.accuracy}% (${d.reviewedCasesScore.passed}/${d.reviewedCasesScore.total})`);
  console.log(`📊 critical_reviewed_score: ${d.criticalReviewedScore.accuracy}% (${d.criticalReviewedScore.passed}/${d.criticalReviewedScore.total})`);
  console.log(`🔴 Critical failures: ${d.criticalFailures}`);

  if (d.goldenResults.length > 0) {
    const pc = d.goldenResults.filter(c => c.passed).length;
    console.log(`💬 Golden conversations: ${pc}/${d.goldenResults.length}`);
  }

  console.log(`\nCase composition: ${d.totalReviewed} reviewed, ${d.totalUnreviewed} unreviewed, ${d.totalGenerated} generated, ${d.totalNeedsFix} needs_fix`);

  console.log("\nPer-intent accuracy:");
  for (const p of d.perIntent) {
    const bar = "█".repeat(Math.round(parseInt(p.accuracy, 10) / 10));
    console.log(`  ${p.intent.padEnd(25)} ${p.accuracy.padStart(4)} ${bar}`);
  }

  const failures = d.results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} failures:`);
    for (const f of failures.slice(0, 10)) {
      const crit = f.criticality === "critical" ? "🔴" : "⚪";
      console.log(`  ${crit} ${f.caseName}: "${f.input.slice(0, 35)}" → exp ${f.expectedIntent}, got ${f.actualIntent} (${f.confidence.toFixed(2)})`);
    }
    if (failures.length > 10) console.log(`  … and ${failures.length - 10} more`);
  }

  if (d.goldenResults.length > 0) {
    const fc = d.goldenResults.filter(c => !c.passed);
    if (fc.length > 0) {
      console.log(`\n❌ Golden conversation failures: ${fc.length}`);
      for (const conv of fc.slice(0, 3)) {
        const ft = conv.turnResults.filter(t => !t.passed);
        console.log(`  ${conv.conversationId}: ${ft.length}/${conv.totalTurns} turns failed`);
        for (const t of ft.slice(0, 2)) {
          console.log(`    turn ${t.turnIndex}: "${t.userMessage.slice(0, 25)}" → exp ${t.expectedIntent}, got ${t.actualIntent}`);
        }
      }
    }
  }
}

// ── Main ──

async function main(): Promise<void> {
  const config = parseArgs();
  const results: EvalResult[] = [];
  const goldenResults: GoldenConvResult[] = [];

  // Run single-turn cases
  if (!config.goldenOnly) {
    const cases = filterCases(ALL_CASES, config);
    const label = config.fast ? "fast (CI)" : describeFilters(config);
    console.log(`\n🧪 Running ${cases.length} eval cases (${label})`);

    for (let i = 0; i < cases.length; i++) {
      results.push(await runCase(cases[i]));
      if ((i + 1) % 20 === 0 || i === cases.length - 1) {
        const p = results.filter(r => r.passed).length;
        process.stdout.write(`\r  Progress: ${i + 1}/${cases.length} (${p} passed, ${i + 1 - p} failed)`);
      }
    }
    process.stdout.write("\n");
  }

  // Run golden conversations
  const convs = filterGolden(GOLDEN_CONVERSATIONS, config);
  if (convs.length > 0) {
    console.log(`\n💬 Running ${convs.length} golden conversations`);
    for (let i = 0; i < convs.length; i++) {
      goldenResults.push(await runGoldenConversation(convs[i]));
      process.stdout.write(`\r  Progress: ${i + 1}/${convs.length}`);
    }
    process.stdout.write("\n");
  }

  // Compute metrics
  const data = computeMetrics(results, goldenResults, config, ALL_CASES.length);
  printConsole(data);

  // Export failures
  if (results.length > 0) {
    const dir = exportFailures(results);
    if (dir) console.log(`\n📁 Failure exports: ${dir}`);
  }

  // Write report
  const reportDir = path.join(import.meta.dirname, "../../../../reports/eval-v2-history");
  fs.mkdirSync(reportDir, { recursive: true });
  const ts = Date.now();

  if (config.output === "json") {
    const f = path.join(reportDir, `v2-eval-${ts}.json`);
    fs.writeFileSync(f, generateJson(data));
    console.log(`\n📄 JSON report: ${f}`);
  } else {
    const f = path.join(reportDir, `v2-eval-${ts}.md`);
    fs.writeFileSync(f, generateMarkdown(data));
    console.log(`📄 Markdown report: ${f}`);
  }

  // Exit code
  const hasFails = (results.length > 0 && results.some(r => !r.passed)) || goldenResults.some(c => !c.passed);
  if (hasFails) process.exitCode = 1;
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
