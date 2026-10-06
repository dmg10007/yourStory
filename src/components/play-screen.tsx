"use client";

import { useState } from "react";
import Link from "next/link";
import { RunNarrative } from "@/components/run-narrative";
import { addRunToHistory } from "@/lib/runs/local-run-history";
import type { MomentSummary } from "@/lib/play/moments";
import styles from "./play-screen.module.css";

export function PlayScreen({ moment }: { moment: MomentSummary }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "starting">("idle");
  const [error, setError] = useState<string | null>(null);

  const selected = moment.pivots.find((pivot) => pivot.id === selectedId) ?? null;

  async function rewriteHistory() {
    if (!selected) return;
    setStatus("starting");
    setError(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: moment.scenarioId, basicChoiceId: selected.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to start this story.");

      addRunToHistory({ runId: body.runId, scenarioId: moment.scenarioId, createdAt: new Date().toISOString() });
      setRunId(body.runId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start this story.");
    } finally {
      setStatus("idle");
    }
  }

  function reset() {
    setRunId(null);
    setSelectedId(null);
    setError(null);
  }

  if (runId && selected) {
    return (
      <div className={styles.stage}>
        <p className="eyebrow">Your change</p>
        <h2>{selected.label}</h2>
        <p className={styles.hook}>{selected.interventionSummary}</p>
        <RunNarrative key={runId} runId={runId} autoStart />
        <div className={styles.actions}>
          <button className="button" onClick={reset} type="button">Try another change</button>
          <span className={styles.share}>
            Share this story: <Link href={`/runs/${runId}`}>/runs/{runId}</Link>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <p className={styles.hook}>{moment.hook}</p>
      <p className={styles.warning} role="note">{moment.contentWarning}</p>
      <h2>Change one thing</h2>
      <ul className={styles.pivotList}>
        {moment.pivots.map((pivot) => {
          const isSelected = pivot.id === selectedId;
          return (
            <li className={styles.pivotCard} key={pivot.id}>
              <button
                type="button"
                aria-pressed={isSelected}
                className={`${styles.pivotButton} ${isSelected ? styles.pivotButtonSelected : ""}`}
                onClick={() => setSelectedId(pivot.id)}
                disabled={status === "starting"}
              >
                <span className={styles.pivotTitle}>{pivot.label}</span>
                <span className={styles.pivotText}>{pivot.description}</span>
              </button>
              <details className={styles.why}>
                <summary>Why this was plausible</summary>
                <p>{pivot.minimalRewrite}</p>
                <ul className={styles.sourceList}>
                  {pivot.sources.map((source) => (
                    <li key={source.id}>
                      <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.title}</a>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
      <div className={styles.actions}>
        <button className="button" onClick={rewriteHistory} type="button" disabled={!selected || status === "starting"}>
          {status === "starting" ? "Rewriting history..." : "Rewrite history"}
        </button>
        {!selected && <span className={styles.share}>Choose a change above.</span>}
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
