import type { ScenarioDefinition } from "@/domain/scenario";

export interface PivotSource {
  id: string;
  title: string;
  sourceUrl: string;
}

export interface PivotSummary {
  id: string;
  label: string;
  description: string;
  interventionSummary: string;
  minimalRewrite: string;
  sources: PivotSource[];
}

export interface MomentSummary {
  scenarioId: string;
  title: string;
  hook: string;
  date: string;
  contentWarning: string;
  pivots: PivotSummary[];
}

/**
 * Reduces a scenario to what the play screen needs. Only choices that carry a
 * minimal-rewrite case and consequence seeds are offered as pivots; the historical
 * baseline and unseeded variants stay out of the one-tap flow.
 */
export function buildMoment(scenario: ScenarioDefinition): MomentSummary {
  const pivots = scenario.basicChoices.flatMap((choice) => {
    if (!choice.plausibility || choice.consequenceSeeds.length === 0) return [];
    const cited = new Set(choice.plausibility.evidenceIds);

    return [{
      id: choice.id,
      label: choice.label,
      description: choice.description,
      interventionSummary: choice.interventionSummary,
      minimalRewrite: choice.plausibility.minimalRewrite,
      sources: scenario.sources
        .filter(({ id }) => cited.has(id))
        .map(({ id, title, sourceUrl }) => ({ id, title, sourceUrl })),
    }];
  });

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    hook: scenario.divergence.historicalEvent,
    date: scenario.divergence.date,
    contentWarning: scenario.contentWarning,
    pivots,
  };
}

export function listPlayableMoments(scenarios: readonly ScenarioDefinition[]): MomentSummary[] {
  return scenarios.map(buildMoment).filter((moment) => moment.pivots.length > 0);
}
