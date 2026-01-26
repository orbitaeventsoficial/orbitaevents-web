import React from 'react';

type Series = {
  data: number[];
  stroke: string;
  label?: string;
  value?: string | number;
};

function normalizeSeries(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || values.length === 0) {
    return values.map(() => 0.5);
  }
  if (min === max) {
    return values.map(() => 0.5);
  }
  return values.map((v) => (v - min) / (max - min));
}

function buildPoints(values: number[], height: number, width: number) {
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - v * height;
      return `${x},${y}`;
    })
    .join(' ');
}

function buildAreaPath(values: number[], height: number, width: number) {
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - v * height;
    return [x, y] as const;
  });
  const line = points.map((p) => `${p[0]},${p[1]}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  return `M ${first[0]} ${height} L ${line} L ${last[0]} ${height} Z`;
}

function strokeToFill(stroke: string) {
  return stroke.replace(')', ', 0.22)').replace('rgb', 'rgba');
}

export function MiniLineChart({ series, height = 56 }: { series: Series[]; height?: number }) {
  const width = 100;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14">
        <defs>
          <linearGradient id="grid-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(148,163,184,0.35)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#grid-fade)" opacity="0.2" />
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(148,163,184,0.35)" strokeWidth="0.5" />
        {series.map((s, idx) => {
          const normalized = normalizeSeries(s.data);
          const points = buildPoints(normalized, height - 2, width);
          const areaPath = buildAreaPath(normalized, height - 2, width);
          return (
            <g key={`${s.label || 'series'}-${idx}`}>
              <path d={areaPath} fill={strokeToFill(s.stroke)} />
              <polyline
                fill="none"
                stroke={s.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
        {series.map((s, idx) => (
          <div key={`${s.label || 'legend'}-${idx}`} className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ background: s.stroke }} />
            <span className="uppercase tracking-wide text-[10px] text-slate-400">{s.label}</span>
            {s.value !== undefined && <span className="text-slate-700 font-medium">{s.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
