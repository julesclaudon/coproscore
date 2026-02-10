export interface FavoriteEntry {
  slug: string;
  nom: string;
  adresse: string;
  commune: string;
  score: number | null;
  lots: number | null;
  addedAt: string;
}

const STORAGE_KEY = "coproscore_favorites";
const MAX_FREE = 5;
const MAX_PRO = 50;

function getMax(): number {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_DEV_UNLOCK === "true") return MAX_PRO;
  return MAX_FREE;
}

export function getFavorites(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FavoriteEntry[];
  } catch {
    return [];
  }
}

export function addFavorite(
  entry: Omit<FavoriteEntry, "addedAt">
): { ok: boolean; limitReached?: boolean } {
  if (typeof window === "undefined") return { ok: false };
  try {
    const favorites = getFavorites();
    if (favorites.some((f) => f.slug === entry.slug)) {
      return { ok: true }; // already exists
    }
    if (favorites.length >= getMax()) {
      return { ok: false, limitReached: true };
    }
    favorites.unshift({ ...entry, addedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function removeFavorite(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const favorites = getFavorites().filter((f) => f.slug !== slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

export function isFavorite(slug: string): boolean {
  return getFavorites().some((f) => f.slug === slug);
}

export function countFavorites(): number {
  return getFavorites().length;
}

export function clearFavorites(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { MAX_FREE, MAX_PRO };
