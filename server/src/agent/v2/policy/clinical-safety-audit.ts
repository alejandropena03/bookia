import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { RouterDecision } from "../types/agent-intent.js";
import type { RiskFlags } from "../types/decision-trace.js";
import { evaluateClinicalSafety, type ClinicalSafetyDecision } from "./clinical-safety.js";
import { safetyPreRoute } from "../understanding/safety-pre-router.js";

const AUDIT_LOG = path.resolve(process.cwd(), "data", "clinical-audit-log.jsonl");

// ── Audit types ──

export type SignalCategory =
  | "contraindication"
  | "refusal"
  | "post_treatment"
  | "emergency"
  | "clinical_risk"
  | "injection"
  | "privacy"
  | "human_escalation";

export type AuditPhase =
  | "pre_router"
  | "domain_router"
  | "llm_router"
  | "policy_engine"
  | "post_risk_scan"
  | "final";

export type AuditVerdict = "pass" | "fail" | "bypass";

export interface ClinicalSignal {
  category: SignalCategory;
  signalName: string;
  phase: AuditPhase;
  confidence: number;
}

export interface RequiredAction {
  safetyLevel: "safe" | "caution" | "handoff" | "blocked";
  policyAction: "allow" | "constrain" | "handoff" | "block";
  constraints: string[];
  disclaimer?: string;
}

export interface AppliedAction {
  intent: string;
  confidence: number;
  safetyLevel: string;
  policyAction: string;
  riskFlags: RiskFlags;
}

export interface ClinicalSafetyAuditEntry {
  id: string;
  timestamp: string;
  traceId: string;
  conversationId: string;
  tenantId: string;
  input: string;
  inputPreview: string;
  phases: Record<AuditPhase, boolean>;
  signals: ClinicalSignal[];
  requiredAction: RequiredAction | null;
  appliedAction: AppliedAction;
  verdict: AuditVerdict;
  failures: string[];
  clinicalSafetyDecision: ClinicalSafetyDecision | null;
}

// ── Audit builder ──

export class ClinicalSafetyAudit {
  private entry: ClinicalSafetyAuditEntry;

