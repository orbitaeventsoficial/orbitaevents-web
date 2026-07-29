import Tooltip from '../components/Tooltip';
import Link from 'next/link';
import { AdminPage, AdminSection, AdminKpiRow, AdminKpi } from '../components/AdminPage';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import QuickActions from '../components/QuickActions';
import StatusQuickSelect from '../components/StatusQuickSelect';
import { fetchDashboardData, timeAgo, formatEventDate } from '../lib/dashboard-data';
import { formatDateTimeFull, formatCurrency, formatDate, getEventLabel } from '@/lib/constants';
import { generateDashboardInsights } from '@/lib/services/dashboardInsightsService';
import WeatherWidget from '../components/WeatherWidget';
import { ADMIN_DASHBOARD_HELP, helpAttrs } from '../components/adminHelpContent';
import { getGreeting, RadialProgress, MetricCard, Card, Button, MonthlyBarChart, DonutChart, MiniLineChart } from '../lib/dashboard-widgets';
import { LEAD_STATUS_OPTIONS, BOOKING_STATUS_OPTIONS } from '@/lib/constants';
import {
  ADMIN_CHART_SERIES_COLORS,
  ADMIN_DASHBOARD_INSIGHT_COLORS,
  ADMIN_DASHBOARD_PILOT_STEPS,
  readAdminPostEventCronSetting,
} from '@/lib/constants/admin';
import { loadDailyBrief } from '@/lib/services/dailyBriefService';
import DailyBriefPanel from '../components/DailyBriefPanel';
import { loadOperationalPulse } from '@/lib/services/operationalPulseService';
import OperationalPulsePanel from '../components/OperationalPulsePanel';
import { loadCaptureHealth } from '@/lib/services/captureHealthService';
import CaptureHealthPanel from '../components/CaptureHealthPanel';
import { loadMultiTouchReport } from '@/lib/services/attributionService';
import AttributionPanel from '../components/AttributionPanel';
import { loadAnomalyReport } from '@/lib/services/dailyAnomalyService';
import AnomalyPanel from '../components/AnomalyPanel';
import { loadCapacityConflicts } from '@/lib/services/capacityConflictService';
import CapacityConflictPanel from '../components/CapacityConflictPanel';
import { loadWeeklyCapacityForecast } from '@/lib/services/operationalForecastService';
import WeeklyCapacityForecastPanel from '../components/WeeklyCapacityForecastPanel';
import { buildDashboardOperatingCycle, type AdminOperatingCycleTone } from '@/lib/services/adminOperatingCycleService';
import NBAExplainPanel from '../components/NBAExplainPanel';
import { getPaymentBand, getPaymentLabel } from '@/lib/payment-status';

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
      outstandingAmount: d.nextEvent.outstandingAmount,
    } : null,
    inventoryMaintenance: d.inventoryMaintenance,
    inventoryBroken: d.inventoryBroken,
  });
  const postEventCronLastRun = readAdminPostEventCronSetting(d.cronMap, 'lastRun');

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
  const nextEventPaymentCoverage = d.nextEvent
    ? { total: d.nextEvent.total, cashAmount: Math.max(0, d.nextEvent.total - d.nextEvent.outstandingAmount) }
    : undefined;
  const nextEventPaymentBand = d.nextEvent
    ? getPaymentBand(d.nextEvent.depositPaid, d.nextEvent.remainingPaid, nextEventPaymentCoverage)
    : null;
  const nextEventPaymentLabel = d.nextEvent
    ? getPaymentLabel(d.nextEvent.depositPaid, d.nextEvent.remainingPaid, nextEventPaymentCoverage)
    : '';
  const nextEventPaymentTooltip = nextEventPaymentBand === 'paid'
    ? 'Tot pagat'
    : nextEventPaymentBand === 'partial'
      ? 'Pagament parcial registrat'
      : 'Sense cap pagament';
  const nextEventPaymentDotClass = nextEventPaymentBand === 'paid'
    ? 'bg-[var(--o-success)]'
    : nextEventPaymentBand === 'partial'
      ? 'bg-[var(--o-warning)]'
      : 'bg-[var(--o-danger)]';
  const criticalHealthCount = d.salutSnapshot?.summary.critical || 0;
  const warningHealthCount = d.salutSnapshot?.summary.warning || 0;
  const manualDecisionCount = d.alerts.length + d.upcomingTasks.length;
  const operatingCycle = buildDashboardOperatingCycle({
    leadsThisMonth: d.leadsThisMonth,
    staleLeadsCount: d.staleLeadsCount,
    quotesInFlightCount: d.quotesInFlightCount,
    bookingsConfirmed: d.bookingsConfirmed,
    pendingPayments: d.pendingPayments,
    postEventPending: d.postEventPending,
  });
  const operatingCycleTone: Record<AdminOperatingCycleTone, string> = {
    success: 'admin-tone-border-success',
    warning: 'admin-tone-border-warning',
    info: 'admin-tone-border-info',
  };
  const nextPriorityHref = d.alerts[0]?.href || '/admin/tasks';
  const nextPriorityTitle = d.alerts[0]?.title || (d.upcomingTasks[0]?.title ? d.upcomingTasks[0].title : 'Revisar la cua de tasques');
  const nextPriorityDetail = d.alerts[0]?.description || (d.upcomingTasks[0]?.lead?.name ? `Relacionat amb ${d.upcomingTasks[0].lead.name}` : 'Obre el workspace que concentra la feina pendent.');
  const controlMetrics = [
    { label: 'Entrades mes', value: d.leadsThisMonth.toString(), href: '/admin/leads' },
    { label: 'Pipeline 30d', value: formatCurrency(d.pipelineWeighted30), href: '/admin/leads' },
    { label: 'Reserves', value: d.bookingsConfirmed.toString(), href: '/admin/bookings' },
    { label: 'Cobraments', value: formatCurrency(d.pendingPayments), href: '/admin/bookings?payment=overdue' },
    { label: 'Marge', value: `${d.avgMarginPct}%`, href: '/admin/economia' },
    {
      label: 'Salut',
      value: criticalHealthCount > 0 ? `${criticalHealthCount} crítics` : warningHealthCount > 0 ? `${warningHealthCount} avisos` : 'OK',
      href: '/admin/salut',
    },
  ];
  const focusHref = d.nextEvent ? buildBookingHref(d.nextEvent.id) : nextPriorityHref;
  const focusKicker = d.nextEvent
    ? d.nextEvent.daysUntil === 0 ? 'Bolo avui' : d.nextEvent.daysUntil === 1 ? 'Bolo demà' : `Bolo en ${d.nextEvent.daysUntil} dies`
    : 'Prioritat oberta';
  const focusTitle = d.nextEvent ? d.nextEvent.clientName : nextPriorityTitle;
  const focusDetail = d.nextEvent
    ? [
        formatDate(d.nextEvent.eventDate),
        d.nextEvent.eventStartTime,
        d.nextEvent.eventType ? getEventLabel(d.nextEvent.eventType) : null,
        d.nextEvent.eventVenue || d.nextEvent.eventLocation,
      ].filter(Boolean).join(' · ')
    : nextPriorityDetail;
  const focusValue = d.nextEvent ? formatCurrency(d.nextEvent.total) : manualDecisionCount > 0 ? `${manualDecisionCount} fronts` : 'Net';
  const pipelineRadarItems = pulse.pipelineDrivers.length > 0
    ? pulse.pipelineDrivers.slice(0, 3).map((driver) => {
        const tone = driver.priority === 'CRITICAL'
          ? {
              card: 'admin-tone-border-danger',
              dot: 'bg-[var(--o-danger)]',
              value: 'admin-tone-text-danger',
            }
          : {
              card: 'admin-tone-border-warning',
              dot: 'bg-[var(--o-warning)]',
              value: 'admin-tone-text-warning',
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
          cardClass: d.staleLeadsCount > 0 ? 'admin-tone-border-danger' : 'admin-tone-border-success',
          dotClass: d.staleLeadsCount > 0 ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-success)]',
          valueClass: d.staleLeadsCount > 0 ? 'admin-tone-text-danger' : 'admin-tone-text-success',
        },
        {
          href: '/admin/leads',
          label: 'Leads calents',
          tooltip: 'Prioritat HIGH o URGENT, en estat actiu',
          value: d.hotLeadsCount,
          detail: 'Prioritat alta/urgent.',
          cardClass: d.hotLeadsCount > 0 ? 'admin-tone-border-warning' : 'admin-tone-border-success',
          dotClass: d.hotLeadsCount > 0 ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-success)]',
          valueClass: d.hotLeadsCount > 0 ? 'admin-tone-text-warning' : 'admin-tone-text-success',
        },
        {
          href: '/admin/presupuestos',
          label: 'Pressupostos en joc',
          tooltip: 'Leads en estat QUOTE_SENT o NEGOTIATING',
          value: d.quotesInFlightCount,
          detail: 'Enviats o negociant.',
          cardClass: d.quotesInFlightCount > 0 ? 'admin-tone-border-info' : 'admin-tone-border-success',
          dotClass: d.quotesInFlightCount > 0 ? 'bg-[var(--o-info)]' : 'bg-[var(--o-success)]',
          valueClass: d.quotesInFlightCount > 0 ? 'admin-tone-text-info' : 'admin-tone-text-success',
        },
      ];

  return (
    <AdminPage
      eyebrow="Control complet"
      title="Centre de control"
      subtitle="Totes les mètriques i panells del negoci. Per al dia a dia, torna a «Avui»."
      actions={
        <>
          <Link href="/admin" className="hidden sm:inline-flex">
            <Button variant="secondary" label="← Avui" helpText="Torna a la pantalla d'avui: el resum calmat amb les accions del dia." />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" helpText={ADMIN_DASHBOARD_HELP.newLeadButton} />
          </Link>
        </>
      }
    >
      {/* ═══ FOCUS DEL DIA ═══ */}
      <Link
        href={focusHref}
        className="ap-card flex items-stretch overflow-hidden no-underline border-l-[3px] border-l-[var(--gold)]"
      >
        <span className="self-center ml-4 w-2 h-2 rounded-full bg-[var(--gold)] shrink-0" aria-hidden="true" />
        <span className="min-w-0 grid gap-0.5 px-4 py-2.5 flex-1">
          <span className="text-[var(--gold)] font-[family-name:var(--mono)] text-xs font-bold uppercase tracking-wider leading-none">{focusKicker}</span>
          <span className="truncate text-[var(--t)] font-[family-name:var(--display)] text-lg font-extrabold leading-tight">{focusTitle}</span>
          <span className="truncate text-[var(--t3)] text-xs leading-snug">{focusDetail}</span>
        </span>
        <span className="hidden sm:grid place-items-center min-w-[7rem] max-w-[10rem] truncate px-4 border-l border-[var(--line)] text-[var(--gold)] font-[family-name:var(--display)] text-lg font-bold">{focusValue}</span>
        <span className="hidden md:grid place-items-center px-3.5 border-l border-[var(--line)] text-[var(--t3)] text-xs font-bold">Obrir</span>
      </Link>

      {/* ═══ RESUM DE COMANDAMENT ═══ */}
      <AdminKpiRow>
        {controlMetrics.map((metric) => (
          <AdminKpi key={metric.label} label={metric.label} value={metric.value} href={metric.href} />
        ))}
      </AdminKpiRow>

      {/* ═══ ACCÉS RÀPID ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { href: '/admin/inbox', kicker: 'Comunicació', label: 'Inbox IMAP', help: ADMIN_DASHBOARD_HELP.quickLinks.inbox },
          { href: '/admin/emails', kicker: 'Automatització', label: 'Correus', help: ADMIN_DASHBOARD_HELP.quickLinks.emails },
          { href: '/admin/bookings', kicker: 'Operació', label: 'Reserves', help: ADMIN_DASHBOARD_HELP.quickLinks.bookings },
          { href: '/admin/bookings?payment=overdue', kicker: 'Risc', label: 'Vençuts', help: ADMIN_DASHBOARD_HELP.quickLinks.overdue },
          { href: '/admin/bookings?payment=due-soon', kicker: 'Proper', label: 'Vencen aviat', help: ADMIN_DASHBOARD_HELP.quickLinks.dueSoon },
          { href: '/admin/economia', kicker: 'Marge', label: 'Economia', help: ADMIN_DASHBOARD_HELP.quickLinks.economy },
          { href: '/admin/salut', kicker: 'Sistema', label: 'Salut', help: ADMIN_DASHBOARD_HELP.quickLinks.health },
          { href: '/admin/calendario', kicker: 'Agenda', label: 'Calendari', help: ADMIN_DASHBOARD_HELP.quickLinks.calendar },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="ap-card px-3 py-2.5 grid gap-0.5 no-underline" {...helpAttrs(q.help)}>
            <span className="text-[var(--t3)] font-[family-name:var(--mono)] text-xs font-bold uppercase tracking-wider">{q.kicker}</span>
            <span className="text-[var(--t)] text-sm font-bold truncate">{q.label}</span>
          </Link>
        ))}
      </div>

      <NBAExplainPanel />

      <AdminSection
        title="On està viu el sistema ara"
        description="Cicle operatiu"
        actions={<Link href="/admin/manual" className="ap-btn ap-btn--secondary ap-btn--xs">Obrir manual</Link>}
      >
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {operatingCycle.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className={`ap-card p-2.5 block no-underline ${operatingCycleTone[item.tone]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[var(--t3)] text-xs font-bold uppercase tracking-wider">Pas {item.step}</p>
                  <h3 className="text-[var(--t)] text-sm font-bold">{item.title}</h3>
                </div>
                <span className="ap-badge shrink-0 max-w-[45%] truncate">{item.metric}</span>
              </div>
              <p className="mt-1 text-[var(--t2)] text-xs">{item.detail}</p>
              <p className="mt-2 inline-flex text-[var(--t)] text-xs font-bold underline decoration-dotted">{item.cta}</p>
            </Link>
          ))}
        </div>
      </AdminSection>

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
        <Link href={buildBookingHref(d.nextEvent.id)} className="block no-underline">
          <section className={`ap-card p-4 ${
            d.nextEvent.daysUntil <= 1
              ? 'admin-tone-border-warning'
              : d.nextEvent.daysUntil <= 3
                ? 'admin-tone-border-info'
                : ''
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    d.nextEvent.daysUntil <= 1 ? 'admin-tone-text-warning' : 'admin-tone-text-info'
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
                  <Tooltip text={nextEventPaymentTooltip}>
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${nextEventPaymentDotClass}`} />
                  </Tooltip>
                  <span className="text-xs">
                    {nextEventPaymentLabel}
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
      <section className="ap-card p-4" {...helpAttrs(ADMIN_DASHBOARD_HELP.revenueGoal)}>
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
            <div className="w-full h-2 rounded-full bg-[var(--raised)] overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${
                  d.revenueMonthPct >= 100 ? 'bg-[var(--o-success)]' : d.revenueMonthPct >= 60 ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-danger)]'
                }`}
                style={{ width: `${Math.min(100, d.revenueMonthPct)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <AdminSection
        title="Pilot automàtic d'avui"
        description="Mode Solo — no és lineal: pots començar directament pel pas 2 o pas 3."
        actions={<span className="ap-badge ap-badge--success">4 passos clars</span>}
        help={ADMIN_DASHBOARD_HELP.pilot}
      >
        <div className="flex flex-wrap gap-2 mb-2.5">
          <Link href="/admin/tasks" className="ap-badge ap-badge--warning no-underline" {...helpAttrs(ADMIN_DASHBOARD_HELP.startStep2)}>Comença per pas 2</Link>
          <Link href="/admin/post-event" className="ap-badge ap-badge--danger no-underline" {...helpAttrs(ADMIN_DASHBOARD_HELP.startStep3)}>Comença per pas 3</Link>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {pilotToday.map((item) => {
            const toneBorder = item.tone === 'rose' ? 'admin-tone-border-danger'
              : item.tone === 'amber' ? 'admin-tone-border-warning'
              : item.tone === 'sky' ? 'admin-tone-border-info'
              : 'admin-tone-border-success';
            return (
              <Link key={item.id} href={item.href} className={`ap-card p-2.5 block no-underline ${toneBorder}`} data-help-title={item.title} data-help-desc={`${item.description}. Acció recomanada: ${item.cta}.`}>
                <p className="text-[var(--t3)] text-xs font-bold uppercase tracking-wider">{item.step}</p>
                <p className="text-[var(--t)] text-sm font-bold">{item.title}</p>
                <p className="mt-1 text-[var(--t2)] text-xs">{item.description}</p>
                <span className="mt-2 inline-flex text-[var(--t)] text-xs font-bold underline decoration-dotted">{item.cta}</span>
              </Link>
            );
          })}
        </div>
      </AdminSection>

      <AdminSection
        title="Control diari de feina"
        description="Checklist d'avui — marca les tasques com a fetes i avança sense perdre el fil."
        actions={<Link href="/admin/tasks?status=OPEN" className="ap-btn ap-btn--secondary ap-btn--xs">Obrir tasques pendents</Link>}
        help={ADMIN_DASHBOARD_HELP.checklist}
      >
        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="ap-kpi ap-kpi--warning">
            <span className="ap-kpi-label">Pendents</span>
            <span className="ap-kpi-value">{d.checklistTodayPendingCount}</span>
          </div>
          <div className="ap-kpi ap-kpi--success">
            <span className="ap-kpi-label">Fetes</span>
            <span className="ap-kpi-value">{d.checklistTodayDoneCount}</span>
          </div>
          <div className="ap-card p-2.5 flex items-center justify-center">
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
      </AdminSection>

      <AdminSection
        title="Mou estats sense canviar de pantalla"
        description="Centre de comandament — accions ràpides de Leads i Reserves des del tauler principal."
        help={ADMIN_DASHBOARD_HELP.commandCenter}
      >
        <div className="grid gap-2.5 lg:grid-cols-2">
          <div className="ap-card p-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-[var(--t)]">Leads actius</p>
              <Link href="/admin/leads" className="text-xs text-[var(--t3)] underline hover:text-[var(--gold)]">Obrir Entrades</Link>
            </div>
            <div className="grid gap-2">
              {d.commandLeads.length === 0 ? (
                <p className="text-xs text-[var(--t3)]">Sense leads actius.</p>
              ) : (
                d.commandLeads.map((lead) => (
                  <div key={lead.id} className="ap-card p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link href={buildLeadWorkspaceHref(lead.id)} className="block truncate text-sm font-semibold text-[var(--t)] hover:text-[var(--gold)]">{lead.name}</Link>
                      <p className="text-xs text-[var(--t3)]">Prioritat {lead.priority.toLowerCase()} · {timeAgo(new Date(lead.createdAt))}</p>
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
          <div className="ap-card p-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase text-[var(--t)]">Reserves actives</p>
              <Link href="/admin/bookings" className="text-xs text-[var(--t3)] underline hover:text-[var(--gold)]">Obrir Reserves</Link>
            </div>
            <div className="grid gap-2">
              {d.commandBookings.length === 0 ? (
                <p className="text-xs text-[var(--t3)]">Sense reserves actives.</p>
              ) : (
                d.commandBookings.map((booking) => (
                  <div key={booking.id} className="ap-card p-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link href={buildBookingHref(booking.id)} className="block truncate text-sm font-semibold text-[var(--t)] hover:text-[var(--gold)]">
                        {booking.reference} · {booking.clientName}
                      </Link>
                      <p className="text-xs text-[var(--t3)]">{formatEventDate(new Date(booking.eventDate))}</p>
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
      </AdminSection>

      <AdminSection
        title="On posar el focus avui"
        description="Radar d'execució — semàfors simples: vermell = urgent, groc = important, verd = controlat."
        help={ADMIN_DASHBOARD_HELP.executionRadar}
      >
        <div className="grid gap-2.5 sm:grid-cols-3">
          {pipelineRadarItems.map((item) => (
            <Link key={`${item.label}:${item.href}`} href={item.href} className={`ap-card p-2.5 block no-underline ${item.cardClass}`}>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${item.dotClass}`} />
                <Tooltip text={item.tooltip}>
                  <p className="text-xs text-[var(--t3)]">{item.label}</p>
                </Tooltip>
              </div>
              <p className={`text-xl font-bold mt-0.5 ${item.valueClass}`}>{item.value}</p>
              <p className="text-xs text-[var(--t2)]">{item.detail}</p>
            </Link>
          ))}
        </div>
      </AdminSection>

      {d.testimonialsPending > 0 && (
        <div className="ap-card p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between admin-tone-border-warning">
          <div>
            <p className="text-xs font-semibold text-[var(--t)]">Testimonis pendents</p>
            <p className="text-base font-bold text-[var(--t)]">
              {d.testimonialsPending} pendent{d.testimonialsPending > 1 ? 's' : ''} d&apos;aprovació
            </p>
          </div>
          <Link href="/admin/ressenyes" className="self-start no-underline">
            <Button variant="secondary" icon="⭐" label="Revisar" />
          </Link>
        </div>
      )}

      {/* ─── Insights narratius ─────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="ap-card p-5 space-y-3">
          <p className="text-xs font-bold text-[var(--t3)] uppercase tracking-wider mb-2">Què necessites saber avui</p>
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
        <div className="grid gap-2.5 xl:grid-cols-3">
          {d.alerts.map((alert, index) => {
            const tone = alert.type === 'error' ? 'admin-tone-border-danger'
              : alert.type === 'warning' ? 'admin-tone-border-warning'
              : 'admin-tone-border-info';
            return (
              <div key={`${alert.title}-${index}`} className={`ap-card p-3 ${tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--t)]">{alert.title}</p>
                    <p className="text-xs text-[var(--t2)] mt-0.5">{alert.description}</p>
                  </div>
                  <Link href={alert.href} className="text-xs text-[var(--t3)] underline hover:text-[var(--gold)] shrink-0">{alert.action}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuickActions />

      <section className="grid gap-2.5 lg:grid-cols-3">
        <div className="ap-card p-3" {...helpAttrs(ADMIN_DASHBOARD_HELP.businessHealth)}>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--t3)] mb-2">Salut del negoci</p>
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
              <div className="grid grid-cols-3 gap-2 mt-2.5" {...helpAttrs(ADMIN_DASHBOARD_HELP.monitoredAreas)}>
                {d.salutSnapshot.sections.map((section) => {
                  const hasCritical = section.counts.critical > 0;
                  const hasWarning = section.counts.warning > 0;
                  const dot = hasCritical ? 'bg-[var(--o-danger)]' : hasWarning ? 'bg-[var(--o-warning)]' : 'bg-[var(--o-success)]';
                  const tone = hasCritical ? 'admin-tone-text-danger' : hasWarning ? 'admin-tone-text-warning' : 'admin-tone-text-success';
                  const count = hasCritical ? section.counts.critical : hasWarning ? section.counts.warning : 0;
                  const href = hasCritical ? '/admin/salut?status=critical' : hasWarning ? '/admin/salut?status=warning' : '/admin/salut';
                  return (
                    <Link key={section.scope} href={href} className="ap-card p-1.5 text-center block no-underline hover:opacity-80 transition-opacity" data-help-title={section.label} data-help-desc={hasCritical ? `Té ${section.counts.critical} punt${section.counts.critical > 1 ? "s" : ""} crític${section.counts.critical > 1 ? "s" : ""}.` : hasWarning ? `Té ${section.counts.warning} avís${section.counts.warning > 1 ? "os" : ""} actiu${section.counts.warning > 1 ? "s" : ""}.` : "No té incidències obertes ara mateix."}>
                      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                      <p className="text-xs text-[var(--t3)]">{section.label}</p>
                      <p className={`text-xs font-bold ${tone}`}>
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
                          <p className="text-sm font-medium text-[var(--t)] truncate">{item.title}</p>
                          <p className="text-xs text-[var(--t3)] line-clamp-1">{item.reason}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {d.healthItems.map((item) => {
                const dot = item.status === 'OK' ? 'bg-[var(--o-success)]' : item.status === 'ERROR' ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-warning)]';
                return (
                  <div key={item.label} className="ap-card p-1.5 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                    <p className="text-xs text-[var(--t3)]">{item.label}</p>
                    <p className={`text-xs font-bold ${item.status === 'OK' ? 'admin-tone-text-success' : item.status === 'ERROR' ? 'admin-tone-text-danger' : 'admin-tone-text-warning'}`}>
                      {item.status}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--t3)]">
              Últim cron: {postEventCronLastRun ? formatDateTimeFull(postEventCronLastRun) : 'Mai'}
            </p>
            <Link href="/admin/salut" className="text-xs text-[var(--t3)] underline hover:text-[var(--gold)]" {...helpAttrs(ADMIN_DASHBOARD_HELP.openHealth)}>Obrir Salut</Link>
          </div>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--t3)] mb-2">Tasques pendents</p>
          <div className="grid gap-2">
            {d.upcomingTasks.length === 0 ? (
              <p className="text-xs text-[var(--t3)]">Sense tasques pendents</p>
            ) : (
              d.upcomingTasks.map((task) => {
                const taskHref = task.lead ? buildLeadWorkspaceHref(task.lead.id) : '/admin/tasks';
                const taskMeta = task.lead?.name || 'Sense lead assignat';

                return (
                  <Link key={task.id} href={taskHref} className="ap-card p-2 flex items-center justify-between gap-2 no-underline">
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--t)]">{task.title}</span>
                    <span className="text-xs text-[var(--t3)] shrink-0">{taskMeta}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
        <div className="ap-card p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--t3)] mb-2">Timeline</p>
          <div className="grid gap-2">
            {d.timeline.length === 0 ? (
              <p className="text-xs text-[var(--t3)]">Cap activitat recent</p>
            ) : (
              d.timeline.map((item) => (
                <Link key={item.id} href={item.href} className="ap-card p-2 flex items-start gap-2 no-underline">
                  <span>{item.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--t)]">{item.text}</span>
                  <span className="text-xs text-[var(--t3)] shrink-0">{item.time}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
        <div><Tooltip text="Quantes reserves tens confirmades ara mateix. Més confirmades = més feina segura."><MetricCard label="Reserves confirmades" value={d.bookingsConfirmed.toString()} change={d.bookingsThisMonth > 0 ? `+${d.bookingsThisMonth} aquest mes` : '-'} changeType="up" accent="emerald" /></Tooltip></div>
        <div><Tooltip text="Consultes noves que han entrat aquest mes. Indica si la web i el màrqueting estan portant feina."><MetricCard label="Consultes del mes" value={d.leadsThisMonth.toString()} change={`${d.leadsCount} totals`} changeType="up" accent="sky" /></Tooltip></div>
        <div><Tooltip text="Clients reals que han contractat. La conversió mostra quin % de consultes acaben en reserva."><MetricCard label="Clients" value={d.customersCount.toString()} change={`${d.conversionRate}% de conversió`} changeType="up" accent="purple" /></Tooltip></div>
        <div><Tooltip text="Nota mitjana de les ressenyes de Google. Afecta directament la confiança dels nous clients."><MetricCard label="Valoració mitjana" value={d.rating} change={`${d.testimonialsApproved} ressenyes`} changeType="up" accent="amber" /></Tooltip></div>
        <div><Tooltip text="Visites a la web els últims 30 dies. Si baixa, pot ser que el màrqueting perdi empenta."><MetricCard label="Sessions web (30d)" value={d.ga4Sessions || '-'} change={d.ga4Users ? `${d.ga4Users} usuaris` : 'GA4 pendent'} changeType="neutral" accent="cyan" /></Tooltip></div>
        <div><Tooltip text="Quant de temps passen els visitants a la web. Més temps = més interès real en el que ofereixes."><MetricCard label="Temps mitjà web" value={d.ga4AvgSessionMin ? `${d.ga4AvgSessionMin} min` : '-'} change={d.ga4PageViews ? `${d.ga4PageViews} pàgines` : 'GA4 pendent'} changeType="neutral" accent="rose" /></Tooltip></div>
        <div><Tooltip text="Percentatge que et queda net de cada reserva després de descomptar costos. Per sobre del 50% és excel·lent."><MetricCard label="Marge mitjà" value={`${d.avgMarginPct}%`} change={d.avgMarginPct >= 50 ? 'Excel·lent' : d.avgMarginPct >= 30 ? 'Acceptable' : d.avgMarginPct >= 15 ? 'Vigilar' : 'Crític'} changeType={d.avgMarginPct >= 30 ? 'up' : 'down'} accent={d.avgMarginPct >= 50 ? 'emerald' : d.avgMarginPct >= 30 ? 'amber' : 'rose'} /></Tooltip></div>
        <div><Tooltip text="Quants diners entraran o sortiran els pròxims 30 dies, segons reserves confirmades i costos previstos."><MetricCard label="Flux net previst" value={`${d.cashFlowNet30 >= 0 ? '+' : ''}${formatCurrency(Math.abs(d.cashFlowNet30))}`} change="Pròxims 30 dies" changeType={d.cashFlowNet30 >= 0 ? 'up' : 'down'} accent={d.cashFlowNet30 >= 0 ? 'emerald' : 'rose'} /></Tooltip></div>
        <div><Tooltip text="Valor estimat de les vendes en curs, ponderat per la probabilitat de tancar cada una."><MetricCard label="Pipeline ponderat" value={formatCurrency(d.pipelineWeighted30)} change="Vendes probables" changeType="neutral" accent="amber" /></Tooltip></div>
        <div><Tooltip text="Total que encara no has cobrat de reserves actives. Inclou bestretes i saldos pendents."><MetricCard label="Pendent de cobrar" value={formatCurrency(d.pendingPayments)} change="Reserves actives" changeType={d.pendingPayments > 0 ? 'down' : 'up'} accent={d.pendingPayments > 5000 ? 'rose' : 'sky'} /></Tooltip></div>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-3">
        <Card title="Trànsit web (30 dies)" subtitle="Sessions i usuaris" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.traffic30d}>
          <div className="p-2.5">
            <MiniLineChart series={[
              { data: d.ga4SessionsSeries, stroke: ADMIN_CHART_SERIES_COLORS.ga4Sessions, label: 'Sessions', value: d.ga4Sessions || '-' },
              { data: d.ga4UsersSeries, stroke: ADMIN_CHART_SERIES_COLORS.ga4Users, label: 'Usuaris', value: d.ga4Users || '-' },
            ]} />
            {!d.ga4Available && <p className="text-xs text-[var(--t3)] mt-2">GA4 pendent o sense dades.</p>}
          </div>
        </Card>
        <Card title="Entrades i conversió" subtitle="Consultes i tancaments" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.leadsConversion}>
          <div className="p-2.5">
            <MiniLineChart series={[
              { data: d.leadsSeries, stroke: ADMIN_CHART_SERIES_COLORS.leads, label: 'Entrades', value: d.leadsThisMonth },
              { data: d.leadsWonSeries, stroke: ADMIN_CHART_SERIES_COLORS.leadsWon, label: 'Guanyats', value: d.wonLeads },
            ]} />
          </div>
        </Card>
        <Card title="Reserves i facturació" subtitle="Esdeveniments confirmats" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.bookingsRevenue}>
          <div className="p-2.5">
            <MiniLineChart series={[
              { data: d.bookingsSeries, stroke: ADMIN_CHART_SERIES_COLORS.bookings, label: 'Reserves', value: d.bookingsConfirmed },
              { data: d.revenueSeries, stroke: ADMIN_CHART_SERIES_COLORS.revenue, label: '€', value: d.revenueTotal30 },
            ]} />
          </div>
        </Card>
      </div>

      {/* ═══ GRÀFIQUES COMPARATIVES ═══ */}
      <div className="grid gap-2.5 lg:grid-cols-3">
        <Card title="Ingressos mensuals" subtitle="Comparativa amb any anterior" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.monthlyRevenue}>
          <div className="p-2.5">
            <MonthlyBarChart data={d.monthlyRevenue} />
          </div>
        </Card>
        <Card title="Distribució per tipus" subtitle="Reserves confirmades/completades" noPadding helpText={ADMIN_DASHBOARD_HELP.cards.eventMix}>
          <div className="p-2.5 flex items-center justify-center py-4">
            <DonutChart segments={d.eventTypeDistribution} />
          </div>
        </Card>
      </div>

      <div className="grid gap-2.5 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <Card title="Pròxims esdeveniments" subtitle={`${d.upcomingBookings.length} programats`} action={<Link href="/admin/calendario"><Button variant="ghost" label="Calendari" /></Link>} noPadding>
            {d.upcomingBookings.length > 0 ? (
              <div className="divide-y divide-[var(--line)]">
                {d.upcomingBookings.map((booking) => (
                  <Link key={booking.id} href={buildBookingHref(booking.id)} className="flex items-center gap-2.5 px-3 py-2.5 adm-row-hover no-underline">
                    <div className="w-11 h-11 rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] flex items-center justify-center shrink-0">
                      <span className="text-[var(--t)] font-bold text-sm">{new Date(booking.eventDate).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--t)]">{booking.clientName || 'Client'}</p>
                      <p className="min-w-0 flex-1 truncate text-xs text-[var(--t3)]">
                        {formatEventDate(new Date(booking.eventDate))} · {booking.eventType || 'Esdeveniment'}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-[var(--t3)] shrink-0" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-[var(--t3)]">No hi ha esdeveniments programats</p>
                <Link href="/admin/bookings" className="text-xs text-[var(--t3)] underline hover:text-[var(--gold)]">Crear nova reserva →</Link>
              </div>
            )}
          </Card>
        </div>
        <div className="hidden md:block">
          <Card title="Activitat" subtitle="Últimes accions" helpText={ADMIN_DASHBOARD_HELP.cards.activity}>
            <div className="grid gap-2">
              {d.activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-2.5 ap-card p-2">
                  <span className="w-5 h-5 rounded-full border border-[var(--line)] bg-[var(--sunk)] inline-flex items-center justify-center shrink-0 text-xs">{activity.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[var(--t2)]">{activity.text}</p>
                    {activity.time && <p className="text-xs text-[var(--t3)]">{activity.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card title="Entrades recents" subtitle={`${d.leadsCount} totals`} action={<Link href="/admin/leads"><Button variant="secondary" label="Tots" /></Link>} noPadding>
        {d.recentLeads.length > 0 ? (
          <div className="divide-y divide-[var(--line)]">
            {d.recentLeads.map((lead) => (
              <Link key={lead.id} href={buildLeadWorkspaceHref(lead.id)} className="flex items-center justify-between gap-2.5 px-3 py-2.5 adm-row-hover no-underline">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full border border-[var(--line)] bg-[var(--sunk)] text-[var(--t)] font-bold flex items-center justify-center shrink-0">{lead.name?.charAt(0).toUpperCase() || '?'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--t)]">{lead.name}</p>
                    <p className="text-xs text-[var(--t3)] hidden sm:inline">{lead.email}</p>
                    <p className="text-xs text-[var(--t3)] inline sm:hidden">{timeAgo(new Date(lead.createdAt))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`ap-badge ${lead.status === 'NEW' ? 'ap-badge--info' : lead.status === 'WON' ? 'ap-badge--success' : ''}`}>
                    {lead.status}
                  </span>
                  <span className="text-xs text-[var(--t3)] hidden sm:inline">{timeAgo(new Date(lead.createdAt))}</span>
                  <svg className="w-4 h-4 text-[var(--t3)] inline sm:hidden" width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-xs text-[var(--t3)]">Encara no hi ha entrades</p>
            <p className="text-xs text-[var(--t3)]">Les entrades apareixeran aquí</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <div className="ap-card p-2.5" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.conversion)}>
          <p className="text-xs text-[var(--t3)]">Conversió</p>
          <p className="text-xl font-bold text-[var(--t)] mt-0.5">{d.conversionRate}%</p>
          <p className="text-xs text-[var(--t3)]">{d.wonLeads}/{d.leadsCount} entrades</p>
        </div>
        <div className="ap-card p-2.5" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.testimonials)}>
          <p className="text-xs text-[var(--t3)]">Testimonis</p>
          <p className="text-xl font-bold text-[var(--t)] mt-0.5">{d.testimonialsApproved + d.testimonialsPending}</p>
          <p className="text-xs text-[var(--t3)]">{d.testimonialsPending} pendents</p>
        </div>
        <div className="ap-card p-2.5" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.rating)}>
          <p className="text-xs text-[var(--t3)]">Valoració</p>
          <p className="text-xl font-bold text-[var(--t)] mt-0.5">⭐ {d.rating}</p>
          <p className="text-xs text-[var(--t3)]">Mitjana</p>
        </div>
        <Link href="/admin/inventory" className="ap-card p-2.5 block no-underline" {...helpAttrs(ADMIN_DASHBOARD_HELP.miniCards.inventory)}>
          <p className="text-xs text-[var(--t3)]">Inventari</p>
          <p className="text-xl font-bold text-[var(--t)] mt-0.5">{d.inventoryAvailable}/{d.inventoryTotal}</p>
          <p className="text-xs text-[var(--t3)]">
            {d.inventoryInUse > 0 && `${d.inventoryInUse} en ús · `}
            {d.inventoryMaintenance > 0 && `${d.inventoryMaintenance} mant.`}
            {d.inventoryBroken > 0 && ` · ${d.inventoryBroken} avariat`}
            {d.inventoryInUse === 0 && d.inventoryMaintenance === 0 && d.inventoryBroken === 0 && 'Tot disponible'}
          </p>
        </Link>
      </div>

      <section className="ap-card overflow-hidden" {...helpAttrs(ADMIN_DASHBOARD_HELP.recentAudit)}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2.5">
          <h3 className="text-sm font-bold text-[var(--t)]">Auditoria recent</h3>
          <p className="text-xs text-[var(--t3)]">Últimes accions d&apos;admin</p>
        </div>
        {d.recentAdminLogs.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--t3)]">Sense activitat recent</div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {d.recentAdminLogs.map((logItem) => (
              <Link key={logItem.id} href={logItem.href} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs adm-row-hover no-underline">
                <span className="min-w-0 flex-1 truncate text-[var(--t)]">{logItem.text}</span>
                <span className="text-xs text-[var(--t3)] shrink-0">{logItem.time}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminPage>
  );
}
