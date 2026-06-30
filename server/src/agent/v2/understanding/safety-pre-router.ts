import type { RouterDecision } from "../types/agent-intent.js";

const HUMAN_SIGNALS: [RegExp, string][] = [
  [/\bhablar\s+con\b/i, "solicita hablar con alguien"],
  [/\b(asesor|asesora)\b/i, "pide asesor"],
  [/\b(con\s+una\s+)?persona\s+(humana|real|f[ií]sica)\b/i, "pide persona humana"],
  [/\b(quiero|necesito|busco|hablar\s+con|ati[eé]ndame|comun[ií]queme)\s+(una|la|con|a)\s+persona\b/i, "pide persona humana"],
  [/\bpersona\s+(que\s+me|que\s+lo|que\s+te|para)\b/i, "pide persona humana"],
  [/\bhumano\b/i, "pide ser atendido por humano"],
  [/\bcomunica(me)?\s+con\b/i, "pide comunicación con persona"],
  [/\b(atiéndame|atender)\s+(una\s+)?persona\b/i, "pide atención humana"],
  [/\bme\s+(llama|contacte)\s+(alguien|un)\b/i, "pide que lo contacten"],
  [/\b(quiero|necesito)\s+(un|una)\s+asesor\b/i, "solicita asesor"],
  [/\b(con|hablar)\s+elkin\b/i, "pide hablar con Elkin"],
  [/\b(con|hablar)\s+carlos\b/i, "pide hablar con Carlos"],
  [/\bgerente\b/i, "pide gerente"],
  [/\bno\s+quiero\s+(hablar\s+con\s+)?(un\s+)?(bot|robot|máquina|automat|ia)\b/i, "rechaza bot"],
  [/\bp(ó|o)ngame\s+con\b/i, "pide ser transferido"],
  [/\boperador\b/i, "pide operador"],
  [/\btransferir\s+(a|a un|a una)\s+(agente|persona|humano|asesor)\b/i, "pide transferencia"],
  [/\b(quiero|necesito)\s+ayuda\s+humana\b/i, "pide ayuda humana"],
  [/\bcontactarme\s+con\b/i, "pide contacto personal"],
  [/\bcomuníqueme\s+con\b/i, "pide comunicación"],
  [/\bpase\s+(a|con|al)\s+(un\s+)?(asesor|agente|operador|persona)\b/i, "pide transferencia"],
  [/\bescalar\b/i, "pide escalar"],
  [/\bspeak\s+to\s+(a\s+)?(person|human|agent)\b/i, "english: request human"],
  [/\btalk\s+to\s+(a\s+)?(person|human|agent)\b/i, "english: talk to human"],
  [/\bhuman\s+(agent|support|representative)\b/i, "english: human agent"],
];

