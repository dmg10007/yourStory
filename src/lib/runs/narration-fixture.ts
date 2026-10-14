import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { initializeSimulation } from "@/lib/simulation-engine";
import { buildNarrationInput, idsForHorizon, type Narration, type NarrationInput } from "./narration";

export function inputFor(basicChoiceId: string, runId = "run-1"): NarrationInput {
  const state = initializeSimulation(dunkirk1940, { basicChoiceId });
  return buildNarrationInput(dunkirk1940, state, runId);
}

const FILLER =
  "This would likely have shaped events because the changed factors would have carried forward, and it might have gone differently in ways that could have mattered.";

/** About 156 words with hedging and a causal link, enough to satisfy every v4 length and wording rule. */
export const LONG_TEXT = Array.from({ length: 6 }, () => FILLER).join(" ");

/** A narration that satisfies every v4 rule for the given input. */
export function buildValidNarration(input: NarrationInput): Narration {
  return {
    headline: "A different summer",
    sections: input.horizons.map((horizon) => ({
      horizon,
      text: LONG_TEXT,
      basedOn: [idsForHorizon(input, horizon)[0]],
    })),
  };
}
