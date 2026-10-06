import { narrativeHorizons, type ConsequenceSeed, type ScenarioDefinition } from "@/domain/scenario";

type BasicChoice = ScenarioDefinition["basicChoices"][number];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically draws a subset of a pivot's authored consequence seeds.
 *
 * The same random seed always yields the same draw, so a stored run replays
 * identically, while different runs combine the pool differently. Seeds are drawn
 * per horizon without replacement, clamped to the pool size, and returned in
 * horizon order and authored order within each horizon. The draw never invents
 * content: every returned seed was authored, sourced, and validated.
 */
export function sampleConsequenceSeeds(choice: BasicChoice, randomSeed: string): ConsequenceSeed[] {
  return narrativeHorizons.flatMap((horizon) => {
    const pool = choice.consequenceSeeds.filter((seed) => seed.horizon === horizon);
    const count = Math.min(choice.seedSelection[horizon], pool.length);
    const random = mulberry32(hashString(`${randomSeed}:${choice.id}:${horizon}`));
    const order = pool.map((_, index) => index);

    for (let index = order.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [order[index], order[swap]] = [order[swap], order[index]];
    }

    return order
      .slice(0, count)
      .sort((left, right) => left - right)
      .map((index) => pool[index]);
  });
}
