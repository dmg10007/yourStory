import { describe, expect, it } from "vitest";
import { scenarioSchema } from "@/domain/scenario";
import { dunkirk1940 } from "./dunkirk-1940";

describe("dunkirk1940", () => {
  it("conforms to the scenario contract", () => expect(scenarioSchema.parse(dunkirk1940)).toEqual(dunkirk1940));
  it("uses unique basic-choice IDs", () => expect(new Set(dunkirk1940.basicChoices.map(({ id }) => id)).size).toBe(dunkirk1940.basicChoices.length));
});
