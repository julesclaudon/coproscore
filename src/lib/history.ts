export interface HistoryEntry {
  slug: string;
  nom: string;
  adresse: string;
  score: number | null;
  visitedAt: string;
}

const STORAGE_KEY = "coproscore_history";
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "visitedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory().filter((e) => e.slug !== entry.slug);
    history.unshift({ ...entry, visitedAt: new Date().toISOString() });
    if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getHistoryCount(): number {
  return getHistory().length;
}
