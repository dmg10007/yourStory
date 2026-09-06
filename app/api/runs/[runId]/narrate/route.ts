import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replayRun, getScenario } from "@/lib/runs/replay";
import { deriveEvents } from "@/lib/runs/narrative";
import { SimulationValidationError } from "@/domain/simulation";

const SYSTEM_PROMPT = `You are a narration renderer for a historical alternate-history simulator called Your Story.

You will be given an ordered list of events. Each event has already been authored and reviewed by a human historian and carries an evidence classification: "documented-fact", "direct-inference", "plausible-projection", or "highly-speculative".

Your ONLY job is to render these events into flowing narrative prose, in the order given. You must not:
- Invent any name, date, place, quotation, or fact not present in the supplied events.
- Add new causal claims beyond what each event's summary states.
- Upgrade or downgrade the confidence of a claim (e.g. do not state a "plausible-projection" as if it were settled fact).

For events classified as "documented-fact" or "direct-inference", write with a confident narrative voice.
For events classified as "plausible-projection" or "highly-speculative", use hedged language ("in this branch of events...", "it is plausible that...") to keep the speculative nature visible to the reader.

Write 2-5 short paragraphs of plain prose. No markdown headers, no bullet lists, no titles.`;

const NARRATION_MODEL = "openai/gpt-oss-120b";

export async function POST(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const body = await request.json().catch(() => ({}) as { regenerate?: boolean });
  const regenerate = body?.regenerate === true;

  const supabase = await createSupabaseServerClient();
  const { data: run, error } = await supabase.from("runs").select("*").eq("id", runId).single();
  if (error || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (!regenerate) {
    const { data: cached, error: cacheError } = await supabase
      .from("narratives")
      .select("content, events, model_id, created_at")
      .eq("run_id", runId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheError && cached) {
      return NextResponse.json({
        narrative: cached.content,
        events: cached.events,
        modelId: cached.model_id,
        generatedAt: cached.created_at,
        cached: true,
      });
    }
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "Narration is not configured. Set GROQ_API_KEY to enable this feature." },
      { status: 503 },
    );
  }

  try {
    const scenario = getScenario(run.scenario_id);
    const state = replayRun(
      run.scenario_id,
      run.scenario_version,
      run.basic_choice_id,
      run.advanced_variable_overrides,
      run.resolved_commands,
    );
    const events = deriveEvents(state, scenario);

    if (events.length === 0) {
      return NextResponse.json({ narrative: "", events: [], cached: false });
    }

    const userContent = events
      .map((event, index) => `${index + 1}. [${event.classification}] ${event.date} \u2014 ${event.title}: ${event.summary}`)
      .join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: NARRATION_MODEL,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Groq narration request failed:", response.status, errorBody);
      return NextResponse.json({ error: "Unable to generate narrative right now." }, { status: 502 });
    }

    const completion = await response.json();
    const narrative = completion.choices?.[0]?.message?.content?.trim() ?? "";

    const { data: saved, error: insertError } = await supabase
      .from("narratives")
      .insert({ run_id: runId, content: narrative, model_id: NARRATION_MODEL, events })
      .select("created_at")
      .single();

    if (insertError) {
      console.error("Failed to cache narrative:", insertError);
    }

    return NextResponse.json({
      narrative,
      events,
      modelId: NARRATION_MODEL,
      generatedAt: saved?.created_at ?? new Date().toISOString(),
      cached: false,
    });
  } catch (caught) {
    console.error("POST /api/runs/[runId]/narrate failed:", caught);
    const message = caught instanceof SimulationValidationError ? caught.message : "Unable to generate narrative.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
