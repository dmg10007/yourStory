import { describe, expect, it } from "vitest";
import type { Narration } from "./narration";
import { validateNarration } from "./narration-validation";
import { HEDGED_TEXT, buildValidNarration, inputFor } from "./narration-fixture";

const input = inputFor("war-cabinet-negotiates");

function findings(narration: Narration) {
  return validateNarration(narration, input).flaggedTerms;
}

function withSection(narration: Narration, index: number, changes: Partial<Narration["sections"][number]>): Narration {
  return { ...narration, sections: narration.sections.map((section, position) => (position === index ? { ...section, ...changes } : section)) };
}

describe("validateNarration", () => {
  it("passes a well-formed narration", () => {
    expect(validateNarration(buildValidNarration(input), input)).toEqual({ flagged: false, flaggedTerms: [], validationVersion: "v3" });
  });

  it("flags sections that do not match the required horizons", () => {
    const valid = buildValidNarration(input);

    expect(findings({ ...valid, sections: [...valid.sections].reverse() }).map(({ rule }) => rule)).toContain("invalid-structure");
  });

  it("flags an ID that was never supplied", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { basedOn: [...valid.sections[0].basedOn, "made-up-id"] }));

    expect(result).toContainEqual({ term: "made-up-id", rule: "unknown-source-id" });
  });

  it("flags a section that cites nothing from its own horizon", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 1, { basedOn: [valid.sections[0].basedOn[0]] }));

    expect(result).toContainEqual({ term: "decade", rule: "missing-citation" });
  });

  it("flags unhedged decade and present sections", () => {
    const valid = buildValidNarration(input);
    const plain = withSection(withSection(valid, 1, { text: "Nothing more can be said." }), 2, { text: "Nothing more can be said." });

    expect(findings(plain).filter(({ rule }) => rule === "missing-hedging").map(({ term }) => term)).toEqual(["decade", "present"]);
  });

  it("requires two hedges in the present section", () => {
    const valid = buildValidNarration(input);
    const one = findings(withSection(valid, 2, { text: "It might have happened." }));
    const two = findings(withSection(valid, 2, { text: "It might have happened and could have lasted." }));

    expect(one).toContainEqual({ term: "present", rule: "missing-hedging" });
    expect(two.map(({ rule }) => rule)).not.toContain("missing-hedging");
  });

  it("flags a number that is not in the supplied material", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { text: `In 1999 ${HEDGED_TEXT.toLowerCase()}` }));

    expect(result).toContainEqual({ term: "1999", rule: "unsupported-number" });
  });

  it("flags an invented multi-word name", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 0, { text: `Georgy Zhukov would likely have advised caution, and it might have gone differently.` }));

    expect(result).toContainEqual({ term: "Georgy Zhukov", rule: "unsupported-name" });
  });

  it("accepts a baseline run that has only an aftermath section", () => {
    const baseline = inputFor("historical");

    expect(validateNarration(buildValidNarration(baseline), baseline).flagged).toBe(false);
  });
});
