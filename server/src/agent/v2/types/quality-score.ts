export type QualityDimension =
  | "intent_accuracy"
  | "response_completeness"
  | "safety_compliance"
  | "tone_appropriateness"
  | "pii_handling"
  | "escalation_appropriateness"
  | "confidence_calibration";

export interface DimensionScore {
  score: number;
  weight: number;
  reason?: string;
}

export interface QualityScore {
  overall: number;
  dimensions: Record<QualityDimension, DimensionScore>;
  requiresReview: boolean;
  reviewReason?: string;
}

export interface ReviewQueueEntry {
  id: string;
  timestamp: string;
  tenantId: string;
  conversationId: string;
  input: string;
  response: string;
  intent: string;
  confidence: number;
  qualityScore: QualityScore;
  riskFlags: {
    hasClinicalRisk: boolean;
    hasPIIExposure: boolean;
    hasPromptInjection: boolean;
    needsEscalation: boolean;
  };
  safetyLevel: "safe" | "caution" | "handoff" | "blocked";
}

export interface MetricEvent {
  type: "quality_score" | "review_queue" | "agent_error" | "safety_trigger" | "router_decision";
  timestamp: string;
  tenantId: string;
  traceId: string;
  conversationId: string;
  payload: Record<string, unknown>;
}

export const QUALITY_DIMENSIONS: QualityDimension[] = [
  "intent_accuracy",
  "response_completeness",
  "safety_compliance",
  "tone_appropriateness",
  "pii_handling",
  "escalation_appropriateness",
  "confidence_calibration",
];

export const REVIEW_QUEUE_THRESHOLDS = {
  minConfidence: 0.6,
  minOverallQuality: 0.5,
  clinicalRiskAutoReview: true,
  piiExposureAutoReview: true,
  injectionAutoReview: true,
  escalationAutoReview: true,
  cautionAutoReview: true,
};
