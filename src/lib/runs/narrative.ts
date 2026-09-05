import type { ScenarioDefinition } from "@/domain/scenario";
import type { DeterministicSimulationState } from "@/domain/simulation";

export type NarrativeEvent = ScenarioDefinition["basicChoices"][number]["narrativeEvents"][number];

/**
 * Deterministically derives the ordered list of authored, reviewed events that
 * correspond to a resolved simulation state. This function performs no
 * generation of its own -- it only selects events that a human author already
 * wrote and classified in the scenario definition. Nothing here can produce a
 * claim that was not explicitly authored and cited. This is the boundary the
 * project's "causality before narration" principle depends on: this function
 * is part of the deterministic, versioned model; narration (LLM prose
 * rendering) happens strictly downstream of its output.
 */
export function deriveEvents(
  state: DeterministicSimulationState,
  scenario: ScenarioDefinition,
): NarrativeEvent[] {
  const events: NarrativeEvent[] = [];

  const basicChoice = scenario.basicChoices.find((choice) => choice.id === state.selectedBasicChoiceId);
  if (basicChoice) {
    events.push(...basicChoice.narrativeEvents);
  }

  for (const traceEntry of state.trace) {
    if (traceEntry.type !== "decision-resolved") continue;
    const fork = scenario.decisionForks.find((item) => item.id === traceEntry.forkId);
    const choice = fork?.choices.find((item) => item.id === traceEntry.choiceId);
    if (choice) {
      events.push(...choice.narrativeEvents);
    }
  }

  return events;
}
