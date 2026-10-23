import Link from "next/link";
import { eventPacks } from "@/data/event-packs";
import { scenarios } from "@/data/scenarios";
import { listPlayableMoments } from "@/lib/play/moments";

export default function HomePage() {
  const moments = listPlayableMoments(scenarios);

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="#top">YOUR STORY</a>
        <span className="nav-status">Alternate history sandbox</span>
      </nav>

      <section className="hero" id="top">
        <p className="eyebrow">⚡ Strategic Time-Fracture Sandbox</p>
        <h1>Change one decision.<br />Fracture history.</h1>
        <p className="lede">
          Step into human history&apos;s greatest near-miss turning points. Change one crucial call, bend the timeline forward, and explore the alternate world that could have been &mdash; fully grounded in historical sources.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <a className="button" href="#play">Choose a Turning Point</a>
          {moments.length > 0 && (
            <Link
              className="button"
              style={{ background: "rgba(240, 228, 200, 0.08)", border: "1px solid var(--line)" }}
              href={`/play/${moments[0].scenarioId}`}
            >
              🎲 Quick Play: {moments[0].title.split(":")[0]}
            </Link>
          )}
        </div>
      </section>

      <section className="event-section" id="play">
        <p className="eyebrow">Playable Turning Points</p>
        <h2>Pick a moment. Fracture the timeline.</h2>
        <div className="event-grid">
          {moments.map((moment) => (
            <article className="event-card" key={moment.scenarioId} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <p className="event-era">
                  <span>📅 {moment.date}</span> &bull; <span>{moment.pivots.length} alternate paths</span>
                </p>
                <h3>{moment.title}</h3>
                <p>{moment.hook}</p>
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                <Link className="button" href={`/play/${moment.scenarioId}`}>
                  Launch Simulation &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="principles">
        <article>
          <span>01</span>
          <h2>Curated Near-Misses</h2>
          <p>Real historical divergence moments where the fate of nations hung on a single judgment call.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Grounded Causality</h2>
          <p>Every divergence triggers structured geopolitical factor shifts and causal probability branches.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Share Your Reality</h2>
          <p>Exportable story cards and headlines ready to share with friends, Discord, or on social media.</p>
        </article>
      </section>

      <section className="event-section" id="event-packs">
        <p className="eyebrow">Scenario Library</p>
        <h2>Eras of divergence</h2>
        <div className="event-grid">
          {eventPacks.map((eventPack) => (
            <article className="event-card" key={eventPack.id}>
              <p className="event-era">{eventPack.era}</p>
              <h3>{eventPack.title}</h3>
              <p>{eventPack.description}</p>
              <span className="pill">{eventPack.status === "in-development" ? "In development" : eventPack.status === "available" ? "Available" : "Planned"}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
