import { buildNarrationPrompt, NarrationFormatError, parseNarration, type Narration, type NarrationInput } from "./narration";
import {
  countErrors,
  validateNarration,
  type NarrationFindingRule,
  type NarrationValidationResult,
} from "./narration-validation";

export interface NarrationMessage {
  role: "system" | "user";
  content: string;
}

export type DraftRequester = (messages: NarrationMessage[]) => Promise<string>;

export interface NarrationResult {
  narration: Narration;
  validation: NarrationValidationResult;
  attempts: number;
}

export class NarrationGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NarrationGenerationError";
  }
}

const MAX_ATTEMPTS = 2;

const ADVICE: Record<NarrationFindingRule, string> = {
  "invalid-structure": "Return exactly the required sections, in the required order.",
  "unknown-source-id": "List only IDs that were supplied.",
  "missing-citation": "Cite at least one supplied item from this section's own horizon in basedOn.",
  "missing-hedging": "Use more hedged language such as would, might, could, and likely.",
  "too-short": "Write more: develop the supplied material in depth to reach the minimum length.",
  "missing-causal-link": "Show the chain of cause, naming what changed, with words such as because or as a result.",
  "unsupported-number": "Remove numbers and dates that are not in the supplied material.",
  "unsupported-name": "Remove people and organizations that are not in the supplied material.",
};

function retryNotice(reasons: string[]): NarrationMessage {
  return {
    role: "user",
    content: [
      "Your previous draft was rejected for these problems:",
      ...reasons.map((reason) => `- ${reason}`),
      "Write a new draft that fixes every problem, using only the supplied material and the same JSON structure.",
    ].join("\n"),
  };
}

/**
 * Requests a narration, validates it, and retries once with the findings fed back to the model.
 * When both drafts have errors it keeps the one with fewer, so the caller can store it as flagged
 * for review instead of discarding the play. Review notes never trigger a retry.
 */
export async function produceNarration(input: NarrationInput, requestDraft: DraftRequester): Promise<NarrationResult> {
  const prompt = buildNarrationPrompt(input);
  const base: NarrationMessage[] = [
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ];

  let best: { narration: Narration; validation: NarrationValidationResult } | null = null;
  let reasons: string[] = [];
  let attempts = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;
    const messages = attempt === 1 ? base : [...base, retryNotice(reasons)];

    let narration: Narration;
    try {
      narration = parseNarration(await requestDraft(messages));
    } catch (caught) {
      if (caught instanceof NarrationFormatError) {
        reasons = [caught.message];
        continue;
      }
      throw caught;
    }

    const validation = validateNarration(narration, input);
    if (!best || countErrors(validation) < countErrors(best.validation)) {
      best = { narration, validation };
    }
    if (!validation.flagged) break;
    reasons = validation.flaggedTerms
      .filter(({ severity }) => severity === "error")
      .map(({ rule, term }) => `${rule} (${term}): ${ADVICE[rule]}`);
  }

  if (!best) throw new NarrationGenerationError("The model did not return a usable narration.");
  return { ...best, attempts };
}
