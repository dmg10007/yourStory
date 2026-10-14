import type { NarrativeHorizon } from "@/domain/scenario";
import { validateNarrative, type NarrativeValidationFinding } from "./narrative-validation";
import { idsForHorizon, toSourceItems, type Narration, type NarrationInput } from "./narration";

export const NARRATION_VALIDATION_VERSION = "v5";

type StructureRule =
  | "invalid-structure"
  | "unknown-source-id"
  | "missing-citation"
  | "breaks-frame"
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

/**
 * Phrases that step outside the changed timeline: hedging, the narrator musing, or any mention
 * that the timeline is alternate or imagined. The decade and present sections are told as lived
 * history, so none of these may appear there; the interface labels those sections instead.
 */
const BREAKS_FRAME_PATTERN = /\b(i (?:imagine|suspect|suppose|guess|wonder|believe|think)|it (?:seems|appears)|seems? (?:likely|plausible)|appears (?:likely|plausible)|looking like|might|may have|could have|would have|would likely|perhaps|possibly|probably|presumably|conceivably|likely|unlikely|speculat\w*|hypothetical\w*|imagined|counterfactual|alternate|in this (?:branch|timeline|scenario|version))\b/gi;

const CAUSAL_PATTERN = /\b(because|since|as a result|result of|which meant|meant that|leading to|led to|so that|thereby|consequently|therefore|owing to|due to)\b/gi;

/** Minimum lengths sit a little below the 120 words the prompt asks for, to leave slack. */
export const MIN_WORDS: Record<NarrativeHorizon, number> = { aftermath: 100, decade: 110, present: 110 };

const REQUIRED_LINKS: Record<NarrativeHorizon, number> = { aftermath: 0, decade: 1, present: 1 };

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function uniqueMatches(text: string, pattern: RegExp): string[] {
  return [...new Set((text.match(pattern) ?? []).map((match) => match.toLowerCase()))];
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countErrors(validation: NarrationValidationResult): number {
  return validation.flaggedTerms.filter(({ severity }) => severity === "error").length;
}

/**
 * v5 keeps the aftermath section strict and sourced (only supplied names, dates, and numbers, with
 * hedging allowed where the evidence is a projection). The decade and present sections are told
 * from inside the changed timeline, so they must not hedge or step outside it; an unfamiliar name
 * there is recorded as a review note, while an invented number or date is still an error. Every
 * section must meet a minimum length, the speculative sections must show a causal chain, and every
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
    if (countMatches(section.text, CAUSAL_PATTERN) < REQUIRED_LINKS[section.horizon]) add(section.horizon, "missing-causal-link");

    if (section.horizon !== "aftermath") {
      uniqueMatches(section.text, BREAKS_FRAME_PATTERN).forEach((phrase) => add(phrase, "breaks-frame"));
    }
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
