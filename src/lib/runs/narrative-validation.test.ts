import { describe, expect, it } from "vitest";
import type { NarrativeEvent } from "./narrative";
import { validateNarrative } from "./narrative-validation";

const events: NarrativeEvent[] = [{
  id: "evt-test",
  date: "1940-05-28",
  title: "Churchill rallies the cabinet",
  summary: "On 28 May 1940, Churchill won backing to continue the war from the British War Cabinet.",
  classification: "documented-fact",
  evidenceIds: ["src-test"],
  causalFactorIds: ["resolve"],
}];

describe("validateNarrative", () => {
  it("does not flag names, dates, or numbers that occur in approved events", () => {
    expect(validateNarrative("On 28 May 1940, Churchill won backing to continue the war.", events)).toEqual({
      flagged: false,
      flaggedTerms: [],
      validationVersion: "v1",
    });
  });

  it("flags an unsupported proper noun", () => {
    expect(validateNarrative("Roosevelt urged Churchill to continue the war.", events).flaggedTerms).toEqual(["Roosevelt"]);
  });

  it("flags an unsupported number", () => {
    expect(validateNarrative("Churchill won 99 votes in the cabinet.", events).flaggedTerms).toEqual(["99"]);
  });

  it("does not flag sentence-initial stop words", () => {
    expect(validateNarrative("The cabinet continued the war.", events).flagged).toBe(false);
  });
});
