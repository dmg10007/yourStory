import { describe, expect, it } from "vitest";
import type { NarrativeEvent } from "./narrative";
import { validateNarrative } from "./narrative-validation";

const events: NarrativeEvent[] = [{
  id: "evt-test",
  date: "1940-06-22",
  title: "Churchill rallies the cabinet",
  summary: "On 28 May 1940, Winston Churchill won backing to continue the war. Prime Minister Paul Reynaud resigned before France signed the armistice on 22 June 1940.",
  classification: "documented-fact",
  evidenceIds: ["src-test"],
  causalFactorIds: ["resolve"],
}];

describe("validateNarrative", () => {
  it("does not flag names, dates, or numbers that occur in approved events", () => {
    expect(validateNarrative("On 28 May 1940, Winston Churchill won backing to continue the war.", events)).toEqual({
      flagged: false,
      flaggedTerms: [],
      validationVersion: "v2",
    });
  });

  it("does not flag title-prefixed source names", () => {
    expect(validateNarrative("In June, Prime Minister Paul Reynaud faced a difficult decision.", events)).toEqual({
      flagged: false,
      flaggedTerms: [],
      validationVersion: "v2",
    });
  });

  it("does not flag ordinary sentence-initial words or number words", () => {
    expect(validateNarrative("Earlier, speaking to two ministers, Churchill continued the war.", events)).toEqual({
      flagged: false,
      flaggedTerms: [],
      validationVersion: "v2",
    });
  });

  it("flags an unsupported multi-word proper name", () => {
    expect(validateNarrative("Franklin Roosevelt urged Churchill to continue the war.", events).flaggedTerms).toEqual([
      { term: "Franklin Roosevelt", rule: "unsupported-name" },
    ]);
  });

  it("flags an unsupported Arabic number", () => {
    expect(validateNarrative("Churchill won 99 votes in the cabinet.", events).flaggedTerms).toEqual([
      { term: "99", rule: "unsupported-number" },
    ]);
  });
});
