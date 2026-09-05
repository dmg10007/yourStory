import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replayRun } from "@/lib/runs/replay";
import { SimulationValidationError } from "@/domain/simulation";
import type { DeterministicSimulationState, SimulationTraceEntry } from "@/domain/simulation";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";

const scenarioLookup = { "dunkirk-1940": dunkirk1940 };

function describeTraceEntry(entry: SimulationTraceEntry): string | null {
  switch (entry.type) {
    case "simulation-initialized":
      return `Basic choice: ${entry.basicChoiceId}`;
    case "advanced-variable-set":
      return `${entry.variableId} set to ${entry.value} (${entry.source})`;
    case "decision-resolved":
      return `Choice: ${entry.choiceId} — ${entry.effects.map((effect) => `${effect.factorId} ${effect.delta > 0 ? "+" : ""}${effect.delta}`).join(", ")}`;
    default:
      return null;
  }
}

export default async function RunReplayPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: run, error } = await supabase.from("runs").select("*").eq("id", runId).single();

  if (error || !run) {
    return <main className="shell run-not-found">
      <p className="eyebrow">Saved run</p>
      <h1>This run could not be found.</h1>
      <p className="lede">The link may be incorrect, or the run may have been removed.</p>
      <Link className="run-back-nav" href="/">&larr; Back to Your Story</Link>
    </main>;
  }

  let state: DeterministicSimulationState | null = null;
  let replayError: string | null = null;

  try {
    state = replayRun(
      run.scenario_id,
      run.scenario_version,
      run.basic_choice_id,
      run.advanced_variable_overrides,
      run.resolved_commands,
    );
  } catch (caught) {
    replayError = caught instanceof SimulationValidationError ? caught.message : "Unable to replay this run.";
  }

  if (replayError || !state) {
    return <main className="shell run-not-found">
      <p className="eyebrow">Saved run</p>
      <h1 role="alert">{replayError}</h1>
      <Link className="run-back-nav" href="/">&larr; Back to Your Story</Link>
    </main>;
  }

  const scenario = scenarioLookup[state.scenarioId as keyof typeof scenarioLookup];
  const basicChoice = scenario?.basicChoices.find((choice) => choice.id === state.selectedBasicChoiceId);
  const resolvedForks = scenario?.decisionForks.filter((fork) => state.resolvedForkIds.includes(fork.id)) ?? [];

  return <main className="shell run-page">
    <Link className="run-back-nav" href="/">&larr; Back to Your Story</Link>

    <div className="run-header">
      <p className="eyebrow">Saved deterministic run</p>
      <h1>{scenario?.title ?? state.scenarioId}</h1>
      <p className="lede">{basicChoice?.interventionSummary ?? basicChoice?.description}</p>
      <div className="run-meta">
        <span className="run-meta-pill">Scenario v{state.scenarioVersion}</span>
        <span className="run-meta-pill">{basicChoice?.label ?? state.selectedBasicChoiceId}</span>
        <span className="run-meta-pill">{state.resolvedForkIds.length} decision{state.resolvedForkIds.length === 1 ? "" : "s"} resolved</span>
      </div>
    </div>

    <section className="run-section">
      <h2>Causal factors</h2>
      <div className="factor-grid">
        {(scenario?.causalFactors ?? Object.keys(state.causalFactorValues).map((id) => ({ id, label: id }))).map((factor) => {
          const value = state.causalFactorValues[factor.id];
          const valueClass = value > 0 ? "positive" : value < 0 ? "negative" : "";
          return <div className="factor-card" key={factor.id}>
            <p className="factor-label">{factor.label}</p>
            <p className={`factor-value ${valueClass}`}>{value > 0 ? "+" : ""}{value}</p>
          </div>;
        })}
      </div>
    </section>

    <section className="run-section">
      <h2>Resolved decisions</h2>
      {state.resolvedForkIds.length === 0 ? (
        <p className="fork-empty">No decision forks have been resolved yet.</p>
      ) : (
        <div className="fork-list">
          {resolvedForks.length > 0
            ? resolvedForks.map((fork) => <span className="fork-badge" key={fork.id}>{fork.label}</span>)
            : state.resolvedForkIds.map((id) => <span className="fork-badge" key={id}>{id}</span>)}
        </div>
      )}
    </section>

    <section className="run-section">
      <h2>Audit trace</h2>
      <ol className="trace-timeline">
        {state.trace.map((entry, index) => <li className="trace-entry" key={index}>
          <p className="trace-entry-type">{entry.type}</p>
          <p className="trace-entry-detail">{describeTraceEntry(entry)}</p>
        </li>)}
      </ol>
    </section>
  </main>;
}
