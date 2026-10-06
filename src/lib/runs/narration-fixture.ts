import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { initializeSimulation } from "@/lib/simulation-engine";
import { buildNarrationInput, idsForHorizon, type Narration, type NarrationInput } from "./narration";

export function inputFor(basicChoiceId: string, runId = "run-1"): NarrationInput {
  const state = initializeSimulation(dunkirk1940, { basicChoiceId });
  return buildNarrationInput(dunkirk1940, state, runId);
}

export const HEDGED_TEXT = "This would likely have shaped events, and it might have gone differently.";

/** A narration that satisfies every v3 rule for the given input. */
export function buildValidNarration(input: NarrationInput): Narration {
  return {
    headline: "A different summer",
    sections: input.horizons.map((horizon) => ({
      horizon,
      text: HEDGED_TEXT,
      basedOn: [idsForHorizon(input, horizon)[0]],
    })),
  };
}
