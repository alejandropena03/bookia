import { getLlm } from "../llm/index.js";
import { classifyIntent } from "../router.js";
import { ROUTER_EVAL_CASES, RouterEvalCase } from "./cases/router-intents.js";
import { MODEL_PRICING, estimateCost } from "./pricing.js";
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
  cost: number;
  category: string;
}

async function runCase(evalCase: RouterEvalCase): Promise<EvalResult> {
  const errors: string[] = [];
  let actualIntent = "error";
  let confidence = 0;

  try {
    const result = await classifyIntent(evalCase.input);
    actualIntent = result.intent;
    confidence = result.confidence;

    if (result.intent !== evalCase.expectedIntent) {
      errors.push(`Expected "${evalCase.expectedIntent}", got "${result.intent}"`);
    }
    const minConf = evalCase.minConfidence ?? 0.7;
    if (confidence < minConf) {
      errors.push(`Low confidence: ${confidence} < ${minConf}`);
    }
  } catch (err) {
    errors.push(`Exception: ${(err as Error).message}`);
  }

  const cost = estimateCost("deepseek-v4-flash", 100, 50);
  return {
    caseName: evalCase.name,
    input: evalCase.input,
    expectedIntent: evalCase.expectedIntent,
    actualIntent,
    confidence,
    passed: errors.length === 0,
    errors,
    cost,
    category: evalCase.category,
  };
}

async function runEval(): Promise<void> {
  const results: EvalResult[] = [];
  const total = ROUTER_EVAL_CASES.length;

  console.log(`🧪 Running eval harness — ${total} cases\n`);
  console.log("Case".padEnd(35) + "Expected".padEnd(22) + "Actual".padEnd(22) + "Conf".padEnd(8) + "Result");
  console.log("─".repeat(100));

  for (const evalCase of ROUTER_EVAL_CASES) {
    const result = await runCase(evalCase);
    results.push(result);
    const status = result.passed ? "✅" : "❌";
    console.log(
      result.caseName.padEnd(35) +
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

  // ── Report ──
  const reportDir = path.join(process.cwd(), "src/agent/eval/reports");
  fs.mkdirSync(reportDir, { recursive: true });

  let md = `# Router Eval Report — ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Total cases | ${total} |\n`;
  md += `| Passed | ${passed} |\n`;
  md += `| Failed | ${failed} |\n`;
  md += `| **Overall accuracy** | **${accuracy}%** |\n`;
  md += `| Est. cost | $${results.reduce((s, r) => s + r.cost, 0).toFixed(4)} |\n\n`;

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

  md += `\n## Model pricing used\n\n`;
  md += `| Model | Input $/1M tok | Output $/1M tok |\n|---|---|---|\n`;
  for (const [model, p] of Object.entries(MODEL_PRICING)) {
    md += `| ${model} | $${p.input} | $${p.output} |\n`;
  }

  const reportFile = path.join(reportDir, `router-eval-${Date.now()}.md`);
  fs.writeFileSync(reportFile, md);

  console.log("\n" + "═".repeat(60));
  console.log(`📊 RESULTS: ${passed}/${total} passed (${accuracy}%)`);
  console.log("═".repeat(60));
  console.log("\nPer-intent accuracy:");
  for (const p of perIntent.sort((a, b) => a.intent.localeCompare(b.intent))) {
    const bar = "█".repeat(Math.round(parseInt(p.accuracy) / 10));
    console.log(`  ${p.intent.padEnd(25)} ${p.accuracy.padStart(4)} ${bar}`);
  }
  console.log(`\n📄 Report saved to ${reportFile}`);

  // Exit code: 0 if all pass, 1 if any fail
  if (failed > 0) process.exitCode = 1;
}

runEval().catch(console.error);
