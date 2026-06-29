export type FunnelStage =
  | "unknown"
  | "new_lead"
  | "exploring_services"
  | "asking_price"
  | "considering"
  | "ready_to_book"
  | "collecting_data"
  | "awaiting_payment"
  | "booked"
  | "post_booking"
  | "complaint"
  | "handoff";

export type NextBestAction =
  | "ask_city"
  | "ask_service_interest"
  | "quote_price"
  | "explain_service"
  | "ask_booking_date"
  | "ask_contact_data"
  | "request_payment_proof"
  | "escalate_to_elkin"
  | "answer_and_offer_booking"
  | "clarify_ambiguous_request"
  | "safe_medical_handoff"
  | "handle_objection";

export interface ConversationPlan {
  goal:
    | "answer_question"
    | "collect_missing_info"
    | "move_to_booking"
    | "handle_objection"
    | "provide_reassurance"
    | "handoff"
    | "safe_refusal"
    | "clarify";
  nextBestAction: NextBestAction;
  requiredFields: string[];
  avoid: string[];
  responseBrief: string;
}
