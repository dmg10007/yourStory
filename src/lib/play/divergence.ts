export interface DivergenceResult {
  score: number;
  label: string;
  badge: string;
  severity: "subtle" | "moderate" | "radical" | "extreme";
}

/**
 * Calculates a thematic "Timeline Divergence" percentage (0-100%) and dramatic
 * classification based on the choice type, causal factor shifts, and resolved forks.
 */
export function calculateDivergence(params: {
  choiceId: string;
  factorValues?: Record<string, number>;
  resolvedForkCount?: number;
}): DivergenceResult {
  const { choiceId, factorValues = {}, resolvedForkCount = 0 } = params;

  // Historical baseline choice has minimal divergence
  if (choiceId === "historical" || choiceId === "historical-discovery") {
    return {
      score: 0,
      label: "Recorded Timeline (Historical)",
      badge: "Historical Baseline",
      severity: "subtle",
    };
  }

  // Base counterfactual jump
  let score = 52;

  // Add weight from causal factor shifts
  const factorDeltas = Object.values(factorValues);
  const totalFactorShift = factorDeltas.reduce((acc, val) => acc + Math.abs(val), 0);
  score += Math.min(28, totalFactorShift * 7);

  // Add weight for resolved decision forks
  score += Math.min(18, resolvedForkCount * 6);

  // Clamp score between 40% and 96% for counterfactual projections
  score = Math.max(40, Math.min(96, Math.round(score)));

  if (score >= 88) {
    return {
      score,
      label: "Existential Reality Reordering",
      badge: "⚡ Extreme Divergence",
      severity: "extreme",
    };
  }
  if (score >= 74) {
    return {
      score,
      label: "Radical Historical Fracture",
      badge: "⚡ Radical Shift",
      severity: "radical",
    };
  }
  if (score >= 60) {
    return {
      score,
      label: "Significant Timeline Fracture",
      badge: "⚡ Major Fracture",
      severity: "moderate",
    };
  }
  return {
    score,
    label: "Moderate Geopolitical Ripple",
    badge: "⚡ Moderate Ripple",
    severity: "subtle",
  };
}
