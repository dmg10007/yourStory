import { describe, expect, it } from "vitest";
import { calculateDivergence } from "./divergence";

describe("calculateDivergence", () => {
  it("returns 0% divergence for historical baseline choices", () => {
    const historicalDunkirk = calculateDivergence({ choiceId: "historical" });
    expect(historicalDunkirk.score).toBe(0);
    expect(historicalDunkirk.severity).toBe("subtle");

    const historicalCuba = calculateDivergence({ choiceId: "historical-discovery" });
    expect(historicalCuba.score).toBe(0);
  });

  it("calculates elevated divergence for counterfactual choices", () => {
    const result = calculateDivergence({
      choiceId: "no-halt-order",
      factorValues: { "evacuation-capacity": -2, "allied-trained-force": -1 },
      resolvedForkCount: 1,
    });

    expect(result.score).toBeGreaterThanOrEqual(74);
    expect(result.badge).toContain("⚡");
  });

  it("scales divergence when decision forks are resolved", () => {
    const low = calculateDivergence({
      choiceId: "delayed-discovery",
      factorValues: { "escalation-risk": 1 },
      resolvedForkCount: 0,
    });

    const high = calculateDivergence({
      choiceId: "delayed-discovery",
      factorValues: { "escalation-risk": 3, "soviet-face-saving-room": -2 },
      resolvedForkCount: 3,
    });

    expect(high.score).toBeGreaterThan(low.score);
    expect(high.score).toBeLessThanOrEqual(96);
  });
});
