import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getScenario } from "@/lib/runs/replay";
import { initializeSimulation } from "@/lib/simulation-engine";
import { SimulationValidationError } from "@/domain/simulation";

export async function POST(request: NextRequest) {
  const { scenarioId, basicChoiceId, advancedVariableOverrides } = await request.json();

  try {
    const scenario = getScenario(scenarioId);
    initializeSimulation(scenario, { basicChoiceId, advancedVariableOverrides });

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("runs")
      .insert({
        scenario_id: scenario.id,
        scenario_version: scenario.version,
        user_id: user?.id ?? null,
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

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your runs" }, { status: 401 });

  const { data, error } = await supabase
    .from("runs")
    .select("id, scenario_id, basic_choice_id, is_complete, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: data });
}
