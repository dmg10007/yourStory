import type { NarrativeEvent } from "./narrative";

export const NARRATIVE_VALIDATION_VERSION = "v1";

export interface NarrativeValidationResult {
  flagged: boolean;
  flaggedTerms: string[];
  validationVersion: typeof NARRATIVE_VALIDATION_VERSION;
}

const STOP_WORDS = new Set([
  "A", "An", "And", "As", "At", "But", "For", "From", "He", "Her", "His", "In", "Into", "It", "Its", "No", "Of", "On", "Or", "She", "The", "Their", "They", "This", "To", "We", "With", "Without",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
}

function sourceText(events: NarrativeEvent[]): string {
  return normalize(events.map((event) => `${event.date} ${event.title} ${event.summary}`).join(" "));
}

function isSupported(term: string, normalizedSource: string): boolean {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return true;
  return ` ${normalizedSource} `.includes(` ${normalizedTerm} `);
}

function extractCandidates(narrative: string): string[] {
  const yearsAndNumbers = narrative.match(/\b\d{1,4}(?:,\d{3})*\b/g) ?? [];
  const properNouns = narrative.match(/\b(?:[A-Z][a-z]+(?:[\s-][A-Z][a-z]+){0,3})\b/g) ?? [];

  return [...yearsAndNumbers, ...properNouns]
    .map((term) => term.trim())
    .filter((term) => !STOP_WORDS.has(term));
}

/**
 * Performs a conservative, deterministic review pass over LLM narration.
 * It does not decide historical truth and never blocks output. Instead it flags
 * candidate numbers and proper nouns absent from the reviewed input events for
 * later editorial review. This intentionally favors false positives over silently
 * accepting an unsupported attribution.
 */
export function validateNarrative(narrative: string, events: NarrativeEvent[]): NarrativeValidationResult {
  const normalizedSource = sourceText(events);
  const flaggedTerms = [...new Set(
    extractCandidates(narrative).filter((term) => !isSupported(term, normalizedSource)),
  )].sort((left, right) => left.localeCompare(right));

  return {
    flagged: flaggedTerms.length > 0,
    flaggedTerms,
    validationVersion: NARRATIVE_VALIDATION_VERSION,
  };
}
