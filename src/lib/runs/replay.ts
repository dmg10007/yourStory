import { type ScenarioDefinition } from "@/domain/scenario";
import { initializeSimulation, resolveDecision } from "@/lib/simulation-engine";
import { SimulationValidationError, type DecisionCommand } from "@/domain/simulation";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";

const scenarioRegistry: Record<string, ScenarioDefinition> = {
  "dunkirk-1940": dunkirk1940,
};

export function getScenario(scenarioId: string): ScenarioDefinition {
  const scenario = scenarioRegistry[scenarioId];
  if (!scenario) throw new SimulationValidationError(`Unknown scenario: ${scenarioId}`);
  return scenario;
}

export function replayRun(
  scenarioId: string,
  scenarioVersion: string,
  basicChoiceId: string,
  advancedVariableOverrides: Record<string, number>,
  resolvedCommands: DecisionCommand[],
) {
  const scenario = getScenario(scenarioId);

  if (scenario.version !== scenarioVersion) {
    throw new SimulationValidationError(
      `Scenario ${scenarioId} has changed since this run was saved (saved v${scenarioVersion}, current v${scenario.version})`,
    );
  }

  let state = initializeSimulation(scenario, { basicChoiceId, advancedVariableOverrides });
  for (const command of resolvedCommands) {
    state = resolveDecision(state, scenario, command);
  }
  return state;
}
