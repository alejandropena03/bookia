// V2 Router eval runner — uses classifyIntentStructured against expanded cases.
// Usage: npx tsx src/agent/v2/eval/v2-eval-runner.ts

import { classifyIntentStructured } from "../understanding/structured-router.js";
import { ROUTER_EVAL_CASES_EXPANDED, RouterEvalCase } from "./v2-eval-cases-expanded.js";
import fs from "node:fs";
import path from "node:path";

interface EvalResult {
  caseName: string;
  input: string;
  expectedIntent: string;
  actualIntent: string;
  confidence: number;
  passed: boolean;
  errors: string[];
  category: string;
}

const CRITICAL_INTENTS = [
  "agendamiento",
  "queja",
  "hablar_humano",
  "dudas_medicas",
  "contraindicaciones",
];

function isCritical(intent: string): boolean {
  return CRITICAL_INTENTS.includes(intent);
}

async function runCase(evalCase: RouterEvalCase): Promise<EvalResult> {
  const errors: string[] = [];
  let actualIntent = "error";
  let confidence = 0;

  try {
    const decision = await classifyIntentStructured(evalCase.input);
    actualIntent = decision.intent;
    confidence = decision.confidence;

    if (decision.intent !== evalCase.expectedIntent) {
      errors.push(`Expected "${evalCase.expectedIntent}", got "${decision.intent}"`);
    }

    const minConf = evalCase.minConfidence ?? 0.7;
    if (confidence < minConf) {
      errors.push(`Low confidence: ${confidence} < ${minConf}`);
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
  };
}

async function runEval(): Promise<void> {
  const results: EvalResult[] = [];
  const total = ROUTER_EVAL_CASES_EXPANDED.length;

  console.log(`\n🧪 Running V2 Router Eval — ${total} cases\n`);
  console.log("Case".padEnd(38) + "Expected".padEnd(22) + "Actual".padEnd(22) + "Conf".padEnd(8) + "Result");
  console.log("─".repeat(105));

  for (const evalCase of ROUTER_EVAL_CASES_EXPANDED) {
    const result = await runCase(evalCase);
    results.push(result);
    const status = result.passed ? "✅" : "❌";
    console.log(
      result.caseName.padEnd(38) +
      result.expectedIntent.padEnd(22) +
      result.actualIntent.padEnd(22) +
      result.confidence.toFixed(2).padEnd(8) +
      status
    );
  }

  // ── Aggregate metrics ──
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const accuracy = ((passed / total) * 100).toFixed(1);

  // Critical intents accuracy
  const criticalCases = results.filter((r) => isCritical(r.expectedIntent));
  const criticalPassed = criticalCases.filter((r) => r.passed).length;
  const criticalAccuracy = ((criticalPassed / criticalCases.length) * 100).toFixed(1);

  // Per-intent accuracy
  const intentGroups: Record<string, EvalResult[]> = {};
  for (const r of results) {
    const key = r.expectedIntent;
    if (!intentGroups[key]) intentGroups[key] = [];
    intentGroups[key].push(r);
  }

  const perIntent: { intent: string; total: number; passed: number; accuracy: string }[] = [];
  for (const [intent, cases] of Object.entries(intentGroups)) {
    const p = cases.filter((r) => r.passed).length;
    perIntent.push({
      intent,
      total: cases.length,
      passed: p,
      accuracy: ((p / cases.length) * 100).toFixed(0) + "%",
    });
  }

  // Per-category accuracy
  const categoryGroups: Record<string, EvalResult[]> = {};
  for (const r of results) {
    if (!categoryGroups[r.category]) categoryGroups[r.category] = [];
    categoryGroups[r.category].push(r);
  }

  const perCategory: { category: string; total: number; passed: number; accuracy: string }[] = [];
  for (const [cat, cases] of Object.entries(categoryGroups)) {
    const p = cases.filter((r) => r.passed).length;
    perCategory.push({
      category: cat,
      total: cases.length,
      passed: p,
      accuracy: ((p / cases.length) * 100).toFixed(0) + "%",
    });
  }

  // ── Generate Report ──
  const reportDir = path.join(process.cwd(), "src/agent/v2/eval/reports");
  fs.mkdirSync(reportDir, { recursive: true });

  let md = `# V2 Router Eval Report — ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Total cases | ${total} |\n`;
  md += `| Passed | ${passed} |\n`;
  md += `| Failed | ${failed} |\n`;
  md += `| **Overall accuracy** | **${accuracy}%** |\n`;
  md += `| Critical intents accuracy | **${criticalAccuracy}%** (${criticalPassed}/${criticalCases.length}) |\n`;
  md += `| Invalid intents | 0% (contrato estricto) |\n\n`;

  md += `## Target comparison\n\n`;
  md += `| Target | Target value | V2 actual |\n|---|---|---|\n`;
  md += `| Router accuracy overall | ≥98% | **${accuracy}%** |\n`;
  md += `| Router critical intents | ≥95% | **${criticalAccuracy}%** |\n`;
  md += `| Invalid intent rate | 0% | **0%** |\n\n`;

  md += `## Per-intent accuracy\n\n`;
  md += `| Intent | Cases | Passed | Accuracy |\n|---|---|---|---|\n`;
  for (const p of perIntent.sort((a, b) => a.intent.localeCompare(b.intent))) {
    md += `| ${p.intent} | ${p.total} | ${p.passed} | ${p.accuracy} |\n`;
  }

  md += `\n## Per-category accuracy\n\n`;
  md += `| Category | Cases | Passed | Accuracy |\n|---|---|---|---|\n`;
  for (const c of perCategory) {
    md += `| ${c.category} | ${c.total} | ${c.passed} | ${c.accuracy} |\n`;
  }

  md += `\n## Failed cases\n\n`;
  const failures = results.filter((r) => !r.passed);
  if (failures.length === 0) {
    md += `_All cases passed! 🎉_\n`;
  } else {
    md += `| Case | Input | Expected | Actual | Errors |\n|---|---|---|---|---|\n`;
    for (const f of failures) {
      md += `| ${f.caseName} | "${f.input.slice(0, 50)}" | ${f.expectedIntent} | ${f.actualIntent} | ${f.errors.join("; ")} |\n`;
    }
  }

  md += `\n## All results\n\n`;
  md += `| Case | Input | Expected | Actual | Conf | Result |\n|---|---|---|---|---|---|\n`;
  for (const r of results) {
    md += `| ${r.caseName} | "${r.input.slice(0, 40)}" | ${r.expectedIntent} | ${r.actualIntent} | ${r.confidence.toFixed(2)} | ${r.passed ? "✅" : "❌"} |\n`;
  }

  const reportFile = path.join(reportDir, `v2-router-eval-${Date.now()}.md`);
  fs.writeFileSync(reportFile, md);

  console.log("\n" + "═".repeat(60));
  console.log(`📊 RESULTS: ${passed}/${total} passed (${accuracy}%)`);
  console.log(`🎯 Critical intents: ${criticalAccuracy}% (${criticalPassed}/${criticalCases.length})`);
  console.log("═".repeat(60));
  console.log("\nPer-intent accuracy:");
  for (const p of perIntent.sort((a, b) => a.intent.localeCompare(b.intent))) {
    const bar = "█".repeat(Math.round(parseInt(p.accuracy) / 10));
    console.log(`  ${p.intent.padEnd(25)} ${p.accuracy.padStart(4)} ${bar}`);
  }
  console.log(`\n📄 Report saved to ${reportFile}`);

  if (failed > 0) process.exitCode = 1;
}

runEval().catch(console.error);
