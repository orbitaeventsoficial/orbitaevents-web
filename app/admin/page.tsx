import Tooltip from './components/Tooltip';
import Link from 'next/link';
import QuickActions from './components/QuickActions';
import StatusQuickSelect from './components/StatusQuickSelect';
import { fetchDashboardData, timeAgo, formatEventDate } from './lib/dashboard-data';
import { formatDateTimeFull, formatCurrency, formatDate } from '@/lib/constants';
import { EVENT_TYPE_LABELS } from '@/lib/constants';
import { generateDashboardInsights, type DashboardInsight } from '@/lib/services/dashboardInsightsService';

interface RadialProgressProps {
  value: number;        // 0-100
  size?: number;        // px, default 80
  strokeWidth?: number; // px, default 6
  label?: string;       // text under the number
  colorOverride?: 'emerald' | 'amber' | 'rose' | 'cyan';
}

const LEAD_STATUS_OPTIONS = [
  { value: 'NEW', label: 'Entrada nova' },
  { value: 'CONTACTED', label: 'Contactat' },
  { value: 'QUOTE_SENT', label: 'Pressupost enviat' },
  { value: 'NEGOTIATING', label: 'Negociacio' },
  { value: 'WON', label: 'Guanyat' },
  { value: 'LOST', label: 'Perdut' },
] as const;

const BOOKING_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendent' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'PREPARING', label: 'Preparant' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancel.lada' },
] as const;

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

