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
  if (values.length === 0) return '';
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
  if (stroke.startsWith('#')) {
    const hex = stroke.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.22)`;
  }
  return stroke.replace(')', ', 0.22)').replace('rgb', 'rgba');
}

// ═══ BAR CHART — Monthly revenue bars ═══
type BarData = {
  label: string;
  current: number;
  previous?: number;
};

export function MonthlyBarChart({ data, height = 160 }: { data: BarData[]; height?: number }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.current, d.previous || 0]), 1);
  const barWidth = 100 / data.length;
  const gap = barWidth * 0.15;
  const usable = barWidth - gap;
  const hasPrevious = data.some((d) => d.previous !== undefined && d.previous > 0);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height: `${height}px` }} role="img" aria-label="Gràfica mensual d'ingressos">
        <defs>
          <linearGradient id="bar-grad-current" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="bar-grad-prev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a0af" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#94a0af" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1="0" y1={height * (1 - pct)} x2="100" y2={height * (1 - pct)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
        ))}
        {data.map((d, i) => {
          const x = i * barWidth + gap / 2;
          const currentH = (d.current / maxVal) * (height - 16);
          const prevH = ((d.previous || 0) / maxVal) * (height - 16);
          const innerW = hasPrevious ? usable / 2 - 0.3 : usable;
          return (
            <g key={d.label}>
              {hasPrevious && d.previous !== undefined && (
                <rect x={x} y={height - prevH} width={innerW} height={prevH} rx="1.5" fill="url(#bar-grad-prev)" />
              )}
              <rect x={hasPrevious ? x + innerW + 0.6 : x} y={height - currentH} width={innerW} height={currentH} rx="1.5" fill="url(#bar-grad-current)" />
              <text x={x + usable / 2} y={height - 2} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="3.2" fontFamily="var(--font-mono, monospace)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          <span className="opacity-50">Any actual</span>
        </div>
        {hasPrevious && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full opacity-40" style={{ background: '#94a0af' }} />
            <span className="opacity-50">Any anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ DONUT CHART — Distribution by type ═══
type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({ segments, size = 120 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center opacity-40 text-sm" style={{ height: size }}>
        Sense dades
      </div>
    );
  }

  const center = size / 2;
  const radius = size * 0.38;
  const strokeW = size * 0.12;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribució per tipus">
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dashLen = pct * circumference;
          const dashOffset = -accumulated * circumference;
          accumulated += pct;
          return (
            <circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          );
        })}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={size * 0.16} fontWeight="700" fontFamily="var(--font-mono, monospace)">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 text-[11px]">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="opacity-60">{seg.label}</span>
            <span className="font-medium" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiniLineChart({ series, height = 56 }: { series: Series[]; height?: number }) {
  const width = 100;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-14">
        <defs>
          <linearGradient id="grid-fade-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--at-subtle)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--at-subtle)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#grid-fade-dark)" opacity="0.3" />
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="var(--at-subtle)" strokeOpacity="0.4" strokeWidth="0.5" />
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
      <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
        {series.map((s, idx) => (
          <div key={`${s.label || 'legend'}-${idx}`} className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full" style={{ background: s.stroke }} />
            <span className="uppercase tracking-wide text-[10px]">{s.label}</span>
            {s.value !== undefined && <span className="font-medium">{s.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