const CONTRA_SIGNALS: [RegExp, string][] = [
  [/\b(estoy\s+)?embaraza(da|d[aá])\b/i, "embarazo"],
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
  [/\bantibiótico(s)?\b/i, "antibióticos"],
  [/\bmenor\s+(de\s+)?(edad|edades?)\b/i, "menor de edad"],
  [/\b(?:hij[oa]|hijos?)\s+(?:tiene|de|con)\s+\d{1,2}\s+(?:años|años?|a[ñn]os?)\b/i, "menor de edad"],
  [/\b(una\s+)?enfermeda(d|d\s+autoinmune)\b/i, "enfermedad"],
  [/\bcirug[ií]a\s+(reciente|previas?|anterior|antigua)\b/i, "cirugía reciente"],
  [/\boperad[oa]s?\s+(de|hace|recientemente)\b/i, "cirugía reciente"],
  [/\b(me\s+)?(operaron|intervinieron)\s+(de\s+|la\s+)?/i, "cirugía reciente"],
  [/\bmedicamentos?\s+(delicados?|controlados?|fuertes?)\b/i, "medicamentos delicados"],
  [/\bquimioterapia\b/i, "quimioterapia"],
  [/\btratamiento\s+m[eé]dico\b/i, "tratamiento médico"],
  [/\b(problema|condici[oó]n|enfermedad|trastorno)\s+(card[ií]ac[oa]|vascular|circulatorio)\b/i, "cardíaco"],
  [/\bpresi[oó]n\s+(arterial|alta|baja)\b/i, "presión arterial"],
  [/\b(asma|asmatic[oa])\b/i, "asma"],
  [/\bgastritis\b/i, "gastritis"],
  [/\bmigraña(s)?\b/i, "migraña"],
  [/\bpsiqui[aá]tric[oa]\b/i, "tratamiento psiquiátrico"],
  [/\btiroides\b/i, "tiroides"],
  [/\b(hipo|hiper)tiroidismo\b/i, "tiroides"],
  [/\benfermeda(d|d\s+)(renal|hep[aá]tica|card[ií]aca|pulmonar|cr[oó]nica)\b/i, "enfermedad crónica"],
  [/\binsuficiencia\s+(renal|hep[aá]tica)\b/i, "insuficiencia orgánica"],
  [/\bhepatitis\b/i, "hepatitis"],
  [/\bVIH\b/i, "VIH"],
  [/\bherpes\b/i, "herpes"],
  [/\bvit[ií]ligo\b/i, "vitíligo"],
  [/\bpsoriasis\b/i, "psoriasis"],
  [/\bros[aá]cea\b/i, "rosácea"],
  [/\bacn[eé]\s+activo\b/i, "acné activo"],
  [/\bqueloides?\b/i, "queloides"],
  [/\bcicatri(ces|z)\s+/i, "cicatriz"],
  [/\bvarices\b/i, "varices"],
  [/\b(me\s+)?estoy\s+(tratando|medicando)\b/i, "en tratamiento"],
  [/\btomo\s+medicamentos?\s+para\b/i, "medicación"],
  [/\b(interacci[oó]n|interact[uú]a)\s+(con\s+)?(mis\s+)?medicamentos?\b/i, "medicación"],
];

const REFUSE_SIGNALS: [RegExp, string][] = [
  [/(qu[eé]\s+)?teng[oó]\s+(en\s+)?(la\s+)?(cara|piel|rostro|labios?|ojos?|piernas?|brazos?)\b/i, "diagnosis request body part"],
  [/(ha[sz]me|h[aá]game|real[ií]zame|realiza)\s+(un\s+)?(diagn[oó]stic|an[aá]lisis|evaluaci[oó]n|ex[aá]men)\b/i, "diagnosis request"],
  [/(rec[eé]tame|rec[eé]teme|rec[eé]ta\s+(un[ao]|algo|algun)|recetame|receteme)\b/i, "prescription request"],
  [/(qu[eé]\s+)?medicamento\s+(me\s+)?(recomiendas?|recetan|sugieres\s+|puedo\s+tomar)\b/i, "medication recommendation"],
  [/(me\s+)?(lo\s+)?garantizas?\b.*(resultados?|perfectos?|[eé]xito|funciona|seguro)?/i, "guarantee request"],
  [/(me\s+)?prometes?\s+(que\s+)?(no\s+)?(duele|funciona|resulta|sirve|pasa|doler[aá])\b/i, "promise request"],
  [/(no\s+)?tiene\s+(ning[uú]n|nada\s+de)\s+(riesgo|riesgos|riesgo\s+alguno)\b/i, "risk minimization"],
  [/(recomi[eé]ndame|recomiendame|aconseja|a[có]onsejame|aconsejame|t[úu]\s+(qu[eé]\s+)?(me\s+)?recomiendas?)\b/i, "personalized recommendation"],
  [/(me\s+lo\s+)?recomiendas?\s+(a\s+)?(m[ií]|m[ií]\s+misma|mi\s+persona)\b/i, "personalized recommendation"],
  [/(soy\s+|eres\s+|son\s+)?(al[eé]rgic[oa]\s+(a|con))\b.*(no\s+)?(s[eé]|sabemos?|estoy\s+seguro)\b/i, "allergy uncertainty"],
];

