import { getLlm } from "../llm/index.js";
import { MODEL_PRICING, estimateCost } from "./pricing.js";
import { agendamientoCase } from "./cases/agendamiento.js";
import { precioCase } from "./cases/precio.js";
import fs from "node:fs";
import path from "node:path";

interface EvalResult {
  model: string;
  caseName: string;
  passed: boolean;
  score: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  response: string;
  errors: string[];
}

interface EvalCase {
  name: string;
  description: string;
  messages: { role: string; content: string }[];
  expectedIntent?: string;
  minConfidence?: number;
}

const cases: EvalCase[] = [agendamientoCase, precioCase];

function scoreResponse(response: string, evalCase: EvalCase): { score: number; errors: string[] } {
  const errors: string[] = [];
  let score = 0;

  if (evalCase.expectedIntent) {
    try {
      const parsed = JSON.parse(response);
      if (parsed.intent === evalCase.expectedIntent) {
        score += 40;
      } else {
        errors.push(`Expected intent '${evalCase.expectedIntent}', got '${parsed.intent}'`);
      }
      if ((parsed.confidence ?? 0) >= (evalCase.minConfidence ?? 0.7)) {
        score += 20;
      } else {
        errors.push(`Low confidence: ${parsed.confidence}`);
      }
    } catch {
      // Not JSON — might be a free-text response from LLM responder
      score += 10;
    }
  }

  // Penalize empty responses
  if (!response || response.length < 5) {
    errors.push("Empty or too short response");
  } else {
    score += 20;
  }

  return { score, errors };
}

async function runEval(models: string[]): Promise<void> {
  const results: EvalResult[] = [];
  const llm = getLlm();

  console.log("🧪 Running eval harness\n");

  for (const model of models) {
    for (const evalCase of cases) {
      const system = "Eres un clasificador de intenciones. Responde SOLO con JSON: {\"intent\": \"...\", \"confidence\": 0.xx, \"extractedSlots\": {}}";

      try {
        const result = await llm.complete({
          system,
          messages: evalCase.messages.map((m) => ({ role: m.role as "user" | "system", content: m.content })),
          model,
          temperature: 0.1,
        });

        const { score, errors } = scoreResponse(result.text, evalCase);
        const cost = estimateCost(model, result.usage.inputTokens, result.usage.outputTokens);

        results.push({
          model,
          caseName: evalCase.name,
          passed: errors.length === 0,
          score,
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cost,
          response: result.text.slice(0, 200),
          errors,
        });
      } catch (err) {
        results.push({
          model,
          caseName: evalCase.name,
          passed: false,
          score: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          response: "",
          errors: [(err as Error).message],
        });
      }
    }
  }

  // Generate report
  const reportPath = path.join(process.cwd(), "src/agent/eval/reports");
  fs.mkdirSync(reportPath, { recursive: true });

  let md = `# Eval Report — ${new Date().toISOString()}\n\n`;
  md += `| Model | Case | Passed | Score | Input Tokens | Output Tokens | Cost (USD) | Errors |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;

  for (const r of results) {
    md += `| ${r.model} | ${r.caseName} | ${r.passed ? "✅" : "❌"} | ${r.score} | ${r.inputTokens} | ${r.outputTokens} | $${r.cost.toFixed(6)} | ${r.errors.join("; ") || "-"} |\n`;
  }

  md += `\n## Model pricing used\n\n`;
  md += `| Model | Input $/1M tok | Output $/1M tok |\n|---|---|---|\n`;
  for (const [model, p] of Object.entries(MODEL_PRICING)) {
    md += `| ${model} | $${p.input} | $${p.output} |\n`;
  }

  const reportFile = path.join(reportPath, `report-${Date.now()}.md`);
  fs.writeFileSync(reportFile, md);
  console.log(md);
  console.log(`\n📄 Report saved to ${reportFile}`);
}

const models = process.env.EVAL_MODELS?.split(",") ?? ["mock"];
runEval(models).catch(console.error);
