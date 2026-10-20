export interface NarrativeQualityFinding {
  term: string;
  rule: string;
  severity: "error" | "note";
}

export interface NarrativeQuality {
  flagged: boolean;
  flaggedTerms: NarrativeQualityFinding[];
  validationVersion: string;
}

/** Normalize stored findings without treating absent or legacy metadata as a pass. */
export function qualityFromStored(row: {
  flagged?: unknown;
  flagged_terms?: unknown;
  validation_version?: unknown;
}): NarrativeQuality | null {
  if (typeof row.flagged !== "boolean" || typeof row.validation_version !== "string" || !row.validation_version.trim()) {
    return null;
  }
  const flaggedTerms: NarrativeQualityFinding[] = [];
  if (Array.isArray(row.flagged_terms)) {
    for (const item of row.flagged_terms) {
      if (!item || typeof item !== "object" || typeof item.term !== "string" || typeof item.rule !== "string") continue;
      const severity = item.severity === "note" ? "note" : item.severity === "error" ? "error" : row.flagged ? "error" : "note";
      flaggedTerms.push({ term: item.term, rule: item.rule, severity });
    }
  }
  return {
    flagged: row.flagged || flaggedTerms.some(({ severity }) => severity === "error"),
    flaggedTerms,
    validationVersion: row.validation_version,
  };
}

export function describeQualityFinding(finding: NarrativeQualityFinding): string {
  switch (finding.rule) {
    case "too-short": return `The ${finding.term} section is shorter than required.`;
    case "unsupported-number": return `A number or date was not supplied to the narrator: ${finding.term}.`;
    case "unsupported-name": return `A name needs review: ${finding.term}.`;
    case "breaks-frame": return `Wording breaks the lived-history voice: ${finding.term}.`;
    case "missing-causal-link": return `The ${finding.term} section is missing an explicit causal link.`;
    case "missing-citation": return `The ${finding.term} section is missing a citation to its supplied material.`;
    case "unknown-source-id": return `An evidence ID was not supplied: ${finding.term}.`;
    case "invalid-structure": return "The story does not contain the required sections in order.";
    default: return `A narration check needs review: ${finding.rule} (${finding.term}).`;
  }
}
