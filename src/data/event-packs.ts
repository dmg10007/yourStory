import type { EventPack } from "@/domain/simulation";

export const eventPacks: EventPack[] = [
  { id: "wwii-europe", title: "World War II: Europe", era: "1939–1945", description: "Explore decisive choices in the European theatre, beginning with the fall of France and the Dunkirk evacuation.", scope: "First vertical slice", status: "available" },
  { id: "wwii-pacific", title: "World War II: Pacific", era: "1937–1945", description: "Trace alternate diplomatic, naval, and strategic choices across the Pacific theatre, starting at Midway.", scope: "Pacific expansion", status: "available" },
  { id: "cold-war", title: "The Cold War: On the Brink", era: "1947–1989", description: "Stand at the precipice of nuclear confrontation, partition, and espionage from the Berlin blockade to the Caribbean.", scope: "Cold War expansion", status: "available" },
  { id: "american-civil-war", title: "American Civil War", era: "1861–1865", description: "Investigate the political and military decisions that shaped the conflict and Reconstruction.", scope: "Future event pack", status: "planned" },
  { id: "american-revolution", title: "American Revolution", era: "1775–1783", description: "Follow the fragile alliances, campaigns, and political choices behind independence.", scope: "Future event pack", status: "planned" }
];
