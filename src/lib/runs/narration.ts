import { z } from "zod";
import {
  narrativeHorizons,
  type ConsequenceSeed,
  type NarrativeHorizon,
  type ScenarioDefinition,
} from "@/domain/scenario";
import { SimulationValidationError, type DeterministicSimulationState } from "@/domain/simulation";
import { deriveEvents, type NarrativeEvent } from "./narrative";
import { narrationVoices, type NarrationVoice } from "./narration-voices";
import { sampleConsequenceSeeds } from "./seed-sampling";
import { hashString } from "./seeded-random";

export const narrationSchema = z.object({
  headline: z.string().min(1),
  sections: z.array(
    z.object({
      horizon: z.enum(narrativeHorizons),
      text: z.string().min(1),
      basedOn: z.array(z.string()),
    }),
  ),
});

export type Narration = z.infer<typeof narrationSchema>;

/** Groq strict structured outputs require every property to be required and additionalProperties to be false. */
export const narrationJsonSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          horizon: { type: "string", enum: [...narrativeHorizons] },
          text: { type: "string" },
          basedOn: { type: "array", items: { type: "string" } },
        },
        required: ["horizon", "text", "basedOn"],
        additionalProperties: false,
      },
    },
  },
  required: ["headline", "sections"],
  additionalProperties: false,
} as const;

export class NarrationFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NarrationFormatError";
  }
}

export interface NarrationPivot {
  id: string;
  label: string;
  description: string;
  interventionSummary: string;
  minimalRewrite?: string | undefined;
}

export interface NarrationInput {
  scenarioTitle: string;
  setting: string;
  pivot: NarrationPivot;
  voice: NarrationVoice;
  horizons: NarrativeHorizon[];
  events: NarrativeEvent[];
  seeds: ConsequenceSeed[];
  allowedIds: Set<string>;
}

export interface NarrationSource {
  id: string;
  title: string;
  author: string;
  kind: string;
  sourceUrl: string;
}

export function pickNarrationVoice(randomSeed: string): NarrationVoice {
  return narrationVoices[hashString(`${randomSeed}:voice`) % narrationVoices.length];
}

/** IDs a section of the given horizon may cite as its own evidence. */
export function idsForHorizon(input: NarrationInput, horizon: NarrativeHorizon): string[] {
  const seedIds = input.seeds.filter((seed) => seed.horizon === horizon).map(({ id }) => id);
  return horizon === "aftermath" ? [...input.events.map(({ id }) => id), ...seedIds] : seedIds;
}

export function buildNarrationInput(
  scenario: ScenarioDefinition,
  state: DeterministicSimulationState,
  randomSeed: string,
  voiceOverride?: NarrationVoice,
): NarrationInput {
  const choice = scenario.basicChoices.find(({ id }) => id === state.selectedBasicChoiceId);
  if (!choice) {
    throw new SimulationValidationError(`Unknown basic choice: ${state.selectedBasicChoiceId}`);
  }

  // A pivot changes one moment, so it narrates from its own sourced events. Events from resolved
  // forks describe other, independent decisions and can contradict the pivot (for example a fork
  // event in which Churchill rallies the Cabinet alongside a pivot in which Halifax prevails).
  const events = choice.consequenceSeeds.length > 0 ? choice.narrativeEvents : deriveEvents(state, scenario);
  const seeds = sampleConsequenceSeeds(choice, randomSeed);
  const hasSeeds = (horizon: NarrativeHorizon) => seeds.some((seed) => seed.horizon === horizon);
  const horizons = narrativeHorizons.filter((horizon) =>
    horizon === "aftermath" ? events.length > 0 || hasSeeds(horizon) : hasSeeds(horizon),
  );

  return {
    scenarioTitle: scenario.title,
    setting: `${scenario.title}. ${scenario.divergence.historicalEvent} ${scenario.divergence.initialConditions.join(" ")}`,
    pivot: {
      id: choice.id,
      label: choice.label,
      description: choice.description,
      interventionSummary: choice.interventionSummary,
      minimalRewrite: choice.plausibility?.minimalRewrite,
    },
    voice: voiceOverride ?? pickNarrationVoice(randomSeed),
    horizons,
    events,
    seeds,
    allowedIds: new Set([...events.map(({ id }) => id), ...seeds.map(({ id }) => id)]),
  };
}

