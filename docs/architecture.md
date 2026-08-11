# Architecture

## Design boundary

Your Story has two deliberately separate systems:

1. **Simulation system:** deterministic, versioned, testable code that validates interventions and generates structured branch data.
2. **Narrative system:** hosted or local language models that turn approved structured events and cited source excerpts into readable headlines, briefings, and evidence explanations.

Narrative providers never determine probabilities, causal weights, source truth, or simulation state.

## Target flow

```text
Scenario definition
  → validate player intervention
  → causal graph propagation
  → stochastic sampling with a saved seed
  → cluster equivalent outcome paths
  → rank and label branches
  → render timeline, symbolic map, and indicators
  → optionally produce source-constrained narrative text
```

## Domain modules

- `src/domain/`: serializable types with no Next.js, database, or model-provider imports.
- `src/data/`: reviewed, versioned scenario definitions and source metadata.
- `src/lib/`: engine interfaces, deterministic utilities, adapters, and validation.
- `app/`: presentation and route handlers only.

## Reproducibility contract

Every `ScenarioRun` must retain:

- `scenarioId`
- `engineVersion`
- `sourceLibraryVersion`
- `randomSeed`
- simulation horizon
- decision-fork setting
- complete intervention payload
- generated branches

A public share URL resolves a stored immutable result rather than rerunning a newer engine version.

## Future services

The MVP starts with Next.js route handlers and a TypeScript engine package. PostgreSQL/Supabase will store scenarios, sources, runs, and public share records. An asynchronous job queue becomes necessary only when Monte Carlo execution exceeds request-time limits.

## Security boundaries

- Keep provider credentials server-only.
- Validate all advanced controls against per-scenario allowlists and ranges.
- Rate-limit public simulation and narrative endpoints.
- Store curated sources with provenance, license/rights notes, excerpt boundaries, and version IDs.
- Treat user-written alternate-history prompts as untrusted input.
