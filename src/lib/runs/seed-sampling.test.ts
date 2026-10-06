import { describe, expect, it } from "vitest";
import { narrativeHorizons, scenarioSchema } from "@/domain/scenario";
import { sampleConsequenceSeeds } from "./seed-sampling";
import { PIVOT_CHOICE_INDEX, buildSeededCandidate } from "./seeded-scenario-fixture";

const scenario = scenarioSchema.parse(buildSeededCandidate());
const pivot = scenario.basicChoices[PIVOT_CHOICE_INDEX];
const runSeeds = Array.from({ length: 50 }, (_, index) => `run-${index}`);
const draw = (seed: string) => sampleConsequenceSeeds(pivot, seed);

describe("sampleConsequenceSeeds", () => {
  it("returns the same seeds for the same random seed", () => {
    expect(draw("run-1")).toEqual(draw("run-1"));
  });

  it("draws the configured number of seeds per horizon in horizon order", () => {
    expect(draw("run-1").map(({ horizon }) => horizon)).toEqual(["aftermath", "aftermath", "decade", "decade", "present"]);
  });

  it("never repeats a seed within one draw", () => {
    runSeeds.forEach((seed) => {
      const ids = draw(seed).map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it("keeps authored order within each horizon", () => {
    runSeeds.forEach((seed) => {
      narrativeHorizons.forEach((horizon) => {
        const authored = pivot.consequenceSeeds.filter((item) => item.horizon === horizon).map(({ id }) => id);
        const drawn = draw(seed).filter((item) => item.horizon === horizon).map(({ id }) => id);
        expect(drawn).toEqual(authored.filter((id) => drawn.includes(id)));
      });
    });
  });

  it("varies across different random seeds", () => {
    const distinct = new Set(runSeeds.map((seed) => draw(seed).map(({ id }) => id).join(",")));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it("clamps the draw to the number of authored seeds", () => {
    const clamped = structuredClone(pivot);
    clamped.seedSelection.aftermath = 5;

    expect(sampleConsequenceSeeds(clamped, "run-1").filter(({ horizon }) => horizon === "aftermath")).toHaveLength(3);
  });

  it("returns nothing for a choice without consequence seeds", () => {
    expect(sampleConsequenceSeeds(scenario.basicChoices[0], "run-1")).toEqual([]);
  });
});
