import { scenarioSchema, type ScenarioDefinition } from "@/domain/scenario";

export const dunkirk1940: ScenarioDefinition = scenarioSchema.parse({
  id: "dunkirk-1940",
  title: "Dunkirk: The Narrowing Shore",
  eventPackId: "wwii-europe",
  status: "reviewed",
  version: "0.1.0",
  sourceLibraryVersion: "wwii-europe-reviewed-1",
  divergence: {
    date: "1940-05-24",
    historicalEvent: "The German halt order pauses armored movement toward the Dunkirk perimeter.",
    counterfactualPremise: "The player changes evacuation capacity or the operational pressure on the Allied perimeter.",
    initialConditions: [
      "The British Expeditionary Force and Allied troops are withdrawing toward Dunkirk.",
      "The evacuation is constrained by time, transport capacity, weather, and the defensive perimeter.",
    ],
  },
  contentWarning: "This scenario concerns war, displacement, military casualties, and Nazi Germany. It is presented for historical exploration with contextual care.",
  baselineSummary: "A constrained May 1940 state centered on the Allied evacuation from Dunkirk. Causal weights and outcome probabilities remain unmodeled.",
  sources: [{
    id: "src-dunkirk-001",
    title: "Dunkirk: Retreat to Victory",
    author: "Julian Thompson",
    kind: "secondary",
    version: "2008 edition",
    publishedYear: 2008,
    sourceUrl: "https://archive.org/details/dunkirkretreatto0000thom_m7p",
    locator: "Whole work; scenario baseline and evacuation context",
    claimsSupported: ["Evacuation context", "Allied force availability", "British political resolve"],
    rightsNote: "Metadata only; excerpts require rights review.",
    reviewStatus: "reviewed",
  }],
  basicChoices: [
    { id: "historical", label: "Historical evacuation", description: "Use the historical baseline.", interventionSummary: "Evacuation broadly follows the recorded course." },
    { id: "reduced-evacuation", label: "Reduced evacuation", description: "Fewer Allied personnel are evacuated.", interventionSummary: "Evacuation capacity and holding period are reduced." },
    { id: "expanded-evacuation", label: "Expanded evacuation", description: "More Allied personnel are evacuated.", interventionSummary: "Evacuation capacity and holding period are increased." },
    { id: "no-halt-order", label: "No halt order", description: "German armored formations continue advancing.", interventionSummary: "Operational pressure near the perimeter is increased." },
  ],
  advancedVariables: [
    { id: "evacuation-capacity", category: "military", label: "Evacuation capacity", baseline: 0, minimum: -2, maximum: 2, step: 1, affectedFactorIds: ["evacuation-capacity", "allied-trained-force"] },
    { id: "british-resolve", category: "politics", label: "British political resolve", baseline: 0, minimum: -2, maximum: 2, step: 1, affectedFactorIds: ["british-political-resolve"] },
  ],
  causalFactors: [
    { id: "evacuation-capacity", label: "Evacuation capacity", evidenceIds: ["src-dunkirk-001"] },
    { id: "allied-trained-force", label: "Allied trained-force availability", evidenceIds: ["src-dunkirk-001"] },
    { id: "british-political-resolve", label: "British political resolve", evidenceIds: ["src-dunkirk-001"] },
  ],
  decisionForks: [{
    id: "armistice-debate-1940",
    date: "1940-06",
    label: "The armistice debate",
    choices: [
      { id: "continue-war", label: "Continue the war", description: "Reject negotiations and continue the British war effort.", effects: [{ factorId: "british-political-resolve", delta: 1 }] },
      { id: "explore-negotiations", label: "Explore negotiations", description: "Open a path to explore a negotiated settlement.", effects: [{ factorId: "british-political-resolve", delta: -1 }] },
    ],
  }],
});