function RadialProgress({
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

// Color accent type for MetricCard
type AccentColor = 'cyan' | 'emerald' | 'rose' | 'amber' | 'purple' | 'sky';

const accentClassMap: Record<AccentColor, string> = {
  cyan: 'admin-ui-metric-card--cyan',
  emerald: 'admin-ui-metric-card--emerald',
  rose: 'admin-ui-metric-card--rose',
  amber: 'admin-ui-metric-card--amber',
  purple: 'admin-ui-metric-card--purple',
  sky: 'admin-ui-metric-card--sky',
};

// MetricCard - Light surface metric card with accent colors
function MetricCard({
  label,
  value,
  change,
  changeType,
  icon,
  accent = 'cyan',
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon?: string;
  accent?: AccentColor;
}) {
  const changeClassMap = {
    up: 'admin-ui-metric-change--up',
    down: 'admin-ui-metric-change--down',
    neutral: 'admin-ui-metric-change--neutral',
  };

  const accentClass = accentClassMap[accent];

  return (
    <div className={`admin-ui-metric-card ${accentClass}`}>
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

// Card - Generic card container
function Card({
  title,
  subtitle,
  action,
  noPadding,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-ui-card">
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

// Button - Unified button variants
function Button({
  variant = 'primary',
  icon,
  label,
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string;
  label: string;
}) {
  const className = `admin-ui-btn admin-ui-btn--${variant} admin-ui-btn--default`;

  return (
    <button type="button" className={className}>
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

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

function MonthlyBarChart({ data, height = 160 }: { data: BarData[]; height?: number }) {
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
          <span className="inline-block h-2 w-2 rounded-full" />
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

function DonutChart({ segments, size = 120 }: { segments: DonutSegment[]; size?: number }) {
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

function MiniLineChart({ series, height = 56 }: { series: Series[]; height?: number }) {
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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Bona nit';
  if (h < 13) return 'Bon dia';
  if (h < 20) return 'Bona tarda';
  return 'Bona nit';
}

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const d = await fetchDashboardData();

  const insights = generateDashboardInsights({
    leadsThisMonth: d.leadsThisMonth,
    staleLeadsCount: d.staleLeadsCount,
    hotLeadsCount: d.hotLeadsCount,
    conversionRate: d.conversionRate,
    bookingsConfirmed: d.bookingsConfirmed,
    bookingsThisMonth: d.bookingsThisMonth,
    avgMarginPct: d.avgMarginPct,
    cashFlowNet30: d.cashFlowNet30,
    pipelineWeighted30: d.pipelineWeighted30,
    pendingPayments: d.pendingPayments,
    revenueThisMonth: d.revenueThisMonth,
    revenueTarget: d.revenueTarget,
    nextEvent: d.nextEvent ? {
      daysUntil: d.nextEvent.daysUntil,
      clientName: d.nextEvent.clientName,
      depositPaid: d.nextEvent.depositPaid,
      remainingPaid: d.nextEvent.remainingPaid,
    } : null,
    inventoryMaintenance: d.inventoryMaintenance,
    inventoryBroken: d.inventoryBroken,
  });

  const pilotToday = [
    {
      id: 'leads',
      step: 'Pas 1',
      title: 'Respondre entrades',
      description: d.leadsThisMonth > 0 ? `${d.leadsThisMonth} consultes aquest mes` : 'No hi ha noves consultes',
      href: '/admin/leads',
      cta: 'Anar a entrades',
      tone: d.leadsThisMonth > 0 ? 'amber' : 'emerald',
    },
    {
      id: 'tasks',
      step: 'Pas 2',
      title: 'Executar tasques',
      description: d.upcomingTasks.length > 0 ? `${d.upcomingTasks.length} tasques obertes` : 'Cap tasca pendent',
      href: '/admin/tasks',
      cta: 'Veure tasques',
      tone: d.upcomingTasks.length > 0 ? 'amber' : 'emerald',
    },
    {
      id: 'postevent',
      step: 'Pas 3',
      title: 'Tancar post-esdeveniment',
      description: d.postEventPending > 0 ? `${d.postEventPending} correus pendents` : 'Post-esdeveniment al dia',
      href: '/admin/emails',
      cta: 'Gestionar',
      tone: d.postEventPending > 0 ? 'rose' : 'emerald',
    },
    {
      id: 'bookings',
      step: 'Pas 4',
      title: 'Preparar reserves',
      description: d.bookingsConfirmed > 0 ? `${d.bookingsConfirmed} reserves confirmades` : 'Sense reserves confirmades',
      href: '/admin/bookings',
      cta: 'Veure reserves',
      tone: 'sky',
    },
  ] as const;

  return (
    <div className="admin-control-room">
      {/* ═══ HERO HEADER ═══ */}
      <div className="admin-hero-header admin-gradient admin-gradient--hero admin-card-glass">
        <div className="admin-hero-glow" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium opacity-60 mb-1">{getGreeting()}</p>
              <h1 className="admin-hero-title">Òrbita Events</h1>
              <p className="admin-hero-subtitle">Visió general del negoci</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/analytics" className="hidden sm:inline-flex">
                <Button variant="secondary" icon="📈" label="Analítica" />
              </Link>
              <Link href="/admin/leads">
                <Button variant="primary" icon="+" label="Nou lead" />
              </Link>
            </div>
          </div>
          <div className="admin-cr-quick-links mt-4">
            <Link href="/admin/inbox" className="admin-cr-quick-link">📥 Inbox (IMAP)</Link>
            <Link href="/admin/emails" className="admin-cr-quick-link">🤖 Correus automàtics</Link>
            <Link href="/admin/bookings" className="admin-cr-quick-link">📋 Reserves</Link>
            <Link href="/admin/economia" className="admin-cr-quick-link">💶 Economia</Link>
            <Link href="/admin/calendario" className="admin-cr-quick-link">📅 Calendari</Link>
          </div>
        </div>
      </div>

      {/* ═══ PRÒXIM BOLO ═══ */}
      {d.nextEvent && (
        <Link href={`/admin/bookings/${d.nextEvent.id}`} className="block">
          <section className={`rounded-2xl border-2 p-5 sm:p-6 transition-all admin-card-glass ${
            d.nextEvent.daysUntil <= 1
              ? 'border-amber-500/50 admin-glow-pulse'
              : d.nextEvent.daysUntil <= 3
                ? 'border-cyan-500/30'
                : 'border-white/10'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    d.nextEvent.daysUntil <= 1 ? 'text-amber-400' : 'text-cyan-400'
                  }`}>
                    {d.nextEvent.daysUntil === 0 ? 'AVUI' : d.nextEvent.daysUntil === 1 ? 'DEMÀ' : `D'aquí ${d.nextEvent.daysUntil} dies`}
                  </span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    d.nextEvent.daysUntil <= 1 ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
                  }`} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold truncate">{d.nextEvent.clientName}</h2>
                <p className="text-sm opacity-70 mt-1">
                  {formatDate(d.nextEvent.eventDate)}
                  {d.nextEvent.eventStartTime && ` · ${d.nextEvent.eventStartTime}`}
                  {d.nextEvent.eventType && ` · ${EVENT_TYPE_LABELS[d.nextEvent.eventType] || d.nextEvent.eventType}`}
                </p>
                <p className="text-sm opacity-50 mt-0.5 truncate">
                  {[d.nextEvent.eventVenue, d.nextEvent.eventLocation].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(d.nextEvent.total)}</p>
                <p className="text-xs opacity-70 mt-0.5">{d.nextEvent.packName}</p>
                <div className="flex items-center justify-end gap-1.5 mt-2">
                  <Tooltip text={d.nextEvent.depositPaid && d.nextEvent.remainingPaid ? 'Tot pagat' : d.nextEvent.depositPaid ? 'Falta pagament final' : 'Sense cap pagament'}>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${d.nextEvent.depositPaid && d.nextEvent.remainingPaid ? 'bg-emerald-400' : d.nextEvent.depositPaid ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  </Tooltip>
                  <span className="text-xs">
                    {d.nextEvent.depositPaid && d.nextEvent.remainingPaid ? 'Pagat' : d.nextEvent.depositPaid ? 'Parcial' : 'Pendent'}
                  </span>
                </div>
                {d.nextEvent.checklistTotal > 0 && (
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    <RadialProgress
                      value={Math.round((d.nextEvent.checklistDone / d.nextEvent.checklistTotal) * 100)}
                      size={36}
                      strokeWidth={3}
                    />
                    <span className="text-xs opacity-60">
                      {d.nextEvent.checklistDone}/{d.nextEvent.checklistTotal}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs opacity-40 mt-3">Toca per veure detalls →</p>
          </section>
        </Link>
      )}

      {/* ═══ OBJECTIU MENSUAL — amb RadialProgress ═══ */}
      <section className="rounded-2xl border border-white/10 p-4 sm:p-5 admin-card-glass">
        <div className="flex items-center gap-5">
          <RadialProgress
            value={d.revenueMonthPct}
            size={88}
            strokeWidth={7}
          />
          <div className="flex-1 min-w-0">
            <Tooltip text="Objectiu mensual configurable a Configuració">
              <p className="text-xs font-medium uppercase tracking-wide opacity-60">Ingressos del mes</p>
            </Tooltip>
            <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(d.revenueThisMonth)}
            </p>
            <p className="text-sm opacity-50">
              de {formatCurrency(d.revenueTarget)} objectiu
            </p>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mt-2">
              <div
                className={`h-full rounded-full admin-progress-animated ${
                  d.revenueMonthPct >= 100 ? 'bg-emerald-500' : d.revenueMonthPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, d.revenueMonthPct)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="admin-cr-panel admin-cr-panel--pilot">
        <div className="admin-cr-panel-head">
          <div>
            <p className="admin-cr-kicker admin-cr-kicker--pilot">Mode Solo</p>
            <h2 className="admin-cr-h2">Pilot automàtic d&apos;avui</h2>
            <p className="admin-cr-small">No és lineal: pots començar directament pel pas 2 o pas 3.</p>
          </div>
          <span className="admin-cr-pill admin-cr-pill--pilot">4 passos clars</span>
        </div>
        <div className="admin-cr-chip-row">
          <Link href="/admin/tasks" className="admin-cr-chip admin-cr-chip--amber">Comença per pas 2</Link>
          <Link href="/admin/emails" className="admin-cr-chip admin-cr-chip--rose">Comença per pas 3</Link>
        </div>
        <div className="admin-cr-grid-4">
          {pilotToday.map((item) => {
            const toneClasses = item.tone === 'rose' ? 'admin-cr-step--rose'
              : item.tone === 'amber' ? 'admin-cr-step--amber'
              : item.tone === 'sky' ? 'admin-cr-step--sky'
              : 'admin-cr-step--emerald';
            return (
              <Link key={item.id} href={item.href} className={`admin-cr-step ${toneClasses}`}>
                <p className="admin-cr-step-kicker">{item.step}</p>
                <p className="admin-cr-step-title">{item.title}</p>
                <p className="admin-cr-step-desc">{item.description}</p>
                <span className="admin-cr-step-cta">{item.cta}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="admin-cr-panel admin-cr-panel--checklist">
        <div className="admin-cr-panel-row">
          <div>
            <p className="admin-cr-kicker admin-cr-kicker--cyan">Checklist d&apos;avui</p>
            <h2 className="admin-cr-h2">Control diari de feina</h2>
            <p className="admin-cr-small admin-cr-small--muted">Marca les tasques com a fetes i avança sense perdre el fil.</p>
          </div>
          <Link href="/admin/tasks?status=OPEN" className="admin-cr-action-link">Obrir tasques pendents</Link>
        </div>
        <div className="admin-cr-grid-3">
          <div className="admin-cr-stat-box admin-cr-stat-box--amber">
            <p className="admin-cr-stat-label">Pendents</p>
            <p className="admin-cr-stat-value admin-cr-stat-value--amber">{d.checklistTodayPendingCount}</p>
          </div>
          <div className="admin-cr-stat-box admin-cr-stat-box--emerald">
            <p className="admin-cr-stat-label">Fetes</p>
            <p className="admin-cr-stat-value admin-cr-stat-value--emerald">{d.checklistTodayDoneCount}</p>
          </div>
          <div className="admin-cr-stat-box flex items-center justify-center">
            <RadialProgress
              value={d.checklistTodayDoneCount + d.checklistTodayPendingCount > 0
                ? Math.round((d.checklistTodayDoneCount / (d.checklistTodayDoneCount + d.checklistTodayPendingCount)) * 100)
                : 0}
              size={64}
              strokeWidth={5}
              label="Progrés"
            />
          </div>
        </div>
      </section>

      <section className="admin-cr-panel admin-cr-panel--command">
        <div className="admin-cr-panel-head-block">
          <p className="admin-cr-kicker admin-cr-kicker--violet">Centre de comandament</p>
          <h2 className="admin-cr-h2">Mou estats sense canviar de pantalla</h2>
          <p className="admin-cr-small admin-cr-small--muted">Accions ràpides de Leads i Reserves des del tauler principal.</p>
        </div>
        <div className="admin-cr-grid-2">
          <div className="admin-cr-command-card">
            <div className="admin-cr-command-head">
              <p className="admin-cr-command-title">Leads actius</p>
              <Link href="/admin/leads" className="admin-cr-link-inline">Obrir Entrades</Link>
            </div>
            <div className="admin-cr-list">
              {d.commandLeads.length === 0 ? (
                <p className="admin-cr-empty-text">Sense leads actius.</p>
              ) : (
                d.commandLeads.map((lead) => (
                  <div key={lead.id} className="admin-cr-list-row">
                    <div className="admin-cr-list-content">
                      <Link href={`/admin/leads/${lead.id}`} className="admin-cr-list-link">{lead.name}</Link>
                      <p className="admin-cr-meta">Prioritat {lead.priority.toLowerCase()} · {timeAgo(new Date(lead.createdAt))}</p>
                    </div>
                    <StatusQuickSelect
                      entityPath={`/api/admin/leads/${lead.id}/status`}
                      currentStatus={lead.status}
                      title="Canviar estat lead"
                      options={LEAD_STATUS_OPTIONS}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="admin-cr-command-card">
            <div className="admin-cr-command-head">
              <p className="admin-cr-command-title">Reserves actives</p>
              <Link href="/admin/bookings" className="admin-cr-link-inline">Obrir Reserves</Link>
            </div>
            <div className="admin-cr-list">
              {d.commandBookings.length === 0 ? (
                <p className="admin-cr-empty-text">Sense reserves actives.</p>
              ) : (
                d.commandBookings.map((booking) => (
                  <div key={booking.id} className="admin-cr-list-row">
                    <div className="admin-cr-list-content">
                      <Link href={`/admin/bookings/${booking.id}`} className="admin-cr-list-link">
                        {booking.reference} · {booking.clientName}
                      </Link>
                      <p className="admin-cr-meta">{formatEventDate(new Date(booking.eventDate))}</p>
                    </div>
                    <StatusQuickSelect
                      entityPath={`/api/admin/bookings/${booking.id}/status`}
                      currentStatus={booking.status}
                      title="Canviar estat reserva"
                      options={BOOKING_STATUS_OPTIONS}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-cr-panel admin-cr-panel--radar">
        <div className="admin-cr-panel-head-block">
          <p className="admin-cr-kicker admin-cr-kicker--cyan">Radar d&apos;execució</p>
          <h2 className="admin-cr-h2">On posar el focus avui</h2>
          <p className="admin-cr-small admin-cr-small--muted">Semàfors simples: vermell = urgent, groc = important, verd = controlat.</p>
        </div>
        <div className="admin-cr-grid-3">
          <Link href="/admin/leads" className={`admin-cr-radar-card ${d.staleLeadsCount > 0 ? 'admin-cr-radar-card--rose' : 'admin-cr-radar-card--emerald'}`}>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${d.staleLeadsCount > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <Tooltip text="Leads NEW/CONTACTED amb >24h sense canvi d'estat">
                <p className="admin-cr-stat-label">Temps sense resposta</p>
              </Tooltip>
            </div>
            <p className={`admin-cr-radar-value ${d.staleLeadsCount > 0 ? 'admin-cr-tone-rose' : 'admin-cr-tone-emerald'}`}>{d.staleLeadsCount}</p>
            <p className="admin-cr-small">Leads amb més de 24h sense avançar.</p>
          </Link>
          <Link href="/admin/leads" className={`admin-cr-radar-card ${d.hotLeadsCount > 0 ? 'admin-cr-radar-card--amber' : 'admin-cr-radar-card--emerald'}`}>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${d.hotLeadsCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <Tooltip text="Prioritat HIGH o URGENT, en estat actiu">
                <p className="admin-cr-stat-label">Leads calents</p>
              </Tooltip>
            </div>
            <p className={`admin-cr-radar-value ${d.hotLeadsCount > 0 ? 'admin-cr-tone-amber' : 'admin-cr-tone-emerald'}`}>{d.hotLeadsCount}</p>
            <p className="admin-cr-small">Prioritat alta/urgent.</p>
          </Link>
          <Link href="/admin/presupuestos" className={`admin-cr-radar-card ${d.quotesInFlightCount > 0 ? 'admin-cr-radar-card--cyan' : 'admin-cr-radar-card--emerald'}`}>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${d.quotesInFlightCount > 0 ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <Tooltip text="Leads en estat QUOTE_SENT o NEGOTIATING">
                <p className="admin-cr-stat-label">Pressupostos en joc</p>
              </Tooltip>
            </div>
            <p className={`admin-cr-radar-value ${d.quotesInFlightCount > 0 ? 'admin-cr-tone-cyan' : 'admin-cr-tone-emerald'}`}>{d.quotesInFlightCount}</p>
            <p className="admin-cr-small">Enviats o negociant.</p>
          </Link>
        </div>
      </section>

      {d.testimonialsPending > 0 && (
        <div className="admin-cr-banner admin-cr-banner--amber">
          <div>
            <p className="admin-cr-banner-label">Testimonis pendents</p>
            <p className="admin-cr-banner-value">
              {d.testimonialsPending} pendent{d.testimonialsPending > 1 ? 's' : ''} d&apos;aprovació
            </p>
          </div>
          <Link href="/admin/ressenyes" className="admin-cr-banner-action">
            <Button variant="secondary" icon="⭐" label="Revisar" />
          </Link>
        </div>
      )}

      {/* ─── Insights narratius ─────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Què necessites saber avui</p>
          {insights.map((insight) => {
            const colors = {
              success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              danger: 'bg-red-500/10 border-red-500/20 text-red-400',
              info: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
            };
            return (
              <div key={insight.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colors[insight.type]}`}>
                <span className="text-lg flex-shrink-0">{insight.icon}</span>
                <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {d.alerts.length > 0 && (
        <div className="admin-cr-alert-grid">
          {d.alerts.map((alert, index) => {
            const palette = alert.type === 'error' ? 'admin-cr-alert admin-cr-alert--error'
              : alert.type === 'warning' ? 'admin-cr-alert admin-cr-alert--warning'
              : 'admin-cr-alert admin-cr-alert--info';
            return (
              <div key={`${alert.title}-${index}`} className={palette}>
                <div className="admin-cr-alert-row">
                  <div>
                    <p className="admin-cr-alert-title">{alert.title}</p>
                    <p className="admin-cr-alert-desc">{alert.description}</p>
                  </div>
                  <Link href={alert.href} className="admin-cr-link-inline">{alert.action}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuickActions />

      <section className="admin-cr-info-grid">
        <div className="admin-cr-info-card">
          <p className="admin-cr-kicker">Salut sistema</p>
          <div className="admin-cr-health-grid">
            {d.healthItems.map((item) => {
              const dot = item.status === 'OK' ? 'bg-emerald-400' : item.status === 'ERROR' ? 'bg-rose-400' : 'bg-amber-400';
              return (
                <div key={item.label} className="admin-cr-health-item">
                  <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                  <p className="admin-cr-health-label">{item.label}</p>
                  <p className={`admin-cr-health-value ${item.status === 'OK' ? 'admin-cr-tone-emerald' : item.status === 'ERROR' ? 'admin-cr-tone-rose' : 'admin-cr-tone-amber'}`}>
                    {item.status}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="admin-cr-footnote">
            Últim cron: {d.cronMap['emails.cron.lastRun'] ? formatDateTimeFull(d.cronMap['emails.cron.lastRun']) : 'Mai'}
          </p>
        </div>
        <div className="admin-cr-info-card">
          <p className="admin-cr-kicker">Tasques pendents</p>
          <div className="admin-cr-list">
            {d.upcomingTasks.length === 0 ? (
              <p className="admin-cr-empty-text">Sense tasques pendents</p>
            ) : (
              d.upcomingTasks.map((task) => {
                const taskHref = task.lead ? `/admin/leads/${task.lead.id}` : '/admin/tasks';
                const taskMeta = task.lead?.name || 'Sense lead assignat';

                return (
                  <Link key={task.id} href={taskHref} className="admin-cr-list-row admin-cr-list-row--link">
                    <span className="admin-cr-truncate">{task.title}</span>
                    <span className="admin-cr-meta">{taskMeta}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
        <div className="admin-cr-info-card">
          <p className="admin-cr-kicker">Timeline</p>
          <div className="admin-cr-list">
            {d.timeline.length === 0 ? (
              <p className="admin-cr-empty-text">Cap activitat recent</p>
            ) : (
              d.timeline.map((item) => (
                <Link key={item.id} href={item.href} className="admin-cr-list-row admin-cr-list-row--link admin-cr-list-row--timeline">
                  <span>{item.icon}</span>
                  <span className="admin-cr-truncate">{item.text}</span>
                  <span className="admin-cr-meta">{item.time}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="admin-cr-kpi-grid">
        <div className="admin-stagger-item"><MetricCard icon="📋" label="Reserves confirmades" value={d.bookingsConfirmed.toString()} change={d.bookingsThisMonth > 0 ? `+${d.bookingsThisMonth} aquest mes` : '-'} changeType="up" accent="emerald" /></div>
        <div className="admin-stagger-item"><MetricCard icon="📨" label="Consultes del mes" value={d.leadsThisMonth.toString()} change={`${d.leadsCount} totals`} changeType="up" accent="sky" /></div>
        <div className="admin-stagger-item"><MetricCard icon="🏆" label="Clients" value={d.customersCount.toString()} change={`${d.conversionRate}% de conversió`} changeType="up" accent="purple" /></div>
        <div className="admin-stagger-item"><MetricCard icon="⭐" label="Valoració mitjana" value={d.rating} change={`${d.testimonialsApproved} ressenyes`} changeType="up" accent="amber" /></div>
        <div className="admin-stagger-item"><MetricCard icon="🌐" label="Sessions web (30d)" value={d.ga4Sessions || '-'} change={d.ga4Users ? `${d.ga4Users} usuaris` : 'GA4 pendent'} changeType="neutral" accent="cyan" /></div>
        <div className="admin-stagger-item"><MetricCard icon="⏱️" label="Temps mitjà web" value={d.ga4AvgSessionMin ? `${d.ga4AvgSessionMin} min` : '-'} change={d.ga4PageViews ? `${d.ga4PageViews} pàgines` : 'GA4 pendent'} changeType="neutral" accent="rose" /></div>
        <div className="admin-stagger-item"><Tooltip text="Cost engine: costEngine.ts"><MetricCard icon="📊" label="Marge mitjà" value={`${d.avgMarginPct}%`} change={d.avgMarginPct >= 50 ? 'Excel·lent' : d.avgMarginPct >= 30 ? 'Acceptable' : d.avgMarginPct >= 15 ? 'Vigilar' : 'Crític'} changeType={d.avgMarginPct >= 30 ? 'up' : 'down'} accent={d.avgMarginPct >= 50 ? 'emerald' : d.avgMarginPct >= 30 ? 'amber' : 'rose'} /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Previsió cashFlowForecast.ts"><MetricCard icon="💰" label="Flux net previst" value={`${d.cashFlowNet30 >= 0 ? '+' : ''}${Math.round(d.cashFlowNet30)} €`} change="Pròxims 30 dies" changeType={d.cashFlowNet30 >= 0 ? 'up' : 'down'} accent={d.cashFlowNet30 >= 0 ? 'emerald' : 'rose'} /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Pipeline ponderat per probabilitat"><MetricCard icon="🔮" label="Pipeline ponderat" value={`${Math.round(d.pipelineWeighted30)} €`} change="Vendes probables" changeType="neutral" accent="amber" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Reserves amb pagament pendent"><MetricCard icon="💶" label="Pendent de cobrar" value={`${Math.round(d.pendingPayments)} €`} change="Reserves actives" changeType={d.pendingPayments > 0 ? 'down' : 'up'} accent={d.pendingPayments > 5000 ? 'rose' : 'sky'} /></Tooltip></div>
      </div>

      <div className="admin-cr-chart-grid">
        <Card title="Trànsit web (30 dies)" subtitle="Sessions i usuaris" noPadding>
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.ga4SessionsSeries, stroke: '#22d3ee', label: 'Sessions', value: d.ga4Sessions || '-' },
              { data: d.ga4UsersSeries, stroke: '#60a5fa', label: 'Usuaris', value: d.ga4Users || '-' },
            ]} />
            {!d.ga4Available && <p className="admin-cr-footnote">GA4 pendent o sense dades.</p>}
          </div>
        </Card>
        <Card title="Entrades i conversió" subtitle="Consultes i tancaments" noPadding>
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.leadsSeries, stroke: '#34d399', label: 'Entrades', value: d.leadsThisMonth },
              { data: d.leadsWonSeries, stroke: '#fbbf24', label: 'Guanyats', value: d.wonLeads },
            ]} />
          </div>
        </Card>
        <Card title="Reserves i facturació" subtitle="Esdeveniments confirmats" noPadding>
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.bookingsSeries, stroke: '#f472b6', label: 'Reserves', value: d.bookingsConfirmed },
              { data: d.revenueSeries, stroke: '#a78bfa', label: '€', value: d.revenueTotal30 },
            ]} />
          </div>
        </Card>
      </div>

      {/* ═══ GRÀFIQUES COMPARATIVES ═══ */}
      <div className="admin-cr-chart-grid">
        <Card title="Ingressos mensuals" subtitle="Comparativa amb any anterior" noPadding>
          <div className="admin-cr-card-pad">
            <MonthlyBarChart data={d.monthlyRevenue} />
          </div>
        </Card>
        <Card title="Distribució per tipus" subtitle="Reserves confirmades/completades" noPadding>
          <div className="admin-cr-card-pad flex items-center justify-center py-4">
            <DonutChart segments={d.eventTypeDistribution} />
          </div>
        </Card>
      </div>

      <div className="admin-cr-main-grid">
        <div className="admin-cr-main-grid-wide">
          <Card title="Pròxims esdeveniments" subtitle={`${d.upcomingBookings.length} programats`} action={<Link href="/admin/calendario"><Button variant="ghost" icon="📅" label="Calendari" /></Link>} noPadding>
            {d.upcomingBookings.length > 0 ? (
              <div className="admin-cr-divide-list">
                {d.upcomingBookings.map((booking) => (
                  <Link key={booking.id} href={`/admin/bookings/${booking.id}`} className="admin-cr-row-link">
                    <div className="admin-cr-avatar-box">
                      <span className="admin-cr-avatar-text">{new Date(booking.eventDate).getDate()}</span>
                    </div>
                    <div className="admin-cr-list-content">
                      <p className="admin-cr-list-link">{booking.clientName || 'Client'}</p>
                      <p className="admin-cr-meta admin-cr-truncate">
                        {formatEventDate(new Date(booking.eventDate))} · {booking.eventType || 'Esdeveniment'}
                      </p>
                    </div>
                    <svg className="admin-cr-chevron" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="admin-cr-empty-block">
                <p className="admin-cr-small admin-cr-small--muted">No hi ha esdeveniments programats</p>
                <Link href="/admin/bookings" className="admin-cr-link-inline">Crear nova reserva →</Link>
              </div>
            )}
          </Card>
        </div>
        <div className="admin-cr-desktop-only">
          <Card title="Activitat" subtitle="Últimes accions">
            <div className="admin-cr-list">
              {d.activities.map((activity, i) => (
                <div key={i} className="admin-cr-activity-row">
                  <span className="admin-cr-activity-icon">{activity.icon}</span>
                  <div className="admin-cr-list-content">
                    <p className="admin-cr-small">{activity.text}</p>
                    {activity.time && <p className="admin-cr-meta">{activity.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Entrades recents" subtitle={`${d.leadsCount} totals`} action={<Link href="/admin/leads"><Button variant="secondary" icon="👥" label="Tots" /></Link>} noPadding>
        {d.recentLeads.length > 0 ? (
          <div className="admin-cr-divide-list">
            {d.recentLeads.map((lead) => (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="admin-cr-row-link">
                <div className="admin-cr-row-main">
                  <div className="admin-cr-avatar-round">{lead.name?.charAt(0).toUpperCase() || '?'}</div>
                  <div className="admin-cr-list-content">
                    <p className="admin-cr-list-link">{lead.name}</p>
                    <p className="admin-cr-meta admin-cr-desktop-only-inline">{lead.email}</p>
                    <p className="admin-cr-meta admin-cr-mobile-only-inline">{timeAgo(new Date(lead.createdAt))}</p>
                  </div>
                </div>
                <div className="admin-cr-row-side">
                  <span className={`admin-cr-status-chip ${lead.status === 'NEW' ? 'admin-cr-status-chip--new' : lead.status === 'WON' ? 'admin-cr-status-chip--won' : 'admin-cr-status-chip--default'}`}>
                    {lead.status}
                  </span>
                  <span className="admin-cr-meta admin-cr-desktop-only-inline">{timeAgo(new Date(lead.createdAt))}</span>
                  <svg className="admin-cr-chevron admin-cr-mobile-only-inline" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="admin-cr-empty-block">
            <p className="admin-cr-small admin-cr-small--muted">Encara no hi ha entrades</p>
            <p className="admin-cr-meta">Les entrades apareixeran aquí</p>
          </div>
        )}
      </Card>

      <div className="admin-cr-mini-grid">
        <div className="admin-cr-mini-card admin-cr-mini-card--violet">
          <p className="admin-cr-stat-label">Conversió</p>
          <p className="admin-cr-mini-value">{d.conversionRate}%</p>
          <p className="admin-cr-meta">{d.wonLeads}/{d.leadsCount} entrades</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-mini-card--amber">
          <p className="admin-cr-stat-label">Testimonis</p>
          <p className="admin-cr-mini-value">{d.testimonialsApproved + d.testimonialsPending}</p>
          <p className="admin-cr-meta">{d.testimonialsPending} pendents</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-mini-card--rose">
          <p className="admin-cr-stat-label">Valoració</p>
          <p className="admin-cr-mini-value">⭐ {d.rating}</p>
          <p className="admin-cr-meta">Mitjana</p>
        </div>
        <Link href="/admin/inventory" className="admin-cr-mini-card admin-cr-mini-card--cyan">
          <p className="admin-cr-stat-label">Inventari</p>
          <p className="admin-cr-mini-value">{d.inventoryAvailable}/{d.inventoryTotal}</p>
          <p className="admin-cr-meta">
            {d.inventoryInUse > 0 && `${d.inventoryInUse} en ús · `}
            {d.inventoryMaintenance > 0 && `${d.inventoryMaintenance} mant.`}
            {d.inventoryBroken > 0 && ` · ${d.inventoryBroken} avariat`}
            {d.inventoryInUse === 0 && d.inventoryMaintenance === 0 && d.inventoryBroken === 0 && 'Tot disponible'}
          </p>
        </Link>
      </div>

      <section className="admin-cr-audit">
        <div className="admin-cr-audit-head">
          <h3 className="admin-cr-step-title">🧾 Auditoria recent</h3>
          <p className="admin-cr-small admin-cr-small--muted">Últimes accions d&apos;admin</p>
        </div>
        {d.recentAdminLogs.length === 0 ? (
          <div className="admin-cr-empty-block">Sense activitat recent</div>
        ) : (
          <div className="admin-cr-divide-list">
            {d.recentAdminLogs.map((logItem) => (
              <div key={logItem.id} className="admin-cr-audit-row">
                <span className="admin-cr-truncate">{logItem.action} · {logItem.entity}</span>
                <span className="admin-cr-meta">{timeAgo(new Date(logItem.createdAt))}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}





