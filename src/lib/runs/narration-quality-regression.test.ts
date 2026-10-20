import { describe, expect, it, vi } from "vitest";
import { buildValidNarration, inputFor, LONG_TEXT } from "./narration-fixture";
import { produceNarration, type DraftRequester } from "./narration-pipeline";
import { buildQualityNarrationPrompt } from "./narration-quality-prompt";
import { validateNarration } from "./narration-validation";

const input = inputFor("reduced-evacuation", "61276f13-2e43-454e-b67b-0b9b9f16d9b7");
const valid = buildValidNarration(input);
const rejected = {
  ...valid,
  sections: valid.sections.map((section) => section.horizon === "decade"
    ? { ...section, text: `${LONG_TEXT} By 1944 the British ground forces had finally reached strength.` }
    : section.horizon === "present" ? { ...section, text: "Britain depended on its partner because its army was smaller." } : section),
};

describe("reduced evacuation narration quality regression", () => {
  it("continues to flag unsupported recovery dates and a short present", () => {
    const result = validateNarration(rejected, input);
    expect(result.flagged).toBe(true);
    expect(result.flaggedTerms).toEqual(expect.arrayContaining([
      { term: "1944", rule: "unsupported-number", severity: "error" },
      { term: "present", rule: "too-short", severity: "error" },
    ]));
  });
  it("supplies every seed's basis and bounds the transatlantic elaboration", () => {
    const prompt = buildQualityNarrationPrompt(input);
    input.seeds.forEach((seed) => expect(prompt.user).toContain(seed.basis));
    expect(prompt.user).toContain("Scope for he-p2");
    expect(prompt.user).toContain("Do not assert that a new reconstruction pact");
    expect(prompt.system).toContain("three or four paragraphs");
    expect(prompt.system).toContain("Slower army rebuilding does not establish");
    expect(prompt.system).toContain("A date supplied for one event");
    expect(prompt.system).toContain("Keep the requested in-world voice");
  });
  it("returns a clean revision and gives the model the actual rejected draft", async () => {
    const request = vi.fn<DraftRequester>().mockResolvedValueOnce(JSON.stringify(rejected)).mockResolvedValueOnce(JSON.stringify(valid));
    const result = await produceNarration(input, request);
    expect(result.validation.flagged).toBe(false);
    expect(result.attempts).toBe(2);
    const messages = request.mock.calls[1][0];
    expect(messages.some(({ role, content }) => role === "assistant" && content === JSON.stringify(rejected))).toBe(true);
    const notice = messages[messages.length - 1].content;
    expect(notice).toContain("Remove this unsupported number or date and the milestone");
    expect(notice).toContain("Do not substitute another date");
    expect(notice).toContain("This section has");
    expect(notice).toContain("at least 120 words");
    expect(notice).toContain("Do not pad other sections");
  });
  it("keeps persistent failures flagged and does not add an automatic third call", async () => {
    const request = vi.fn<DraftRequester>().mockResolvedValue(JSON.stringify(rejected));
    const result = await produceNarration(input, request);
    expect(result.validation.flagged).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
