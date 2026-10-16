import { describe, expect, it } from "vitest";
import { scenarioSchema } from "@/domain/scenario";
import { deriveEvents } from "@/lib/runs/narrative";
import { sampleConsequenceSeeds } from "@/lib/runs/seed-sampling";
import { initializeSimulation } from "@/lib/simulation-engine";
import { dunkirk1940 } from "./dunkirk-1940";
import {
  cabinetNegotiatesChoice as originalCabinet,
  noHaltOrderPivot as originalNoHalt,
  reducedEvacuationPivot as originalReduced,
} from "./dunkirk-1940-pivots";

const PIVOT_IDS = ["reduced-evacuation", "no-halt-order", "war-cabinet-negotiates"];

function choiceById(id: string) {
  const choice = dunkirk1940.basicChoices.find((item) => item.id === id);
  if (!choice) throw new Error(`Missing basic choice ${id}`);
  return choice;
}

describe("dunkirk1940 pivots", () => {
  it("offers the three pivots alongside the historical baseline", () => {
    expect(dunkirk1940.basicChoices.map(({ id }) => id)).toEqual(expect.arrayContaining(["historical", ...PIVOT_IDS]));
  });

  it("gives only the pivots consequence seeds and a plausibility case", () => {
    const withSeeds = dunkirk1940.basicChoices.filter((choice) => choice.consequenceSeeds.length > 0).map(({ id }) => id);
    expect([...withSeeds].sort()).toEqual([...PIVOT_IDS].sort());
    PIVOT_IDS.forEach((id) => expect(choiceById(id).plausibility).toBeDefined());
  });

  it("backs every plausibility case with at least two sources", () => {
    PIVOT_IDS.forEach((id) => expect(choiceById(id).plausibility?.evidenceIds.length ?? 0).toBeGreaterThanOrEqual(2));
  });

  it("authors five aftermath, five decade, and four present seeds per pivot", () => {
    PIVOT_IDS.forEach((id) => {
      const seeds = choiceById(id).consequenceSeeds;
      const count = (horizon: string) => seeds.filter((seed) => seed.horizon === horizon).length;
      expect([count("aftermath"), count("decade"), count("present")]).toEqual([5, 5, 4]);
    });
  });

  it("draws five seeds for a play of each pivot", () => {
    PIVOT_IDS.forEach((id) => expect(sampleConsequenceSeeds(choiceById(id), "run-1")).toHaveLength(5));
  });

  it("derives the cabinet pivot's event from the basic choice", () => {
    const state = initializeSimulation(dunkirk1940, { basicChoiceId: "war-cabinet-negotiates" });
    expect(deriveEvents(state, dunkirk1940).map(({ id }) => id)).toEqual(["evt-pivot-cabinet-negotiates"]);
  });

  it("spells out United States in seed text so narration validation can match it", () => {
    dunkirk1940.basicChoices.flatMap((choice) => choice.consequenceSeeds).forEach((seed) => expect(seed.summary).not.toContain("U.S."));
  });

  it("preserves every previously authored seed", () => {
    const pairs = [
      ["no-halt-order", originalNoHalt.consequenceSeeds],
      ["reduced-evacuation", originalReduced.consequenceSeeds],
      ["war-cabinet-negotiates", originalCabinet.consequenceSeeds],
    ] as const;
    pairs.forEach(([id, originals]) => {
      expect(choiceById(id).consequenceSeeds.slice(0, originals.length)).toEqual(originals);
    });
  });

  it("keeps all 42 seed IDs unique and the scenario valid", () => {
    const seeds = dunkirk1940.basicChoices.flatMap((choice) => choice.consequenceSeeds);
    expect(seeds).toHaveLength(42);
    expect(new Set(seeds.map(({ id }) => id)).size).toBe(42);
    expect(scenarioSchema.safeParse(dunkirk1940).success).toBe(true);
  });

  it("gives every new seed a cited basis, a factor and a horizon-appropriate classification", () => {
    const sourceIds = new Set(dunkirk1940.sources.map(({ id }) => id));
    const allowed = { aftermath: ["direct-inference", "plausible-projection"], decade: ["plausible-projection", "highly-speculative"], present: ["highly-speculative"] };
    PIVOT_IDS.forEach((id) => {
      choiceById(id).consequenceSeeds.slice(8).forEach((seed) => {
        expect(seed.basis.trim().length).toBeGreaterThan(0);
        expect(seed.evidenceIds.length).toBeGreaterThan(0);
        expect(seed.causalFactorIds.length).toBeGreaterThan(0);
        seed.evidenceIds.forEach((sourceId) => expect(sourceIds.has(sourceId)).toBe(true));
        expect(allowed[seed.horizon]).toContain(seed.classification);
      });
    });
  });

  it("draws deterministically and reaches new seeds across multiple run IDs", () => {
    PIVOT_IDS.forEach((id) => {
      const choice = choiceById(id);
      expect(sampleConsequenceSeeds(choice, "same-run")).toEqual(sampleConsequenceSeeds(choice, "same-run"));
      const newIds = new Set(choice.consequenceSeeds.slice(8).map(({ id: seedId }) => seedId));
      const draws = Array.from({ length: 100 }, (_, index) => sampleConsequenceSeeds(choice, `expanded-${index}`));
      expect(draws.flat().some((seed) => newIds.has(seed.id))).toBe(true);
      draws.forEach((draw) => {
        expect(draw.map(({ horizon }) => horizon)).toEqual(["aftermath", "aftermath", "decade", "decade", "present"]);
        expect(new Set(draw.map(({ id: seedId }) => seedId)).size).toBe(5);
      });
    });
  });
});
