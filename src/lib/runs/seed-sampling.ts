import { narrativeHorizons, type ConsequenceSeed, type ScenarioDefinition } from "@/domain/scenario";
import { hashString, mulberry32 } from "./seeded-random";

type BasicChoice = ScenarioDefinition["basicChoices"][number];

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
