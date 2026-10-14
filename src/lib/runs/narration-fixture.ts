import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { initializeSimulation } from "@/lib/simulation-engine";
import { buildNarrationInput, idsForHorizon, type Narration, type NarrationInput } from "./narration";

export function inputFor(basicChoiceId: string, runId = "run-1"): NarrationInput {
  const state = initializeSimulation(dunkirk1940, { basicChoiceId });
  return buildNarrationInput(dunkirk1940, state, runId);
}

const FILLER =
  "The Cabinet's choice carried forward because the changed factors kept shaping the years that followed, and the country felt the difference in its politics and in daily life.";

/** About 140 words, told in plain past tense with a causal link, enough to satisfy every v5 length and wording rule. */
export const LONG_TEXT = Array.from({ length: 5 }, () => FILLER).join(" ");

/** A narration that satisfies every v5 rule for the given input. */
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
