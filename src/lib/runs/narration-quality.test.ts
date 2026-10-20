import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NarrativeQualityNotice } from "@/components/narrative-quality-notice";
import { qualityFromStored, type NarrativeQuality } from "./narration-quality";

const flagged: NarrativeQuality = {
  flagged: true,
  validationVersion: "v5",
  flaggedTerms: [
    { rule: "unsupported-number", term: "1944", severity: "error" },
    { rule: "too-short", term: "present", severity: "error" },
    { rule: "unsupported-name", term: "War Office", severity: "note" },
  ],
};

function render(validation?: NarrativeQuality | null, disabled = false) {
  return renderToStaticMarkup(createElement(NarrativeQualityNotice, { validation, disabled, onRegenerate: vi.fn() }));
}

describe("narration quality metadata", () => {
  it("preserves stored errors and notes for cached narratives", () => {
    expect(qualityFromStored({ flagged: true, flagged_terms: flagged.flaggedTerms, validation_version: "v5" })).toEqual(flagged);
  });
  it("does not turn absent metadata into a pass", () => {
    expect(qualityFromStored({})).toBeNull();
    expect(qualityFromStored({ flagged: false })).toBeNull();
  });
  it("handles legacy findings without a severity", () => {
    expect(qualityFromStored({ flagged: true, validation_version: "v2", flagged_terms: [{ term: "1944", rule: "unsupported-number" }] })?.flaggedTerms[0].severity).toBe("error");
  });
  it("treats an explicit error as flagged even if the stored flag is inconsistent", () => {
    expect(qualityFromStored({ flagged: false, validation_version: "v5", flagged_terms: flagged.flaggedTerms })?.flagged).toBe(true);
  });
  it("ignores malformed finding entries safely", () => {
    expect(qualityFromStored({ flagged: true, validation_version: "v5", flagged_terms: [null, {}, "bad"] })?.flaggedTerms).toEqual([]);
  });
});

describe("rendered narration quality notice", () => {
  it("shows the reviewed run's blocking issues separately from notes", () => {
    const html = render(flagged);
    expect(html).toContain("Draft needs review");
    expect(html).toContain("1944");
    expect(html).toContain("present section is shorter");
    expect(html).toContain("Non-blocking review notes (1)");
    expect(html).toContain("War Office");
    expect(html).toContain("Regenerate draft");
    expect(html).toContain('role="status"');
  });
  it("does not show a failure warning for clean results", () => {
    expect(render({ flagged: false, flaggedTerms: [], validationVersion: "v5" })).toBe("");
  });
  it("does not turn notes alone into a failed draft", () => {
    const html = render({ flagged: false, flaggedTerms: [flagged.flaggedTerms[2]], validationVersion: "v5" });
    expect(html).toContain("Review notes");
    expect(html).not.toContain("Draft needs review");
  });
  it("shows unknown status for missing metadata", () => {
    expect(render(null)).toContain("Quality check unavailable");
  });
  it("disables regeneration while a request is in progress", () => {
    expect(render(flagged, true)).toContain('disabled=""');
  });
});
