import Tooltip from './components/Tooltip';
import Link from 'next/link';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import QuickActions from './components/QuickActions';
import StatusQuickSelect from './components/StatusQuickSelect';
import { fetchDashboardData, timeAgo, formatEventDate } from './lib/dashboard-data';
import { formatDateTimeFull, formatCurrency, formatDate, getEventLabel } from '@/lib/constants';
import { generateDashboardInsights, type DashboardInsight } from '@/lib/services/dashboardInsightsService';
import WeatherWidget from './components/WeatherWidget';
import { ADMIN_DASHBOARD_HELP, helpAttrs } from './components/adminHelpContent';
import { getGreeting, RadialProgress, MetricCard, Card, Button, MonthlyBarChart, DonutChart, MiniLineChart } from './lib/dashboard-widgets';
import { LEAD_STATUS_OPTIONS, BOOKING_STATUS_OPTIONS } from '@/lib/constants';
import { ADMIN_DASHBOARD_PILOT_STEPS, ADMIN_DASHBOARD_INSIGHT_COLORS, ADMIN_CHART_SERIES_COLORS } from '@/lib/constants/admin';
import { loadDailyBrief } from '@/lib/services/dailyBriefService';
import DailyBriefPanel from './components/DailyBriefPanel';
import { loadOperationalPulse } from '@/lib/services/operationalPulseService';
import OperationalPulsePanel from './components/OperationalPulsePanel';
import { loadCaptureHealth } from '@/lib/services/captureHealthService';
import CaptureHealthPanel from './components/CaptureHealthPanel';
import { loadMultiTouchReport } from '@/lib/services/attributionService';
import AttributionPanel from './components/AttributionPanel';
import { loadAnomalyReport } from '@/lib/services/dailyAnomalyService';
import AnomalyPanel from './components/AnomalyPanel';
import { loadCapacityConflicts } from '@/lib/services/capacityConflictService';
import CapacityConflictPanel from './components/CapacityConflictPanel';
import { loadWeeklyCapacityForecast } from '@/lib/services/operationalForecastService';
import WeeklyCapacityForecastPanel from './components/WeeklyCapacityForecastPanel';
import { OwnerControlStrip } from './components/OwnerControlStrip';
import { buildDashboardOperatingCycle, type AdminOperatingCycleTone } from '@/lib/services/adminOperatingCycleService';
import NBAExplainPanel from './components/NBAExplainPanel';