const SYSTEM_PROMPT = `You are the narration renderer for Your Story, an alternate-history game. A player has changed one historical moment. You receive the setting, the player's pivot, approved events that were sourced and reviewed by a human, and consequence seeds grouped by time horizon (aftermath, decade, present). Every item has an ID and an evidence classification.

Write a short narrative in the requested voice. Return JSON with a headline and one section per required horizon, in the order given.

Rules:
1. Use ONLY the supplied material. Do not add any person, organization, place, date, number, quotation, or event that is not in it. Written-out numbers count as numbers.
2. Never strengthen a claim. A documented-fact may be stated plainly. A direct-inference or plausible-projection needs hedged verbs such as likely, would, or might. A highly-speculative item must be framed clearly as speculation.
3. List in basedOn the ID of every event or seed a section uses. Never list an ID that was not supplied. Each section must use at least one item from its own horizon; for aftermath that means an approved event or an aftermath seed.
4. The decade section and the present section must use hedged language. The present section must make plain that it is speculation about an alternate present, not established history.
5. The voice changes tone only. Do not invent a narrator's name, a publication, a byline, or a dateline.
6. Write the headline in sentence case, with capital letters only on the first word and proper nouns.
7. Each section is one or two short paragraphs of plain prose separated by a blank line. No markdown and no lists.`;

const VOICE_GUIDES: Record<NarrationVoice, string> = {
  historian: "A historian's retrospective: measured and analytical, written from a distance of decades.",
  dispatch:
    "A newsroom dispatch: terse, factual, short sentences. In the decade and present sections, shift to a reflective feature-writer's tone.",
  memoir:
    "A memoir: the reflective first-person voice of an unnamed observer. Express feelings and reflections only; never describe personal experiences or events that are not in the supplied material.",
};

export function buildNarrationPrompt(input: NarrationInput): { system: string; user: string } {
  const lines = [
    `Voice: ${input.voice} - ${VOICE_GUIDES[input.voice]}`,
    `Required sections, in order: ${input.horizons.join(", ")}`,
    "",
    `Setting: ${input.setting}`,
    `The player's pivot: ${input.pivot.label}. ${input.pivot.description} ${input.pivot.interventionSummary}`,
  ];

  if (input.pivot.minimalRewrite) {
    lines.push(`Why this change was plausible (background): ${input.pivot.minimalRewrite}`);
  }

  lines.push("", "Approved events:");
  if (input.events.length === 0) lines.push("- none");
  input.events.forEach((event) => {
    lines.push(`- [${event.id}] (${event.classification}, ${event.date}) ${event.title}: ${event.summary}`);
  });

  input.horizons.forEach((horizon) => {
    const seeds = input.seeds.filter((seed) => seed.horizon === horizon);
    if (seeds.length === 0) return;
    lines.push("", `Consequence seeds (${horizon}):`);
    seeds.forEach((seed) => {
      lines.push(`- [${seed.id}] (${seed.classification}) ${seed.title}: ${seed.summary}`);
    });
  });

  return { system: SYSTEM_PROMPT, user: lines.join("\n") };
}

export function parseNarration(raw: string): Narration {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new NarrationFormatError("The response was not valid JSON.");
  }

  const result = narrationSchema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
    throw new NarrationFormatError(`The response did not match the required structure: ${detail}`);
  }
  return result.data;
}

export function renderNarrationText(narration: Narration): string {
  return narration.sections.map(({ text }) => text.trim()).join("\n\n");
}

export function collectSources(
  scenario: ScenarioDefinition,
  events: { evidenceIds: string[] }[],
  seeds: { evidenceIds: string[] }[],
): NarrationSource[] {
  const cited = new Set([...events, ...seeds].flatMap(({ evidenceIds }) => evidenceIds));
  return scenario.sources
    .filter(({ id }) => cited.has(id))
    .map(({ id, title, author, kind, sourceUrl }) => ({ id, title, author, kind, sourceUrl }));
}

/** Everything the model was shown, as event-shaped items, so name and number checks can compare against it. */
export function toSourceItems(input: NarrationInput): NarrativeEvent[] {
  const context = (id: string, title: string, summary: string): NarrativeEvent => ({
    id,
    date: "",
    title,
    summary,
    classification: "documented-fact",
    evidenceIds: ["context"],
    causalFactorIds: [],
  });

  return [
    ...input.events,
    ...input.seeds.map((seed) => ({
      id: seed.id,
      date: "",
      title: seed.title,
      summary: seed.summary,
      classification: seed.classification,
      evidenceIds: seed.evidenceIds,
      causalFactorIds: seed.causalFactorIds,
    })),
    context("context-setting", input.scenarioTitle, input.setting),
    context(
      "context-pivot",
      input.pivot.label,
      `${input.pivot.description} ${input.pivot.interventionSummary} ${input.pivot.minimalRewrite ?? ""}`,
    ),
  ];
}
