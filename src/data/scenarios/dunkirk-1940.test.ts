import { describe, expect, it } from "vitest";
import { safeParseScenario, scenarioSchema } from "@/domain/scenario";
import { dunkirk1940 } from "./dunkirk-1940";

describe("dunkirk1940", () => {
  it("conforms to the reviewed scenario contract", () => {
    expect(scenarioSchema.parse(dunkirk1940)).toEqual(dunkirk1940);
    expect(dunkirk1940.status).toBe("reviewed");
  });

  it("uses unique basic-choice IDs", () => {
    expect(new Set(dunkirk1940.basicChoices.map(({ id }) => id)).size).toBe(dunkirk1940.basicChoices.length);
  });

  it("rejects an advanced variable outside its bounds", () => {
    const invalid = structuredClone(dunkirk1940);
    invalid.advancedVariables[0].baseline = 3;

    expect(safeParseScenario(invalid).success).toBe(false);
  });

  it("rejects an effect that references an unknown causal factor", () => {
    const invalid = structuredClone(dunkirk1940);
    invalid.decisionForks[0].choices[0].effects[0].factorId = "unknown-factor";

    expect(safeParseScenario(invalid).success).toBe(false);
  });

  it("rejects draft sources in a reviewed scenario", () => {
    const invalid = structuredClone(dunkirk1940);
    invalid.sources[0].reviewStatus = "draft";

    expect(safeParseScenario(invalid).success).toBe(false);
  });
});
