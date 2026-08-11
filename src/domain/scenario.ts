import { z } from "zod";

export const scenarioSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), eventPackId: z.string().min(1), status: z.enum(["draft", "reviewed", "available"]), version: z.string().min(1), sourceLibraryVersion: z.string().min(1), divergenceDate: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/), contentWarning: z.string().min(1), baselineSummary: z.string().min(1),
  sources: z.array(z.object({ id: z.string().min(1), title: z.string().min(1), author: z.string().min(1), kind: z.enum(["primary", "secondary", "reference"]), version: z.string().min(1), rightsNote: z.string().min(1), reviewStatus: z.enum(["draft", "reviewed", "approved"]) })).min(1),
  basicChoices: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), description: z.string().min(1), interventionSummary: z.string().min(1) })).min(2),
  advancedVariables: z.array(z.object({ id: z.string().min(1), category: z.enum(["politics", "military", "leadership", "publicOpinion", "technology", "economy", "diplomacy"]), label: z.string().min(1), baseline: z.number(), minimum: z.number(), maximum: z.number(), step: z.number().positive(), affectedFactorIds: z.array(z.string()).min(1) })).min(1),
  causalFactors: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), evidenceIds: z.array(z.string()).min(1) })).min(1),
  decisionForks: z.array(z.object({ id: z.string().min(1), date: z.string().min(1), label: z.string().min(1), choiceIds: z.array(z.string()).min(2) }))
});
export type ScenarioDefinition = z.infer<typeof scenarioSchema>;
