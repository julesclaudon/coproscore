"use client";

function getColor(score: number, max: number): string {
  const pct = (score / max) * 100;
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number | null;
  max: number;
}) {
  const value = score ?? 0;
  const pct = Math.round((value / max) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-medium text-slate-400">
          {score ?? "?"}/{max}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${getColor(value, max)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
