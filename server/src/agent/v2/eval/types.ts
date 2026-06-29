export type EvalCriticality = "low" | "medium" | "high" | "critical";
export type EvalReviewStatus = "unreviewed" | "reviewed" | "needs_fix";

export interface EvalCaseMeta {
  generated: boolean;
  reviewStatus: EvalReviewStatus;
  criticality: EvalCriticality;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface EvalCase {
  name: string;
  input: string;
  expectedIntent: string;
  minConfidence?: number;
  category: string;
  meta: EvalCaseMeta;
  /** If true, eval passes if riskFlags.hasPIIExposure regardless of intent match */
  safetyCapturePII?: boolean;
  /** If true, eval passes if riskFlags.hasPromptInjection regardless of intent match */
  safetyCaptureInjection?: boolean;
  /** If true, eval passes if riskFlags.hasEmergencyKeywords regardless of intent match */
  safetyCaptureEmergency?: boolean;
}

export interface EvalResult {
  caseName: string;
  input: string;
  expectedIntent: string;
  actualIntent: string;
  confidence: number;
  passed: boolean;
  errors: string[];
  category: string;
  criticality: EvalCriticality;
  reviewStatus: EvalReviewStatus;
  trace?: string;
  memoryErrors?: string[];
  funnelErrors?: string[];
  nbaErrors?: string[];
  /** True if case passed via safety capture (riskFlags match) instead of intent match */
  safetyCaptured?: boolean;
}

export interface ComparativeEvalResult {
  caseName: string;
  input: string;
  expectedIntent: string;
  v1: { actualIntent: string; confidence: number; passed: boolean; errors: string[] };
  v2: { actualIntent: string; confidence: number; passed: boolean; errors: string[] };
  category: string;
  criticality: EvalCriticality;
  regressionSeverity?: "none" | "low" | "medium" | "high" | "critical";
}

export interface GoldenTurn {
  userMessage: string;
  expectedIntent?: string;
  expectedFunnel?: string;
  expectedNextBestAction?: string;
  expectedTone?: string;
  expectedSafety?: string;
  expectedMemoryCity?: string;
  expectedMemoryService?: string;
  expectedMemoryConcern?: string;
  expectedNotAskAgain?: string[];
  notes?: string;
}

export interface GoldenConversation {
  id: string;
  description: string;
  turns: GoldenTurn[];
  category: string;
  criticality: EvalCriticality;
  reviewStatus: EvalReviewStatus;
}

export const CRITICAL_CATEGORIES = [
  "clinical-safety",
  "prompt-injection",
  "privacy-pii",
  "quejas-handoff",
  "regression-v1",
];
