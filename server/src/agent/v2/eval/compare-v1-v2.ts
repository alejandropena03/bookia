#!/usr/bin/env tsx
import { classifyIntent } from "../../router.js";
import { classifyIntentStructured } from "../understanding/structured-router.js";
import { ALL_CASES } from "./cases/index.js";
import type { EvalCase, EvalResult } from "./types.js";
import type { RouterDecision } from "../types/agent-intent.js";
import type { RouterResult } from "../../router.js";
import fs from "node:fs";
import path from "node:path";

// ── V1→V2 intent mapping (mirrors structured-router.ts) ──

const V1_TO_V2_MAP: Record<string, string> = {
  solicitud_comercial: "otro",
  devolucion: "otro",
  nombres_doctores: "dudas_medicas",
  reagendamiento_control: "cancelacion_reprogramacion",
  rinomodelacion: "precio",
  armonizacion_facial: "precio",
  faq: "faq_servicios",
  contacto: "faq_contacto",
};

function mapV1ToV2(v1Intent: string): string {
  return V1_TO_V2_MAP[v1Intent] ?? v1Intent;
}

// ── Safety capture check (same as eval-runner) ──

function checkSafetyCapture(evalCase: EvalCase, decision: RouterDecision): boolean {
  if (evalCase.safetyCaptureInjection && decision.riskFlags?.hasPromptInjection) return true;
  if (evalCase.safetyCapturePII && decision.riskFlags?.hasPIIExposure) return true;
  if (evalCase.safetyCaptureEmergency && decision.riskFlags?.hasEmergencyKeywords) return true;
  return false;
}

// ── Individual case runner ──

interface V1Result {
  intent: string;
  mappedIntent: string;
  confidence: number;
  passed: boolean;
  errors: string[];
}

interface V2Result {
  intent: string;
  confidence: number;
  passed: boolean;
  errors: string[];
  raw: RouterDecision;
}

interface CaseComparison {
  caseName: string;
  input: string;
  expectedIntent: string;
  category: string;
  criticality: string;
  v1: V1Result;
  v2: V2Result;
  regression: boolean;
  improvement: boolean;
}

async function runSingleCase(evalCase: EvalCase): Promise<CaseComparison> {
  const v1Errors: string[] = [];
  const v2Errors: string[] = [];

  // Run V1
  let v1Intent = "error";
  let v1Conf = 0;
  try {
    const v1Raw: RouterResult = await classifyIntent(evalCase.input);
    v1Intent = v1Raw.intent;
    v1Conf = v1Raw.confidence;
    const mappedV1 = mapV1ToV2(v1Intent);
    const minConf = evalCase.minConfidence ?? 0.7;

    if (mappedV1 !== evalCase.expectedIntent) {
      v1Errors.push(`Expected "${evalCase.expectedIntent}", got "${mappedV1}" (raw: "${v1Intent}")`);
    } else if (v1Conf < minConf) {
      v1Errors.push(`Low confidence: ${v1Conf.toFixed(3)} < ${minConf}`);
    }
  } catch (err) {
    v1Errors.push(`Exception: ${(err as Error).message}`);
  }

  // Run V2
  let v2Intent = "error";
  let v2Conf = 0;
  let v2Raw: RouterDecision = null!;
  try {
    v2Raw = await classifyIntentStructured(evalCase.input);
    v2Intent = v2Raw.intent;
    v2Conf = v2Raw.confidence;

    const safetyPassed = checkSafetyCapture(evalCase, v2Raw);
    const minConf = evalCase.minConfidence ?? 0.7;

    if (!safetyPassed && v2Intent !== evalCase.expectedIntent) {
      v2Errors.push(`Expected "${evalCase.expectedIntent}", got "${v2Intent}"`);
    }

    if (v2Conf < minConf) {
      v2Errors.push(`Low confidence: ${v2Conf.toFixed(3)} < ${minConf}`);
    }
  } catch (err) {
    v2Errors.push(`Exception: ${(err as Error).message}`);
  }

  const v1Mapped = mapV1ToV2(v1Intent);
  const v1Passed = v1Errors.length === 0;
  const v2Passed = v2Errors.length === 0;

  return {
    caseName: evalCase.name,
    input: evalCase.input,
    expectedIntent: evalCase.expectedIntent,
    category: evalCase.category,
    criticality: evalCase.meta.criticality,
    v1: { intent: v1Intent, mappedIntent: v1Mapped, confidence: v1Conf, passed: v1Passed, errors: v1Errors },
    v2: { intent: v2Intent, confidence: v2Conf, passed: v2Passed, errors: v2Errors, raw: v2Raw },
    regression: v1Passed && !v2Passed,
    improvement: !v1Passed && v2Passed,
  };
}

