# Scenario Authoring

Scenarios are reviewed, versioned historical starting states—not unrestricted prompts or certain predictions.

## Required

- Stable ID, scenario version, event-pack ID, and source-library version
- Divergence date, baseline, and content warning
- At least two Basic-mode choices
- Bounded Advanced-mode variables with baseline, range, step, and affected factors
- Source metadata, provenance, rights note, and review status

Run `npm test` whenever scenario data changes. Keep scenarios in `draft` until historical and simulation review are complete.
