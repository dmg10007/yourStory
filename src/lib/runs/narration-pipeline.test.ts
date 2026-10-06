import { describe, expect, it, vi } from "vitest";
import type { Narration } from "./narration";
import { NarrationGenerationError, produceNarration, type DraftRequester } from "./narration-pipeline";
import { buildValidNarration, inputFor } from "./narration-fixture";

const input = inputFor("war-cabinet-negotiates");
const valid = buildValidNarration(input);

function withUnknownId(narration: Narration): Narration {
  return {
    ...narration,
    sections: narration.sections.map((section, index) => (index === 0 ? { ...section, basedOn: [...section.basedOn, "made-up-id"] } : section)),
  };
}

function withUnknownIdAndNumber(narration: Narration): Narration {
  const flagged = withUnknownId(narration);
  return {
    ...flagged,
    sections: flagged.sections.map((section, index) => (index === 0 ? { ...section, text: "In 1999 this would likely have shaped events, and it might have gone differently." } : section)),
  };
}

function requesterReturning(...drafts: string[]) {
  const requester = vi.fn<DraftRequester>();
  drafts.forEach((draft) => requester.mockResolvedValueOnce(draft));
  return requester;
}

describe("produceNarration", () => {
  it("returns the first draft when it validates", async () => {
    const requester = requesterReturning(JSON.stringify(valid));
    const result = await produceNarration(input, requester);

    expect(result.attempts).toBe(1);
    expect(result.validation.flagged).toBe(false);
    expect(requester).toHaveBeenCalledTimes(1);
  });

  it("retries once with the findings fed back and returns a clean second draft", async () => {
    const requester = requesterReturning(JSON.stringify(withUnknownId(valid)), JSON.stringify(valid));
    const result = await produceNarration(input, requester);
    const retryMessages = requester.mock.calls[1][0];

    expect(result.attempts).toBe(2);
    expect(result.validation.flagged).toBe(false);
    expect(retryMessages[retryMessages.length - 1].content).toContain("unknown-source-id: made-up-id");
  });

  it("keeps the second draft when it has fewer findings", async () => {
    const first = withUnknownIdAndNumber(valid);
    const second = withUnknownId(valid);
    const result = await produceNarration(input, requesterReturning(JSON.stringify(first), JSON.stringify(second)));

    expect(result.attempts).toBe(2);
    expect(result.narration).toEqual(second);
    expect(result.validation.flaggedTerms).toHaveLength(1);
  });

  it("keeps the first draft when the retry is worse", async () => {
    const first = withUnknownId(valid);
    const second = withUnknownIdAndNumber(valid);
    const result = await produceNarration(input, requesterReturning(JSON.stringify(first), JSON.stringify(second)));

    expect(result.narration).toEqual(first);
    expect(result.validation.flagged).toBe(true);
  });

  it("treats malformed JSON as a failed attempt and retries", async () => {
    const requester = requesterReturning("not json", JSON.stringify(valid));
    const result = await produceNarration(input, requester);

    expect(result.attempts).toBe(2);
    expect(result.validation.flagged).toBe(false);
  });

  it("throws when no attempt returns usable JSON", async () => {
    await expect(produceNarration(input, requesterReturning("oops", "still not json"))).rejects.toThrow(NarrationGenerationError);
  });
});
