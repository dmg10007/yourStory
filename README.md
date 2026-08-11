# Your Story

**Your Story** is a source-aware alternate-history sandbox. A player changes a consequential historical decision, simulates forward, compares several plausible branches, and can inspect the evidence and assumptions behind each projection.

> This is a narrative simulation, not a predictive engine. The product must clearly separate established history, structured inference, and long-range speculation.

## MVP

The first vertical slice is **World War II: Europe**, starting with a focused scenario around the Dunkirk evacuation in May–June 1940.

Players will be able to:

- Choose a curated alternative in Basic mode or adjust bounded variables in Advanced mode.
- Simulate 1, 5, 10, or 50 years forward, or to the present day.
- Review several outcome branches ordered by probability band.
- Optionally pause at major decision forks and introduce subsequent interventions.
- Explore timelines, period-inspired newspaper headlines, symbolic maps, indicators, and evidence.
- Share an immutable, read-only scenario result.

## Core principles

- **Guided before generative.** Historical points of divergence and valid ranges are curated.
- **Causality before narration.** A deterministic, versioned model produces events and probability bands; an LLM only renders approved output into prose.
- **Evidence and uncertainty are visible.** Every result is labeled as documented fact, direct inference, plausible projection, or highly speculative.
- **Runs are reproducible.** A shareable run records scenario, intervention, random seed, engine version, and source-library version.
- **Sensitive material is handled responsibly.** Violent and politically sensitive subjects receive contextual warnings and careful sourcing.

## Architecture

```text
Intervention → causal graph → sampled outcomes → clustered branches → timeline/map/indicators → source-grounded narration
```

See [Architecture](docs/architecture.md), [Simulation Principles](docs/simulation-principles.md), and the [Roadmap](docs/roadmap.md).

## Local development

Requires Node.js 22+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run typecheck
npm run lint
npm run build
```

## Repository layout

```text
app/                  Next.js routes and application styles
src/data/              Curated event-pack metadata and scenario seed data
src/domain/            Framework-independent domain contracts
src/lib/               Engine and provider interfaces
docs/                 Product and technical documentation
```

## Environment

Copy `.env.example` to `.env.local` only when adding narrative providers. Never commit credentials. Hosted APIs and Ollama will share an adapter contract; neither provider may calculate probabilities, mutate model data, or invent sources.

## Status

The repository currently contains the UI foundation and typed simulation contracts. The next milestone is the formal scenario domain contract and seed definition for Dunkirk 1940.
