import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildValidNarration, inputFor } from "./narration-fixture";

const state = vi.hoisted(() => ({
  cached: null as Record<string, unknown> | null,
  inserted: null as Record<string, unknown> | null,
  generate: vi.fn(),
  selected: [] as string[],
}));
const runId = "61276f13-2e43-454e-b67b-0b9b9f16d9b7";

interface TestQuery {
  select: (columns: string) => TestQuery;
  eq: () => TestQuery;
  order: () => TestQuery;
  limit: () => TestQuery;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: null }>;
  insert: (row: Record<string, unknown>) => TestQuery;
  single: () => Promise<{ data: Record<string, unknown>; error: null }>;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => {
      const query: TestQuery = {
        select: vi.fn((columns: string) => { if (table === "narratives") state.selected.push(columns); return query; }),
        eq: vi.fn(() => query),
        order: vi.fn(() => query),
        limit: vi.fn(() => query),
        maybeSingle: vi.fn(async () => ({ data: state.cached, error: null })),
        insert: vi.fn((row: Record<string, unknown>) => { state.inserted = row; return query; }),
        single: vi.fn(async () => ({
          data: table === "runs" ? {
            id: "61276f13-2e43-454e-b67b-0b9b9f16d9b7", scenario_id: "dunkirk-1940", scenario_version: "0.2.0",
            basic_choice_id: "reduced-evacuation", advanced_variable_overrides: {}, resolved_commands: [],
          } : { created_at: "2026-10-20T14:40:23Z" },
          error: null,
        })),
      };
      return query;
    },
  }),
}));
vi.mock("./narration-pipeline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./narration-pipeline")>();
  return { ...actual, produceNarration: state.generate };
});
vi.mock("./groq", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./groq")>();
  return { ...actual, createGroqRequester: vi.fn(() => vi.fn()) };
});

import { POST } from "../../../app/api/runs/[runId]/narrate/route";

const findings = [
  { term: "1944", rule: "unsupported-number", severity: "error" },
  { term: "present", rule: "too-short", severity: "error" },
];

async function request(regenerate = false) {
  const response = await POST(new NextRequest(`http://localhost/api/runs/${runId}/narrate`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ regenerate }),
  }), { params: Promise.resolve({ runId }) });
  expect(response.status).toBe(200);
  return response.json();
}

beforeEach(() => {
  state.cached = null;
  state.inserted = null;
  state.selected = [];
  state.generate.mockReset();
  vi.stubEnv("GROQ_API_KEY", "test-only-not-a-real-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("narration API quality propagation", () => {
  it("returns stored findings for a cached flagged story without generating again", async () => {
    state.cached = { content: "Cached story", events: [], seeds: [], flagged: true, flagged_terms: findings, validation_version: "v5" };
    const body = await request();
    expect(body.cached).toBe(true);
    expect(state.selected.some((columns) => columns.includes("flagged_terms") && columns.includes("validation_version"))).toBe(true);
    expect(body.validation).toEqual({ flagged: true, flaggedTerms: findings, validationVersion: "v5" });
    expect(state.generate).not.toHaveBeenCalled();
  });
  it("returns the same validation metadata that it saves for a fresh flagged story", async () => {
    state.generate.mockResolvedValue({
      narration: buildValidNarration(inputFor("reduced-evacuation", runId)),
      validation: { flagged: true, flaggedTerms: findings, validationVersion: "v5" }, attempts: 2,
    });
    const body = await request(true);
    expect(body.cached).toBe(false);
    expect(body.validation).toEqual({ flagged: true, flaggedTerms: findings, validationVersion: "v5" });
    expect(state.inserted).toMatchObject({ flagged: true, flagged_terms: findings, validation_version: "v5" });
    expect(state.generate).toHaveBeenCalledTimes(1);
  });
  it("does not convert a cached response with absent metadata into a clean result", async () => {
    state.cached = { content: "Legacy story", events: [], seeds: [] };
    expect((await request()).validation).toBeNull();
  });
  it("preserves clean cached status without creating a false failure", async () => {
    state.cached = { content: "Clean story", events: [], seeds: [], flagged: false, flagged_terms: [], validation_version: "v5" };
    expect((await request()).validation).toEqual({ flagged: false, flaggedTerms: [], validationVersion: "v5" });
  });
});