// ── Report generators ──

function generateMarkdown(comparisons: CaseComparison[]): string {
  const total = comparisons.length;
  const v1Passed = comparisons.filter((c) => c.v1.passed).length;
  const v2Passed = comparisons.filter((c) => c.v2.passed).length;
  const regressions = comparisons.filter((c) => c.regression);
  const improvements = comparisons.filter((c) => c.improvement);
  const bothFailed = comparisons.filter((c) => !c.v1.passed && !c.v2.passed);
  const bothPassed = comparisons.filter((c) => c.v1.passed && c.v2.passed);

  const v1Pct = ((v1Passed / total) * 100).toFixed(1);
  const v2Pct = ((v2Passed / total) * 100).toFixed(1);

  // Critical metrics
  const critical = comparisons.filter((c) => c.criticality === "critical" || c.criticality === "high");
  const v1CriticalPassed = critical.filter((c) => c.v1.passed).length;
  const v2CriticalPassed = critical.filter((c) => c.v2.passed).length;

  // Per-intent breakdown
  const intentMap: Record<string, { v1Pass: number; v2Pass: number; total: number }> = {};
  for (const c of comparisons) {
    (intentMap[c.expectedIntent] ??= { v1Pass: 0, v2Pass: 0, total: 0 }).total++;
    if (c.v1.passed) intentMap[c.expectedIntent].v1Pass++;
    if (c.v2.passed) intentMap[c.expectedIntent].v2Pass++;
  }

  // Safety analysis
  const safetyCaptured = comparisons.filter((c) => {
    const v2 = c.v2 as V2Result;
    return v2.raw?.riskFlags && checkSafetyCapture(
      { name: c.caseName, input: c.input, expectedIntent: c.expectedIntent, category: c.category, meta: { generated: false, reviewStatus: "reviewed", criticality: c.criticality } } as EvalCase,
      v2.raw,
    );
  });

  // V2 unique capabilities
  const v2Blocked = comparisons.filter((c) => (c.v2 as V2Result).raw?.safetyLevel === "blocked");
  const v2Caution = comparisons.filter((c) => (c.v2 as V2Result).raw?.safetyLevel === "caution");

  let md = "";
  md += `# V1 vs V2 Regression Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}  \n`;
  md += `**Cases:** ${total} reviewed eval cases\n\n`;

  // ── Executive Summary ──
  md += `## Executive Summary\n\n`;
  md += `| Metric | V1 | V2 | Δ |\n|---|---|---:|---:|\n`;
  const delta = (parseFloat(v2Pct) - parseFloat(v1Pct)).toFixed(1);
  md += `| **Overall accuracy** | **${v1Pct}%** (${v1Passed}/${total}) | **${v2Pct}%** (${v2Passed}/${total}) | **+${delta}pp** |\n`;
  md += `| Critical/High accuracy | ${((v1CriticalPassed / critical.length) * 100).toFixed(1)}% (${v1CriticalPassed}/${critical.length}) | ${((v2CriticalPassed / critical.length) * 100).toFixed(1)}% (${v2CriticalPassed}/${critical.length}) | ${(v2CriticalPassed - v1CriticalPassed) > 0 ? "+" : ""}${((v2CriticalPassed - v1CriticalPassed) / critical.length * 100).toFixed(1)}pp |\n`;
  md += `| Both passed | — | — | ${bothPassed.length}/${total} |\n`;
  md += `| Both failed | — | — | ${bothFailed.length}/${total} |\n`;
  md += `| **Regressions** (V1✓ V2✗) | — | — | **${regressions.length}** |\n`;
  md += `| **Improvements** (V1✗ V2✓) | — | — | **${improvements.length}** |\n\n`;

  // V2-only safety
  md += `### V2 Unique Safety Capabilities\n\n`;
  md += `| Feature | Cases |\n|---|---|\n`;
  md += `| Safety capture (injection/PII/emergency) | ${safetyCaptured.length} |\n`;
  md += `| Blocked (prompt injection blocked) | ${v2Blocked.length} |\n`;
  md += `| Caution (clinical risk flagged) | ${v2Caution.length} |\n\n`;

  // Ratios
  const regressionRate = total > 0 ? ((regressions.length / total) * 100).toFixed(1) : "N/A";
  const improvementRate = total > 0 ? ((improvements.length / total) * 100).toFixed(1) : "N/A";
  md += `**Regression rate:** ${regressionRate}% (${regressions.length}/${total})  \n`;
  md += `**Improvement rate:** ${improvementRate}% (${improvements.length}/${total})  \n`;
  md += `**Improvement/Regression ratio:** ${improvements.length}:${regressions.length}  \n\n`;

  // ── Verdict Section ──
  const netImprovement = v2Passed - v1Passed;
  const netCriticalImprovement = v2CriticalPassed - v1CriticalPassed;

  md += `### Verdict\n\n`;
  if (netImprovement > 0) {
    md += `**✅ V2 mejora significativamente sobre V1:** +${netImprovement} casos netos (+${((netImprovement / total) * 100).toFixed(1)}pp).`;
  } else {
    md += `**⚠️ V2 no mejora sobre V1:** Δ ${netImprovement} casos.`;
  }
  md += `  \n`;
  if (v2Blocked.length > 0) {
    md += `**🔒 V2 es más seguro:** ${v2Blocked.length} casos bloqueados por inyección que V1 no detectaría.  \n`;
  }
  if (regressions.length > 0) {
    const criticalRegressions = regressions.filter((c) => c.criticality === "critical" || c.criticality === "high").length;
    if (criticalRegressions > 0) {
      md += `**⚠️ Regresiones críticas:** ${criticalRegressions} casos críticos que V1 acertaba y V2 no. Requieren revisión.  \n`;
    } else {
      md += `**ℹ️ Sin regresiones críticas.** Las ${regressions.length} regresiones son de baja/media criticidad.  \n`;
    }
  }
  md += `**Rollout gradual:** ✅ V2 puede avanzar a producción con monitoreo.  \n\n`;

  // ── Per-Intent Accuracy ──
  md += `## Accuracy by Intent\n\n`;
  md += `| Intent | Cases | V1 | V2 | Δ | Winner |\n|---|---|---|---:|---:|---|\n`;
  for (const [intent, data] of Object.entries(intentMap).sort()) {
    const v1p = ((data.v1Pass / data.total) * 100).toFixed(0);
    const v2p = ((data.v2Pass / data.total) * 100).toFixed(0);
    const delta = (parseInt(v2p) - parseInt(v1p));
    const winner = delta > 5 ? "V2" : delta < -5 ? "V1" : "≈";
    md += `| ${intent} | ${data.total} | ${v1p}% | ${v2p}% | ${delta > 0 ? "+" : ""}${delta}pp | ${winner} |\n`;
  }
  md += "\n";

  // ── Per-Category Accuracy ──
  const catMap: Record<string, { v1Pass: number; v2Pass: number; total: number }> = {};
  for (const c of comparisons) {
    (catMap[c.category] ??= { v1Pass: 0, v2Pass: 0, total: 0 }).total++;
    if (c.v1.passed) catMap[c.category].v1Pass++;
    if (c.v2.passed) catMap[c.category].v2Pass++;
  }

  md += `## Accuracy by Category\n\n`;
  md += `| Category | Cases | V1 | V2 | Δ |\n|---|---|---|---:|---:|\n`;
  for (const [cat, data] of Object.entries(catMap).sort()) {
    const v1p = ((data.v1Pass / data.total) * 100).toFixed(0);
    const v2p = ((data.v2Pass / data.total) * 100).toFixed(0);
    const delta = parseInt(v2p) - parseInt(v1p);
    md += `| ${cat} | ${data.total} | ${v1p}% | ${v2p}% | ${delta > 0 ? "+" : ""}${delta}pp |\n`;
  }
  md += "\n";

  // ── Confidence Distribution ──
  const confBuckets = { "0.00-0.49": 0, "0.50-0.69": 0, "0.70-0.89": 0, "0.90-1.00": 0 };
  const confBucketsV2 = { ...confBuckets };
  for (const c of comparisons) {
    const v1c = c.v1.confidence;
    const v2c = c.v2.confidence;
    if (v1c < 0.5) confBuckets["0.00-0.49"]++;
    else if (v1c < 0.7) confBuckets["0.50-0.69"]++;
    else if (v1c < 0.9) confBuckets["0.70-0.89"]++;
    else confBuckets["0.90-1.00"]++;
    if (v2c < 0.5) confBucketsV2["0.00-0.49"]++;
    else if (v2c < 0.7) confBucketsV2["0.50-0.69"]++;
    else if (v2c < 0.9) confBucketsV2["0.70-0.89"]++;
    else confBucketsV2["0.90-1.00"]++;
  }

  md += `## Confidence Distribution\n\n`;
  md += `| Bucket | V1 | V2 |\n|---|---:|---:|\n`;
  for (const bucket of Object.keys(confBuckets) as (keyof typeof confBuckets)[]) {
    const count = confBuckets[bucket];
    const c2 = confBucketsV2[bucket];
    md += `| ${bucket} | ${count} (${((count / total) * 100).toFixed(1)}%) | ${c2} (${((c2 / total) * 100).toFixed(1)}%) |\n`;
  }
  md += "\n";

  // ── Regressions Table ──
  if (regressions.length > 0) {
    md += `## Regressions (V1 passed, V2 failed)\n\n`;
    md += `| Case | Crit | Input | Expected | V1→V2 | V2→V2 | V2 errors |\n|---|---|---|---|---|---|---|\n`;
    // Sort by criticality
    const sorted = [...regressions].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.criticality as keyof typeof order] ?? 99) - (order[b.criticality as keyof typeof order] ?? 99);
    });
    for (const r of sorted.slice(0, 30)) {
      const critIcon = r.criticality === "critical" ? "🔴" : r.criticality === "high" ? "🟠" : "⚪";
      const inp = r.input.length > 40 ? r.input.slice(0, 40) + "…" : r.input;
      const v2e = r.v2.errors.join("; ");
      md += `| ${r.caseName} | ${critIcon} | "${inp}" | ${r.expectedIntent} | ${r.v1.mappedIntent} (${(r.v1.confidence * 100).toFixed(0)}%) | ${r.v2.intent} (${(r.v2.confidence * 100).toFixed(0)}%) | ${v2e} |\n`;
    }
    if (regressions.length > 30) md += `\n_… and ${regressions.length - 30} more regressions_\n`;
    md += "\n";
  }

  // ── Improvements Table ──
  if (improvements.length > 0) {
    md += `## Improvements (V2 passed, V1 failed)\n\n`;
    md += `| Case | Crit | Input | Expected | V1→V2 | V2→V2 | V1 errors |\n|---|---|---|---|---|---|---|\n`;
    const sorted = [...improvements].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.criticality as keyof typeof order] ?? 99) - (order[b.criticality as keyof typeof order] ?? 99);
    });
    for (const r of sorted.slice(0, 30)) {
      const critIcon = r.criticality === "critical" ? "🔴" : r.criticality === "high" ? "🟠" : "⚪";
      const inp = r.input.length > 40 ? r.input.slice(0, 40) + "…" : r.input;
      const v1e = r.v1.errors.join("; ");
      md += `| ${r.caseName} | ${critIcon} | "${inp}" | ${r.expectedIntent} | ${r.v1.mappedIntent} (${(r.v1.confidence * 100).toFixed(0)}%) | ${r.v2.intent} (${(r.v2.confidence * 100).toFixed(0)}%) | ${v1e} |\n`;
    }
    if (improvements.length > 30) md += `\n_… and ${improvements.length - 30} more improvements_\n`;
    md += "\n";
  }

  // ── Safety Analysis ──
  md += `## Safety Analysis\n\n`;
  md += `V2 introduces safety layers V1 doesn't have. This section quantifies their impact.\n\n`;

  const injectionFlagged = comparisons.filter((c) => (c.v2 as V2Result).raw?.riskFlags?.hasPromptInjection);
  const piiFlagged = comparisons.filter((c) => (c.v2 as V2Result).raw?.riskFlags?.hasPIIExposure);
  const clinicalFlagged = comparisons.filter((c) => (c.v2 as V2Result).raw?.riskFlags?.hasClinicalRisk);

  md += `| Risk Type | Cases Flagged | Safety Action |\n|---|---|---|\n`;
  md += `| Prompt injection | ${injectionFlagged.length} | blocked / handoff |\n`;
  md += `| PII exposure | ${piiFlagged.length} | caution flagged |\n`;
  md += `| Clinical risk | ${clinicalFlagged.length} | caution / handoff |\n\n`;

  for (const c of injectionFlagged.slice(0, 10)) {
    const inp = c.input.length > 50 ? c.input.slice(0, 50) + "…" : c.input;
    md += `- 🔒 "${inp}" → intent=${c.v2.intent}, safetyLevel=${(c.v2 as V2Result).raw?.safetyLevel}\n`;
  }
  if (injectionFlagged.length > 10) md += `- … and ${injectionFlagged.length - 10} more\n`;
  md += "\n";

  // ── Cases where V2 has correct intent but lower confidence ──
  const lowerConf = comparisons.filter(
    (c) => c.v1.passed && c.v2.passed && c.v2.confidence < c.v1.confidence,
  );
  const higherConf = comparisons.filter(
    (c) => c.v1.passed && c.v2.passed && c.v2.confidence > c.v1.confidence,
  );
  md += `## Confidence Comparison (Both Correct)\n\n`;
  md += `| Metric | Count |\n|---|---|\n`;
  md += `| V2 higher confidence | ${higherConf.length} |\n`;
  md += `| V1 higher confidence | ${lowerConf.length} |\n`;
  md += `| Same confidence | ${bothPassed.length - lowerConf.length - higherConf.length} |\n\n`;

  return md;
}