const POST_SIGNALS: [RegExp, string][] = [
  [/\b(despu[eé]s\s+del? procedimiento|despu[eé]s\s+del? tratamiento)\b/i, "después de procedimiento"],
  [/\b(me\s+)?qued[oó].+(inflamad[oa]|morad[oa]|hinchad[oa]|roj[oa]|abultad[oa]|asim[eé]tric[oa]|doloros[oa]|sensibl[eé])\b/i, "efecto post"],
  [/\b(me\s+)?(duele|dolor)\s+(la\s+)?(zona|á[áa]rea|regi[óo]n|herida)\b/i, "dolor post específico"],
  [/\b(me\s+)?sali[oó]\s+(una\s+)?(bola|bolita|protuberancia|bulto|roncha)\b/i, "reacción post"],
  [/\b(infecci[oó]n|hinchaz[oó]n|inflamaci[oó]n)\b/i, "complicación post"],
  [/\b(me\s+)?inyectaron\b/i, "inyección reciente"],
  [/\bme\s+(hic[ei]|hice|hicieron)\s+(botox|ácido|tratamiento|procedimiento|relleno)\b/i, "tratamiento reciente"],
  [/\bcuidados?\s+(despu[eé]s\s+de|post|para\s+despu[eé]s)\b/i, "consulta cuidados"],
  [/\b(recuperaci[oó]n|recuperarme|recuperar)\b/i, "recuperación"],
  [/\b(despu[eé]s\s+de\s+)(haberlo|hac[eé]rmelo|aplicarlo|ponérmelo|ponermelo)\b/i, "post aplicación"],
  [/\b(me\s+)?(aplicaron|pusieron|inyectaron)\b.*(y\s+ahora|pero|ahora)\b/i, "complicación reciente"],
  [/\b(me\s+)?retiraron\b.*(puntos|suturas|hilos)\b/i, "retiro de puntos/hilos"],
  [/\b(reacci[oó]n|tuve|tengo)\s+al[eé]rgic[oa]\b/i, "reacción alérgica post"],
  [/\bcomplicaci[oó]n(es)?\b/i, "complicaciones"],
  [/\b(no|a[uú]n)\s+(veo|noto|observo)\s+(resultados|mejora|cambio|nada)\b/i, "sin resultados"],
  [/\b(me|se)\s+(arrepiento|arrepiente)\b/i, "arrepentimiento"],
  [/\bmal\s+(despu[eé]s\s+de|resultado|estar)\b/i, "malestar post"],
  [/\breacci[oó]n\s+adversa\b/i, "reacción adversa"],
  [/\bsali[oó]\s+mal\b/i, "complicación"],
  [/\bmoret[oó]n(es)?\b/i, "hematoma"],
  [/\bhematoma(s)?\b/i, "hematoma"],
  [/\bcu[aá]ndo\s+(veo|noto|empiezo|puedo\s+ver|voy\s+a\s+ver)\s+(resultados|el\s+resultado|mejora|efecto)\b/i, "expectativa resultados"],
  [/\bcu[aá]nto\s+(tarda|dura|demora)\s+(la\s+)?(recuperaci[oó]n|resultado|efecto|hinchaz[oó]n|inflamaci[oó]n)\b/i, "expectativa recuperación"],
  [/\b(me\s+)?pusieron\s+(botox|ácido|relleno|lipasa|vitonas|tratamiento)\b/i, "tratamiento reciente"],
];

