export const PERIOD_LABELS: Record<string, string> = {
  AVANT_1949: "avant 1949",
  DE_1949_A_1960: "entre 1949 et 1960",
  DE_1961_A_1974: "entre 1961 et 1974",
  DE_1975_A_1993: "entre 1975 et 1993",
  DE_1994_A_2000: "entre 1994 et 2000",
  DE_2001_A_2010: "entre 2001 et 2010",
  A_COMPTER_DE_2011: "après 2011",
};

export function formatPeriod(p: string | null): string | null {
  if (!p || p === "NON_CONNUE" || p === "non renseigné") return null;
  return PERIOD_LABELS[p] ?? null;
}

export function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-teal-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

export function scoreBg(score: number | null) {
  if (score === null) return "bg-slate-100";
  if (score >= 70) return "bg-teal-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}
