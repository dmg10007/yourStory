import { describe, expect, it } from "vitest";
import { deriveEvents } from "@/lib/runs/narrative";
import { sampleConsequenceSeeds } from "@/lib/runs/seed-sampling";
import { initializeSimulation } from "@/lib/simulation-engine";
import { dunkirk1940 } from "./dunkirk-1940";

const PIVOT_IDS = ["reduced-evacuation", "no-halt-order", "war-cabinet-negotiates"];

function choiceById(id: string) {
  const choice = dunkirk1940.basicChoices.find((item) => item.id === id);
  if (!choice) throw new Error(`Missing basic choice ${id}`);
  return choice;
}

describe("dunkirk1940 pivots", () => {
  it("offers the three pivots alongside the historical baseline", () => {
    const ids = dunkirk1940.basicChoices.map(({ id }) => id);

    expect(ids).toEqual(expect.arrayContaining(["historical", ...PIVOT_IDS]));
  });

  it("gives only the pivots consequence seeds and a plausibility case", () => {
    const withSeeds = dunkirk1940.basicChoices.filter((choice) => choice.consequenceSeeds.length > 0).map(({ id }) => id);

    expect([...withSeeds].sort()).toEqual([...PIVOT_IDS].sort());
    PIVOT_IDS.forEach((id) => expect(choiceById(id).plausibility).toBeDefined());
  });

  it("backs every plausibility case with at least two sources", () => {
    PIVOT_IDS.forEach((id) => {
      expect(choiceById(id).plausibility?.evidenceIds.length ?? 0).toBeGreaterThanOrEqual(2);
    });
  });

  it("authors three aftermath, three decade, and two present seeds per pivot", () => {
    PIVOT_IDS.forEach((id) => {
      const seeds = choiceById(id).consequenceSeeds;
      const count = (horizon: string) => seeds.filter((seed) => seed.horizon === horizon).length;

      expect([count("aftermath"), count("decade"), count("present")]).toEqual([3, 3, 2]);
    });
  });

  it("draws five seeds for a play of each pivot", () => {
    PIVOT_IDS.forEach((id) => {
      expect(sampleConsequenceSeeds(choiceById(id), "run-1")).toHaveLength(5);
    });
  });

  it("derives the cabinet pivot's event from the basic choice", () => {
    const state = initializeSimulation(dunkirk1940, { basicChoiceId: "war-cabinet-negotiates" });

    expect(deriveEvents(state, dunkirk1940).map(({ id }) => id)).toEqual(["evt-pivot-cabinet-negotiates"]);
  });

  it("spells out United States in seed text so narration validation can match it", () => {
    dunkirk1940.basicChoices.flatMap((choice) => choice.consequenceSeeds).forEach((seed) => {
      expect(seed.summary).not.toContain("U.S.");
    });
  });
});
