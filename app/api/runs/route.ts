import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getScenario } from "@/lib/runs/replay";
import { initializeSimulation } from "@/lib/simulation-engine";
import { SimulationValidationError } from "@/domain/simulation";

// GET /api/runs (list the caller's own runs) is deferred until magic-link auth
// is added. For now every run is anonymous, so there is no session to scope a
// list to; the client tracks its own run IDs in localStorage instead.

export async function POST(request: NextRequest) {
  const { scenarioId, basicChoiceId, advancedVariableOverrides } = await request.json();

  try {
    const scenario = getScenario(scenarioId);
    initializeSimulation(scenario, { basicChoiceId, advancedVariableOverrides });

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("runs")
      .insert({
        scenario_id: scenario.id,
        scenario_version: scenario.version,
        basic_choice_id: basicChoiceId,
        advanced_variable_overrides: advancedVariableOverrides ?? {},
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ runId: data.id });
  } catch (caught) {
    const message = caught instanceof SimulationValidationError ? caught.message : "Unable to create run";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
