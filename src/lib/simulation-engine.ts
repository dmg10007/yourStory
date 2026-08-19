import type { ScenarioDefinition } from "@/domain/scenario";
import {
  type DecisionCommand,
  type DeterministicSimulationState,
  type SimulationInput,
  type SimulationTraceEntry,
  SimulationValidationError,
  type ScenarioRun,
} from "@/domain/simulation";

/** Narrative providers consume results from this deterministic engine; they do not alter them. */
export interface SimulationEngine { run(input: Omit<ScenarioRun, "branches">): Promise<ScenarioRun>; }

function isStepAligned(value: number, minimum: number, step: number) {
  const steps = (value - minimum) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-10;
}

function validateVariableValue(variable: ScenarioDefinition["advancedVariables"][number], value: number) {
  if (!Number.isFinite(value)) {
    throw new SimulationValidationError(`Advanced variable ${variable.id} must be finite`);
  }
  if (value < variable.minimum || value > variable.maximum) {
    throw new SimulationValidationError(`Advanced variable ${variable.id} must be between ${variable.minimum} and ${variable.maximum}`);
  }
  if (!isStepAligned(value, variable.minimum, variable.step)) {
    throw new SimulationValidationError(`Advanced variable ${variable.id} must align with step ${variable.step}`);
  }
}

export function initializeSimulation(
  scenario: ScenarioDefinition,
  input: SimulationInput,
): DeterministicSimulationState {
  if (!scenario.basicChoices.some(({ id }) => id === input.basicChoiceId)) {
    throw new SimulationValidationError(`Unknown basic choice: ${input.basicChoiceId}`);
  }

  const overrides = input.advancedVariableOverrides ?? {};
  const variablesById = new Map(scenario.advancedVariables.map((variable) => [variable.id, variable]));
  Object.keys(overrides).forEach((variableId) => {
    if (!variablesById.has(variableId)) {
      throw new SimulationValidationError(`Unknown advanced variable: ${variableId}`);
    }
  });

  const trace: SimulationTraceEntry[] = [
    { type: "simulation-initialized", scenarioId: scenario.id, basicChoiceId: input.basicChoiceId },
  ];
  const advancedVariableValues: Record<string, number> = {};

  scenario.advancedVariables.forEach((variable) => {
    const value = overrides[variable.id] ?? variable.baseline;
    validateVariableValue(variable, value);
    advancedVariableValues[variable.id] = value;
    trace.push({
      type: "advanced-variable-set",
      variableId: variable.id,
      value,
      source: Object.hasOwn(overrides, variable.id) ? "override" : "baseline",
    });
  });

  const causalFactorValues = Object.fromEntries(scenario.causalFactors.map(({ id }) => [id, 0]));

  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    selectedBasicChoiceId: input.basicChoiceId,
    advancedVariableValues,
    causalFactorValues,
    resolvedForkIds: [],
    trace,
  };
}

export function resolveDecision(
  state: DeterministicSimulationState,
  scenario: ScenarioDefinition,
  command: DecisionCommand,
): DeterministicSimulationState {
  if (state.scenarioId !== scenario.id || state.scenarioVersion !== scenario.version) {
    throw new SimulationValidationError("Simulation state does not match the supplied scenario");
  }
  if (state.resolvedForkIds.includes(command.forkId)) {
    throw new SimulationValidationError(`Decision fork already resolved: ${command.forkId}`);
  }

  const fork = scenario.decisionForks.find(({ id }) => id === command.forkId);
  if (!fork) {
    throw new SimulationValidationError(`Unknown decision fork: ${command.forkId}`);
  }
  const choice = fork.choices.find(({ id }) => id === command.choiceId);
  if (!choice) {
    throw new SimulationValidationError(`Unknown choice ${command.choiceId} for decision fork ${command.forkId}`);
  }

  const causalFactorValues = { ...state.causalFactorValues };
  choice.effects.forEach(({ factorId, delta }) => {
    causalFactorValues[factorId] += delta;
  });

  return {
    ...state,
    causalFactorValues,
    resolvedForkIds: [...state.resolvedForkIds, fork.id],
    trace: [
      ...state.trace,
      { type: "decision-resolved", forkId: fork.id, choiceId: choice.id, effects: choice.effects.map(({ factorId, delta }) => ({ factorId, delta })) },
    ],
  };
}
