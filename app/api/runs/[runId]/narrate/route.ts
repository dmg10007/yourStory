import { NextRequest, NextResponse } from "next/server";
import { SimulationValidationError } from "@/domain/simulation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { replayRun, getScenario } from "@/lib/runs/replay";
import { buildNarrationInput, collectSources, renderNarrationText } from "@/lib/runs/narration";
import { isNarrationVoice } from "@/lib/runs/narration-voices";
import { NarrationGenerationError, produceNarration } from "@/lib/runs/narration-pipeline";
import { DEFAULT_NARRATION_MODEL, GroqRequestError, createGroqRequester } from "@/lib/runs/groq";

export async function POST(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const body = await request.json().catch(() => ({}));
  const regenerate = body?.regenerate === true;
  const requestedVoice = isNarrationVoice(body?.voice) ? body.voice : undefined;

  const supabase = await createSupabaseServerClient();
  const { data: run, error } = await supabase.from("runs").select("*").eq("id", runId).single();
  if (error || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  try {
    const scenario = getScenario(run.scenario_id);

    if (!regenerate) {
      const { data: cached, error: cacheError } = await supabase
        .from("narratives")
        .select("content, events, model_id, created_at, voice, headline, sections, seeds")
        .eq("run_id", runId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cacheError && cached) {
        const events = cached.events ?? [];
        const seeds = cached.seeds ?? [];
        return NextResponse.json({
          narrative: cached.content,
          headline: cached.headline,
          voice: cached.voice,
          sections: cached.sections,
          events,
          seeds,
          sources: collectSources(scenario, events, seeds),
          modelId: cached.model_id,
          generatedAt: cached.created_at,
          cached: true,
        });
      }
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Narration is not configured. Set GROQ_API_KEY to enable this feature." },
        { status: 503 },
      );
    }

    const state = replayRun(
      run.scenario_id,
      run.scenario_version,
      run.basic_choice_id,
      run.advanced_variable_overrides,
      run.resolved_commands,
    );
    const input = buildNarrationInput(scenario, state, run.id, requestedVoice);

    if (input.horizons.length === 0) {
      return NextResponse.json({
        narrative: "",
        headline: null,
        voice: input.voice,
        sections: [],
        events: [],
        seeds: [],
        sources: [],
        cached: false,
      });
    }

    const model = process.env.GROQ_MODEL ?? DEFAULT_NARRATION_MODEL;
    const result = await produceNarration(input, createGroqRequester({ apiKey, model }));
    const narrative = renderNarrationText(result.narration);

    const { data: saved, error: insertError } = await supabase
      .from("narratives")
      .insert({
        run_id: runId,
        content: narrative,
        model_id: model,
        events: input.events,
        seeds: input.seeds,
        voice: input.voice,
        headline: result.narration.headline,
        sections: result.narration.sections,
        flagged: result.validation.flagged,
        flagged_terms: result.validation.flaggedTerms,
        validation_version: result.validation.validationVersion,
      })
      .select("created_at")
      .single();

    if (insertError) {
      console.error("Failed to cache narrative:", insertError);
    }

    return NextResponse.json({
      narrative,
      headline: result.narration.headline,
      voice: input.voice,
      sections: result.narration.sections,
      events: input.events,
      seeds: input.seeds,
      sources: collectSources(scenario, input.events, input.seeds),
      modelId: model,
      generatedAt: saved?.created_at ?? new Date().toISOString(),
      cached: false,
    });
  } catch (caught) {
    if (caught instanceof SimulationValidationError) {
      return NextResponse.json({ error: caught.message }, { status: 400 });
    }
    if (caught instanceof GroqRequestError || caught instanceof NarrationGenerationError) {
      console.error("Narration generation failed:", caught);
      return NextResponse.json({ error: "Unable to generate narrative right now." }, { status: 502 });
    }
    console.error("POST /api/runs/[runId]/narrate failed:", caught);
    return NextResponse.json({ error: "Unable to generate narrative." }, { status: 500 });
  }
}
