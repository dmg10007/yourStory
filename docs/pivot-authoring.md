# Pivot Authoring

A pivot is a basic choice that changes one historical moment and carries enough sourced material for a narrative that runs from the immediate aftermath to the present day.

## Plausibility

Every pivot that has consequence seeds must document a minimal-rewrite justification: why the change was a near miss rather than a miracle, with cited sources. The schema rejects seeds on a choice without it.

## Horizons and evidence strength

Evidence strength decays with distance from the pivot, so each seed declares a horizon and its classification is constrained by it.

| Horizon | Allowed classifications |
|---|---|
| aftermath (weeks to months) | direct-inference, plausible-projection |
| decade (years to a decade) | plausible-projection, highly-speculative |
| present (decades to today) | highly-speculative |

Seeds are counterfactual, so none may be documented-fact. Documented context belongs in the choice's narrative events.

## Writing seeds

- Give each seed a short `basis` that states the causal link from the pivot, and cite at least one source.
- Write seeds so they can be combined in any subset. Each play draws a subset by seed, so avoid seeds that contradict or depend on each other.
- Seed IDs must be unique across the scenario and must not reuse a narrative event ID, because narration attributes claims by ID.
- Spell out "United States" instead of "U.S." so narration validation can match terms literally.
- Provide at least as many seeds per horizon as `seedSelection` requests. The defaults are 2 aftermath, 2 decade, and 1 present.

## Sampling

`sampleConsequenceSeeds(choice, randomSeed)` draws seeds per horizon without replacement. The same random seed always gives the same draw, so a stored run replays identically.
