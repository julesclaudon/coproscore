"use client";

const DPE_COLORS: Record<string, string> = {
  A: "bg-[#319834]",
  B: "bg-[#33cc31]",
  C: "bg-[#cbfc34]",
  D: "bg-[#fbfe06]",
  E: "bg-[#fbcc05]",
  F: "bg-[#fc9935]",
  G: "bg-[#fc0205]",
};

const DPE_CLASSES = ["A", "B", "C", "D", "E", "F", "G"];

export function DpeDistribution({
  distribution,
  median,
}: {
  distribution: Record<string, number>;
  median: string;
}) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="flex flex-col gap-1.5" role="img" aria-label={`Distribution DPE : ${DPE_CLASSES.filter((c) => distribution[c]).map((c) => `classe ${c} : ${distribution[c]} logements`).join(", ")}. Médiane : ${median}`}>
      {DPE_CLASSES.map((cls) => {
        const count = distribution[cls] || 0;
        const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const isMedian = cls === median;

        return (
          <div key={cls} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-white ${DPE_COLORS[cls]}`}
            >
              {cls}
            </span>
            <div className="flex-1">
              <div className="h-5 w-full rounded bg-slate-100">
                <div
                  className={`h-5 rounded ${DPE_COLORS[cls]} transition-all duration-500`}
                  style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%`, opacity: 0.8 }}
                />
              </div>
            </div>
            <span className={`w-8 text-right text-sm ${isMedian ? "font-bold text-slate-900" : "text-slate-400"}`}>
              {count}
            </span>
            {isMedian && (
              <span className="text-xs font-medium text-slate-500">(m&eacute;diane)</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
