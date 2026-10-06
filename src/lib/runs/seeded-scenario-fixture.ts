import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import type { ConsequenceSeed, NarrativeHorizon } from "@/domain/scenario";

/** Index of the Dunkirk basic choice ("reduced-evacuation") that the fixture turns into a pivot. */
export const PIVOT_CHOICE_INDEX = 1;

export function buildSeed(id: string, horizon: NarrativeHorizon, classification: ConsequenceSeed["classification"]): ConsequenceSeed {
  return {
    id,
    horizon,
    title: `Seed ${id}`,
    summary: `Summary for seed ${id}.`,
    classification,
    basis: `Reasoning that links seed ${id} to the pivot.`,
    evidenceIds: ["src-dunkirk-001"],
    causalFactorIds: ["evacuation-capacity"],
  };
}

/** A Dunkirk clone whose second basic choice is a documented pivot with eight consequence seeds. */
export function buildSeededCandidate() {
  const candidate = structuredClone(dunkirk1940);
  const pivot = candidate.basicChoices[PIVOT_CHOICE_INDEX];

  pivot.plausibility = {
    minimalRewrite: "A narrower evacuation needs only less shipping or a shorter holding period, both of which were close to the margin.",
    evidenceIds: ["src-dunkirk-001"],
  };
  pivot.consequenceSeeds = [
    buildSeed("a1", "aftermath", "plausible-projection"),
    buildSeed("a2", "aftermath", "plausible-projection"),
    buildSeed("a3", "aftermath", "plausible-projection"),
    buildSeed("d1", "decade", "plausible-projection"),
    buildSeed("d2", "decade", "plausible-projection"),
    buildSeed("d3", "decade", "plausible-projection"),
    buildSeed("p1", "present", "highly-speculative"),
    buildSeed("p2", "present", "highly-speculative"),
  ];
  pivot.seedSelection = { aftermath: 2, decade: 2, present: 1 };

  return candidate;
}