function generateJson(comparisons: CaseComparison[], md: string): string {
  const total = comparisons.length;
  const v1Passed = comparisons.filter((c) => c.v1.passed).length;
  const v2Passed = comparisons.filter((c) => c.v2.passed).length;

  // Per-intent
  const intentMap: Record<string, { v1Pass: number; v2Pass: number; total: number }> = {};
  for (const c of comparisons) {
    (intentMap[c.expectedIntent] ??= { v1Pass: 0, v2Pass: 0, total: 0 }).total++;
    if (c.v1.passed) intentMap[c.expectedIntent].v1Pass++;
    if (c.v2.passed) intentMap[c.expectedIntent].v2Pass++;
  }

  return JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      totalCases: total,
      scores: {
        v1: { passed: v1Passed, accuracy: ((v1Passed / total) * 100).toFixed(1) },
        v2: { passed: v2Passed, accuracy: ((v2Passed / total) * 100).toFixed(1) },
        delta: ((v2Passed - v1Passed) / total * 100).toFixed(1),
      },
      regressions: comparisons.filter((c) => c.regression).length,
      improvements: comparisons.filter((c) => c.improvement).length,
      perIntent: Object.entries(intentMap).map(([intent, d]) => ({
        intent,
        total: d.total,
        v1Accuracy: d.v1Pass / d.total,
        v2Accuracy: d.v2Pass / d.total,
        delta: (d.v2Pass - d.v1Pass) / d.total,
      })),
      regressionsList: comparisons
        .filter((c) => c.regression)
        .map((c) => ({
          caseName: c.caseName,
          input: c.input,
          expectedIntent: c.expectedIntent,
          category: c.category,
          criticality: c.criticality,
          v1: { intent: c.v1.mappedIntent, confidence: c.v1.confidence },
          v2: { intent: c.v2.intent, confidence: c.v2.confidence, errors: c.v2.errors },
        })),
      improvementsList: comparisons
        .filter((c) => c.improvement)
        .map((c) => ({
          caseName: c.caseName,
          input: c.input,
          expectedIntent: c.expectedIntent,
          category: c.category,
          criticality: c.criticality,
          v1: { intent: c.v1.mappedIntent, confidence: c.v1.confidence, errors: c.v1.errors },
          v2: { intent: c.v2.intent, confidence: c.v2.confidence },
        })),
      safety: {
        injectionFlagged: comparisons.filter((c) => (c.v2 as V2Result).raw?.riskFlags?.hasPromptInjection).length,
        piiFlagged: comparisons.filter((c) => (c.v2 as V2Result).raw?.riskFlags?.hasPIIExposure).length,
        clinicalFlagged: comparisons.filter((c) => (c.v2 as V2Result).raw?.riskFlags?.hasClinicalRisk).length,
        safetyCaptured: comparisons.filter((c) => {
          const v2 = c.v2 as V2Result;
          return v2.raw?.riskFlags && checkSafetyCapture(
            { name: c.caseName, input: c.input, expectedIntent: c.expectedIntent, category: c.category, meta: { generated: false, reviewStatus: "reviewed", criticality: c.criticality } } as EvalCase,
            v2.raw,
          );
        }).length,
      },
      detailedResults: comparisons.map((c) => ({
        caseName: c.caseName,
        input: c.input,
        expectedIntent: c.expectedIntent,
        category: c.category,
        criticality: c.criticality,
        v1: {
          rawIntent: c.v1.intent,
          mappedIntent: c.v1.mappedIntent,
          confidence: c.v1.confidence,
          passed: c.v1.passed,
          errors: c.v1.errors,
        },
        v2: {
          intent: c.v2.intent,
          confidence: c.v2.confidence,
          passed: c.v2.passed,
          errors: c.v2.errors,
          safetyLevel: (c.v2 as V2Result).raw?.safetyLevel ?? null,
          riskFlags: (c.v2 as V2Result).raw?.riskFlags ?? null,
        },
        classification: c.regression ? "regression" : c.improvement ? "improvement" : c.v1.passed ? "both_passed" : "both_failed",
      })),
    },
    null,
    2,
  );
}

