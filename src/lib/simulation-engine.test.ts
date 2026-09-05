import { describe, expect, it } from "vitest";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { SimulationValidationError } from "@/domain/simulation";
import { initializeSimulation, resolveDecision } from "./simulation-engine";

describe("deterministic simulation engine", () => {
  it("initializes authored baselines and zeroed causal factors", () => {
    const state = initializeSimulation(dunkirk1940, { basicChoiceId: "historical" });

    expect(state.advancedVariableValues).toEqual({ "evacuation-capacity": 0, "british-resolve": 0 });
    expect(state.causalFactorValues).toEqual({ "evacuation-capacity": 0, "allied-trained-force": 0, "british-political-resolve": 0, "french-resistance-continuity": 0, "raf-fighter-reserve": 0 });
    expect(state.trace[0]).toEqual({ type: "simulation-initialized", scenarioId: "dunkirk-1940", basicChoiceId: "historical" });
  });

  it("records valid advanced-variable overrides", () => {
    const state = initializeSimulation(dunkirk1940, { basicChoiceId: "historical", advancedVariableOverrides: { "evacuation-capacity": 1 } });

    expect(state.advancedVariableValues["evacuation-capacity"]).toBe(1);
    expect(state.trace).toContainEqual({ type: "advanced-variable-set", variableId: "evacuation-capacity", value: 1, source: "override" });
  });

  it("rejects an unknown basic choice", () => {
    expect(() => initializeSimulation(dunkirk1940, { basicChoiceId: "unknown" })).toThrow(SimulationValidationError);
  });

  it("rejects unknown, out-of-range, and off-step variable overrides", () => {
    expect(() => initializeSimulation(dunkirk1940, { basicChoiceId: "historical", advancedVariableOverrides: { unknown: 1 } })).toThrow(SimulationValidationError);
    expect(() => initializeSimulation(dunkirk1940, { basicChoiceId: "historical", advancedVariableOverrides: { "evacuation-capacity": 3 } })).toThrow(SimulationValidationError);
    expect(() => initializeSimulation(dunkirk1940, { basicChoiceId: "historical", advancedVariableOverrides: { "evacuation-capacity": 0.5 } })).toThrow(SimulationValidationError);
  });

  it("applies decision effects exactly once and preserves the prior state", () => {
    const initial = initializeSimulation(dunkirk1940, { basicChoiceId: "no-halt-order" });
    const resolved = resolveDecision(initial, dunkirk1940, { forkId: "armistice-debate-1940", choiceId: "continue-war" });

    expect(resolved.causalFactorValues["british-political-resolve"]).toBe(1);
    expect(initial.causalFactorValues["british-political-resolve"]).toBe(0);
    expect(resolved.resolvedForkIds).toEqual(["armistice-debate-1940"]);
  });

  it("returns identical results for identical commands", () => {
    const input = { basicChoiceId: "no-halt-order", advancedVariableOverrides: { "evacuation-capacity": 1 } };
    const command = { forkId: "armistice-debate-1940", choiceId: "continue-war" };

    expect(resolveDecision(initializeSimulation(dunkirk1940, input), dunkirk1940, command)).toEqual(resolveDecision(initializeSimulation(dunkirk1940, input), dunkirk1940, command));
  });

  it("rejects duplicate fork resolution", () => {
    const initial = initializeSimulation(dunkirk1940, { basicChoiceId: "historical" });
    const resolved = resolveDecision(initial, dunkirk1940, { forkId: "armistice-debate-1940", choiceId: "continue-war" });

    expect(() => resolveDecision(resolved, dunkirk1940, { forkId: "armistice-debate-1940", choiceId: "continue-war" })).toThrow(SimulationValidationError);
  });

  it("rejects a choice that does not belong to the fork", () => {
    const state = initializeSimulation(dunkirk1940, { basicChoiceId: "historical" });

    expect(() => resolveDecision(state, dunkirk1940, { forkId: "armistice-debate-1940", choiceId: "historical" })).toThrow(SimulationValidationError);
  });
});
