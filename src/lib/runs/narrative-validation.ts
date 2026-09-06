import type { NarrativeEvent } from "./narrative";

export const NARRATIVE_VALIDATION_VERSION = "v2";

type NarrativeValidationRule = "unsupported-name" | "unsupported-number";

export interface NarrativeValidationFinding {
  term: string;
  rule: NarrativeValidationRule;
}

export interface NarrativeValidationResult {
  flagged: boolean;
  flaggedTerms: NarrativeValidationFinding[];
  validationVersion: typeof NARRATIVE_VALIDATION_VERSION;
}

const TITLE_WORDS = new Set([
  "Admiral", "Air", "Chief", "Commander", "Foreign", "General", "King", "Lord", "Marshal", "Minister", "President", "Prime", "Secretary", "Sir",
]);

const MONTHS = new Set([
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
]);

const NUMBER_WORDS = new Set([
  "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety", "Hundred", "Thousand", "Million",
]);

const LEADING_STOP_WORDS = new Set([
  "A", "An", "And", "As", "At", "But", "Earlier", "For", "From", "He", "Her", "His", "In", "Into", "It", "Its", "No", "Of", "On", "Or", "She", "Speaking", "That", "The", "Their", "They", "This", "To", "We", "With", "Without",
]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9]+/g, " ").trim();
}

function sourceText(events: NarrativeEvent[]): string {
  return normalize(events.map((event) => `${event.date} ${event.title} ${event.summary}`).join(" "));
}

function sourceCapitalizedTokens(events: NarrativeEvent[]): Set<string> {
  return new Set(
    events
      .flatMap((event) => `${event.title} ${event.summary}`.match(/\b[A-Z][a-z]+\b/g) ?? [])
      .filter((term) => !MONTHS.has(term) && !TITLE_WORDS.has(term) && !NUMBER_WORDS.has(term)),
  );
}

function isSupportedNumber(value: string, normalizedSource: string): boolean {
  const normalizedValue = normalize(value);
  return ` ${normalizedSource} `.includes(` ${normalizedValue} `);
}

function extractArabicNumbers(narrative: string): string[] {
  return narrative.match(/\b\d{1,4}(?:,\d{3})*\b/g) ?? [];
}

/**
 * Strips leading connective/sentence-initial words ("In", "Earlier", "Speaking",
 * etc.) from a matched capitalized run so that phrases like "In June, Prime
 * Minister Paul Reynaud" are correctly reduced to "Prime Minister Paul Reynaud"
 * rather than treated as a single compound name. Title words ("Prime",
 * "Minister") are never stripped even though they are also capitalized, since
 * they are part of a legitimate name phrase, not a sentence connective.
 */
function stripLeadingConnectives(words: string[]): string[] {
  let start = 0;
  while (start < words.length && LEADING_STOP_WORDS.has(words[start]) && !TITLE_WORDS.has(words[start])) {
    start += 1;
  }
  return words.slice(start);
}

function extractCapitalizedNames(narrative: string): string[] {
  const matches = narrative.match(/\b(?:[A-Z][a-z]+(?:[\s-][A-Z][a-z]+)+)\b/g) ?? [];
  return matches
    .map((phrase) => stripLeadingConnectives(phrase.split(/[\s-]+/)).join(" "))
    .filter((phrase) => phrase.split(" ").length >= 2);
}

function nameTokens(phrase: string): string[] {
  return phrase
    .split(/[\s-]+/)
    .filter((word) => !TITLE_WORDS.has(word) && !MONTHS.has(word) && !NUMBER_WORDS.has(word));
}

/**
 * Deterministically identifies candidate unsupported names and Arabic numeric
 * claims. It never determines historical truth and never blocks output.
 *
 * v2 intentionally ignores ordinary sentence-initial words, month names, and
 * number words. A title-prefixed name passes when at least one substantive name
 * token appears in a reviewed event, so e.g. "Prime Minister Paul Reynaud" is
 * accepted if "Paul Reynaud" is in the event set.
 */
export function validateNarrative(narrative: string, events: NarrativeEvent[]): NarrativeValidationResult {
  const normalizedSource = sourceText(events);
  const approvedNameTokens = sourceCapitalizedTokens(events);
  const findings = new Map<string, NarrativeValidationFinding>();

  for (const number of extractArabicNumbers(narrative)) {
    if (!isSupportedNumber(number, normalizedSource)) {
      findings.set(`unsupported-number:${number}`, { term: number, rule: "unsupported-number" });
    }
  }

  for (const phrase of extractCapitalizedNames(narrative)) {
    const tokens = nameTokens(phrase);
    if (tokens.length === 0 || tokens.some((token) => approvedNameTokens.has(token))) continue;
    findings.set(`unsupported-name:${phrase}`, { term: phrase, rule: "unsupported-name" });
  }

  const flaggedTerms = [...findings.values()].sort((left, right) => {
    const byRule = left.rule.localeCompare(right.rule);
    return byRule === 0 ? left.term.localeCompare(right.term) : byRule;
  });

  return {
    flagged: flaggedTerms.length > 0,
    flaggedTerms,
    validationVersion: NARRATIVE_VALIDATION_VERSION,
  };
}