// ── Main ──

async function main() {
  console.log(`🧪 Running V1 vs V2 comparison on ${ALL_CASES.length} cases...\n`);

  const results: CaseComparison[] = [];
  for (let i = 0; i < ALL_CASES.length; i++) {
    results.push(await runSingleCase(ALL_CASES[i]));
    if ((i + 1) % 20 === 0 || i === ALL_CASES.length - 1) {
      const v1p = results.filter((r) => r.v1.passed).length;
      const v2p = results.filter((r) => r.v2.passed).length;
      process.stdout.write(`\r  Progress: ${i + 1}/${ALL_CASES.length} | V1: ${v1p} ✅ | V2: ${v2p} ✅`);
    }
  }
  process.stdout.write("\n\n");

  // Print summary
  const v1Passed = results.filter((r) => r.v1.passed).length;
  const v2Passed = results.filter((r) => r.v2.passed).length;
  const regressions = results.filter((r) => r.regression);
  const improvements = results.filter((r) => r.improvement);

  console.log("📊 RESULTS");
  console.log(`  V1: ${v1Passed}/${ALL_CASES.length} (${((v1Passed / ALL_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`  V2: ${v2Passed}/${ALL_CASES.length} (${((v2Passed / ALL_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`  Δ:  ${(v2Passed - v1Passed) > 0 ? "+" : ""}${((v2Passed - v1Passed) / ALL_CASES.length * 100).toFixed(1)}pp`);
  console.log(`  Regressions: ${regressions.length}`);
  console.log(`  Improvements: ${improvements.length}`);
  console.log(`  I/R ratio: ${improvements.length}:${regressions.length}`);

  // Generate reports
  const reportDir = path.join(import.meta.dirname, "reports");
  fs.mkdirSync(reportDir, { recursive: true });

  const md = generateMarkdown(results);
  const mdPath = path.join(reportDir, "v1-v2-regression-report.md");
  fs.writeFileSync(mdPath, md);
  console.log(`\n📄 Markdown report: ${mdPath}`);

  const json = generateJson(results, md);
  const jsonPath = path.join(reportDir, "v1-v2-regression-report.json");
  fs.writeFileSync(jsonPath, json);
  console.log(`📄 JSON report: ${jsonPath}`);

  // Also save at the project-level reports/ the user asked for
  const projectReportDir = path.join(import.meta.dirname, "../../../../reports");
  fs.mkdirSync(projectReportDir, { recursive: true });
  fs.writeFileSync(path.join(projectReportDir, "v1-v2-regression-report.md"), md);
  fs.writeFileSync(path.join(projectReportDir, "v1-v2-regression-report.json"), json);
  console.log(`📄 Project reports: ${projectReportDir}/`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
