import Link from "next/link";
import { notFound } from "next/navigation";
import { scenariosById } from "@/data/scenarios";
import { PlayScreen } from "@/components/play-screen";
import { buildMoment } from "@/lib/play/moments";

export default async function PlayPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params;
  const scenario = scenariosById.get(scenarioId);
  if (!scenario) notFound();

  const moment = buildMoment(scenario);
  if (moment.pivots.length === 0) notFound();

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">YOUR STORY</Link>
        <span className="nav-status">Play</span>
      </nav>
      <section className="hero">
        <p className="eyebrow">{moment.date}</p>
        <h1>{moment.title}</h1>
      </section>
      <PlayScreen moment={moment} />
    </main>
  );
}