// Removed: all widget components now in lib/dashboard-widgets.tsx
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [d, dailyBrief, pulse, captureHealth, attribution, anomalies, capacityConflicts, weeklyCapacityForecast] = await Promise.all([
    fetchDashboardData(),
    loadDailyBrief(),
    loadOperationalPulse(),
    loadCaptureHealth(),
    loadMultiTouchReport(90),
    loadAnomalyReport(),
    loadCapacityConflicts(),
    loadWeeklyCapacityForecast(),
  ]);

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

  const pilotDynamic: Record<string, { description: string; tone: string }> = {
    leads: {
      description: d.leadsThisMonth > 0 ? `${d.leadsThisMonth} consultes aquest mes` : 'No hi ha noves consultes',
      tone: d.leadsThisMonth > 0 ? 'amber' : 'emerald',
    },
    tasks: {
      description: d.upcomingTasks.length > 0 ? `${d.upcomingTasks.length} tasques obertes` : 'Cap tasca pendent',
      tone: d.upcomingTasks.length > 0 ? 'amber' : 'emerald',
    },
    postevent: {
      description: d.postEventPending > 0 ? `${d.postEventPending} correus pendents` : 'Post-esdeveniment al dia',
      tone: d.postEventPending > 0 ? 'rose' : 'emerald',
    },
    bookings: {
      description: d.bookingsConfirmed > 0 ? `${d.bookingsConfirmed} reserves confirmades` : 'Sense reserves confirmades',
      tone: 'sky',
    },
  };
  const pilotToday = ADMIN_DASHBOARD_PILOT_STEPS.map((step) => ({
    ...step,
    ...pilotDynamic[step.id],
  }));
  const criticalHealthCount = d.salutSnapshot?.summary.critical || 0;
  const warningHealthCount = d.salutSnapshot?.summary.warning || 0;
  const manualDecisionCount = d.alerts.length + d.upcomingTasks.length;
  const autoSignals = [
    {
      label: 'Crons clau',
      value: `${d.cronMap['emails.cron.lastStatus'] || '—'} · ${d.cronMap['automation.commercial.lastStatus'] || '—'}`,
    },
    {
      label: 'Salut vigilada',
      value: criticalHealthCount > 0 ? `${criticalHealthCount} crítics` : warningHealthCount > 0 ? `${warningHealthCount} avisos` : 'Tot correcte',
    },
    {
      label: 'Checklist d’avui',
      value: `${d.checklistTodayDoneCount} fetes · ${d.checklistTodayPendingCount} pendents`,
    },
  ];
  const ownerDecisions = [
    {
      label: 'Alertes obertes',
      value: d.alerts.length > 0 ? `${d.alerts.length} a revisar` : 'Cap alerta oberta',
    },
    {
      label: 'Tasques obertes',
      value: d.upcomingTasks.length > 0 ? `${d.upcomingTasks.length} pendents` : 'Sense cua oberta',
    },
    {
      label: 'Cobraments pendents',
      value: d.pendingPayments > 0 ? `${formatCurrency(d.pendingPayments)} per cobrar` : 'Cap import pendent',
    },
  ];
  const ownerAutomaticSignals = autoSignals.map((item) => `${item.label}: ${item.value}`);
  const ownerManualSignals = ownerDecisions.map((item) => `${item.label}: ${item.value}`);
  const operatingCycle = buildDashboardOperatingCycle({
    leadsThisMonth: d.leadsThisMonth,
    staleLeadsCount: d.staleLeadsCount,
    quotesInFlightCount: d.quotesInFlightCount,
    bookingsConfirmed: d.bookingsConfirmed,
    pendingPayments: d.pendingPayments,
    postEventPending: d.postEventPending,
  });
  const operatingCycleTone: Record<AdminOperatingCycleTone, string> = {
    success: 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
    warning: 'admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
    info: 'admin-tone-border-cyan admin-tone-bg-cyan admin-tone-text-cyan',
  };
  const nextPriorityHref = d.alerts[0]?.href || '/admin/tasks';
  const nextPriorityTitle = d.alerts[0]?.title || (d.upcomingTasks[0]?.title ? d.upcomingTasks[0].title : 'Revisar la cua de tasques');
  const nextPriorityDetail = d.alerts[0]?.description || (d.upcomingTasks[0]?.lead?.name ? `Relacionat amb ${d.upcomingTasks[0].lead.name}` : 'Obre el workspace que concentra la feina pendent.');
  const operationHref = d.nextEvent ? buildBookingHref(d.nextEvent.id) : '/admin/bookings';
  const operationLabel = d.nextEvent ? `${d.nextEvent.clientName} · ${d.nextEvent.daysUntil === 0 ? 'avui' : d.nextEvent.daysUntil === 1 ? 'demà' : `d'aquí ${d.nextEvent.daysUntil} dies`}` : 'Sense bolo imminent';
  const pipelineRadarItems = pulse.pipelineDrivers.length > 0
    ? pulse.pipelineDrivers.slice(0, 3).map((driver) => {
        const tone = driver.priority === 'CRITICAL'
          ? {
              card: 'admin-cr-radar-card--rose',
              dot: 'bg-[var(--o-danger)]',
              value: 'admin-cr-tone-rose',
            }
          : {
              card: 'admin-cr-radar-card--amber',
              dot: 'bg-[var(--o-warning)]',
              value: 'admin-cr-tone-amber',
            };
        return {
          href: driver.href,
          label: driver.title,
          tooltip: driver.detail,
          value: driver.count,
          detail: driver.detail,
          cardClass: tone.card,
          dotClass: tone.dot,
          valueClass: tone.value,
        };
      })
    : [
        {
          href: '/admin/leads',
          label: 'Temps sense resposta',
          tooltip: "Leads NEW/CONTACTED amb >24h sense canvi d'estat",
          value: d.staleLeadsCount,
          detail: 'Leads amb més de 24h sense avançar.',
          cardClass: d.staleLeadsCount > 0 ? 'admin-cr-radar-card--rose' : 'admin-cr-radar-card--emerald',
          dotClass: d.staleLeadsCount > 0 ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-success)]',
          valueClass: d.staleLeadsCount > 0 ? 'admin-cr-tone-rose' : 'admin-cr-tone-emerald',
        },
        {
          href: '/admin/leads',
          label: 'Leads calents',
          tooltip: 'Prioritat HIGH o URGENT, en estat actiu',
          value: d.hotLeadsCount,
          detail: 'Prioritat alta/urgent.',
          cardClass: d.hotLeadsCount > 0 ? 'admin-cr-radar-card--amber' : 'admin-cr-radar-card--emerald',
          dotClass: d.hotLeadsCount > 0 ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-success)]',
          valueClass: d.hotLeadsCount > 0 ? 'admin-cr-tone-amber' : 'admin-cr-tone-emerald',
        },
        {
          href: '/admin/presupuestos',
          label: 'Pressupostos en joc',
          tooltip: 'Leads en estat QUOTE_SENT o NEGOTIATING',
          value: d.quotesInFlightCount,
          detail: 'Enviats o negociant.',
          cardClass: d.quotesInFlightCount > 0 ? 'admin-cr-radar-card--cyan' : 'admin-cr-radar-card--emerald',
          dotClass: d.quotesInFlightCount > 0 ? 'bg-[var(--o-info)]' : 'bg-[var(--o-success)]',
          valueClass: d.quotesInFlightCount > 0 ? 'admin-cr-tone-cyan' : 'admin-cr-tone-emerald',
        },
      ];

  return (
    <div className="admin-control-room">
      {/* ═══ HERO HEADER ═══ */}
      <div className="admin-hero-header admin-gradient admin-gradient--hero admin-card-glass">
        <div className="admin-hero-glow" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="admin-cr-hero-kicker">{getGreeting()}</p>
              <h1 className="admin-hero-title">Centre de control</h1>
              <p className="admin-hero-subtitle">Visió general del negoci</p>
            </div>
            <div className="admin-cr-hero-actions">
              <Link href="/admin/analytics" className="hidden sm:inline-flex">
                <Button variant="secondary" label="Analítica" helpText={ADMIN_DASHBOARD_HELP.analyticsButton} />
              </Link>
              <Link href="/admin/leads">
                <Button variant="primary" icon="+" label="Nou lead" helpText={ADMIN_DASHBOARD_HELP.newLeadButton} />
              </Link>
            </div>
          </div>
          <div className="admin-cr-quick-links mt-4">
            <Link href="/admin/inbox" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.inbox)}>
              <span className="admin-cr-quick-kicker">Comunicació</span>
              <span className="admin-cr-quick-label">Inbox IMAP</span>
            </Link>
            <Link href="/admin/emails" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.emails)}>
              <span className="admin-cr-quick-kicker">Automatització</span>
              <span className="admin-cr-quick-label">Correus</span>
            </Link>
            <Link href="/admin/bookings" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.bookings)}>
              <span className="admin-cr-quick-kicker">Operació</span>
              <span className="admin-cr-quick-label">Reserves</span>
            </Link>
            <Link href="/admin/bookings?payment=overdue" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.overdue)}>
              <span className="admin-cr-quick-kicker">Risc</span>
              <span className="admin-cr-quick-label">Vençuts</span>
            </Link>
            <Link href="/admin/bookings?payment=due-soon" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.dueSoon)}>
              <span className="admin-cr-quick-kicker">Proper</span>
              <span className="admin-cr-quick-label">Vencen aviat</span>
            </Link>
            <Link href="/admin/economia" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.economy)}>
              <span className="admin-cr-quick-kicker">Marge</span>
              <span className="admin-cr-quick-label">Economia</span>
            </Link>
            <Link href="/admin/salut" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.health)}>
              <span className="admin-cr-quick-kicker">Sistema</span>
              <span className="admin-cr-quick-label">Salut</span>
            </Link>
            <Link href="/admin/calendario" className="admin-cr-quick-link" {...helpAttrs(ADMIN_DASHBOARD_HELP.quickLinks.calendar)}>
              <span className="admin-cr-quick-kicker">Agenda</span>
              <span className="admin-cr-quick-label">Calendari</span>
            </Link>
          </div>
        </div>
      </div>

      <OwnerControlStrip
        className="lg:grid-cols-[1.2fr_1fr_1fr]"
        system={{
          eyebrow: 'Automàtic',
          title: 'Què està fent el sistema per tu',
          tone: 'info',
          items: ownerAutomaticSignals,
          emptyText: 'Sense senyals automàtiques destacades ara mateix.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On tu has de decidir',
          tone: manualDecisionCount > 0 ? 'warning' : 'success',
          items: ownerManualSignals,
          emptyText: 'No hi ha cap front manual calent ara mateix.',
        }}
        nextStep={{
          title: nextPriorityTitle,
          detail: nextPriorityDetail,
          href: nextPriorityHref,
          secondaryAction: {
            href: operationHref,
            label: operationLabel,
          },
        }}
      />

      <NBAExplainPanel />

      <section className="rounded-2xl border border-white/10 p-4 admin-card-glass">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Cicle operatiu</p>
            <h2 className="mt-1 text-lg font-semibold text-white">On està viu el sistema ara</h2>
          </div>
          <Link href="/admin/manual" className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/5">
            Obrir manual
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {operatingCycle.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className={`rounded-2xl border p-3 transition-colors adm-row-hover ${operatingCycleTone[item.tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">Pas {item.step}</p>
                  <h3 className="mt-1 text-sm font-black text-white">{item.title}</h3>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 bg-black/10 px-2 py-1 text-xs font-bold uppercase tracking-wide">
                  {item.metric}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-white/70">{item.detail}</p>
              <p className="mt-3 text-xs font-semibold text-white/55">{item.cta}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ DAILY BRIEF ═══ */}
      <DailyBriefPanel brief={dailyBrief} />
      {anomalies.anomalies.length > 0 && <AnomalyPanel report={anomalies} />}
      {capacityConflicts.conflicts.length > 0 && <CapacityConflictPanel report={capacityConflicts} />}
      <WeeklyCapacityForecastPanel forecast={weeklyCapacityForecast} />
      <CaptureHealthPanel report={captureHealth} />
      <AttributionPanel report={attribution} />
      <OperationalPulsePanel pulse={pulse} />

      {/* ═══ PRÒXIM BOLO ═══ */}
      {d.nextEvent && (
        <Link href={buildBookingHref(d.nextEvent.id)} className="block">
          <section className={`rounded-2xl border-2 p-5 sm:p-6 transition-all admin-card-glass ${
            d.nextEvent.daysUntil <= 1
              ? 'admin-tone-border-warning admin-glow-pulse'
              : d.nextEvent.daysUntil <= 3
                ? 'admin-tone-border-cyan'
                : 'border-white/10'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    d.nextEvent.daysUntil <= 1 ? 'admin-tone-text-warning' : 'admin-tone-text-cyan'
                  }`}>
                    {d.nextEvent.daysUntil === 0 ? 'AVUI' : d.nextEvent.daysUntil === 1 ? 'DEMÀ' : `D'aquí ${d.nextEvent.daysUntil} dies`}
                  </span>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    d.nextEvent.daysUntil <= 1 ? 'bg-[var(--o-warning)] animate-pulse' : 'bg-[var(--o-info)]'
                  }`} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold truncate">{d.nextEvent.clientName}</h2>
                <p className="text-sm opacity-70 mt-1">
                  {formatDate(d.nextEvent.eventDate)}
                  {d.nextEvent.eventStartTime && ` · ${d.nextEvent.eventStartTime}`}
                  {d.nextEvent.eventType && ` · ${getEventLabel(d.nextEvent.eventType)}`}
                </p>
                <p className="text-sm opacity-50 mt-0.5 truncate">
                  {[d.nextEvent.eventVenue, d.nextEvent.eventLocation].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(d.nextEvent.total)}</p>
                <p className="text-xs opacity-70 mt-0.5">{d.nextEvent.packName}</p>
                <div className="flex items-center justify-end gap-1.5 mt-2">
                  <Tooltip text={d.nextEvent.depositPaid && d.nextEvent.remainingPaid ? 'Tot pagat' : d.nextEvent.depositPaid ? 'Falta pagament final' : 'Sense cap pagament'}>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${d.nextEvent.depositPaid && d.nextEvent.remainingPaid ? 'bg-[var(--o-success)]' : d.nextEvent.depositPaid ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-danger)]'}`} />
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
      <section className="rounded-2xl border border-white/10 p-4 sm:p-5 admin-card-glass" {...helpAttrs(ADMIN_DASHBOARD_HELP.revenueGoal)}>
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
            <p className="text-xl font-bold mt-1 font-mono tabular-nums">
              {formatCurrency(d.revenueThisMonth)}
            </p>
            <p className="text-sm opacity-50">
              de {formatCurrency(d.revenueTarget)} objectiu
            </p>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mt-2">
              <div
                className={`h-full rounded-full admin-progress-animated ${
                  d.revenueMonthPct >= 100 ? 'bg-[var(--o-success)]' : d.revenueMonthPct >= 60 ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-danger)]'
                }`}
                style={{ width: `${Math.min(100, d.revenueMonthPct)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="admin-cr-panel admin-cr-panel--pilot" {...helpAttrs(ADMIN_DASHBOARD_HELP.pilot)}>
        <div className="admin-cr-panel-head">
          <div>
            <p className="admin-cr-kicker admin-cr-kicker--pilot">Mode Solo</p>
            <h2 className="admin-cr-h2">Pilot automàtic d&apos;avui</h2>
            <p className="admin-cr-small">No és lineal: pots començar directament pel pas 2 o pas 3.</p>
          </div>
          <span className="admin-cr-pill admin-cr-pill--pilot">4 passos clars</span>
        </div>
        <div className="admin-cr-chip-row">
          <Link href="/admin/tasks" className="admin-cr-chip admin-cr-chip--amber" {...helpAttrs(ADMIN_DASHBOARD_HELP.startStep2)}>Comença per pas 2</Link>
          <Link href="/admin/emails" className="admin-cr-chip admin-cr-chip--rose" {...helpAttrs(ADMIN_DASHBOARD_HELP.startStep3)}>Comença per pas 3</Link>
        </div>
        <div className="admin-cr-grid-4">
          {pilotToday.map((item) => {
            const toneClasses = item.tone === 'rose' ? 'admin-cr-step--rose'
              : item.tone === 'amber' ? 'admin-cr-step--amber'
              : item.tone === 'sky' ? 'admin-cr-step--sky'
              : 'admin-cr-step--emerald';
            return (
              <Link key={item.id} href={item.href} className={`admin-cr-step ${toneClasses}`} data-help-title={item.title} data-help-desc={`${item.description}. Acció recomanada: ${item.cta}.`}>
                <p className="admin-cr-step-kicker">{item.step}</p>
                <p className="admin-cr-step-title">{item.title}</p>
                <p className="admin-cr-step-desc">{item.description}</p>
                <span className="admin-cr-step-cta">{item.cta}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="admin-cr-panel admin-cr-panel--checklist" {...helpAttrs(ADMIN_DASHBOARD_HELP.checklist)}>
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

      <section className="admin-cr-panel admin-cr-panel--command" {...helpAttrs(ADMIN_DASHBOARD_HELP.commandCenter)}>
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
                      <Link href={buildLeadWorkspaceHref(lead.id)} className="admin-cr-list-link">{lead.name}</Link>
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
                      <Link href={buildBookingHref(booking.id)} className="admin-cr-list-link">
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

      <section className="admin-cr-panel admin-cr-panel--radar" {...helpAttrs(ADMIN_DASHBOARD_HELP.executionRadar)}>
        <div className="admin-cr-panel-head-block">
          <p className="admin-cr-kicker admin-cr-kicker--cyan">Radar d&apos;execució</p>
          <h2 className="admin-cr-h2">On posar el focus avui</h2>
          <p className="admin-cr-small admin-cr-small--muted">Semàfors simples: vermell = urgent, groc = important, verd = controlat.</p>
        </div>
        <div className="admin-cr-grid-3">
          {pipelineRadarItems.map((item) => (
            <Link key={`${item.label}:${item.href}`} href={item.href} className={`admin-cr-radar-card ${item.cardClass}`}>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${item.dotClass}`} />
                <Tooltip text={item.tooltip}>
                  <p className="admin-cr-stat-label">{item.label}</p>
                </Tooltip>
              </div>
              <p className={`admin-cr-radar-value ${item.valueClass}`}>{item.value}</p>
              <p className="admin-cr-small">{item.detail}</p>
            </Link>
          ))}
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
        <div className="ap-card p-5 space-y-3">
          <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Què necessites saber avui</p>
          {insights.map((insight) => (
              <div key={insight.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${ADMIN_DASHBOARD_INSIGHT_COLORS[insight.type] || ''}`}>
                <span className="text-lg flex-shrink-0">{insight.icon}</span>
                <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
              </div>
          ))}
        </div>
      )}

      {/* ═══ TEMPS PRÒXIMS EVENTS ═══ */}
      <WeatherWidget />

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
        <div className="admin-cr-info-card" {...helpAttrs(ADMIN_DASHBOARD_HELP.businessHealth)}>
          <p className="admin-cr-kicker">Salut del negoci</p>
          {d.salutSnapshot ? (
            <>
              <div className="flex items-center gap-4 mb-3">
                {d.salutSnapshot.summary.critical > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold admin-tone-text-danger">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--o-danger)]" />
                    {d.salutSnapshot.summary.critical} crític{d.salutSnapshot.summary.critical > 1 ? 's' : ''}
                  </span>
                )}
                {d.salutSnapshot.summary.warning > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold admin-tone-text-warning">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--o-warning)]" />
                    {d.salutSnapshot.summary.warning} avís{d.salutSnapshot.summary.warning > 1 ? 'os' : ''}
                  </span>
                )}
                {d.salutSnapshot.summary.critical === 0 && d.salutSnapshot.summary.warning === 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold admin-tone-text-success">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--o-success)]" />
                    Tot correcte
                  </span>
                )}
              </div>
              <div className="admin-cr-health-grid" {...helpAttrs(ADMIN_DASHBOARD_HELP.monitoredAreas)}>
                {d.salutSnapshot.sections.map((section) => {
                  const hasCritical = section.counts.critical > 0;
                  const hasWarning = section.counts.warning > 0;
                  const dot = hasCritical ? 'bg-[var(--o-danger)]' : hasWarning ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-success)]';
                  const tone = hasCritical ? 'admin-cr-tone-rose' : hasWarning ? 'admin-cr-tone-amber' : 'admin-cr-tone-emerald';
                  const count = hasCritical ? section.counts.critical : hasWarning ? section.counts.warning : 0;
                  const href = hasCritical ? '/admin/salut?status=critical' : hasWarning ? '/admin/salut?status=warning' : '/admin/salut';
                  return (
                    <Link key={section.scope} href={href} className="admin-cr-health-item hover:opacity-80 transition-opacity" data-help-title={section.label} data-help-desc={hasCritical ? `Té ${section.counts.critical} punt${section.counts.critical > 1 ? "s" : ""} crític${section.counts.critical > 1 ? "s" : ""}.` : hasWarning ? `Té ${section.counts.warning} avís${section.counts.warning > 1 ? "os" : ""} actiu${section.counts.warning > 1 ? "s" : ""}.` : "No té incidències obertes ara mateix."}>
                      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                      <p className="admin-cr-health-label">{section.label}</p>
                      <p className={`admin-cr-health-value ${tone}`}>
                        {count > 0 ? count : 'OK'}
                      </p>
                    </Link>
                  );
                })}
              </div>
              {(() => {
                const topItems = d.salutSnapshot!.sections
                  .flatMap((s) => s.items)
                  .filter((item) => item.status === 'critical' || item.status === 'warning')
                  .sort((a, b) => (a.status === 'critical' ? 0 : 1) - (b.status === 'critical' ? 0 : 1))
                  .slice(0, 3);
                if (topItems.length === 0) return null;
                return (
                  <div className="mt-3 space-y-2" {...helpAttrs(ADMIN_DASHBOARD_HELP.priorityIssues)}>
                    {topItems.map((item) => (
                      <Link key={item.id} href={item.href} className="flex items-start gap-2 rounded-lg px-3 py-2 transition-colors adm-row-hover" data-help-title={item.title} data-help-desc={item.reason}>
                        <span className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${item.status === 'critical' ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-warning)]'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{item.title}</p>
                          <p className="text-xs text-white/50 line-clamp-1">{item.reason}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="admin-cr-health-grid">
              {d.healthItems.map((item) => {
                const dot = item.status === 'OK' ? 'bg-[var(--o-success)]' : item.status === 'ERROR' ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-warning)]';
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
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="admin-cr-footnote">
              Últim cron: {d.cronMap['emails.cron.lastRun'] ? formatDateTimeFull(d.cronMap['emails.cron.lastRun']) : 'Mai'}
            </p>
            <Link href="/admin/salut" className="admin-cr-link-inline" {...helpAttrs(ADMIN_DASHBOARD_HELP.openHealth)}>Obrir Salut</Link>
          </div>
        </div>
        <div className="admin-cr-info-card">
          <p className="admin-cr-kicker">Tasques pendents</p>
          <div className="admin-cr-list">
            {d.upcomingTasks.length === 0 ? (
              <p className="admin-cr-empty-text">Sense tasques pendents</p>
            ) : (
              d.upcomingTasks.map((task) => {
                const taskHref = task.lead ? buildLeadWorkspaceHref(task.lead.id) : '/admin/tasks';
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
        <div className="admin-stagger-item"><Tooltip text="Quantes reserves tens confirmades ara mateix. Més confirmades = més feina segura."><MetricCard icon="📋" label="Reserves confirmades" value={d.bookingsConfirmed.toString()} change={d.bookingsThisMonth > 0 ? `+${d.bookingsThisMonth} aquest mes` : '-'} changeType="up" accent="emerald" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Consultes noves que han entrat aquest mes. Indica si la web i el màrqueting estan portant feina."><MetricCard icon="📨" label="Consultes del mes" value={d.leadsThisMonth.toString()} change={`${d.leadsCount} totals`} changeType="up" accent="sky" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Clients reals que han contractat. La conversió mostra quin % de consultes acaben en reserva."><MetricCard icon="🏆" label="Clients" value={d.customersCount.toString()} change={`${d.conversionRate}% de conversió`} changeType="up" accent="purple" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Nota mitjana de les ressenyes de Google. Afecta directament la confiança dels nous clients."><MetricCard icon="⭐" label="Valoració mitjana" value={d.rating} change={`${d.testimonialsApproved} ressenyes`} changeType="up" accent="amber" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Visites a la web els últims 30 dies. Si baixa, pot ser que el màrqueting perdi empenta."><MetricCard icon="🌐" label="Sessions web (30d)" value={d.ga4Sessions || '-'} change={d.ga4Users ? `${d.ga4Users} usuaris` : 'GA4 pendent'} changeType="neutral" accent="cyan" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Quant de temps passen els visitants a la web. Més temps = més interès real en el que ofereixes."><MetricCard icon="⏱️" label="Temps mitjà web" value={d.ga4AvgSessionMin ? `${d.ga4AvgSessionMin} min` : '-'} change={d.ga4PageViews ? `${d.ga4PageViews} pàgines` : 'GA4 pendent'} changeType="neutral" accent="rose" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Percentatge que et queda net de cada reserva després de descomptar costos. Per sobre del 50% és excel·lent."><MetricCard icon="📊" label="Marge mitjà" value={`${d.avgMarginPct}%`} change={d.avgMarginPct >= 50 ? 'Excel·lent' : d.avgMarginPct >= 30 ? 'Acceptable' : d.avgMarginPct >= 15 ? 'Vigilar' : 'Crític'} changeType={d.avgMarginPct >= 30 ? 'up' : 'down'} accent={d.avgMarginPct >= 50 ? 'emerald' : d.avgMarginPct >= 30 ? 'amber' : 'rose'} /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Quants diners entraran o sortiran els pròxims 30 dies, segons reserves confirmades i costos previstos."><MetricCard icon="💰" label="Flux net previst" value={`${d.cashFlowNet30 >= 0 ? '+' : ''}${formatCurrency(Math.abs(d.cashFlowNet30))}`} change="Pròxims 30 dies" changeType={d.cashFlowNet30 >= 0 ? 'up' : 'down'} accent={d.cashFlowNet30 >= 0 ? 'emerald' : 'rose'} /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Valor estimat de les vendes en curs, ponderat per la probabilitat de tancar cada una."><MetricCard icon="🔮" label="Pipeline ponderat" value={formatCurrency(d.pipelineWeighted30)} change="Vendes probables" changeType="neutral" accent="amber" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Total que encara no has cobrat de reserves actives. Inclou bestretes i saldos pendents."><MetricCard icon="💶" label="Pendent de cobrar" value={formatCurrency(d.pendingPayments)} change="Reserves actives" changeType={d.pendingPayments > 0 ? 'down' : 'up'} accent={d.pendingPayments > 5000 ? 'rose' : 'sky'} /></Tooltip></div>
      </div>

      <div className="admin-cr-chart-grid">
        <Card title="Trànsit web (30 dies)" subtitle="Sessions i usuaris" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.traffic30d}>
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.ga4SessionsSeries, stroke: ADMIN_CHART_SERIES_COLORS.ga4Sessions, label: 'Sessions', value: d.ga4Sessions || '-' },
              { data: d.ga4UsersSeries, stroke: ADMIN_CHART_SERIES_COLORS.ga4Users, label: 'Usuaris', value: d.ga4Users || '-' },
            ]} />
            {!d.ga4Available && <p className="admin-cr-footnote">GA4 pendent o sense dades.</p>}
          </div>
        </Card>
        <Card title="Entrades i conversió" subtitle="Consultes i tancaments" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.leadsConversion}>
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.leadsSeries, stroke: ADMIN_CHART_SERIES_COLORS.leads, label: 'Entrades', value: d.leadsThisMonth },
              { data: d.leadsWonSeries, stroke: ADMIN_CHART_SERIES_COLORS.leadsWon, label: 'Guanyats', value: d.wonLeads },
            ]} />
          </div>
        </Card>
        <Card title="Reserves i facturació" subtitle="Esdeveniments confirmats" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.bookingsRevenue}>
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.bookingsSeries, stroke: ADMIN_CHART_SERIES_COLORS.bookings, label: 'Reserves', value: d.bookingsConfirmed },
              { data: d.revenueSeries, stroke: ADMIN_CHART_SERIES_COLORS.revenue, label: '€', value: d.revenueTotal30 },
            ]} />
          </div>
        </Card>
      </div>

      {/* ═══ GRÀFIQUES COMPARATIVES ═══ */}
      <div className="admin-cr-chart-grid">
        <Card title="Ingressos mensuals" subtitle="Comparativa amb any anterior" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.monthlyRevenue}>
          <div className="admin-cr-card-pad">
            <MonthlyBarChart data={d.monthlyRevenue} />
          </div>
        </Card>
        <Card title="Distribució per tipus" subtitle="Reserves confirmades/completades" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.eventMix}>
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
                  <Link key={booking.id} href={buildBookingHref(booking.id)} className="admin-cr-row-link">
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
          <Card title="Activitat" subtitle="Últimes accions" helpText={ADMIN_DASHBOARD_HELP.cards.activity}>
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
              <Link key={lead.id} href={buildLeadWorkspaceHref(lead.id)} className="admin-cr-row-link">
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
        <div className="admin-cr-mini-card admin-cr-mini-card--violet" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.conversion)}>
          <p className="admin-cr-stat-label">Conversió</p>
          <p className="admin-cr-mini-value">{d.conversionRate}%</p>
          <p className="admin-cr-meta">{d.wonLeads}/{d.leadsCount} entrades</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-mini-card--amber" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.testimonials)}>
          <p className="admin-cr-stat-label">Testimonis</p>
          <p className="admin-cr-mini-value">{d.testimonialsApproved + d.testimonialsPending}</p>
          <p className="admin-cr-meta">{d.testimonialsPending} pendents</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-mini-card--rose" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.rating)}>
          <p className="admin-cr-stat-label">Valoració</p>
          <p className="admin-cr-mini-value">⭐ {d.rating}</p>
          <p className="admin-cr-meta">Mitjana</p>
        </div>
        <Link href="/admin/inventory" className="admin-cr-mini-card admin-cr-mini-card--cyan" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.inventory)}>
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

      <section className="admin-cr-audit" {...helpAttrs(ADMIN_DASHBOARD_HELP.recentAudit)}>
        <div className="admin-cr-audit-head">
          <h3 className="admin-cr-step-title">Auditoria recent</h3>
          <p className="admin-cr-small admin-cr-small--muted">Últimes accions d&apos;admin</p>
        </div>
        {d.recentAdminLogs.length === 0 ? (
          <div className="admin-cr-empty-block">Sense activitat recent</div>
        ) : (
          <div className="admin-cr-divide-list">
            {d.recentAdminLogs.map((logItem) => (
              <Link key={logItem.id} href={logItem.href} className="admin-cr-audit-row admin-cr-list-row--link">
                <span className="admin-cr-truncate">{logItem.text}</span>
                <span className="admin-cr-meta">{logItem.time}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


