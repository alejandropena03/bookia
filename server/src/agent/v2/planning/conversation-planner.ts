import type { ConversationPlan, FunnelStage, NextBestAction } from "../types/funnel.js";

export function createPlan(
  funnelStage: FunnelStage,
  intent: string,
  hasMissingInfo: boolean,
  hasObjection: boolean,
  needsEscalation: boolean,
): ConversationPlan {
  if (needsEscalation) {
    return {
      goal: "handoff",
      nextBestAction: "escalate_to_elkin",
      requiredFields: [],
      avoid: ["minimize complaint", "be defensive"],
      responseBrief: "Escalate to human supervisor. Acknowledge concern first.",
    };
  }

  if (intent === "queja") {
    return {
      goal: "handle_objection",
      nextBestAction: "escalate_to_elkin",
      requiredFields: [],
      avoid: ["be defensive", "promise results"],
      responseBrief: "Acknowledge frustration. Offer escalation to Elkin.",
    };
  }

  if (intent === "hablar_humano") {
    return {
      goal: "handoff",
      nextBestAction: "escalate_to_elkin",
      requiredFields: [],
      avoid: [],
      responseBrief: "User requested human. Offer handoff to Elkin.",
    };
  }

  if (hasObjection) {
    return {
      goal: "handle_objection",
      nextBestAction: "handle_objection",
      requiredFields: [],
      avoid: ["be pushy", "ignore the objection"],
      responseBrief: "Address the specific objection with empathy and value.",
    };
  }

  if (hasMissingInfo && funnelStage === "ready_to_book") {
    return {
      goal: "collect_missing_info",
      nextBestAction: "ask_contact_data",
      requiredFields: ["name", "phone", "email"],
      avoid: ["ask everything at once"],
      responseBrief: "Ask for contact info needed to book. One field at a time.",
    };
  }

  if (funnelStage === "asking_price" || intent === "precio") {
    return {
      goal: "answer_question",
      nextBestAction: "quote_price",
      requiredFields: ["city"],
      avoid: ["hide prices", "be vague"],
      responseBrief: "Quote the price for the requested service. Ask city if unknown.",
    };
  }

  if (funnelStage === "new_lead") {
    return {
      goal: "answer_question",
      nextBestAction: "ask_city",
      requiredFields: ["city"],
      avoid: ["overwhelm with options"],
      responseBrief: "Greet warmly. Ask for their city to personalize.",
    };
  }

  if (intent === "dudas_medicas") {
    return {
      goal: "answer_question",
      nextBestAction: "answer_and_offer_booking",
      requiredFields: [],
      avoid: ["diagnose", "promise results"],
      responseBrief: "Answer the medical question with authorized info. Offer booking.",
    };
  }

  return {
    goal: "answer_question",
    nextBestAction: "clarify_ambiguous_request",
    requiredFields: [],
    avoid: [],
    responseBrief: "Answer the user's question naturally.",
  };
}
