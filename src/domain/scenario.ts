import { z } from "zod";

const historicalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/, "Use YYYY-MM or YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    if (month < 1 || month > 12) return false;
    if (day === undefined) return true;
    return new Date(Date.UTC(year, month - 1, day)).getUTCFullYear() === year
      && new Date(Date.UTC(year, month - 1, day)).getUTCMonth() === month - 1
      && new Date(Date.UTC(year, month - 1, day)).getUTCDate() === day;
  }, "Use a real calendar date");

const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  kind: z.enum(["primary", "secondary", "reference"]),
  version: z.string().min(1),
  publishedYear: z.number().int().min(1),
  sourceUrl: z.string().url(),
  locator: z.string().min(1),
  claimsSupported: z.array(z.string().min(1)).min(1),
  rightsNote: z.string().min(1),
  reviewStatus: z.enum(["draft", "reviewed", "approved"]),
});

const factorEffectSchema = z.object({
  factorId: z.string().min(1),
  delta: z.number(),
});

const basicChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  interventionSummary: z.string().min(1),
});

const decisionChoiceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  effects: z.array(factorEffectSchema).min(1),
});

export const scenarioSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    eventPackId: z.string().min(1),
    status: z.enum(["draft", "reviewed", "available"]),
    version: z.string().min(1),
    sourceLibraryVersion: z.string().min(1),
    divergence: z.object({
      date: historicalDateSchema,
      historicalEvent: z.string().min(1),
      counterfactualPremise: z.string().min(1),
      initialConditions: z.array(z.string().min(1)).min(1),
    }),
    contentWarning: z.string().min(1),
    baselineSummary: z.string().min(1),
    sources: z.array(sourceSchema).min(1),
    basicChoices: z.array(basicChoiceSchema).min(2),
    advancedVariables: z.array(z.object({
      id: z.string().min(1),
      category: z.enum(["politics", "military", "leadership", "publicOpinion", "technology", "economy", "diplomacy"]),
      label: z.string().min(1),
      baseline: z.number(),
      minimum: z.number(),
      maximum: z.number(),
      step: z.number().positive(),
      affectedFactorIds: z.array(z.string().min(1)).min(1),
    })).min(1),
    causalFactors: z.array(z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      evidenceIds: z.array(z.string().min(1)).min(1),
    })).min(1),
    decisionForks: z.array(z.object({
      id: z.string().min(1),
      date: historicalDateSchema,
      label: z.string().min(1),
      choices: z.array(decisionChoiceSchema).min(2),
    })),
  })
  .superRefine((scenario, ctx) => {
    const addDuplicateIssues = (items: { id: string }[], path: string) => {
      const ids = new Set<string>();
      items.forEach((item, index) => {
        if (ids.has(item.id)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path, index, "id"], message: `Duplicate ${path} ID: ${item.id}` });
        }
        ids.add(item.id);
      });
    };

    addDuplicateIssues(scenario.sources, "sources");
    addDuplicateIssues(scenario.basicChoices, "basicChoices");
    addDuplicateIssues(scenario.advancedVariables, "advancedVariables");
    addDuplicateIssues(scenario.causalFactors, "causalFactors");
    addDuplicateIssues(scenario.decisionForks, "decisionForks");

    const sourceIds = new Set(scenario.sources.map(({ id }) => id));
    const factorIds = new Set(scenario.causalFactors.map(({ id }) => id));

    scenario.advancedVariables.forEach((variable, index) => {
      if (variable.minimum > variable.maximum) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["advancedVariables", index], message: "minimum must not exceed maximum" });
      }
      if (variable.baseline < variable.minimum || variable.baseline > variable.maximum) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["advancedVariables", index, "baseline"], message: "baseline must be within minimum and maximum" });
      }
      if ((variable.baseline - variable.minimum) % variable.step !== 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["advancedVariables", index, "step"], message: "baseline must align with step from minimum" });
      }
      variable.affectedFactorIds.forEach((factorId, factorIndex) => {
        if (!factorIds.has(factorId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["advancedVariables", index, "affectedFactorIds", factorIndex], message: `Unknown causal factor: ${factorId}` });
        }
      });
    });

    scenario.causalFactors.forEach((factor, index) => {
      factor.evidenceIds.forEach((evidenceId, evidenceIndex) => {
        if (!sourceIds.has(evidenceId)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["causalFactors", index, "evidenceIds", evidenceIndex], message: `Unknown source: ${evidenceId}` });
        }
      });
    });

    scenario.decisionForks.forEach((fork, forkIndex) => {
      addDuplicateIssues(fork.choices, `decisionForks.${forkIndex}.choices`);
      fork.choices.forEach((choice, choiceIndex) => {
        choice.effects.forEach((effect, effectIndex) => {
          if (!factorIds.has(effect.factorId)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["decisionForks", forkIndex, "choices", choiceIndex, "effects", effectIndex, "factorId"], message: `Unknown causal factor: ${effect.factorId}` });
          }
        });
      });
    });

    if (scenario.status !== "draft") {
      scenario.sources.forEach((source, index) => {
        if (source.reviewStatus === "draft") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sources", index, "reviewStatus"], message: "Reviewed or available scenarios cannot use draft sources" });
        }
      });
    }
  });

export type ScenarioDefinition = z.infer<typeof scenarioSchema>;

export function safeParseScenario(input: unknown) {
  return scenarioSchema.safeParse(input);
}
