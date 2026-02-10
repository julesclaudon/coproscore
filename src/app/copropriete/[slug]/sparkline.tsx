"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface SparklineProps {
  data: DataPoint[];
  height?: number;
}

export function Sparkline({ data, height = 200 }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-sm text-slate-400">
        Pas assez de données pour afficher la tendance
      </div>
    );
  }

  const width = 600;
  const padTop = 24;
  const padBottom = 32;
  const padLeft = 56;
  const padRight = 16;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Round axis labels to nice values
  const yMin = Math.floor(minVal / 500) * 500;
  const yMax = Math.ceil(maxVal / 500) * 500;
  const yRange = yMax - yMin || 1;

  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - ((d.value - yMin) / yRange) * chartH;
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Area path: line + close to bottom
  const areaPath = [
    `M ${points[0].x},${points[0].y}`,
    ...points.slice(1).map((p) => `L ${p.x},${p.y}`),
    `L ${points[points.length - 1].x},${padTop + chartH}`,
    `L ${points[0].x},${padTop + chartH}`,
    "Z",
  ].join(" ");

  // Y-axis labels (3 ticks)
  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax];

  // X-axis labels: show first, middle, last
  const xIndexes =
    data.length <= 4
      ? data.map((_, i) => i)
      : [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Grid lines */}
      {yTicks.map((tick) => {
        const y = padTop + chartH - ((tick - yMin) / yRange) * chartH;
        return (
          <line
            key={tick}
            x1={padLeft}
            y1={y}
            x2={width - padRight}
            y2={y}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill="#0d9488" opacity={0.08} />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="#0d9488"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#0d9488" />
      ))}

      {/* Y-axis labels */}
      {yTicks.map((tick) => {
        const y = padTop + chartH - ((tick - yMin) / yRange) * chartH;
        return (
          <text
            key={tick}
            x={padLeft - 8}
            y={y + 4}
            textAnchor="end"
            fontSize={11}
            fill="#94a3b8"
          >
            {tick.toLocaleString("fr-FR")}
          </text>
        );
      })}

      {/* X-axis labels */}
      {xIndexes.map((idx) => (
        <text
          key={idx}
          x={points[idx].x}
          y={height - 6}
          textAnchor="middle"
          fontSize={11}
          fill="#94a3b8"
        >
          {data[idx].label}
        </text>
      ))}
    </svg>
  );
}
