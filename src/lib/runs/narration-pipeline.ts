import { buildNarrationPrompt, NarrationFormatError, parseNarration, type Narration, type NarrationInput } from "./narration";
import { validateNarration, type NarrationValidationResult } from "./narration-validation";

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
 * When both drafts are flagged it keeps the one with fewer findings, so the caller can store it
 * as flagged for review instead of discarding the play.
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
    if (!best || validation.flaggedTerms.length < best.validation.flaggedTerms.length) {
      best = { narration, validation };
    }
    if (!validation.flagged) break;
    reasons = validation.flaggedTerms.map(({ rule, term }) => `${rule}: ${term}`);
  }

  if (!best) throw new NarrationGenerationError("The model did not return a usable narration.");
  return { ...best, attempts };
}
