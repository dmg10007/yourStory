import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replayRun } from "@/lib/runs/replay";
import { SimulationValidationError } from "@/domain/simulation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: run, error } = await supabase.from("runs").select("*").eq("id", runId).single();
  if (error || !run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  try {
    const state = replayRun(
      run.scenario_id,
      run.scenario_version,
      run.basic_choice_id,
      run.advanced_variable_overrides,
      run.resolved_commands,
    );
    return NextResponse.json({ state });
  } catch (caught) {
    const message = caught instanceof SimulationValidationError ? caught.message : "Replay failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const { forkId, choiceId } = await request.json();
  const supabase = await createSupabaseServerClient();

  const { data: run, error: fetchError } = await supabase.from("runs").select("*").eq("id", runId).single();
  if (fetchError || !run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const nextCommands = [...run.resolved_commands, { forkId, choiceId }];

  try {
    const state = replayRun(
      run.scenario_id,
      run.scenario_version,
      run.basic_choice_id,
      run.advanced_variable_overrides,
      nextCommands,
    );

    const { error: updateError } = await supabase
      .from("runs")
      .update({ resolved_commands: nextCommands, cached_state: state })
      .eq("id", runId);

    if (updateError) throw updateError;
    return NextResponse.json({ state });
  } catch (caught) {
    const message = caught instanceof SimulationValidationError ? caught.message : "Unable to resolve decision";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
