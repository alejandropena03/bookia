import type { EvalCase, GoldenConversation } from "../types.js";
import { CLINICAL_SAFETY_CASES } from "./clinical-safety.js";
import { PROMPT_INJECTION_CASES } from "./prompt-injection.js";
import { PRIVACY_PII_CASES } from "./privacy-pii.js";
import { QUEJAS_HANDOFF_CASES } from "./quejas-handoff.js";
import { ROUTER_CASES } from "./router-cases.js";
import { SCHEDULING_CASES } from "./scheduling-cases.js";
import { PRICING_CASES } from "./pricing-cases.js";
import { FAQ_CASES } from "./faq-cases.js";
import { TYPOS_AMBIGUOUS_CASES } from "./typos-ambiguous.js";
import { REGRESSION_V1_CASES } from "./regression-v1.js";
import { NEXT_LEVEL_REGRESSION_CASES } from "./next-level-regression.js";
import { GOLDEN_CONVERSATIONS } from "./golden-conversations.js";

export const ALL_CASES: EvalCase[] = [
  ...CLINICAL_SAFETY_CASES,
  ...PROMPT_INJECTION_CASES,
  ...PRIVACY_PII_CASES,
  ...QUEJAS_HANDOFF_CASES,
  ...ROUTER_CASES,
  ...SCHEDULING_CASES,
  ...PRICING_CASES,
  ...FAQ_CASES,
  ...TYPOS_AMBIGUOUS_CASES,
  ...REGRESSION_V1_CASES,
  ...NEXT_LEVEL_REGRESSION_CASES,
];

export const CASE_COUNT = ALL_CASES.length;
export const REVIEWED_CASES = ALL_CASES.filter(c => c.meta.reviewStatus === "reviewed");
export const CRITICAL_CASES = ALL_CASES.filter(c => c.meta.criticality === "critical" || c.meta.criticality === "high");
export const CRITICAL_REVIEWED_CASES = CRITICAL_CASES.filter(c => c.meta.reviewStatus === "reviewed");

export function getCasesByCategory(category: string): EvalCase[] {
  return ALL_CASES.filter(c => c.category === category);
}

export function getCasesByCriticality(criticality: string): EvalCase[] {
  return ALL_CASES.filter(c => c.meta.criticality === criticality);
}

export function getCasesByReviewStatus(status: string): EvalCase[] {
  return ALL_CASES.filter(c => c.meta.reviewStatus === status);
}

export { GOLDEN_CONVERSATIONS };
export type { GoldenConversation };

export {
  CLINICAL_SAFETY_CASES,
  PROMPT_INJECTION_CASES,
  PRIVACY_PII_CASES,
  QUEJAS_HANDOFF_CASES,
  ROUTER_CASES,
  SCHEDULING_CASES,
  PRICING_CASES,
  FAQ_CASES,
  TYPOS_AMBIGUOUS_CASES,
  REGRESSION_V1_CASES,
  NEXT_LEVEL_REGRESSION_CASES,
};
