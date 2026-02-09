"use client";

function getColor(score: number): string {
  if (score >= 70) return "#10B981"; // emerald-500
  if (score >= 40) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

export function ScoreGauge({ score }: { score: number | null }) {
  const value = score ?? 0;
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = score !== null ? getColor(value) : "#cbd5e1";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="170" height="170" viewBox="0 0 170 170">
        {/* Background circle */}
        <circle
          cx="85"
          cy="85"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx="85"
          cy="85"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 85 85)"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {score ?? "?"}
        </span>
        <span className="text-xs text-slate-400">/100</span>
      </div>
    </div>
  );
}
