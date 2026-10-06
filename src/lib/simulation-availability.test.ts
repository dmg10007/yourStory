import { describe, expect, it } from "vitest";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import { safeParseScenario, scenarioSchema, type AvailabilityCondition } from "@/domain/scenario";
import { SimulationValidationError } from "@/domain/simulation";
import { getAvailableForks, initializeSimulation, isForkAvailable, resolveDecision } from "./simulation-engine";

const FOLLOW_UP_FORK_ID = "follow-up-decision";

const requiresContinueWar: AvailabilityCondition[] = [
  { type: "choice-resolved", forkId: "armistice-debate-1940", choiceIds: ["continue-war"] },
];

function buildCandidate(availableWhen: AvailabilityCondition[]) {
  const candidate = structuredClone(dunkirk1940);
  candidate.decisionForks.push({
    id: FOLLOW_UP_FORK_ID,
    date: "1940-07",
    label: "Follow-up decision",
    availableWhen,
    choices: [
      { id: "proceed", label: "Proceed", description: "Proceed with the follow-up.", effects: [{ factorId: "british-political-resolve", delta: 1 }], narrativeEvents: [] },
      { id: "hold", label: "Hold", description: "Hold position.", effects: [{ factorId: "british-political-resolve", delta: -1 }], narrativeEvents: [] },
    ],
  });
  return candidate;
}

function getFork(scenario: ReturnType<typeof buildCandidate>, forkId: string) {
  const fork = scenario.decisionForks.find(({ id }) => id === forkId);
  if (!fork) throw new Error(`Missing fork ${forkId}`);
  return fork;
}

describe("conditional decision forks", () => {
  it("keeps forks without conditions available until they are resolved", () => {
    const initial = initializeSimulation(dunkirk1940, { basicChoiceId: "historical" });

    expect(getAvailableForks(initial, dunkirk1940).map(({ id }) => id)).toEqual(dunkirk1940.decisionForks.map(({ id }) => id));
  });

  it("blocks a conditional fork until its prerequisite choice is resolved", () => {
    const scenario = scenarioSchema.parse(buildCandidate(requiresContinueWar));
    const initial = initializeSimulation(scenario, { basicChoiceId: "historical" });

    expect(isForkAvailable(initial, getFork(scenario, FOLLOW_UP_FORK_ID))).toBe(false);
    expect(() => resolveDecision(initial, scenario, { forkId: FOLLOW_UP_FORK_ID, choiceId: "proceed" })).toThrow(SimulationValidationError);
  });

  it("unlocks a conditional fork when the prerequisite is resolved with a listed choice", () => {
    const scenario = scenarioSchema.parse(buildCandidate(requiresContinueWar));
    const initial = initializeSimulation(scenario, { basicChoiceId: "historical" });
    const afterPrerequisite = resolveDecision(initial, scenario, { forkId: "armistice-debate-1940", choiceId: "continue-war" });

    expect(getAvailableForks(afterPrerequisite, scenario).map(({ id }) => id)).toContain(FOLLOW_UP_FORK_ID);

    const resolved = resolveDecision(afterPrerequisite, scenario, { forkId: FOLLOW_UP_FORK_ID, choiceId: "proceed" });
    expect(resolved.resolvedForkIds).toEqual(["armistice-debate-1940", FOLLOW_UP_FORK_ID]);
  });

  it("keeps a conditional fork locked when the prerequisite was resolved with a different choice", () => {
    const scenario = scenarioSchema.parse(buildCandidate(requiresContinueWar));
    const initial = initializeSimulation(scenario, { basicChoiceId: "historical" });
    const afterPrerequisite = resolveDecision(initial, scenario, { forkId: "armistice-debate-1940", choiceId: "explore-negotiations" });

    expect(isForkAvailable(afterPrerequisite, getFork(scenario, FOLLOW_UP_FORK_ID))).toBe(false);
    expect(() => resolveDecision(afterPrerequisite, scenario, { forkId: FOLLOW_UP_FORK_ID, choiceId: "proceed" })).toThrow(SimulationValidationError);
  });

  it("supports causal-factor thresholds", () => {
    const scenario = scenarioSchema.parse(buildCandidate([{ type: "factor-at-least", factorId: "british-political-resolve", value: 1 }]));
    const initial = initializeSimulation(scenario, { basicChoiceId: "historical" });
    const afterPrerequisite = resolveDecision(initial, scenario, { forkId: "armistice-debate-1940", choiceId: "continue-war" });

    expect(isForkAvailable(initial, getFork(scenario, FOLLOW_UP_FORK_ID))).toBe(false);
    expect(isForkAvailable(afterPrerequisite, getFork(scenario, FOLLOW_UP_FORK_ID))).toBe(true);
  });

  it("removes a fork from the available list once it is resolved", () => {
    const initial = initializeSimulation(dunkirk1940, { basicChoiceId: "historical" });
    const resolved = resolveDecision(initial, dunkirk1940, { forkId: "armistice-debate-1940", choiceId: "continue-war" });

    expect(getAvailableForks(resolved, dunkirk1940).map(({ id }) => id)).not.toContain("armistice-debate-1940");
  });
});

describe("availableWhen schema validation", () => {
  it("rejects a condition that references an unknown fork", () => {
    const candidate = buildCandidate([{ type: "choice-resolved", forkId: "missing-fork", choiceIds: ["continue-war"] }]);

    expect(safeParseScenario(candidate).success).toBe(false);
  });

  it("rejects a condition that depends on its own or a later fork", () => {
    const candidate = buildCandidate([{ type: "choice-resolved", forkId: FOLLOW_UP_FORK_ID, choiceIds: ["proceed"] }]);

    expect(safeParseScenario(candidate).success).toBe(false);
  });

  it("rejects a condition that references an unknown choice", () => {
    const candidate = buildCandidate([{ type: "choice-resolved", forkId: "armistice-debate-1940", choiceIds: ["not-a-choice"] }]);

    expect(safeParseScenario(candidate).success).toBe(false);
  });

  it("rejects a threshold on an unknown causal factor", () => {
    const candidate = buildCandidate([{ type: "factor-at-least", factorId: "not-a-factor", value: 1 }]);

    expect(safeParseScenario(candidate).success).toBe(false);
  });
});
