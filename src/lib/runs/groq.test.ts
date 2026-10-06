import { describe, expect, it, vi } from "vitest";
import { GroqRequestError, createGroqRequester } from "./groq";

const messages = [{ role: "user" as const, content: "hello" }];

function fakeFetch(response: Response) {
  return vi.fn(async (_url: string, _init?: RequestInit) => response);
}

describe("createGroqRequester", () => {
  it("requests strict structured output from the configured model and returns the content", async () => {
    const fetchImpl = fakeFetch(new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 }));
    const requester = createGroqRequester({ apiKey: "key", model: "test-model", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(requester(messages)).resolves.toBe("{}");

    const init = fetchImpl.mock.calls[0][1];
    const sent = JSON.parse(String(init?.body));
    expect(sent.model).toBe("test-model");
    expect(sent.reasoning_effort).toBe("low");
    expect(sent.response_format.type).toBe("json_schema");
    expect(sent.response_format.json_schema.strict).toBe(true);
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer key");
  });

  it("throws a GroqRequestError carrying the status when Groq rejects the request", async () => {
    const fetchImpl = fakeFetch(new Response("model_not_found", { status: 404 }));
    const requester = createGroqRequester({ apiKey: "key", model: "gone", fetchImpl: fetchImpl as unknown as typeof fetch });

    const error = await requester(messages).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(GroqRequestError);
    expect(error).toMatchObject({ name: "GroqRequestError", status: 404 });
  });

  it("returns an empty string when the response has no content", async () => {
    const fetchImpl = fakeFetch(new Response(JSON.stringify({ choices: [] }), { status: 200 }));
    const requester = createGroqRequester({ apiKey: "key", model: "m", fetchImpl: fetchImpl as unknown as typeof fetch });

    await expect(requester(messages)).resolves.toBe("");
  });
});
