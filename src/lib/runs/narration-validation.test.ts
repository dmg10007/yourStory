import { describe, expect, it } from "vitest";
import type { Narration } from "./narration";
import { countErrors, validateNarration } from "./narration-validation";
import { LONG_TEXT, buildValidNarration, inputFor } from "./narration-fixture";

const input = inputFor("war-cabinet-negotiates");

const NO_LINK_TEXT = Array.from({ length: 6 }, () => "The Cabinet's choice carried forward and the country felt the difference in its politics and in daily life across the years.").join(" ");

function findings(narration: Narration, subject = input) {
  return validateNarration(narration, subject).flaggedTerms;
}

function withSection(narration: Narration, index: number, changes: Partial<Narration["sections"][number]>): Narration {
  return { ...narration, sections: narration.sections.map((section, position) => (position === index ? { ...section, ...changes } : section)) };
}

describe("validateNarration", () => {
  it("passes a well-formed narration", () => {
    expect(validateNarration(buildValidNarration(input), input)).toEqual({ flagged: false, flaggedTerms: [], validationVersion: "v5" });
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

  it("rejects the narrator musing in the decade section", () => {
    const valid = buildValidNarration(input);
    const result = findings(withSection(valid, 1, { text: `I imagine ${LONG_TEXT}` }));

    expect(result).toContainEqual({ term: "i imagine", rule: "breaks-frame", severity: "error" });
  });

  it("rejects hedging and talk of an alternate timeline in the present section", () => {
    const valid = buildValidNarration(input);
    const hedged = findings(withSection(valid, 2, { text: `${LONG_TEXT} It might have lasted for years.` }));
    const framed = findings(withSection(valid, 2, { text: `${LONG_TEXT} In this alternate present the country stood apart.` }));

    expect(hedged).toContainEqual({ term: "might", rule: "breaks-frame", severity: "error" });
    expect(framed).toContainEqual({ term: "alternate", rule: "breaks-frame", severity: "error" });
  });

  it("allows hedged wording in the strict aftermath section", () => {
    const valid = buildValidNarration(input);
    const draft = withSection(valid, 0, { text: `This would likely have shaped events because ${LONG_TEXT.toLowerCase()}` });
    const result = validateNarration(draft, input);

    expect(result.flaggedTerms.map(({ rule }) => rule)).not.toContain("breaks-frame");
    expect(result.flagged).toBe(false);
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
    const result = findings(withSection(valid, 0, { text: `Georgy Zhukov advised caution because ${LONG_TEXT.toLowerCase()}` }));

    expect(result).toContainEqual({ term: "Georgy Zhukov", rule: "unsupported-name", severity: "error" });
  });

  it("records an unfamiliar name in a speculative section as a note that does not flag the draft", () => {
    const valid = buildValidNarration(input);
    const draft = withSection(valid, 1, { text: `Georgy Zhukov advised caution because ${LONG_TEXT.toLowerCase()}` });
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
