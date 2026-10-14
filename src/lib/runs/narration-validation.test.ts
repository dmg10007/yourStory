import { describe, expect, it } from "vitest";
import type { Narration } from "./narration";
import { countErrors, validateNarration } from "./narration-validation";
import { LONG_TEXT, buildValidNarration, inputFor } from "./narration-fixture";

const input = inputFor("war-cabinet-negotiates");

const NO_HEDGE_TEXT = Array.from({ length: 8 }, () => "The Cabinet acted because the situation demanded it, and the effects spread across the following years.").join(" ");
const NO_LINK_TEXT = Array.from({ length: 8 }, () => "This would likely have shaped events, and it might have gone differently in ways that could have mattered.").join(" ");

function findings(narration: Narration, subject = input) {
  return validateNarration(narration, subject).flaggedTerms;
}

function withSection(narration: Narration, index: number, changes: Partial<Narration["sections"][number]>): Narration {
  return { ...narration, sections: narration.sections.map((section, position) => (position === index ? { ...section, ...changes } : section)) };
}

describe("validateNarration", () => {
  it("passes a well-formed narration", () => {
    expect(validateNarration(buildValidNarration(input), input)).toEqual({ flagged: false, flaggedTerms: [], validationVersion: "v4" });
  });

  it("flags sections that do not match the required horizons", () => {
    const valid = buildValidNarration(input);

    expect(findings({ ...valid, sections: [...valid.sections].reverse() }).map(({ rule }) => rule)).toContain("invalid-structure");
  });

  it("flags an ID that was never supplied", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { basedOn: [...valid.sections[0].basedOn, "made-up-id"] }));

    expect(result).toContainEqual({ term: "made-up-id", rule: "unknown-source-id", severity: "error" });
  });

  it("flags a section that cites nothing from its own horizon", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 1, { basedOn: [valid.sections[0].basedOn[0]] }));

    expect(result).toContainEqual({ term: "decade", rule: "missing-citation", severity: "error" });
  });

  it("flags unhedged decade and present sections", () => {
    const valid = buildValidNarration(input);
    const plain = withSection(withSection(valid, 1, { text: NO_HEDGE_TEXT }), 2, { text: NO_HEDGE_TEXT });

    expect(findings(plain).filter(({ rule }) => rule === "missing-hedging").map(({ term }) => term)).toEqual(["decade", "present"]);
  });

  it("requires two hedges in the present section", () => {
    const valid = buildValidNarration(input);
    const one = findings(withSection(valid, 2, { text: `${NO_HEDGE_TEXT} It might have happened.` }));
    const two = findings(withSection(valid, 2, { text: `${NO_HEDGE_TEXT} It might have happened and could have lasted.` }));

    expect(one).toContainEqual({ term: "present", rule: "missing-hedging", severity: "error" });
    expect(two.map(({ rule }) => rule)).not.toContain("missing-hedging");
  });

  it("flags a section that is too short", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { text: "Too short." }));

    expect(result).toContainEqual({ term: "aftermath", rule: "too-short", severity: "error" });
  });

  it("requires a causal link in the speculative sections", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 1, { text: NO_LINK_TEXT }));

    expect(result).toContainEqual({ term: "decade", rule: "missing-causal-link", severity: "error" });
  });

  it("flags a number that is not in the supplied material", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { text: `In 1999 ${LONG_TEXT.toLowerCase()}` }));

    expect(result).toContainEqual({ term: "1999", rule: "unsupported-number", severity: "error" });
  });

  it("treats an invented name in the strict aftermath section as an error", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { text: `Georgy Zhukov would likely have advised caution because ${LONG_TEXT.toLowerCase()}` }));

    expect(result).toContainEqual({ term: "Georgy Zhukov", rule: "unsupported-name", severity: "error" });
  });

  it("records an unfamiliar name in a speculative section as a note that does not flag the draft", () => {
    const valid = buildValidNarration(input);
    const draft = withSection(valid, 1, { text: `Georgy Zhukov would likely have advised caution because ${LONG_TEXT.toLowerCase()}` });
    const result = validateNarration(draft, input);

    expect(result.flaggedTerms).toContainEqual({ term: "Georgy Zhukov", rule: "unsupported-name", severity: "note" });
    expect(countErrors(result)).toBe(0);
    expect(result.flagged).toBe(false);
  });

  it("still treats an invented number or date in a speculative section as an error", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 1, { text: `By 1999 ${LONG_TEXT.toLowerCase()}` }));

    expect(result).toContainEqual({ term: "1999", rule: "unsupported-number", severity: "error" });
  });

  it("accepts a baseline run that has only an aftermath section", () => {
    const baseline = inputFor("historical");

    expect(validateNarration(buildValidNarration(baseline), baseline).flagged).toBe(false);
  });
});
