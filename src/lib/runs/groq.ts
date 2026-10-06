import { narrationJsonSchema } from "./narration";
import type { DraftRequester } from "./narration-pipeline";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const DEFAULT_NARRATION_MODEL = "openai/gpt-oss-120b";

export class GroqRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqRequestError";
    this.status = status;
  }
}

interface GroqConfig {
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
}

/** Strict structured outputs guarantee schema-valid JSON, so the pipeline only has to check content. */
export function createGroqRequester({ apiKey, model, fetchImpl = fetch }: GroqConfig): DraftRequester {
  return async (messages) => {
    const response = await fetchImpl(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        reasoning_effort: "low",
        include_reasoning: false,
        max_completion_tokens: 3000,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: "narration", strict: true, schema: narrationJsonSchema },
        },
      }),
    });

    if (!response.ok) {
      throw new GroqRequestError(`Groq narration request failed: ${response.status} ${await response.text()}`, response.status);
    }

    const completion = await response.json();
    const content = completion.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  };
}
