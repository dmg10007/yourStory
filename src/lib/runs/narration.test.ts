import { describe, expect, it } from "vitest";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import {
  NarrationFormatError,
  buildNarrationPrompt,
  collectSources,
  narrationJsonSchema,
  parseNarration,
  pickNarrationVoice,
  renderNarrationText,
} from "./narration";
import { narrationVoices } from "./narration-voices";
import { buildValidNarration, inputFor } from "./narration-fixture";

function expectStrict(schema: unknown) {
  if (typeof schema !== "object" || schema === null) return;
  const node = schema as Record<string, unknown>;
  if (node.type === "object") {
    const properties = (node.properties ?? {}) as Record<string, unknown>;
    expect(node.additionalProperties).toBe(false);
    expect([...(node.required as string[])].sort()).toEqual(Object.keys(properties).sort());
    Object.values(properties).forEach(expectStrict);
  }
  if (node.type === "array") expectStrict(node.items);
}

describe("narration input", () => {
  it("requires all three horizons for a pivot", () => {
    expect(inputFor("war-cabinet-negotiates").horizons).toEqual(["aftermath", "decade", "present"]);
  });

  it("requires only the aftermath for a choice without consequence seeds", () => {
    const input = inputFor("historical");

    expect(input.horizons).toEqual(["aftermath"]);
    expect(input.seeds).toEqual([]);
  });

  it("draws the run's seeds and allows exactly the supplied IDs", () => {
    const input = inputFor("war-cabinet-negotiates");

    expect(input.seeds).toHaveLength(5);
    expect(input.allowedIds.size).toBe(input.events.length + input.seeds.length);
    expect(input.allowedIds.has("evt-pivot-cabinet-negotiates")).toBe(true);
    input.seeds.forEach((seed) => expect(input.allowedIds.has(seed.id)).toBe(true));
  });

  it("is deterministic per run and varies across runs", () => {
    const ids = (runId: string) => inputFor("war-cabinet-negotiates", runId).seeds.map(({ id }) => id).join(",");
    const distinct = new Set(Array.from({ length: 30 }, (_, index) => ids(`run-${index}`)));

    expect(ids("run-1")).toBe(ids("run-1"));
    expect(distinct.size).toBeGreaterThan(1);
  });

  it("picks a stable voice from the supported list", () => {
    const voices = Array.from({ length: 30 }, (_, index) => pickNarrationVoice(`run-${index}`));

    expect(pickNarrationVoice("run-1")).toBe(pickNarrationVoice("run-1"));
    voices.forEach((voice) => expect(narrationVoices).toContain(voice));
    expect(new Set(voices).size).toBeGreaterThan(1);
  });
});

describe("narration prompt and parsing", () => {
  it("puts the rules, required sections, and every supplied ID in the prompt", () => {
    const input = inputFor("war-cabinet-negotiates");
    const prompt = buildNarrationPrompt(input);

    expect(prompt.system).toContain("Use ONLY the supplied material");
    expect(prompt.user).toContain("Required sections, in order: aftermath, decade, present");
    input.allowedIds.forEach((id) => expect(prompt.user).toContain(`[${id}]`));
  });

  it("emits a JSON schema that satisfies Groq strict mode", () => {
    expectStrict(narrationJsonSchema);
  });

  it("parses a well-formed narration and rejects malformed output", () => {
    const valid = buildValidNarration(inputFor("war-cabinet-negotiates"));

    expect(parseNarration(JSON.stringify(valid))).toEqual(valid);
    expect(() => parseNarration("not json")).toThrow(NarrationFormatError);
    expect(() => parseNarration(JSON.stringify({ headline: "x", sections: [{ horizon: "aftermath", text: "t" }] }))).toThrow(NarrationFormatError);
  });

  it("renders section text without the headline", () => {
    const narration = { headline: "Head", sections: [{ horizon: "aftermath" as const, text: " One. ", basedOn: ["a"] }, { horizon: "decade" as const, text: "Two.", basedOn: ["b"] }] };

    expect(renderNarrationText(narration)).toBe("One.\n\nTwo.");
  });

  it("collects only the sources cited by the supplied material", () => {
    const input = inputFor("war-cabinet-negotiates");
    const sources = collectSources(dunkirk1940, input.events, input.seeds);
    const known = new Set(dunkirk1940.sources.map(({ id }) => id));

    expect(sources.map(({ id }) => id)).toContain("src-museum-pm-001");
    sources.forEach((source) => expect(known.has(source.id)).toBe(true));
  });
});
