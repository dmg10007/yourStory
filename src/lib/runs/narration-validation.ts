import { validateNarrative, type NarrativeValidationFinding } from "./narrative-validation";
import { idsForHorizon, toSourceItems, type Narration, type NarrationInput } from "./narration";

export const NARRATION_VALIDATION_VERSION = "v3";

type StructureRule = "invalid-structure" | "unknown-source-id" | "missing-citation" | "missing-hedging";

export interface NarrationFinding {
  term: string;
  rule: NarrativeValidationFinding["rule"] | StructureRule;
}

export interface NarrationValidationResult {
  flagged: boolean;
  flaggedTerms: NarrationFinding[];
  validationVersion: typeof NARRATION_VALIDATION_VERSION;
}

const HEDGE_PATTERN = /\b(might|may|could|would|likely|unlikely|perhaps|possibly|plausibly|probably|conceivably|speculat\w*)\b/gi;

const REQUIRED_HEDGES = { aftermath: 0, decade: 1, present: 2 } as const;

function countHedges(text: string): number {
  return (text.match(HEDGE_PATTERN) ?? []).length;
}

/**
 * v3 checks the structure the prompt demands and then reuses the v2 name and number check
 * against everything the model was shown. Like v2 it never decides historical truth; it flags
 * drafts for retry or review.
 */
export function validateNarration(narration: Narration, input: NarrationInput): NarrationValidationResult {
  const findings = new Map<string, NarrationFinding>();
  const add = (term: string, rule: NarrationFinding["rule"]) => findings.set(`${rule}:${term}`, { term, rule });

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

    if (countHedges(section.text) < REQUIRED_HEDGES[section.horizon]) add(section.horizon, "missing-hedging");
  });

  const text = [narration.headline, ...narration.sections.map((section) => section.text)].join("\n");
  validateNarrative(text, toSourceItems(input)).flaggedTerms.forEach((finding) => add(finding.term, finding.rule));

  const flaggedTerms = [...findings.values()].sort((left, right) => {
    const byRule = left.rule.localeCompare(right.rule);
    return byRule === 0 ? left.term.localeCompare(right.term) : byRule;
  });

  return { flagged: flaggedTerms.length > 0, flaggedTerms, validationVersion: NARRATION_VALIDATION_VERSION };
}
