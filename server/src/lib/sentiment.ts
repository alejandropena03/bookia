export type SentimentLabel = "frustrated" | "anxious" | "urgent" | "happy" | "neutral" | "confused";

export interface SentimentResult {
  label: SentimentLabel;
  score: number;
  isNegative: boolean;
}

const FRUSTRATED = [
  "pesimo", "pésimo", "terrible", "horrible", "pesima", "pesima",
  "insatisfecho", "insatisfecha", "molesto", "molesta", "enfadado",
  "enfadada", "rabia", "furioso", "furiosa", "queja", "quejar",
  "reclamo", "reclamar", "no me gusto", "no me gustó", "mal servicio",
  "pesima atencion", "pésima atención", "decepcionado", "decepcionada",
  "indignado", "indignada", "estafa", "robo", "mentira",
  "no sirven", "no sirve", "pérdida de tiempo", "perdida de tiempo",
  "no vuelvo", "pésimo servicio",
];

const ANXIOUS = [
  "duele", "dolor", "da miedo", "miedo", "nervioso", "nerviosa",
  "me preocupa", "preocupado", "preocupada", "ansiedad", "ansioso",
  "ansiosa", "temor", "asustado", "asustada", "inseguro", "insegura",
  "que tal es", "es seguro", "es peligroso", "complicaciones",
  "efectos secundarios", "reaccion", "reacción", "alergia",
];

const URGENT = [
  "urgente", "urgencia", "ya", "lo antes posible", "rapido", "rápido",
  "necesito ya", "ahora mismo", "inmediato", "inmediatamente",
  "lo necesito", "es urgente", "derecho", "corre", "corra",
  "no puedo esperar", "hoy mismo", "lo mas pronto posible",
  "lo más pronto posible", "maximo", "máximo",
];

const HAPPY = [
  "genial", "excelente", "maravilloso", "maravillosa", "perfecto",
  "perfecta", "feliz", "contento", "contenta", "encantado", "encantada",
  "me encanta", "me encantó", "hermoso", "hermosa", "super bien",
  "súper bien", "muy bien", "magnífico", "espectacular", "fantástico",
  "fantastico", "increible", "increíble", "belleza", "divino", "divina",
  "gracias", "muchas gracias",
];

const CONFUSED = [
  "no entiendo", "no comprendo", "explica", "explique", "no me queda claro",
  "confuso", "confusa", "no se", "no sé", "que significa", "qué significa",
  "como asi", "cómo así", "no entendi", "no entendí", "no capto",
  "repita", "repite", "otra vez", "no claro", "ayuda no entiendo",
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function matchKeywords(text: string, keywords: string[]): number {
  const normalized = normalize(text);
  let matches = 0;
  for (const kw of keywords) {
    if (normalized.includes(kw)) {
      matches++;
    }
  }
  return matches;
}

export function detectSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { label: "neutral", score: 0, isNegative: false };
  }

  const scores: Record<SentimentLabel, number> = {
    frustrated: matchKeywords(text, FRUSTRATED),
    anxious: matchKeywords(text, ANXIOUS),
    urgent: matchKeywords(text, URGENT),
    happy: matchKeywords(text, HAPPY),
    neutral: 0,
    confused: matchKeywords(text, CONFUSED),
  };

  // Find highest scoring sentiment
  let maxScore = 0;
  let maxLabel: SentimentLabel = "neutral";

  for (const [label, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxLabel = label as SentimentLabel;
    }
  }

  // Happy and frustrated check: if user says "gracias" but also "molesto", frustrated wins
  if (scores.frustrated > 0 && scores.happy > 0 && scores.frustrated >= scores.happy) {
    maxLabel = "frustrated";
  }

  const isNegative = maxLabel === "frustrated" || maxLabel === "anxious" || maxLabel === "urgent";

  return { label: maxLabel, score: maxScore, isNegative };
}

export function getToneInstruction(sentiment: SentimentLabel): string {
  switch (sentiment) {
    case "frustrated":
      return "TONO: El cliente está frustrado o molesto. Sé empático, valida su molestia. Usa frases como 'Entiendo tu molestia' o 'Lamento que hayas tenido esa experiencia'. No seas excesivamente alegre. Mantén un tono serio y respetuoso.";
    case "anxious":
      return "TONO: El cliente está ansioso o preocupado. Usa tono tranquilizador y cálido. Explica con claridad, evita tecnicismos. Destaca que todo es seguro y que los doctores evaluarán su caso personalmente.";
    case "urgent":
      return "TONO: El cliente tiene urgencia. Prioriza rapidez y solución directa. No hagas preguntas innecesarias. Ve al grano y ofrece la solución más rápida disponible.";
    case "happy":
      return "TONO: El cliente está de buen humor. Mantén tono cálido y positivo. Corresponde su entusiasmo con energía pero sin exagerar.";
    case "confused":
      return "TONO: El cliente está confundido. Sé paciente, explica con claridad y sencillez. Usa frases como 'Déjame explicarte mejor' o 'Para que quede más claro'. Pregunta si necesita más aclaración.";
    case "neutral":
    default:
      return "TONO: Mantén un tono cordial, natural y profesional. Como texto de WhatsApp.";
  }
}

export function getValidationPrefix(sentiment: SentimentLabel): string | null {
  switch (sentiment) {
    case "frustrated":
      return pickRandom([
        "Entiendo tu molestia. Déjame ayudarte con esto.",
        "Lamento que hayas tenido esa experiencia.",
        "Gracias por contarme, entiendo tu punto. Voy a ayudarte.",
        "Siento mucho que te sientas así. Estoy aquí para resolverlo.",
      ]);
    case "anxious":
      return pickRandom([
        "Entiendo tu preocupación. Déjame contarte con más detalle.",
        "No te preocupes, estoy aquí para resolver todas tus dudas.",
        "Es normal tener preguntas. Con gusto te explico.",
      ]);
    case "urgent":
      return pickRandom([
        "Entendido, voy al grano.",
        "Claro, te respondo rápido.",
      ]);
    default:
      return null;
  }
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
