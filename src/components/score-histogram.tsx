interface ScoreHistogramProps {
  buckets: { label: string; count: number; color: string }[];
}

export function ScoreHistogram({ buckets }: ScoreHistogramProps) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Bars */}
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: 140 }}>
        {buckets.map((b) => {
          const pct = (b.count / maxCount) * 100;
          return (
            <div
              key={b.label}
              className="relative flex min-w-0 flex-1 flex-col justify-end"
              style={{ height: "100%" }}
            >
              <div
                className="w-full rounded-t-md transition-all"
                style={{
                  height: `${Math.max(pct, 4)}%`,
                  backgroundColor: b.color,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* Labels row */}
      <div className="flex gap-2 sm:gap-3">
        {buckets.map((b) => (
          <div key={b.label} className="min-w-0 flex-1 text-center">
            <p className="text-xs font-semibold text-slate-700">
              {b.count.toLocaleString("fr-FR")}
            </p>
            <p className="text-[11px] text-slate-400">{b.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
