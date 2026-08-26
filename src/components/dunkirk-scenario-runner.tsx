"use client";

import { useEffect, useState } from "react";
import { dunkirk1940 } from "@/data/scenarios/dunkirk-1940";
import type { DeterministicSimulationState } from "@/domain/simulation";
import { initializeSimulation, resolveDecision } from "@/lib/simulation-engine";
import { addRunToHistory } from "@/lib/runs/local-run-history";

const defaults = Object.fromEntries(dunkirk1940.advancedVariables.map((item) => [item.id, item.baseline]));

export function DunkirkScenarioRunner() {
  const [choiceId, setChoiceId] = useState("historical");
  const [values, setValues] = useState<Record<string, number>>(defaults);
  const [state, setState] = useState<DeterministicSimulationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fork = state && dunkirk1940.decisionForks.find((item) => !state.resolvedForkIds.includes(item.id));

  useEffect(() => {
    setRunId(null);
    setSaveError(null);
  }, [choiceId, values]);

  async function start() {
    try {
      const nextState = initializeSimulation(dunkirk1940, { basicChoiceId: choiceId, advancedVariableOverrides: values });
      setState(nextState);
      setError(null);

      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: dunkirk1940.id, basicChoiceId: choiceId, advancedVariableOverrides: values }),
      });
      if (!response.ok) throw new Error("Unable to save this run.");

      const { runId: savedRunId } = await response.json();
      setRunId(savedRunId);
      setSaveError(null);
      addRunToHistory({ runId: savedRunId, scenarioId: dunkirk1940.id, createdAt: new Date().toISOString() });
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Unable to save this run.") {
        setSaveError("The run is playable locally but could not be saved for sharing.");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to initialize the simulation.");
      }
    }
  }

  async function resolve(choice: string) {
    if (!state || !fork) return;
    try {
      const nextState = resolveDecision(state, dunkirk1940, { forkId: fork.id, choiceId: choice });
      setState(nextState);
      setError(null);

      if (runId) {
        const response = await fetch(`/api/runs/${runId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forkId: fork.id, choiceId: choice }),
        });
        if (!response.ok) throw new Error("Unable to save this run.");
        setSaveError(null);
      }
    } catch (caught) {
      if (caught instanceof Error && caught.message === "Unable to save this run.") {
        setSaveError("This decision is reflected locally but could not be saved for sharing.");
      } else {
        setError(caught instanceof Error ? caught.message : "Unable to resolve the decision.");
      }
    }
  }

  return <section className="runner" id="dunkirk-runner">
    <p className="eyebrow">Reviewed scenario · {dunkirk1940.divergence.date}</p>
    <h2>{dunkirk1940.title}</h2><p>{dunkirk1940.baselineSummary}</p>
    <p className="content-warning"><strong>Content note:</strong> {dunkirk1940.contentWarning}</p>
    <div className="runner-grid"><div className="runner-controls">
      <h3>Choose a divergence</h3>{dunkirk1940.basicChoices.map((item) => <button className={choiceId === item.id ? "choice active" : "choice"} key={item.id} onClick={() => { setChoiceId(item.id); setState(null); }} type="button">{item.label}</button>)}
      <h3>Tune variables</h3>{dunkirk1940.advancedVariables.map((item) => <label className="variable-control" key={item.id}>{item.label}: {values[item.id]}<input max={item.maximum} min={item.minimum} onChange={(event) => { setValues((current) => ({ ...current, [item.id]: Number(event.target.value) })); setState(null); }} step={item.step} type="range" value={values[item.id]} /></label>)}
      <button className="button" onClick={start} type="button">Initialize deterministic run</button>{error && <p role="alert">{error}</p>}
    </div><div className="runner-results">{!state ? <p>Initialize a run to inspect the causal state.</p> : <>
      <h3>Causal factors</h3><ul>{dunkirk1940.causalFactors.map((item) => <li key={item.id}>{item.label}: {state.causalFactorValues[item.id]}</li>)}</ul>
      {fork ? <><h3>{fork.label}</h3>{fork.choices.map((item) => <button className="choice" key={item.id} onClick={() => resolve(item.id)} type="button">{item.label}</button>)}</> : <p>All authored forks are resolved.</p>}
      <h3>Audit trace</h3><ol>{state.trace.map((item, index) => <li key={index}>{item.type}</li>)}</ol>
      {runId && <p>Saved. Shareable link: <a href={`/runs/${runId}`}>/runs/{runId}</a></p>}
      {saveError && <p role="alert">{saveError}</p>}
    </>}</div></div>
  </section>;
}
