export type ToneProfile =
  | "warm_brief"
  | "warm_detailed"
  | "reassuring"
  | "professional_clinical"
  | "apologetic"
  | "direct_booking"
  | "clarifying";

export interface ResponseContract {
  mustSay: string[];
  maySay: string[];
  mustNotSay: string[];
  tone: ToneProfile;
  maxLength: number;
  includeCTA: boolean;
  requireDisclosure?: boolean;
  requireDisclaimer?: boolean;
}
