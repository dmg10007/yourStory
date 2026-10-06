import Link from "next/link";
import { DunkirkScenarioRunner } from "@/components/dunkirk-scenario-runner";
import { eventPacks } from "@/data/event-packs";
import { scenarios } from "@/data/scenarios";
import { listPlayableMoments } from "@/lib/play/moments";

export default function HomePage() {
  const moments = listPlayableMoments(scenarios);

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="#top">YOUR STORY</a>
        <span className="nav-status">Historical simulation platform</span>
      </nav>
      <section className="hero" id="top">
        <p className="eyebrow">History, rewritten with care</p>
        <h1>Change one decision.<br />Follow the consequences.</h1>
        <p className="lede">Pick a turning point in history, change one thing, and read how it might have changed the world, all the way to today. Every claim is tied to sources, and the speculation is labeled.</p>
        <a className="button" href="#play">Play a moment</a>
      </section>
      <section className="event-section" id="play">
        <p className="eyebrow">Play</p>
        <h2>Pick a moment. Change one thing.</h2>
        <div className="event-grid">
          {moments.map((moment) => (
            <article className="event-card" key={moment.scenarioId}>
              <p className="event-era">{moment.date} - {moment.pivots.length} ways to change it</p>
              <h3>{moment.title}</h3>
              <p>{moment.hook}</p>
              <Link className="button" href={`/play/${moment.scenarioId}`}>Play</Link>
            </article>
          ))}
        </div>
      </section>
      <section className="principles">
        <article><span>01</span><h2>Guided divergence</h2><p>Curated historical decision points before unrestricted inputs.</p></article>
        <article><span>02</span><h2>Visible causality</h2><p>Every state change has an authored rule and an audit trace.</p></article>
        <article><span>03</span><h2>Sources preserved</h2><p>Versioned research stays separate from modeled projection and narration.</p></article>
      </section>
      <section className="event-section" id="event-packs">
        <p className="eyebrow">Event packs</p>
        <h2>Begin at a decisive moment.</h2>
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
      <DunkirkScenarioRunner />
      <section className="how-it-works">
        <p className="eyebrow">The simulation contract</p>
        <h2>Structured causality first. Narrative second.</h2>
      </section>
    </main>
  );
}
