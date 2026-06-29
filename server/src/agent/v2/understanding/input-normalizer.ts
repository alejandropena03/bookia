export interface NormalizedInput {
  originalText: string;
  normalizedText: string;
  hasTypos: boolean;
  containsEmoji: boolean;
  containsUrls: boolean;
  wordCount: number;
}

const EMOJI_PATTERN = /[\p{Emoji}]/u;

const URL_PATTERN = /https?:\/\/[^\s]+/gi;

export function normalizeInput(text: string): NormalizedInput {
  const trimmed = text.trim();

  const normalized = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\sáéíóúüñ.,!?¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const hasTypos = detectTypos(normalized);

  const containsEmoji = EMOJI_PATTERN.test(trimmed);

  const containsUrls = URL_PATTERN.test(trimmed);

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return {
    originalText: trimmed,
    normalizedText: normalized,
    hasTypos,
    containsEmoji,
    containsUrls,
    wordCount,
  };
}

const COMMON_TYPOS: Record<string, string> = {
  hola: "hola",
  agendar: "agendar",
  cita: "cita",
  precio: "precio",
  precios: "precio",
  bogota: "bogotá",
  medellin: "medellín",
  valoracion: "valoración",
  ubicacion: "ubicación",
  horario: "horarios",
  direccion: "dirección",
  telefono: "teléfono",
  correo: "correo",
  tratamieto: "tratamiento",
  trataminto: "tratamiento",
};

function detectTypos(text: string): boolean {
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.length > 3 && !COMMON_TYPOS[word]) {
      const knownWords = Object.keys(COMMON_TYPOS);
      for (const known of knownWords) {
        if (Math.abs(word.length - known.length) <= 2) {
          const distance = levenshtein(word, known);
          if (distance === 1) return true;
        }
      }
    }
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}
