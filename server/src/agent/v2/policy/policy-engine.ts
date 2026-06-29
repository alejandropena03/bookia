import type { PolicyDecision, RiskFlags } from "../types/decision-trace.js";
import type { AgentIntent, RouterDecision } from "../types/agent-intent.js";
import { scanPromptInjection } from "./prompt-injection.js";
import { evaluateClinicalSafety, type ClinicalCategory } from "./clinical-safety.js";

const CLINICAL_ACTION_MAP: Record<ClinicalCategory, "allow" | "handoff" | "block"> = {
  general_info: "allow",
  needs_evaluation: "handoff",
  urgent_handoff: "handoff",
  refuse_medical_advice: "block",
};

const CLINICAL_SAFETY_MAP: Record<ClinicalCategory, "safe" | "caution" | "handoff" | "blocked"> = {
  general_info: "safe",
  needs_evaluation: "caution",
  urgent_handoff: "handoff",
  refuse_medical_advice: "blocked",
};

export function enforceClinicalSafety(
  text: string,
  intent: AgentIntent,
  decision: RouterDecision,
): RouterDecision {
  const clinical = evaluateClinicalSafety(text, intent);

  if (clinical.category === "general_info") {
    return decision;
  }

  return {
    ...decision,
    policyAction: CLINICAL_ACTION_MAP[clinical.category],
    safetyLevel: CLINICAL_SAFETY_MAP[clinical.category],
    riskFlags: {
      hasEmergencyKeywords: decision.riskFlags?.hasEmergencyKeywords ?? false,
      hasClinicalRisk: true,
      hasPIIExposure: decision.riskFlags?.hasPIIExposure ?? false,
      hasPromptInjection: decision.riskFlags?.hasPromptInjection ?? false,
      needsEscalation: Boolean(clinical.escalate || decision.riskFlags?.needsEscalation),
    },
  };
}

export function evaluatePolicy(
  text: string,
  intent: AgentIntent,
  riskFlags: RiskFlags,
): PolicyDecision {
  const reasons: string[] = [];
  const responseConstraints: string[] = [];

  const injection = scanPromptInjection(text);
  if (injection.detected) {
    reasons.push(`Prompt injection detected: ${injection.patterns.join(", ")}`);
    if (injection.severity === "high") {
      return {
        action: "block",
        safetyLevel: "blocked",
        reasons,
        responseConstraints: ["no_follow_user_instructions", "safe_fallback"],
      };
    }
    responseConstraints.push("ignore_injected_instruction");
  }

  if (riskFlags.needsEscalation) {
    reasons.push("Escalation required");
    if (riskFlags.hasEmergencyKeywords || riskFlags.hasClinicalRisk) {
      return {
        action: "handoff",
        safetyLevel: "caution",
        reasons: [...reasons, ...(riskFlags.hasEmergencyKeywords ? ["Emergency keywords detected"] : []),
          ...(riskFlags.hasClinicalRisk ? ["Clinical risk detected"] : [])],
        responseConstraints: ["validate_before_sending", "add_disclaimer"],
      };
    }
  }

  if (intent === "queja") {
    return {
      action: "constrain",
      safetyLevel: "caution",
      reasons: ["Complaint handling"],
      responseConstraints: ["no_defensive_tone", "acknowledge_first", "offer_escalation"],
    };
  }

  if (intent === "hablar_humano") {
    return {
      action: "handoff",
      safetyLevel: "safe",
      reasons: ["User requested human"],
      responseConstraints: ["offer_handoff", "acknowledge"],
    };
  }

  if (riskFlags.hasPIIExposure) {
    responseConstraints.push("mask_pii_in_response", "do_not_repeat_pii");
    reasons.push("PII detected in input");
  }

  const clinical = evaluateClinicalSafety(text, intent);
  if (clinical.category !== "general_info") {
    return {
      action: CLINICAL_ACTION_MAP[clinical.category],
      safetyLevel: CLINICAL_SAFETY_MAP[clinical.category],
      reasons: [...reasons, `Clinical safety: ${clinical.category}`],
      responseConstraints: clinical.forbiddenClaims,
    };
  }

  return {
    action: "allow",
    safetyLevel: "safe",
    reasons,
    responseConstraints,
  };
}
