import type { ScenarioDefinition } from "@/domain/scenario";
import { dunkirk1940 } from "./dunkirk-1940";
import { midway1942 } from "./midway-1942";
import { berlinAirlift1948 } from "./berlin-airlift-1948";
import { cubanMissileCrisis1962 } from "./cuban-missile-crisis-1962";

export const scenarios: readonly ScenarioDefinition[] = [
  dunkirk1940,
  midway1942,
  berlinAirlift1948,
  cubanMissileCrisis1962,
];
export const scenariosById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
