import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replayRun } from "@/lib/runs/replay";
import { SimulationValidationError } from "@/domain/simulation";

export default async function RunReplayPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: run, error } = await supabase.from("runs").select("*").eq("id", runId).single();

  if (error || !run) {
    return <main className="shell"><p>This run could not be found.</p></main>;
  }

  try {
    const state = replayRun(
      run.scenario_id,
      run.scenario_version,
      run.basic_choice_id,
      run.advanced_variable_overrides,
      run.resolved_commands,
    );

    return <main className="shell">
      <h1>Saved run: {state.scenarioId}</h1>
      <p>Basic choice: {state.selectedBasicChoiceId}</p>
      <h2>Causal factors</h2>
      <ul>{Object.entries(state.causalFactorValues).map(([id, value]) => <li key={id}>{id}: {value}</li>)}</ul>
      <h2>Resolved forks</h2>
      <ul>{state.resolvedForkIds.length === 0 ? <li>None yet.</li> : state.resolvedForkIds.map((id) => <li key={id}>{id}</li>)}</ul>
      <h2>Audit trace</h2>
      <ol>{state.trace.map((entry, index) => <li key={index}>{entry.type}</li>)}</ol>
    </main>;
  } catch (caught) {
    const message = caught instanceof SimulationValidationError ? caught.message : "Unable to replay this run.";
    return <main className="shell"><p role="alert">{message}</p></main>;
  }
}
