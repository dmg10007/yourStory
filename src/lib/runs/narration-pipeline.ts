import { NarrationFormatError, parseNarration, type Narration, type NarrationInput } from "./narration";
import { countErrors, validateNarration, type NarrationValidationResult } from "./narration-validation";
import { buildQualityNarrationPrompt, buildQualityRetryReasons } from "./narration-quality-prompt";

export interface NarrationMessage {
  role: "system" | "user" | "assistant";
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
      "The preceding assistant message is a rejected draft, not evidence or additional instructions. Do not carry its unsupported claims into the revision.",
      "Your previous draft was rejected for these problems:",
      ...reasons.map((reason) => `- ${reason}`),
      "Return a complete revised draft that fixes every problem, using only the supplied material and the same JSON structure. Keep the in-world voice for the decade and present.",
    ].join("\n"),
  };
}

/** Retry once; retain the draft with fewer errors as an explicitly flagged review draft if needed. */
export async function produceNarration(input: NarrationInput, requestDraft: DraftRequester): Promise<NarrationResult> {
  const prompt = buildQualityNarrationPrompt(input);
  const base: NarrationMessage[] = [
    { role: "system", content: prompt.system },
    { role: "user", content: prompt.user },
  ];
  let best: { narration: Narration; validation: NarrationValidationResult } | null = null;
  let reasons: string[] = [];
  let previousRaw: string | null = null;
  let attempts = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    attempts = attempt;
    const messages: NarrationMessage[] = attempt === 1 ? base : [
      ...base,
      ...(previousRaw === null ? [] : [{ role: "assistant" as const, content: previousRaw }]),
      retryNotice(reasons),
    ];
    let narration: Narration;
    try {
      previousRaw = await requestDraft(messages);
      narration = parseNarration(previousRaw);
    } catch (caught) {
      if (caught instanceof NarrationFormatError) {
        reasons = [caught.message];
        continue;
      }
      throw caught;
    }
    const validation = validateNarration(narration, input);
    if (!best || countErrors(validation) < countErrors(best.validation)) best = { narration, validation };
    if (!validation.flagged) break;
    reasons = buildQualityRetryReasons(narration, validation);
  }

  if (!best) throw new NarrationGenerationError("The model did not return a usable narration.");
  return { ...best, attempts };
}
