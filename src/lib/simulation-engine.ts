import type { ScenarioRun } from "@/domain/simulation";

/** Narrative providers consume results from this deterministic engine; they do not alter them. */
export interface SimulationEngine { run(input: Omit<ScenarioRun, "branches">): Promise<ScenarioRun>; }
