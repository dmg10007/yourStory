import { describe, expect, it } from "vitest";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { SimulationValidationError } from "@/domain/simulation";
import { getScenario, replayRun } from "./replay";

describe("scenario registry and replay", () => {
  it("resolves registered scenarios by ID", () => {
    expect(getScenario("dunkirk-1940")).toBe(dunkirk1940);
  });

  it("rejects an unknown scenario", () => {
    expect(() => getScenario("not-a-scenario")).toThrow(SimulationValidationError);
  });

  it("replays a saved run with no resolved forks", () => {
    const state = replayRun("dunkirk-1940", dunkirk1940.version, "war-cabinet-negotiates", {}, []);

    expect(state.selectedBasicChoiceId).toBe("war-cabinet-negotiates");
    expect(state.resolvedForkIds).toEqual([]);
  });

  it("refuses to replay a run saved under a different scenario version", () => {
    expect(() => replayRun("dunkirk-1940", "0.0.1", "historical", {}, [])).toThrow(SimulationValidationError);
  });
});
