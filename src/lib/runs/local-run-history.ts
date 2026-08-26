export interface LocalRunEntry {
  runId: string;
  scenarioId: string;
  createdAt: string;
}

const STORAGE_KEY = "yourStory:runHistory";

export function getRunHistory(): LocalRunEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRunToHistory(entry: LocalRunEntry) {
  if (typeof window === "undefined") return;
  const history = getRunHistory();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...history].slice(0, 50)));
}

export function removeRunFromHistory(runId: string) {
  if (typeof window === "undefined") return;
  const history = getRunHistory().filter((entry) => entry.runId !== runId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
