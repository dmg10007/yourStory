import { describe, expect, it } from "vitest";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { safeParseScenario, type ConsequenceSeed, type NarrativeHorizon } from "@/domain/scenario";
import { PIVOT_CHOICE_INDEX, buildSeed, buildSeededCandidate } from "@/lib/runs/seeded-scenario-fixture";

function issueMessages(candidate: unknown): string[] {
  const result = safeParseScenario(candidate);
  return result.success ? [] : result.error.issues.map(({ message }) => message);
}

function expectIssue(candidate: unknown, fragment: string) {
  expect(issueMessages(candidate).some((message) => message.includes(fragment))).toBe(true);
}

describe("pivot schema", () => {
  it("accepts a pivot with a plausibility basis and consequence seeds", () => {
    expect(safeParseScenario(buildSeededCandidate()).success).toBe(true);
  });

  it("defaults existing choices to no seeds and the standard selection", () => {
    const choice = dunkirk1940.basicChoices[0];

    expect(choice.consequenceSeeds).toEqual([]);
    expect(choice.seedSelection).toEqual({ aftermath: 2, decade: 2, present: 1 });
    expect(choice.plausibility).toBeUndefined();
  });

  const forbiddenClassifications: [NarrativeHorizon, ConsequenceSeed["classification"]][] = [
    ["aftermath", "documented-fact"],
    ["aftermath", "highly-speculative"],
    ["decade", "direct-inference"],
    ["decade", "documented-fact"],
    ["present", "plausible-projection"],
  ];

  it.each(forbiddenClassifications)("rejects a %s seed classified %s", (horizon, classification) => {
    const candidate = buildSeededCandidate();
    const pivot = candidate.basicChoices[PIVOT_CHOICE_INDEX];
    const seedIndex = pivot.consequenceSeeds.findIndex((seed) => seed.horizon === horizon);
    pivot.consequenceSeeds[seedIndex].classification = classification;

    expectIssue(candidate, `A ${horizon} seed cannot be classified ${classification}`);
  });

  it("rejects a seed that cites an unknown source", () => {
    const candidate = buildSeededCandidate();
    candidate.basicChoices[PIVOT_CHOICE_INDEX].consequenceSeeds[0].evidenceIds = ["missing-source"];

    expectIssue(candidate, "Unknown source: missing-source");
  });

  it("rejects a seed that references an unknown causal factor", () => {
    const candidate = buildSeededCandidate();
    candidate.basicChoices[PIVOT_CHOICE_INDEX].consequenceSeeds[0].causalFactorIds = ["missing-factor"];

    expectIssue(candidate, "Unknown causal factor: missing-factor");
  });

  it("rejects a plausibility basis that cites an unknown source", () => {
    const candidate = buildSeededCandidate();
    const pivot = candidate.basicChoices[PIVOT_CHOICE_INDEX];
    if (!pivot.plausibility) throw new Error("Fixture must define plausibility");
    pivot.plausibility.evidenceIds = ["missing-source"];

    expectIssue(candidate, "Unknown source: missing-source");
  });

  it("rejects duplicate seed IDs across choices", () => {
    const candidate = buildSeededCandidate();
    const other = candidate.basicChoices[2];
    other.plausibility = { minimalRewrite: "A second documented near miss.", evidenceIds: ["src-dunkirk-001"] };
    other.consequenceSeeds = [buildSeed("a1", "aftermath", "plausible-projection")];
    other.seedSelection = { aftermath: 1, decade: 0, present: 0 };

    expectIssue(candidate, "Duplicate consequenceSeeds ID: a1");
  });

  it("rejects a seed ID that collides with a narrative event ID", () => {
    const candidate = buildSeededCandidate();
    candidate.basicChoices[PIVOT_CHOICE_INDEX].consequenceSeeds[0].id = "evt-halt-order-historical";

    expectIssue(candidate, "collides with a narrative event ID");
  });

  it("rejects consequence seeds on a choice with no minimal-rewrite plausibility", () => {
    const candidate = buildSeededCandidate();
    delete candidate.basicChoices[PIVOT_CHOICE_INDEX].plausibility;

    expectIssue(candidate, "minimal-rewrite plausibility");
  });

  it("rejects a seed selection larger than the authored pool", () => {
    const candidate = buildSeededCandidate();
    candidate.basicChoices[PIVOT_CHOICE_INDEX].seedSelection.present = 3;

    expectIssue(candidate, "seedSelection.present requests 3 seeds but only 2 are authored");
  });
});
