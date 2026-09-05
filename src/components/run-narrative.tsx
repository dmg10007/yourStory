"use client";

import { useState } from "react";

interface NarrativeEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  classification: "documented-fact" | "direct-inference" | "plausible-projection" | "highly-speculative";
}

export function RunNarrative({ runId }: { runId: string }) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/narrate`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to generate narrative.");
      setNarrative(body.narrative);
      setEvents(body.events ?? []);
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate narrative.");
      setStatus("error");
    }
  }

  return (
    <section className="run-section run-narrative">
      <h2>Narrative</h2>
      {!narrative && status !== "loading" && (
        <>
          <p className="fork-empty">
            Render the approved, cited events above into prose. The model may only rephrase these
            events -- it cannot add facts, names, or dates that were not authored and reviewed.
          </p>
          <button className="button" onClick={generate} type="button">Generate narrative</button>
        </>
      )}
      {status === "loading" && <p className="fork-empty">Generating narrative...</p>}
      {error && <p role="alert">{error}</p>}
      {narrative && (
        <>
          <div className="narrative-prose">
            {narrative.split("\n\n").filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
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
