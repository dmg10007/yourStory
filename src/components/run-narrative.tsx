"use client";

import { useState } from "react";

interface NarrativeEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  classification: "documented-fact" | "direct-inference" | "plausible-projection" | "highly-speculative";
}

interface NarrativeMeta {
  cached: boolean;
  modelId?: string;
  generatedAt?: string;
}

export function RunNarrative({ runId }: { runId: string }) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [meta, setMeta] = useState<NarrativeMeta | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "regenerating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function fetchNarrative(regenerate: boolean) {
    setStatus(regenerate ? "regenerating" : "loading");
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to generate narrative.");
      setNarrative(body.narrative);
      setEvents(body.events ?? []);
      setMeta({ cached: body.cached ?? false, modelId: body.modelId, generatedAt: body.generatedAt });
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate narrative.");
      setStatus("error");
    }
  }

  const isBusy = status === "loading" || status === "regenerating";

  return (
    <section className="run-section run-narrative">
      <h2>Narrative</h2>
      {!narrative && !isBusy && (
        <>
          <p className="fork-empty">
            Render the approved, cited events above into prose. The model may only rephrase these
            events -- it cannot add facts, names, or dates that were not authored and reviewed.
          </p>
          <button className="button" onClick={() => fetchNarrative(false)} type="button">Generate narrative</button>
        </>
      )}
      {status === "loading" && <p className="fork-empty">Generating narrative...</p>}
      {status === "regenerating" && <p className="fork-empty">Regenerating narrative...</p>}
      {error && <p role="alert">{error}</p>}
      {narrative && (
        <>
          <div className="narrative-prose">
            {narrative.split("\n\n").filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", marginTop: "12px" }}>
            {meta?.cached && (
              <span style={{ fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", border: "1px solid var(--line)", padding: "3px 8px" }}>
                Cached
              </span>
            )}
            {meta?.modelId && (
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Model: {meta.modelId}</span>
            )}
            {meta?.generatedAt && (
              <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                Generated {new Date(meta.generatedAt).toLocaleString()}
              </span>
            )}
            <button className="button" onClick={() => fetchNarrative(true)} type="button" disabled={isBusy}>
              {isBusy ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
          <details className="narrative-sources">
            <summary>Underlying approved events ({events.length})</summary>
            <ul className="narrative-source-list">
              {events.map((event) => (
                <li key={event.id}>
                  <span className={`event-classification ${event.classification}`}>{event.classification}</span>
                  {" "}{event.date} \u2014 {event.title}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}