const INJECTION_SIGNALS: [RegExp, string][] = [
  [/\bignora\s+(tus\s+)?instrucciones?\b/i, "instruct override"],
  [/\b(mu[eé]stra\b|mu[eé]strame|d[ií]me|rev[eé]la|enseñ[ao]|enseñ[ao]me)\s+(tu\s+)?prompt\b/i, "prompt extraction"],
  [/\b(system|sistema)\s+prompt\b/i, "system prompt request"],
  [/\bdeveloper\s+message\b/i, "developer message request"],
  [/\b(soy\s+(el\s+|un\s+)?|eres\s+)?admin(istrador[aos]?)?\b/i, "admin impersonation"],
  [/\bbypass\b/i, "bypass attempt"],
  [/\b(dame|d[ií]me)\s+(tu\s+|la\s+)?(api\s*key|contraseña|password|token|secreto)\b/i, "credential extraction"],
  [/\b(cu[aá]l\s+es\s+|dime\s+|dame\s+|quiero\s+)?(la\s+)?(contraseña|password|clave|credencial)\s+(de\s+(la\s+)?)?(base\s+de\s+datos|db|sistema|admin|servidor|acceso)\b/i, "credential extraction"],
  [/\b(necesito|busco|quiero|dame|d[ií]me)\s+(las\s+)?(credenciales|datos\s+de\s+acceso|información\s+de\s+acceso)\s+(al|del|para|de)\s+(servidor|sistema|admin|panel|base\s+de\s+datos)\b/i, "credential extraction"],
  [/\b(necesito|busco|quiero|dame|d[ií]me)\s+(las\s+)?credenciales\s+de\s+acceso\s+(al|del|para|de)\s+(servidor|sistema|admin|panel|base\s+de\s+datos)\b/i, "credential extraction"],
  [/\bdame\s+datos?\s+de\s+pacientes?\b/i, "patient data request"],
  [/\b(ahora\s+eres|act[úu]a\s+como|desde\s+ahora\s+eres)\s+(DAN|ChatGPT|asistente\s+sin\s+restricciones)\b/i, "role escape"],
  [/\bolvida\s+(todo\s+)?(lo\s+)?(anterior|tus\s+reglas?|tus\s+instrucciones?)\b/i, "forget instructions"],
  [/\brepite\s+(todo\s+)?(lo\s+que\s+)?(te\s+)?(dije|he\s+dicho|dijeron)\b/i, "context extraction"],
  [/\b(c[oó]mo\s+)?(puedo\s+)?(hacer\s+una\s+|hago\s+una\s+)?(inyecci[óo]n\s+sql|sql\s+injection|hackear|explotar)\b/i, "exploit attempt"],
  [/\b(libera|ignora|olvida|salta)\s+(tus\s+)?(reglas?|restricciones?|l[ií]mites|normas?|protocolos?)\b/i, "rule bypass"],
  [/\bsin\s+(restricciones?|l[ií]mites|reglas?|normas?|censura)\b/i, "no restrictions"],
  [/\b(resetea|reinicia|borra)\s+(el\s+)?(contexto|historial|conversaci[oó]n|todo)\b/i, "reset attempt"],
  [/\b(dame|d[ií]me)\s+(tu\s+)?(informaci[oó]n|data|datos)\s+(de\s+)?(privada|confidencial|pacientes?|clientes?)\b/i, "data extraction"],
  [/\bc[oó]mo\s+(hago\s+para|puedo)\s+(hackear|acceder|obtener)\s+(la\s+)?(base\s+de\s+datos|db|admin|panel)\b/i, "hack attempt"],
  [/\b(necesito|quiero)\s+(la\s+)?base\s+de\s+datos\b/i, "db access"],
  [/\b(dame|d[ií]me)\s+(todos\s+)?los\s+(nombres|tel[eé]fonos|datos|contactos)\s+de\s+(tus\s+)?(pacientes?|clientes?|usuarios?)\b/i, "mass data extraction"],
  [/\b(quiero\s+)?ver\s+(las\s+)?(historias?\s+cl[ií]nicas?|fotos?|resultados?)\s+de\s+(otr[oa]s?\s+)?(pacientes?|clientes?)\b/i, "unauthorized access"],
  [/\b(d[ií]me|cu[eé]ntame)\s+(cu[aá]l\s+es\s+|la\s+|el\s+).*(prompt|api\s*key|contraseña|token\b|secreto)\b/i, "credential extraction"],
  [/\bolvida\s+(tod[oa]s?\s+)?(tus\s+)?(reglas?|instrucciones?|normas?|pol[ií]ticas?|protocolos?)\b/i, "forget rules"],
  [/\b(ignora|olvida|descarta|deja\s+de\s+lado)\s+(lo\s+que\s+te\s+(dije|indiqué|pedí|conté)|mis?\s+(instrucciones?|indicaciones?|mensajes?\s+anteriores?))\b/i, "ignore prior context injection"],
  [/\bahora\s+eres?\s+(un[ao]?\s+)?(asistente|bot|ia|robot|chatbot|agente)\s+(de|para|que)\b/i, "persona override injection"],
  [/\b(entra|ponte|pasa)\s+(en\s+)?modo\s+(DAN|asistente|sin\s+restricciones|libre|oscuro)\b/i, "role escape mode"],
  [/\b(imprime|muestra|publica|revela|revele)\s+(todas\s+(las\s+|tus\s+|mis\s+)?|tus\s+|las\s+|mis\s+)?(reglas?|normas?|instrucciones?|pol[ií]ticas?|protocolos?|seguridad)\b/i, "rule extraction"],
  [/\b(mostrar|listar|enlistar|lista|listame)\s+(todas\s+)?(las\s+)?(instrucciones?|reglas?|comandos?)\b/i, "instruction listing"],
  [/\b(comando\s+de\s+)?super(u)?suario\b/i, "superuser command"],
  [/\b(soy\s+el\s+desarrollador|soy\s+el\s+dueñ[oa]|eres\s+el\s+desarrollador)\b/i, "owner/developer impersonation"],
  [/\b(soy\s+el\s+(creador|programador|administrador|admin))\b/i, "creator impersonation"],
  [/\b(desactiva|deshabilita|apaga|suspende)\s+(todos?\s+)?(tus\s+)?(filtros?|controles?|protocolos?|seguridad|restricciones?|l[ií]mites)\b/i, "disable safety"],
  [/\bmodifica\s+tu\s+comportamiento\b/i, "modify behavior"],
  [/\b(ejecuta|ejecutar|corre|run)\s+(este\s+)?(código|codigo|script|comando)\b/i, "code execution"],
  [/\b(modelo\s+de\s+IA|versión\s+exacta|versi[óo]n\s+exacta)\b/i, "model info extraction"],
  [/\b(repite|repetir|repíteme|repiteme)\s+(la\s+)?(contraseña|password|clave|token)\b/i, "password repeat"],
  [/\b(inventa|fabrica|crea|simula)\s+(un\s+)?(precio|cotización|presupuesto|oferta)\s+(especial|falso|personalizado)\b/i, "fake pricing"],
  [/\b(cita\s+falsa|falsa\s+cita|cita\s+de\s+mentira|reserva\s+falsa)\b/i, "fake booking"],
  [/\b(eres\s+un?\s+)(inútil|inservible)\b|\b(servicio\s+pésimo)\b/i, "insult"],
  // NOTE: capability inquiries like "qué más puedes hacer", "cuáles son tus limitaciones"
  // are legitimate curiosity questions → charla, not injection. They have been moved to the
  // deterministic domain route. Only actual override/escape attempts remain here.
];

