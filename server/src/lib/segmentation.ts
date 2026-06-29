export interface MessageSegment {
  text: string;
  delayMs: number;
}

const MIN_CHARS_FOR_SEGMENT = 200;
const TYPING_SPEED_CHARS_PER_MS = 0.05; // ~50 chars/sec typing speed
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 3000;
const PAUSE_BETWEEN_SEGMENTS_MS = 400;

export function segmentResponse(text: string): MessageSegment[] {
  if (!text || text.length < MIN_CHARS_FOR_SEGMENT) {
    const delay = calculateDelay(text.length);
    return [{ text, delayMs: delay }];
  }

  const segments: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= MIN_CHARS_FOR_SEGMENT) {
      segments.push(remaining);
      break;
    }

    const cutAt = findNaturalBreak(remaining, MIN_CHARS_FOR_SEGMENT);
    segments.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }

  return segments.map((seg, i) => ({
    text: seg,
    delayMs: i === 0 ? calculateDelay(seg.length) : PAUSE_BETWEEN_SEGMENTS_MS,
  }));
}

function findNaturalBreak(text: string, minLength: number): number {
  // Prefer breaking at double newlines, then single newlines, then periods, then commas
  const patterns = [
    { char: "\n\n", offset: 0 },
    { char: "\n", offset: 0 },
    { char: ". ", offset: 1 },
    { char: ".\n", offset: 1 },
    { char: "! ", offset: 1 },
    { char: "? ", offset: 1 },
    { char: ", ", offset: 0 },
  ];

  const searchFrom = Math.max(minLength - 50, 0);
  const searchTo = minLength + 100;

  for (const { char, offset } of patterns) {
    const pos = text.lastIndexOf(char, searchTo);
    if (pos >= searchFrom && pos < searchTo) {
      return pos + char.length - offset;
    }
  }

  // Fallback: break at space near minLength
  const spacePos = text.lastIndexOf(" ", searchTo);
  if (spacePos >= searchFrom) {
    return spacePos;
  }

  return Math.min(text.length, searchTo);
}

function calculateDelay(charCount: number): number {
  const raw = BASE_DELAY_MS + charCount / TYPING_SPEED_CHARS_PER_MS;
  return Math.min(Math.max(Math.round(raw), BASE_DELAY_MS), MAX_DELAY_MS);
}
