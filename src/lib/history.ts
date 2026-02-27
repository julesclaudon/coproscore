export interface HistoryEntry {
  slug: string;
  nom: string;
  adresse: string;
  score: number | null;
  visitedAt: string;
}

const STORAGE_PREFIX = "coproscore_history";
const MAX_ENTRIES = 50;

function storageKey(userId?: string): string {
  return userId ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX;
}

export function getHistory(userId?: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "visitedAt">, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory(userId).filter((e) => e.slug !== entry.slug);
    history.unshift({ ...entry, visitedAt: new Date().toISOString() });
    if (history.length > MAX_ENTRIES) history.length = MAX_ENTRIES;
    localStorage.setItem(storageKey(userId), JSON.stringify(history));
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearHistory(userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}

export function getHistoryCount(userId?: string): number {
  return getHistory(userId).length;
}
