"use client";

import { useEffect, useRef, useState } from "react";
import { narrationVoiceLabels, narrationVoices, type NarrationVoice } from "@/lib/runs/narration-voices";
import styles from "./run-narrative.module.css";

type Horizon = "aftermath" | "decade" | "present";
type Classification = "documented-fact" | "direct-inference" | "plausible-projection" | "highly-speculative";

interface NarrativeEvent {
  id: string;
  date: string;
  title: string;
  summary: string;
  classification: Classification;
}

interface NarrativeSeed {
  id: string;
  horizon: Horizon;
  title: string;
  summary: string;
  classification: Classification;
}

interface NarrativeSection {
  horizon: Horizon;
  text: string;
  basedOn: string[];
}

interface NarrativeSource {
  id: string;
  title: string;
  author: string;
  sourceUrl: string;
}

interface NarrativeResult {
  narrative: string;
  headline?: string | null;
  voice?: string | null;
  sections?: NarrativeSection[] | null;
  events?: NarrativeEvent[];
  seeds?: NarrativeSeed[] | null;
  sources?: NarrativeSource[];
  modelId?: string;
  generatedAt?: string;
  cached: boolean;
}

const HORIZON_LABELS: Record<Horizon, { title: string; badge: string; className: Classification }> = {
  aftermath: { title: "Aftermath", badge: "Anchored in sources", className: "direct-inference" },
  decade: { title: "The following decade", badge: "Reasoned projection", className: "plausible-projection" },
  present: { title: "The world today", badge: "Speculation", className: "highly-speculative" },
};

function paragraphs(text: string): string[] {
  return text.split("\n\n").filter(Boolean);
}

export function RunNarrative({ runId, autoStart = false }: { runId: string; autoStart?: boolean }) {
  const [result, setResult] = useState<NarrativeResult | null>(null);
  const [voice, setVoice] = useState<NarrationVoice | "">("");
  const [status, setStatus] = useState<"idle" | "loading" | "regenerating" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function fetchNarrative(regenerate: boolean) {
    setStatus(regenerate ? "regenerating" : "loading");
    setError(null);
    try {
      const response = await fetch(`/api/runs/${runId}/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate, ...(voice ? { voice } : {}) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Unable to generate narrative.");
      setResult(body as NarrativeResult);
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate narrative.");
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    void fetchNarrative(false);
    // Start once per mount; the ref also keeps React strict mode from sending two requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const isBusy = status === "loading" || status === "regenerating";
  const hasNarrative = Boolean(result && result.narrative);
  const sections = result?.sections ?? [];
  const events = result?.events ?? [];
  const seeds = result?.seeds ?? [];
  const sources = result?.sources ?? [];
  const voiceLabel = result?.voice ? narrationVoiceLabels[result.voice as NarrationVoice] ?? result.voice : null;

  return (
    <section className="run-section run-narrative">
      <h2>Narrative</h2>
      <div className={styles.body}>
        {!hasNarrative && !isBusy && (
          <p className="fork-empty">
            Render the approved, cited events and consequence seeds above into prose. The model may only rephrase this
            material. It cannot add facts, names, or dates that were not authored and reviewed.
          </p>
        )}
        <div className={styles.controls}>
          <label className={styles.voiceLabel}>
            Voice{" "}
            <select value={voice} onChange={(event) => setVoice(event.target.value as NarrationVoice | "")} disabled={isBusy}>
              <option value="">Surprise me</option>
              {narrationVoices.map((item) => (
                <option key={item} value={item}>{narrationVoiceLabels[item]}</option>
              ))}
            </select>
          </label>
          {!hasNarrative && !isBusy && (
            <button className="button" onClick={() => fetchNarrative(false)} type="button">Generate narrative</button>
          )}
        </div>
        {status === "loading" && <p className="fork-empty">Generating narrative...</p>}
        {status === "regenerating" && <p className="fork-empty">Regenerating narrative...</p>}
        {error && <p role="alert">{error}</p>}
        {result && hasNarrative && (
          <>
            <div className={styles.story}>
              {result.headline && <h3 className={styles.headline}>{result.headline}</h3>}
              {sections.length > 0 ? (
                sections.map((section) => {
                  const label = HORIZON_LABELS[section.horizon];
                  return (
                    <section key={section.horizon} className={styles.section}>
                      <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionHeading}>{label.title}</h3>
                        <span className={`event-classification ${label.className}`}>{label.badge}</span>
                      </div>
                      <div className={styles.prose}>
                        {paragraphs(section.text).map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  );
                })
              ) : (
                <div className={styles.prose}>
                  {paragraphs(result.narrative).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              )}
              <p className={styles.notice}>
                AI-generated from the sourced material listed below. Sections marked as projection or speculation reach
                beyond the sources.
              </p>
            </div>
            <div className={styles.meta}>
              {result.cached && <span className={styles.cachedBadge}>Cached</span>}
              {voiceLabel && <span className={styles.metaText}>Voice: {voiceLabel}</span>}
              {result.modelId && <span className={styles.metaText}>Model: {result.modelId}</span>}
              {result.generatedAt && (
                <span className={styles.metaText}>Generated {new Date(result.generatedAt).toLocaleString()}</span>
              )}
              <button className="button" onClick={() => fetchNarrative(true)} type="button" disabled={isBusy}>
                {isBusy ? "Regenerating..." : "Regenerate"}
              </button>
            </div>
            <details className="narrative-sources">
              <summary>How we know ({events.length + seeds.length} items, {sources.length} sources)</summary>
              <ul className="narrative-source-list">
                {events.map((event) => (
                  <li key={event.id}>
                    <span className={`event-classification ${event.classification}`}>{event.classification}</span>
                    {" "}{event.date} - {event.title}
                  </li>
                ))}
                {seeds.map((seed) => (
                  <li key={seed.id}>
                    <span className={`event-classification ${seed.classification}`}>{seed.classification}</span>
                    {" "}{HORIZON_LABELS[seed.horizon].title} - {seed.title}
                  </li>
                ))}
              </ul>
              {sources.length > 0 && (
                <ul className="narrative-source-list">
                  {sources.map((source) => (
                    <li key={source.id}>
                      <a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.title}</a>
                      {" "}({source.author})
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </>
        )}
      </div>
    </section>
  );
}