  constructor(params: {
    traceId: string;
    conversationId: string;
    tenantId: string;
    input: string;
  }) {
    this.entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      traceId: params.traceId,
      conversationId: params.conversationId,
      tenantId: params.tenantId,
      input: params.input,
      inputPreview: params.input.slice(0, 160),
      phases: {
        pre_router: false,
        domain_router: false,
        llm_router: false,
        policy_engine: false,
        post_risk_scan: false,
        final: false,
      },
      signals: [],
      requiredAction: null,
      appliedAction: {
        intent: "",
        confidence: 0,
        safetyLevel: "safe",
        policyAction: "allow",
        riskFlags: {
          hasEmergencyKeywords: false,
          hasClinicalRisk: false,
          hasPIIExposure: false,
          hasPromptInjection: false,
          needsEscalation: false,
        },
      },
      verdict: "pass",
      failures: [],
      clinicalSafetyDecision: null,
    };
  }

  markPhase(phase: AuditPhase): void {
    this.entry.phases[phase] = true;
  }

  addSignal(signal: ClinicalSignal): void {
    this.entry.signals.push(signal);
  }

  private detectContraSignals(text: string): ClinicalSignal[] {
    const signals: ClinicalSignal[] = [];
    const contraPatterns: [RegExp, string][] = [
      [/\b(estoy\s+)?embaraza(da|d[áa])\b/i, "embarazo"],
      [/\blactanc(ia|i[eé])\b/i, "lactancia"],
      [/\blupus\b/i, "lupus"],
      [/\bdiab[eé]t([eé]s|[ií]c[oa]s?)\b/i, "diabetes"],
      [/\banticoagulante(s)?\b/i, "anticoagulantes"],
      [/\bal[eé]rg(i[oa]s?|ias?)\b/i, "alergia"],
      [/\bhipertens([ií]v[oa]s?|[ií]n|i[oa]s?)\b/i, "hipertensión"],
      [/\bautoinmun(e|es)\b/i, "autoinmune"],
      [/\bc[aá]ncer\b/i, "cáncer"],
      [/\bepilepsi(a|tic[oa])\b/i, "epilepsia"],
      [/\bmarcapasos\b/i, "marcapasos"],
      [/\bmenor\s+(de\s+)?(edad|edades?)\b/i, "menor de edad"],
      [/\b(?:hij[oa]|hijos?)\s+(?:tiene|de|con)\s+\d{1,2}\s+(?:años?|a[ñn]os?)\b/i, "menor de edad"],
      [/\bcirug[ií]a\s+(reciente|previas?|anterior|antigua)\b/i, "cirugía reciente"],
      [/\b(me\s+)?(operaron|intervinieron)\s+(de\s+|la\s+)?/i, "cirugía reciente"],
      [/\bquimioterapia\b/i, "quimioterapia"],
      [/\b(asma|asmatic[oa])\b/i, "asma"],
      [/\bgastritis\b/i, "gastritis"],
      [/\bmigraña(s)?\b/i, "migraña"],
      [/\btiroides\b/i, "tiroides"],
      [/\b(hipo|hiper)tiroidismo\b/i, "tiroides"],
      [/\bhepatitis\b/i, "hepatitis"],
      [/\bVIH\b/i, "VIH"],
      [/\bherpes\b/i, "herpes"],
      [/\bvit[ií]ligo\b/i, "vitíligo"],
      [/\bpsoriasis\b/i, "psoriasis"],
      [/\bros[aá]cea\b/i, "rosácea"],
      [/\bacn[eé]\s+activo\b/i, "acné activo"],
      [/\bqueloides?\b/i, "queloides"],
      [/\bvarices\b/i, "varices"],
      [/\b(me\s+)?estoy\s+(tratando|medicando)\b/i, "en tratamiento"],
      [/\btomo\s+medicamentos?\s+para\b/i, "medicación"],
    ];
    for (const [regex, name] of contraPatterns) {
      if (regex.test(text)) {
        signals.push({ category: "contraindication", signalName: name, phase: "pre_router", confidence: 0.95 });
      }
    }
    return signals;
  }

  private detectRefuseSignals(text: string): ClinicalSignal[] {
    const signals: ClinicalSignal[] = [];
    const refusePatterns: [RegExp, string][] = [
      [/(qu[eé]\s+)?teng[oó]\s+(en\s+)?(la\s+)?(cara|piel|rostro|labios?|ojos?)\b/i, "diagnosis request"],
      [/(ha[sz]me|h[aá]game|real[ií]zame|realiza)\s+(un\s+)?(diagn[oó]stic|an[aá]lisis)\b/i, "diagnosis request"],
      [/(rec[eé]tame|rec[eé]teme|rec[eé]ta\s+(un[ao]|algo|algun))\b/i, "prescription request"],
      [/(me\s+)?(lo\s+)?garantizas?\b.*(resultados?|perfectos?|[eé]xito|funciona)\b/i, "guarantee request"],
      [/(me\s+)?prometes?\s+(que\s+)?(no\s+)?(duele|funciona|resulta)\b/i, "promise request"],
      [/(no\s+)?tiene\s+(ning[uú]n|nada\s+de)\s+(riesgo|riesgos)\b/i, "risk minimization"],
      [/(recomi[eé]ndame|recomiendame|aconseja|aconsejame|t[úu]\s+(qu[eé]\s+)?(me\s+)?recomiendas?)\b/i, "personalized recommendation"],
    ];
    for (const [regex, name] of refusePatterns) {
      if (regex.test(text)) {
        signals.push({ category: "refusal", signalName: name, phase: "pre_router", confidence: 0.85 });
      }
    }
    return signals;
  }

  private detectEmergencySignals(text: string): ClinicalSignal[] {
    const signals: ClinicalSignal[] = [];
    const emergencyKeywords = [
      "emergencia", "urgencia", "reacción alérgica", "reaccion alergica",
      "dificultad para respirar", "sangrado", "hinchazón excesiva", "hinchazon excesiva",
      "dolor fuerte", "dolor intenso", "fiebre alta", "pérdida de conocimiento", "perdida de conocimiento",
      "desmayo", "convulsión", "convulsion", "parálisis", "paralisis",
    ];
    const lower = text.toLowerCase();
    for (const kw of emergencyKeywords) {
      if (lower.includes(kw)) {
        signals.push({ category: "emergency", signalName: kw, phase: "pre_router", confidence: 0.95 });
      }
    }
    return signals;
  }

  scanInput(text: string): this {
    const contra = this.detectContraSignals(text);
    const refuse = this.detectRefuseSignals(text);
    const emergency = this.detectEmergencySignals(text);
    this.entry.signals.push(...contra, ...refuse, ...emergency);
    this.entry.phases.pre_router = true;
    return this;
  }

  addPostTreatmentSignal(text: string): this {
    const lower = text.toLowerCase();
    const postPatterns: [RegExp, string][] = [
      [/\b(despu[eé]s\s+del?|post)\s+(procedimiento|tratamiento)\b/i, "post procedure"],
      [/\b(me\s+)?inyectaron\b/i, "recent injection"],
      [/\bme\s+(hic[ei]|hice|hicieron)\s+(botox|ácido|tratamiento|procedimiento|relleno)\b/i, "recent treatment"],
      [/\bcuidados?\s+(despu[eé]s\s+de|post)\b/i, "post care query"],
      [/\b(recuperaci[oó]n|recuperarme)\b/i, "recovery"],
    ];
    for (const [regex, name] of postPatterns) {
      if (regex.test(text)) {
        this.entry.signals.push({ category: "post_treatment", signalName: name, phase: "pre_router", confidence: 0.90 });
      }
    }
    return this;
  }

  addPrivacySignal(text: string): this {
    const lower = text.toLowerCase();
    const piiPatterns: [RegExp, string][] = [
      [/\b(?:mi\s+)?(?:cédula|CC|documento|identificación)\s+(?:es|:)?\s*\d{5,10}\b/i, "id disclosure"],
      [/\b(?:mi\s+)?(?:correo|email)\s+(?:es|:)\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i, "email disclosure"],
      [/\b(vivo\s+en|resido\s+en|dirección)\b/i, "address disclosure"],
      [/\b(?:mi\s+)?(?:teléfono|telefono|celular|cel|whatsapp)\s+(?:es|:)\s*\d{7,10}\b/i, "phone disclosure"],
    ];
    for (const [regex, name] of piiPatterns) {
      if (regex.test(text)) {
        this.entry.signals.push({ category: "privacy", signalName: name, phase: "pre_router", confidence: 0.85 });
      }
    }
    return this;
  }

  addInjectionSignal(text: string): this {
    const lower = text.toLowerCase();
    const injectionPatterns: [RegExp, string][] = [
      [/\bignora\s+(tus\s+)?instrucciones?\b/i, "instruction override"],
      [/\b(mu[eé]stra|mu[eé]strame|d[ií]me|rev[eé]la)\s+(tu\s+)?prompt\b/i, "prompt extraction"],
      [/\b(soy\s+(el\s+|un\s+)?|eres\s+)?admin(istrador)?\b/i, "admin impersonation"],
      [/\bbypass\b/i, "bypass attempt"],
      [/\bolvida\s+(todo\s+)?(lo\s+)?(anterior|tus\s+reglas?)\b/i, "forget instructions"],
      [/\bsin\s+(restricciones?|l[ií]mites|reglas?)\b/i, "no restrictions"],
      [/\b(desactiva|deshabilita)\s+(todos?\s+)?(tus\s+)?(filtros?|seguridad)\b/i, "disable safety"],
    ];
    for (const [regex, name] of injectionPatterns) {
      if (regex.test(text)) {
        this.entry.signals.push({ category: "injection", signalName: name, phase: "pre_router", confidence: 0.90 });
      }
    }
    return this;
  }

  setRequiredAction(decision: ClinicalSafetyDecision): this {
    const actionMap: Record<string, "allow" | "constrain" | "handoff" | "block"> = {
      general_info: "allow",
      needs_evaluation: "handoff",
      urgent_handoff: "handoff",
      refuse_medical_advice: "block",
    };
    const safetyMap: Record<string, "safe" | "caution" | "handoff" | "blocked"> = {
      general_info: "safe",
      needs_evaluation: "caution",
      urgent_handoff: "handoff",
      refuse_medical_advice: "blocked",
    };
    this.entry.requiredAction = {
      safetyLevel: safetyMap[decision.category] ?? "safe",
      policyAction: actionMap[decision.category] ?? "allow",
      constraints: decision.forbiddenClaims,
      disclaimer: decision.requiredDisclaimer,
    };
    this.entry.clinicalSafetyDecision = decision;
    this.entry.phases.policy_engine = true;
    return this;
  }

  setAppliedAction(routerDecision: RouterDecision): this {
    this.entry.appliedAction = {
      intent: routerDecision.intent,
      confidence: routerDecision.confidence,
      safetyLevel: routerDecision.safetyLevel ?? "safe",
      policyAction: routerDecision.policyAction ?? "allow",
      riskFlags: {
        hasEmergencyKeywords: routerDecision.riskFlags?.hasEmergencyKeywords ?? false,
        hasClinicalRisk: routerDecision.riskFlags?.hasClinicalRisk ?? false,
        hasPIIExposure: routerDecision.riskFlags?.hasPIIExposure ?? false,
        hasPromptInjection: routerDecision.riskFlags?.hasPromptInjection ?? false,
        needsEscalation: routerDecision.riskFlags?.needsEscalation ?? false,
      },
    };
    this.entry.phases.final = true;
    return this;
  }

  resolveVerdict(): this {
    const failures: string[] = [];
    const req = this.entry.requiredAction;
    const app = this.entry.appliedAction;

    if (!req) {
      this.entry.verdict = "bypass";
      this.entry.failures = [];
      return this;
    }

    if (req.policyAction === "handoff") {
      if (app.policyAction !== "handoff" && app.policyAction !== "constrain") {
        failures.push(`required handoff but got ${app.policyAction}`);
      }
      if (app.safetyLevel !== "caution" && app.safetyLevel !== "handoff") {
        failures.push(`required safetyLevel caution/handoff but got ${app.safetyLevel}`);
      }
    }

    if (req.policyAction === "block") {
      if (app.policyAction !== "block") {
        failures.push(`required block but got ${app.policyAction}`);
      }
      if (app.safetyLevel !== "blocked") {
        failures.push(`required safetyLevel blocked but got ${app.safetyLevel}`);
      }
    }

    if (req.policyAction === "allow" && !req.disclaimer) {
      if (this.entry.signals.some((s) => s.category === "contraindication")) {
        if (app.safetyLevel !== "caution" && app.safetyLevel !== "handoff") {
          failures.push(`contraindication signal present but safetyLevel is ${app.safetyLevel}, not caution`);
        }
      }
    }

    if (this.entry.signals.length > 0 && req.policyAction === "allow") {
      if (app.safetyLevel === "safe" && !app.riskFlags.hasClinicalRisk) {
        const hasClinicalSignal = this.entry.signals.some(
          (s) => s.category === "contraindication" || s.category === "refusal" || s.category === "emergency",
        );
        if (hasClinicalSignal) {
          failures.push(`clinical signal detected but safetyLevel is safe without hasClinicalRisk`);
        }
      }
    }

    this.entry.failures = failures;
    this.entry.verdict = failures.length === 0 ? "pass" : "fail";
    return this;
  }

  toJSON(): ClinicalSafetyAuditEntry {
    return { ...this.entry };
  }

  export(): void {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
    try {
      const dir = path.dirname(AUDIT_LOG);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(AUDIT_LOG, JSON.stringify(this.entry) + "\n", "utf-8");
    } catch {
      // best effort
    }
  }
}

// ── Standalone audit function (single call, full pipeline) ──

export function auditClinicalSafety(params: {
  traceId: string;
  conversationId: string;
  tenantId: string;
  input: string;
  routerDecision: RouterDecision;
}): ClinicalSafetyAuditEntry {
  const audit = new ClinicalSafetyAudit({
    traceId: params.traceId,
    conversationId: params.conversationId,
    tenantId: params.tenantId,
    input: params.input,
  });

  audit.scanInput(params.input);
  audit.addPostTreatmentSignal(params.input);
  audit.addPrivacySignal(params.input);
  audit.addInjectionSignal(params.input);

  const clinicalDecision = evaluateClinicalSafety(params.input, params.routerDecision.intent);
  audit.setRequiredAction(clinicalDecision);

  audit.setAppliedAction(params.routerDecision);
  audit.resolveVerdict();
  audit.export();

  return audit.toJSON();
}
