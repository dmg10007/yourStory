export const narrationVoices = ["historian", "dispatch", "memoir"] as const;

export type NarrationVoice = (typeof narrationVoices)[number];

export const narrationVoiceLabels: Record<NarrationVoice, string> = {
  historian: "Historian's retrospective",
  dispatch: "Wire-service dispatch",
  memoir: "Later memoir",
};

export function isNarrationVoice(value: unknown): value is NarrationVoice {
  return typeof value === "string" && (narrationVoices as readonly string[]).includes(value);
}
