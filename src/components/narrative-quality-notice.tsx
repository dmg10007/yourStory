import { describeQualityFinding, type NarrativeQuality } from "@/lib/runs/narration-quality";
import styles from "./narrative-quality-notice.module.css";

export function NarrativeQualityNotice({ validation, onRegenerate, disabled = false }: {
  validation?: NarrativeQuality | null;
  onRegenerate?: () => void;
  disabled?: boolean;
}) {
  if (!validation) {
    return <aside className={styles.notice} role="status">
      <h4>Quality check unavailable</h4>
      <p>This saved response has no usable validation metadata. It has not been confirmed to pass the current checks. Regenerate to request a newly checked draft.</p>
      {onRegenerate && <button className="button" type="button" onClick={onRegenerate} disabled={disabled}>Regenerate draft</button>}
    </aside>;
  }
  const errors = validation.flaggedTerms.filter(({ severity }) => severity === "error");
  const notes = validation.flaggedTerms.filter(({ severity }) => severity === "note");
  if (!validation.flagged && errors.length === 0 && notes.length === 0) return null;
  const needsReview = validation.flagged || errors.length > 0;
  return <aside className={styles.notice} role="status">
    <h4>{needsReview ? "Draft needs review" : "Review notes"}</h4>
    <p>{needsReview
      ? "This draft did not pass all automated narration checks. You can read it below, but it contains unresolved issues."
      : "No blocking issues were recorded, but some details need review. Automated checks do not establish historical truth."}</p>
    {errors.length > 0 && <ul>{errors.map((finding, index) => <li key={index}>{describeQualityFinding(finding)}</li>)}</ul>}
    {notes.length > 0 && <details><summary>Non-blocking review notes ({notes.length})</summary>
      <ul>{notes.map((finding, index) => <li key={index}>{describeQualityFinding(finding)}</li>)}</ul>
    </details>}
    <p className={styles.version}>Recorded checks: {validation.validationVersion}. This status is separate from the projection and speculation labels.</p>
    {needsReview && onRegenerate && <button className="button" type="button" onClick={onRegenerate} disabled={disabled}>Regenerate draft</button>}
  </aside>;
}
