import type { NarrativeHorizon } from "@/domain/scenario";
import { validateNarrative, type NarrativeValidationFinding } from "./narrative-validation";
import { idsForHorizon, toSourceItems, type Narration, type NarrationInput } from "./narration";

export const NARRATION_VALIDATION_VERSION = "v4";

type StructureRule =
  | "invalid-structure"
  | "unknown-source-id"
  | "missing-citation"
  | "missing-hedging"
  | "too-short"
  | "missing-causal-link";

export type NarrationFindingRule = NarrativeValidationFinding["rule"] | StructureRule;

/** Errors trigger a retry and flag the draft for review; notes are recorded for review without blocking. */
export interface NarrationFinding {
  term: string;
  rule: NarrationFindingRule;
  severity: "error" | "note";
}

export interface NarrationValidationResult {
  flagged: boolean;
  flaggedTerms: NarrationFinding[];
  validationVersion: typeof NARRATION_VALIDATION_VERSION;
}

const HEDGE_PATTERN = /\b(might|may|could|would|likely|unlikely|perhaps|possibly|plausibly|probably|conceivably|speculat\w*)\b/gi;

const CAUSAL_PATTERN = /\b(because|since|as a result|result of|which meant|meant that|leading to|led to|so that|thereby|consequently|therefore|owing to|due to)\b/gi;

/** Minimum lengths sit a little below the 120 words the prompt asks for, to leave slack. */
export const MIN_WORDS: Record<NarrativeHorizon, number> = { aftermath: 100, decade: 110, present: 110 };

const REQUIRED_HEDGES: Record<NarrativeHorizon, number> = { aftermath: 0, decade: 1, present: 2 };

const REQUIRED_LINKS: Record<NarrativeHorizon, number> = { aftermath: 0, decade: 1, present: 1 };

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countErrors(validation: NarrationValidationResult): number {
  return validation.flaggedTerms.filter(({ severity }) => severity === "error").length;
}

/**
 * v4 keeps the aftermath section strict (only supplied names, dates, and numbers) and lets the
 * decade and present sections read as grounded alt-history narrative: an unfamiliar name there is
 * recorded as a review note, while an invented number or date is still an error. Every section must
 * meet a minimum length, the speculative sections must show a causal chain and hedge, and every
 * cited ID must have been supplied. Like earlier versions it never decides historical truth.
 */
export function validateNarration(narration: Narration, input: NarrationInput): NarrationValidationResult {
  const findings = new Map<string, NarrationFinding>();
  const add = (term: string, rule: NarrationFindingRule, severity: "error" | "note" = "error") => {
    const key = `${rule}:${term}`;
    if (findings.get(key)?.severity === "error") return;
    findings.set(key, { term, rule, severity });
  };

  const actual = narration.sections.map(({ horizon }) => horizon);
  if (actual.length !== input.horizons.length || actual.some((horizon, index) => horizon !== input.horizons[index])) {
    add(`expected ${input.horizons.join(", ")} but received ${actual.join(", ") || "none"}`, "invalid-structure");
  }

  narration.sections.forEach((section) => {
    section.basedOn.forEach((id) => {
      if (!input.allowedIds.has(id)) add(id, "unknown-source-id");
    });

    const ownIds = new Set(idsForHorizon(input, section.horizon));
    if (!section.basedOn.some((id) => ownIds.has(id))) add(section.horizon, "missing-citation");

    if (countWords(section.text) < MIN_WORDS[section.horizon]) add(section.horizon, "too-short");
    if (countMatches(section.text, HEDGE_PATTERN) < REQUIRED_HEDGES[section.horizon]) add(section.horizon, "missing-hedging");
    if (countMatches(section.text, CAUSAL_PATTERN) < REQUIRED_LINKS[section.horizon]) add(section.horizon, "missing-causal-link");
  });

  const sourceItems = toSourceItems(input);
  const strictSections = narration.sections.filter(({ horizon }) => horizon === "aftermath");
  const speculativeSections = narration.sections.filter(({ horizon }) => horizon !== "aftermath");

  const strictText = [narration.headline, ...strictSections.map(({ text }) => text)].join("\n");
  validateNarrative(strictText, sourceItems).flaggedTerms.forEach((finding) => add(finding.term, finding.rule, "error"));

  speculativeSections.forEach(({ text }) => {
    validateNarrative(text, sourceItems).flaggedTerms.forEach((finding) => {
      add(finding.term, finding.rule, finding.rule === "unsupported-number" ? "error" : "note");
    });
  });

  const flaggedTerms = [...findings.values()].sort((left, right) => {
    const byRule = left.rule.localeCompare(right.rule);
    return byRule === 0 ? left.term.localeCompare(right.term) : byRule;
  });

  return {
    flagged: flaggedTerms.some(({ severity }) => severity === "error"),
    flaggedTerms,
    validationVersion: NARRATION_VALIDATION_VERSION,
  };
}
