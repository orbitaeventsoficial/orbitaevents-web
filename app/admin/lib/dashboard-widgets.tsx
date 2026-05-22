/**
 * Components SVG i helpers purs pel dashboard admin.
 * Extret de page.tsx per reduir la mida del component principal.
 */

import React from 'react';
import { BOOKING_STATUS_OPTIONS, DASHBOARD_WIDGET_COLOR_MAP, LEAD_STATUS_OPTIONS } from '@/lib/constants';
import { ADMIN_CHART_SERIES_COLORS, ADMIN_SVG_COLORS } from '@/lib/constants/admin';
import { ADMIN_ACTIONS_HELP, helpAttrs } from '../components/adminHelpContent';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RadialProgressProps {
  value: number;        // 0-100
  size?: number;        // px, default 80
  strokeWidth?: number; // px, default 6
  label?: string;       // text under the number
  colorOverride?: 'emerald' | 'amber' | 'rose' | 'cyan';
}

type AccentColor = 'cyan' | 'emerald' | 'rose' | 'amber' | 'purple' | 'sky';

type Series = {
  data: number[];
  stroke: string;
  label?: string;
  value?: string | number;
};

type BarData = {
  label: string;
  current: number;
  previous?: number;
};

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

// ─── Constants ──────────────────────────────────────────────────────────────

const accentClassMap: Record<AccentColor, string> = {
  cyan: 'admin-ui-metric-card--cyan',
  emerald: 'admin-ui-metric-card--emerald',
  rose: 'admin-ui-metric-card--rose',
  amber: 'admin-ui-metric-card--amber',
  purple: 'admin-ui-metric-card--purple',
  sky: 'admin-ui-metric-card--sky',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getColor(value: number) {
  if (value >= 70) return DASHBOARD_WIDGET_COLOR_MAP.emerald;
  if (value >= 40) return DASHBOARD_WIDGET_COLOR_MAP.amber;
  return DASHBOARD_WIDGET_COLOR_MAP.rose;
}

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

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Bona nit';
  if (h < 13) return 'Bon dia';
  if (h < 20) return 'Bona tarda';
  return 'Bona nit';
}

// ─── Components ─────────────────────────────────────────────────────────────

export function RadialProgress({
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
  const color = colorOverride ? DASHBOARD_WIDGET_COLOR_MAP[colorOverride] : getColor(clamped);
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
        <circle cx={center} cy={center} r={radius} fill="none" stroke={ADMIN_SVG_COLORS.donutTrack} strokeWidth={strokeWidth} />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={color.stroke} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} className="admin-radial-ring"
          style={{ '--ring-circumference': circumference, '--ring-offset': offset, filter: `drop-shadow(0 0 4px ${color.glow})`, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' } as React.CSSProperties}
        />
        <text x={center} y={center} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize={size * 0.22} fontFamily="var(--font-mono, monospace)" fontWeight="700">
          {clamped}%
        </text>
      </svg>
      {label && <span className="text-[10px] uppercase tracking-wider opacity-50">{label}</span>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  changeType,
  icon,
  accent = 'cyan',
  helpTitle,
  helpText,
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: string;
  accent?: AccentColor;
  helpTitle?: string;
  helpText?: string;
}) {
  const changeClassMap = {
    up: 'admin-ui-metric-change--up',
    down: 'admin-ui-metric-change--down',
    neutral: 'admin-ui-metric-change--neutral',
  };
  const accentClass = accentClassMap[accent];

  return (
    <div className={`admin-ui-metric-card ${accentClass}`} {...helpAttrs(ADMIN_ACTIONS_HELP.dashboardWidget.metricCard(helpTitle || label, helpText))}>
      <div className="admin-ui-metric-head">
        <div className="admin-ui-metric-copy">
          <p className="admin-ui-metric-label">{label}</p>
          <p className="admin-ui-metric-value">{value}</p>
        </div>
        {icon && <span className="admin-ui-metric-icon">{icon}</span>}
      </div>
      <div className="admin-ui-metric-dot" />
      {change && (
        <p className={`admin-ui-metric-change ${changeClassMap[changeType || 'neutral']}`}>
          {change}
        </p>
      )}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  noPadding,
  children,
  helpText,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
  helpText?: string;
}) {
  return (
    <div className="admin-ui-card" {...helpAttrs(title ? ADMIN_ACTIONS_HELP.dashboardWidget.card(title, helpText) : undefined)}>
      {(title || subtitle || action) && (
        <div className="admin-ui-card-head">
          <div className="admin-ui-card-head-copy">
            {title && <h3 className="admin-ui-card-title">{title}</h3>}
            {subtitle && <p className="admin-ui-card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="admin-ui-card-head-action">{action}</div>}
        </div>
      )}
      <div className={`admin-ui-card-body ${noPadding ? 'admin-ui-card-body--none' : ''}`}>{children}</div>
    </div>
  );
}

export function Button({
  variant = 'primary',
  icon,
  label,
  helpText,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  label: string;
  helpText?: string;
}) {
  const className = `admin-ui-btn admin-ui-btn--${variant} admin-ui-btn--default`;
  return (
    <button type="button" className={className} {...helpAttrs(ADMIN_ACTIONS_HELP.dashboardWidget.button(label, helpText))}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

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
            <stop offset="0%" stopColor={ADMIN_CHART_SERIES_COLORS.leads} stopOpacity="0.9" />
            <stop offset="100%" stopColor={ADMIN_CHART_SERIES_COLORS.leads} stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="bar-grad-prev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ADMIN_CHART_SERIES_COLORS.prevBar} stopOpacity="0.5" />
            <stop offset="100%" stopColor={ADMIN_CHART_SERIES_COLORS.prevBar} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1="0" y1={height * (1 - pct)} x2="100" y2={height * (1 - pct)} stroke={ADMIN_SVG_COLORS.gridLine} strokeWidth="0.3" />
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
              <text x={x + usable / 2} y={height - 2} textAnchor="middle" fill={ADMIN_SVG_COLORS.axisLabel} fontSize="3.2" fontFamily="var(--font-mono, monospace)">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" />
          <span className="opacity-50">Any actual</span>
        </div>
        {hasPrevious && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full opacity-40" style={{ background: ADMIN_CHART_SERIES_COLORS.prevBar }} />
            <span className="opacity-50">Any anterior</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
              key={seg.label} cx={center} cy={center} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeW}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`} strokeDashoffset={dashOffset}
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
            <span className="font-medium font-mono">{seg.value}</span>
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
              <polyline fill="none" stroke={s.stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={points} />
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



