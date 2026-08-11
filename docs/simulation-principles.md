# Simulation Principles

## What the engine represents

A scenario is a constrained historical state at a specific point in time. It has curated interventions, causal factors, relationships between factors, decision forks, and evidence records.

The engine represents uncertainty with ranges and repeated sampling. It returns several distinct, human-readable branches rather than declaring a single alternate timeline to be certain.

## Evidence labels

| Label | Meaning |
|---|---|
| Documented fact | A claim about actual history supported by curated source material |
| Direct inference | A near-term result directly supported by the modeled causal relationship |
| Plausible projection | A downstream result consistent with the scenario model, but less directly supported |
| Highly speculative | A long-range or weakly constrained projection that must not be presented as likely fact |

## Probability display

The interface shows probability bands, such as 40–50%, rather than precise decimal probabilities. A band reflects uncertainty in model parameters and sampling variation; it is not a claim of measurable historical frequency.

## Advanced controls

Advanced mode exposes only variables curated for the selected point of divergence. Categories may include politics, military readiness, leadership, public opinion, technology, economy, and diplomacy. Each control requires a range, baseline value, unit, explanation, and downstream factor links.

## Decision forks

A fork is an authored future decision point with preconditions. When pause mode is enabled, the engine stops at a reached fork and asks the player to choose from bounded alternatives. When disabled, the model selects an outcome using its scenario rules and saved random seed.

## Narrative constraints

Headline and briefing generation receives only structured branch data, permitted source excerpts, and a style guide. Generated prose must include uncertainty-aware language and must not add unsourced historical claims.