const PRIVACY_SIGNALS: [RegExp, string][] = [
  [/\b(?:mi\s+)?(?:número|teléfono|celular|whatsapp|cel)\s+(?:es|:)\s*\d{7,10}\b/i, "phone disclosure"],
  [/\b3\d{9}\b/, "phone number (colombian)"],
  [/\b(?:mi\s+)?(?:cédula|CC|documento|identificación)\s+(?:es|:)?\s*\d{5,10}\b/i, "id disclosure"],
  [/\b(?:mi\s+)?correo\s+(?:es|:)\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i, "email disclosure"],
  [/\b(?:envío|adjunto|te\s+envío)\s+(?:mis\s+)?(?:datos|foto|fotografía|documento|identificación)\b/i, "data submission"],
  [/\b(me\s+llamo|mi\s+nombre\s+(es|:))\b/i, "name disclosure"],
  [/\b(vivo\s+en|resido\s+en|dirección)\b/i, "address disclosure"],
  [/\b(?:toma|tome|tomar|pedir)\s+(?:mis\s+)?(?:datos|foto)\b/i, "photo data request"],
];

const EMERGENCY_KEYWORDS = [
  "emergencia", "urgencia", "reacción alérgica", "reaccion alergica",
  "dificultad para respirar", "sangrado", "hinchazón excesiva", "hinchazon excesiva",
  "dolor fuerte", "fiebre alta", "pérdida de conocimiento", "perdida de conocimiento",
  "desmayo", "convulsión", "convulsion", "parálisis", "paralisis",
];

function matchAny(text: string, signals: [RegExp, string][]): string | null {
  const nfcText = text.normalize('NFC');
  for (const [regex, reason] of signals) {
    if (regex.test(nfcText)) return reason;
  }
  return null;
}

function hasEmergency(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw));
}

function detectPII(text: string): string[] {
  const found: string[] = [];
  const nfcText = text.normalize('NFC');
  const reason = matchAny(nfcText, PRIVACY_SIGNALS);
  if (reason) found.push(reason);
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch && !found.some((f) => f.includes("email"))) found.push("email detected");
  return found;
}

