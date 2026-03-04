/**
 * RadialProgress — SVG circular progress ring
 * Color dinàmic segons valor: emerald ≥70, amber ≥40, rose <40
 */

interface RadialProgressProps {
  value: number;        // 0-100
  size?: number;        // px, default 80
  strokeWidth?: number; // px, default 6
  label?: string;       // text under the number
  colorOverride?: 'emerald' | 'amber' | 'rose' | 'cyan';
}

const COLOR_MAP = {
  emerald: { stroke: '#34d399', glow: 'rgba(52, 211, 153, 0.2)' },
  amber:   { stroke: '#fbbf24', glow: 'rgba(251, 191, 36, 0.2)' },
  rose:    { stroke: '#f472b6', glow: 'rgba(244, 114, 182, 0.2)' },
  cyan:    { stroke: '#22d3ee', glow: 'rgba(34, 211, 238, 0.2)' },
};

function getColor(value: number) {
  if (value >= 70) return COLOR_MAP.emerald;
  if (value >= 40) return COLOR_MAP.amber;
  return COLOR_MAP.rose;
}

export default function RadialProgress({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  colorOverride,
}: RadialProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = colorOverride ? COLOR_MAP[colorOverride] : getColor(clamped);
  const center = size / 2;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="admin-radial-svg"
        role="img"
        aria-label={`${clamped}%`}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="admin-radial-ring"
          style={{
            '--ring-circumference': circumference,
            '--ring-offset': offset,
            filter: `drop-shadow(0 0 4px ${color.glow})`,
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
          } as React.CSSProperties}
        />
        {/* Center text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize={size * 0.22}
          fontFamily="var(--font-mono, monospace)"
          fontWeight="700"
        >
          {clamped}%
        </text>
      </svg>
      {label && (
        <span className="text-[10px] uppercase tracking-wider opacity-50">{label}</span>
      )}
    </div>
  );
}
