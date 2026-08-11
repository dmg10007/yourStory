import type { ScenarioDefinition } from "@/domain/scenario";
import { dunkirk1940 } from "./dunkirk-1940";

export const scenarios: readonly ScenarioDefinition[] = [dunkirk1940];
export const scenariosById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