export function hasInjectionSignal(text: string): boolean {
  return INJECTION_SIGNALS.some(([regex]) => regex.test(text.normalize('NFC')));
}

export function safetyPreRoute(text: string): {
  decision: RouterDecision | null;
  riskFlags: {
    hasEmergencyKeywords: boolean;
    hasClinicalRisk: boolean;
    hasPIIExposure: boolean;
    hasPromptInjection: boolean;
    needsEscalation: boolean;
  };
  safetyLevel: "safe" | "caution" | "handoff" | "blocked";
  detectedPII: string[];
} {
  text = text.normalize('NFC');
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      decision: null,
      riskFlags: {
        hasEmergencyKeywords: false, hasClinicalRisk: false,
        hasPIIExposure: false, hasPromptInjection: false, needsEscalation: false,
      },
      safetyLevel: "safe",
      detectedPII: [],
    };
  }

  const hasEmergencyKW = hasEmergency(trimmed);
  const foundPII = detectPII(trimmed);

  const injectionReason = matchAny(trimmed, INJECTION_SIGNALS);
  if (injectionReason) {
    return {
      decision: {
        intent: "otro",
        confidence: 0.95,
        secondaryIntents: [],
        entities: {},
        reasoningSummary: `PRE-ROUTER: prompt injection — ${injectionReason}`,
      },
      riskFlags: {
        hasEmergencyKeywords: hasEmergencyKW,
        hasClinicalRisk: false,
        hasPIIExposure: foundPII.length > 0,
        hasPromptInjection: true,
        needsEscalation: true,
      },
      safetyLevel: "blocked",
      detectedPII: foundPII,
    };
  }

  // If the text expresses dissatisfaction or asks about result timelines, bypass post_tratamiento
  // routing and let the deterministic domain router handle it more precisely.
  const hasComplaintPrefix = /\b(no\s+vi\b|no\s+noté\b|no\s+me\s+gust[oó]\b|no\s+funcion[oó]\b|decepcionad[oa]\b|estoy\s+hart[oa]\b|pésim[oa]\b|terrible\b|no\s+veo\s+resultados?\b)/i.test(trimmed)
    || /\bcu[aá]ndo\s+(veo|se\s+ven|notan?|empiezan?\s+a\s+ver|voy\s+a\s+ver)\s+(los?\s+)?resultados?\b/i.test(trimmed);

  const postReason = !hasComplaintPrefix ? matchAny(trimmed, POST_SIGNALS) : null;
  if (postReason) {
    return {
      decision: {
        intent: "post_tratamiento",
        confidence: 0.90,
        secondaryIntents: ["dudas_medicas", "queja"],
        entities: { urgency: "medium" },
        reasoningSummary: `PRE-ROUTER: post-treatment signal — ${postReason}`,
      },
      riskFlags: {
        hasEmergencyKeywords: hasEmergencyKW,
        hasClinicalRisk: true,
        hasPIIExposure: foundPII.length > 0,
        hasPromptInjection: false,
        needsEscalation: hasEmergencyKW,
      },
      safetyLevel: hasEmergencyKW ? "handoff" : "caution",
      detectedPII: foundPII,
    };
  }

  const contraReason = matchAny(trimmed, CONTRA_SIGNALS);
  if (contraReason) {
    // If the user is just STATING a condition without asking a question, it's
    // information sharing → charla (not contraindicaciones).
    // Eg: "Me diagnosticaron diabetes" = charla. "¿Puedo hacérmelo si tengo diabetes?" = contraindicaciones.
    const hasQuestionIntent = /[¿?]/.test(trimmed)
      || /\b(puedo|puede|pueden|pueda|se[púu]ede|debo|deber[ií]a|recomiendas?)\b/i.test(trimmed)
      || /\b(agendar|cita|separar|reservar|pedir\s+cita|precio|cu[aá]nto|qu[eé]\s+es)\b/i.test(trimmed)
      || (/\b(embaraza(da|d[aá])|lactanc(ia|i[eé])|enferm[oa]|al[eé]rgic[oa]|diab[eé]tic[oa]|hipertens[oa])\b/i.test(trimmed)
        && /\b(quiero|puedo|podr[ií]a|hacerme|aplicarme|ponerme|tratamiento|procedimiento|hac[eé]rmelo|hacerme\s+un)\b/i.test(trimmed));
    if (!hasQuestionIntent) {
      return {
        decision: null,
        riskFlags: {
          hasEmergencyKeywords: hasEmergencyKW,
          hasClinicalRisk: true,
          hasPIIExposure: foundPII.length > 0,
          hasPromptInjection: false,
          needsEscalation: hasEmergencyKW,
        },
        safetyLevel: hasEmergencyKW ? "handoff" : "caution",
        detectedPII: foundPII,
      };
    }

    // If the contraindication is about a THIRD PARTY (hijo/hija) AND the user
    // expresses booking intent, route to agendamiento (not contraindicaciones).
    // Eg: "Mi hija es menor de edad, ¿puede agendar?" → booking, not medical.
    const hasThirdPartyBooking = (
      /\b(mi\s+(hij[oa]|hijos?)|ella|(mi\s+)?hij[oa]\s+(tiene|necesita|quiere|debe|puede))\b/i.test(trimmed)
      && /\b(agendar|cita|separar|reservar|pedir\s+cita|agenda)\b/i.test(trimmed)
    );
    if (hasThirdPartyBooking) {
      return {
        decision: null,
        riskFlags: {
          hasEmergencyKeywords: hasEmergencyKW,
          hasClinicalRisk: true,
          hasPIIExposure: foundPII.length > 0,
          hasPromptInjection: false,
          needsEscalation: hasEmergencyKW,
        },
        safetyLevel: hasEmergencyKW ? "handoff" : "caution",
        detectedPII: foundPII,
      };
    }

    return {
      decision: {
        intent: "contraindicaciones",
        confidence: 0.95,
        secondaryIntents: ["dudas_medicas"],
        entities: {},
        reasoningSummary: `PRE-ROUTER: contraindication signal — ${contraReason}`,
      },
      riskFlags: {
        hasEmergencyKeywords: hasEmergencyKW,
        hasClinicalRisk: true,
        hasPIIExposure: foundPII.length > 0,
        hasPromptInjection: false,
        needsEscalation: hasEmergencyKW,
      },
      safetyLevel: hasEmergencyKW ? "handoff" : "caution",
      detectedPII: foundPII,
    };
  }

  // "¿Eres una persona real?" = asking if the AI is human → charla, not hablar_humano
  const isAIIdentityQuestion = /\b(eres?\s+|sos?\s+)(una?\s+)?(persona\s+real|humano?\b|bot\b|ia\b|robot\b|persona\s+de\s+verdad)/i.test(trimmed);

  // "No necesito hablar con un humano, me ayudas tú" = negated human request → charla
  const isNegatedHumanRequest = /\b(no\s+necesito\s+(hablar|un\s+humano)|no\s+quiero\s+hablar\s+con\s+(una?\s+)?(persona|humano))\b/i.test(trimmed);

  const humanReason = (!isAIIdentityQuestion && !isNegatedHumanRequest) ? matchAny(trimmed, HUMAN_SIGNALS) : null;
  if (humanReason) {
    return {
      decision: {
        intent: "hablar_humano",
        confidence: 0.95,
        secondaryIntents: ["queja"],
        entities: { urgency: "high" },
        reasoningSummary: `PRE-ROUTER: human escalation — ${humanReason}`,
      },
      riskFlags: {
        hasEmergencyKeywords: hasEmergencyKW,
        hasClinicalRisk: false,
        hasPIIExposure: foundPII.length > 0,
        hasPromptInjection: false,
        needsEscalation: true,
      },
      safetyLevel: "handoff",
      detectedPII: foundPII,
    };
  }

  const refuseReason = matchAny(trimmed, REFUSE_SIGNALS);
  const hasRefuseSignal = refuseReason !== null;

  return {
    decision: hasRefuseSignal ? null : null,
    riskFlags: {
      hasEmergencyKeywords: hasEmergencyKW,
      hasClinicalRisk: hasRefuseSignal,
      hasPIIExposure: foundPII.length > 0,
      hasPromptInjection: false,
      needsEscalation: hasEmergencyKW || hasRefuseSignal,
    },
    safetyLevel: hasEmergencyKW || foundPII.length > 0 || hasRefuseSignal ? "caution" : "safe",
    detectedPII: foundPII,
  };
}
