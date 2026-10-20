import { buildNarrationPrompt, type Narration, type NarrationInput } from "./narration";
import { MIN_WORDS, type NarrationValidationResult } from "./narration-validation";

const QUALITY_RULES = `
Additional quality requirements:
- Keep the requested in-world voice in the decade and present. Precision of language is not permission to invent precision of facts.
- The seed basis is authoring commentary explaining the causal premise and its limits, not a new event or a quotation to put in the story. Its source references do not prove the fictional consequence.
- A date supplied for one event does not authorize assigning that date to another event. Do not add recovery deadlines, troop totals, deployment schedules, named agreements, or milestones absent from the supplied material. Do not spell out a rejected number to evade a check.
- Slower army rebuilding does not establish that Britain could field no full divisions or that it reached full strength in a particular year. Describe the specific training, staffing and equipment constraints instead of asserting total incapacity or a completed recovery.
- Preserve chronology. A smaller army after an evacuation is not a change to when Britain entered the war. Distinguish entering a partnership from entering the war. If a force recovers, do not describe its earlier weakness as continuing afterward without explanation.
- Make conditional prerequisites coherent across sections. Exploring peace is not signing a settlement. Do not silently turn possible terms into accepted terms or invent an agreement to bridge that gap.
- A weaker bargaining position does not establish a particular treaty, reconstruction agreement, border, or institution. Explain dependence and limits on choices at the level authorized by the seed.
- For the present, connect the changed wartime position to an enduring relationship, then describe that relationship today. Do not finish with an unexplained list of trade, diplomacy and defence categories.
- Keep the aftermath evidence-sensitive as already required. Do not turn a qualified logistical constraint into an absolute such as the only route unless the supplied material says so.
- Write three or four paragraphs and at least 120 words in EVERY section, including the present. Expand by explaining distinct consequences of the supplied material, not by repeating claims or inventing events. Keep proper nouns capitalized in the sentence-case headline.
`;

export function buildQualityNarrationPrompt(input: NarrationInput): { system: string; user: string } {
  const base = buildNarrationPrompt(input);
  const labels = new Map(input.factors.map(({ id, label }) => [id, label]));
  const context = input.seeds.map((seed) => [
    `[${seed.id}] Authoring basis: ${seed.basis}`,
    `Causal factors: ${seed.causalFactorIds.map((id) => labels.get(id) ?? id).join(", ") || "No explicit factor mapping; do not invent a missing causal mechanism."}`,
    ...(seed.id === "he-p2" ? [
      "Scope for he-p2: smaller rescued army -> reduced British capacity to contribute -> weaker leverage within the partnership with the United States. Develop the relative dependence and limits on independent choices. Do not assert that a new reconstruction pact, treaty, or alliance institution was negotiated. This is bounded authoring guidance, not a documented historical outcome.",
    ] : []),
  ].join("\n")).join("\n\n");
  return {
    system: `${base.system}\n${QUALITY_RULES}`,
    user: context ? `${base.user}\n\nSeed grounding and limits (authoring commentary):\n${context}` : base.user,
  };
}

export function buildQualityRetryReasons(narration: Narration, validation: NarrationValidationResult): string[] {
  return validation.flaggedTerms.filter(({ severity }) => severity === "error").map(({ rule, term }) => {
    if (rule === "too-short") {
      const section = narration.sections.find(({ horizon }) => horizon === term);
      if (section) {
        const words = section.text.trim().split(/\s+/).filter(Boolean).length;
        return `${rule} (${term}): This section has ${words} words; the validator minimum is ${MIN_WORDS[section.horizon]}. Expand this section to at least 120 words in three or four paragraphs using the supplied material. Do not pad other sections instead.`;
      }
    }
    if (rule === "unsupported-number") {
      return `${rule} (${term}): Remove this unsupported number or date and the milestone attached to it. Do not substitute another date, spell the number out, or reuse a supplied year for a different event. Use relative sequence and specific constraints without a new deadline.`;
    }
    const advice: Record<string, string> = {
      "invalid-structure": "Return exactly the required sections, in the required order.",
      "unknown-source-id": "List only IDs that were supplied.",
      "missing-citation": "Cite at least one supplied item from this section's own horizon in basedOn.",
      "breaks-frame": "Tell the decade and present as lived history in confident past tense. Remove hedging and frame-breaking phrases; do not weaken the in-world voice to fix grounding.",
      "missing-causal-link": "Name the supplied change and explain the consequence it caused, without inventing an intermediate event.",
      "unsupported-name": "Remove names and organizations absent from the supplied material.",
    };
    return `${rule} (${term}): ${advice[rule] ?? "Fix this finding using the supplied material."}`;
  });
}
