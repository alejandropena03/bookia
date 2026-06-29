import type { RouterDecision } from "./agent-intent.js";
import type { ResponseCriticIssue } from "../response/response-critic.js";

export type SafetyLevel = "safe" | "caution" | "handoff" | "blocked";

export type ResponseStrategy =
  | "canned"
  | "flow"
  | "llm"
  | "hybrid"
  | "handoff"
  | "refusal";

export interface RiskFlags {
  hasEmergencyKeywords: boolean;
  hasClinicalRisk: boolean;
  hasPIIExposure: boolean;
  hasPromptInjection: boolean;
  needsEscalation: boolean;
}

export interface PolicyDecision {
  action: "allow" | "constrain" | "handoff" | "block";
  safetyLevel: SafetyLevel;
  reasons: string[];
  responseConstraints: string[];
}

export interface DecisionTrace {
  traceId: string;
  timestamp: string;
  input: {
    normalizedText: string;
    language: string;
    detectedPII: string[];
  };
  understanding: {
    routerDecision: RouterDecision;
    riskFlags: RiskFlags;
    sentimentLabel: string;
  };
  policy: PolicyDecision;
  funnelStage: string;
  nextBestAction: string;
  generation: {
    route: ResponseStrategy;
    model?: string;
    promptVersion?: string;
    tokensIn?: number;
    tokensOut?: number;
  };
  quality: {
    criticPassed: boolean;
    criticNotes: string[];
    criticIssues?: ResponseCriticIssue[];
    criticAction?: string;
  };
}
