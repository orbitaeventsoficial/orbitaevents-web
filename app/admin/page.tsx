import Tooltip from './components/Tooltip';
import Link from 'next/link';
import QuickActions from './components/QuickActions';
import StatusQuickSelect from './components/StatusQuickSelect';
import { fetchDashboardData, timeAgo, formatEventDate } from './lib/dashboard-data';
import { formatDateTimeFull, formatCurrency, formatDate, getEventLabel } from '@/lib/constants';
import { generateDashboardInsights, type DashboardInsight } from '@/lib/services/dashboardInsightsService';
import WeatherWidget from './components/WeatherWidget';
import { getGreeting, RadialProgress, MetricCard, Card, Button, MonthlyBarChart, DonutChart, MiniLineChart } from './lib/dashboard-widgets';
import { LEAD_STATUS_OPTIONS, BOOKING_STATUS_OPTIONS } from '@/lib/constants';

// Removed: all widget components now in lib/dashboard-widgets.tsx
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
                <Button variant="secondary" icon="📈" label="Analítica" helpText="Obre els informes detallats del negoci: ingressos, conversió, canals i rendiment." />
              </Link>
              <Link href="/admin/leads">
                <Button variant="primary" icon="+" label="Nou lead" helpText="Crea manualment una entrada nova quan una consulta no ha arribat sola des de la web o el correu." />
              </Link>
            </div>
          </div>
          <div className="admin-cr-quick-links mt-4">
            <Link href="/admin/inbox" className="admin-cr-quick-link" data-help-title="Inbox (IMAP)" data-help-desc="Centralitza els correus entrants per convertir-los en leads, seguir converses i no deixar cap consulta sense resposta.">📥 Inbox (IMAP)</Link>
            <Link href="/admin/emails" className="admin-cr-quick-link" data-help-title="Correus automàtics" data-help-desc="Gestiona les seqüències automàtiques i els enviaments operatius abans i després dels esdeveniments.">🤖 Correus automàtics</Link>
            <Link href="/admin/bookings" className="admin-cr-quick-link" data-help-title="Reserves" data-help-desc="Obre el tauler complet de reserves per revisar estats, preparar esdeveniments i seguir cobraments.">📋 Reserves</Link>
            <Link href="/admin/bookings?payment=overdue" className="admin-cr-quick-link" data-help-title="Cobraments vençuts" data-help-desc="Filtra directament les reserves amb pagaments que ja haurien d'haver entrat i requereixen seguiment.">💸 Cobraments vençuts</Link>
            <Link href="/admin/bookings?payment=due-soon" className="admin-cr-quick-link" data-help-title="Cobraments que vencen aviat" data-help-desc="Mostra les reserves amb pagaments a punt de vèncer per poder anticipar recordatoris.">⏳ Vencen aviat</Link>
            <Link href="/admin/economia" className="admin-cr-quick-link" data-help-title="Economia" data-help-desc="Accedeix a la visió financera: factures, pressupostos, fluxos i marge del negoci.">💶 Economia</Link>
            <Link href="/admin/salut" className="admin-cr-quick-link" data-help-title="Salut" data-help-desc="Revisa alertes i incidències del sistema, dades, automatitzacions i operativa general.">🩺 Salut</Link>
            <Link href="/admin/calendario" className="admin-cr-quick-link" data-help-title="Calendari" data-help-desc="Consulta l'agenda d'esdeveniments i planifica el volum de feina dels pròxims dies.">📅 Calendari</Link>
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
                  {d.nextEvent.eventType && ` · ${getEventLabel(d.nextEvent.eventType)}`}
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
      <section className="rounded-2xl border border-white/10 p-4 sm:p-5 admin-card-glass" data-help-title="Objectiu mensual d'ingressos" data-help-desc="Resumeix quant has facturat aquest mes respecte de l'objectiu configurat. T'ajuda a veure si vas per sota, en línia o per sobre del ritme previst.">
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

      <section className="admin-cr-panel admin-cr-panel--pilot" data-help-title="Pilot automàtic d'avui" data-help-desc="És una ruta guiada per a un usuari novell: primer entrades, després tasques, post-esdeveniment i finalment reserves. Pots saltar passos si ja saps què toca.">
        <div className="admin-cr-panel-head">
          <div>
            <p className="admin-cr-kicker admin-cr-kicker--pilot">Mode Solo</p>
            <h2 className="admin-cr-h2">Pilot automàtic d&apos;avui</h2>
            <p className="admin-cr-small">No és lineal: pots començar directament pel pas 2 o pas 3.</p>
          </div>
          <span className="admin-cr-pill admin-cr-pill--pilot">4 passos clars</span>
        </div>
        <div className="admin-cr-chip-row">
          <Link href="/admin/tasks" className="admin-cr-chip admin-cr-chip--amber" data-help-title="Comença pel pas 2" data-help-desc="Et porta directament a tasques si ja has resolt les entrades i vols avançar feina operativa.">Comença per pas 2</Link>
          <Link href="/admin/emails" className="admin-cr-chip admin-cr-chip--rose" data-help-title="Comença pel pas 3" data-help-desc="Et porta a correus automàtics si vols tancar la part post-esdeveniment sense seguir l'ordre complet.">Comença per pas 3</Link>
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

      <section className="admin-cr-panel admin-cr-panel--checklist" data-help-title="Checklist d'avui" data-help-desc="Concentra les tasques diàries obertes i el progrés del dia. Serveix per no perdre el fil operatiu.">
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

      <section className="admin-cr-panel admin-cr-panel--command" data-help-title="Centre de comandament" data-help-desc="Permet moure estats clau de leads i reserves sense entrar a cada fitxa. És per operativa ràpida des del dashboard.">
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

      <section className="admin-cr-panel admin-cr-panel--radar" data-help-title="Radar d'execució" data-help-desc="Resumeix en semàfors on hi ha urgència real: leads aturats, oportunitats calentes i pressupostos en curs.">
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
        <div className="admin-cr-info-card">
          <p className="admin-cr-kicker">Salut del negoci</p>
          {d.salutSnapshot ? (
            <>
              <div className="flex items-center gap-4 mb-3">
                {d.salutSnapshot.summary.critical > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-rose-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400" />
                    {d.salutSnapshot.summary.critical} crític{d.salutSnapshot.summary.critical > 1 ? 's' : ''}
                  </span>
                )}
                {d.salutSnapshot.summary.warning > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                    {d.salutSnapshot.summary.warning} avís{d.salutSnapshot.summary.warning > 1 ? 'os' : ''}
                  </span>
                )}
                {d.salutSnapshot.summary.critical === 0 && d.salutSnapshot.summary.warning === 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Tot correcte
                  </span>
                )}
              </div>
              <div className="admin-cr-health-grid">
                {d.salutSnapshot.sections.map((section) => {
                  const hasCritical = section.counts.critical > 0;
                  const hasWarning = section.counts.warning > 0;
                  const dot = hasCritical ? 'bg-rose-400' : hasWarning ? 'bg-amber-400' : 'bg-emerald-400';
                  const tone = hasCritical ? 'admin-cr-tone-rose' : hasWarning ? 'admin-cr-tone-amber' : 'admin-cr-tone-emerald';
                  const count = hasCritical ? section.counts.critical : hasWarning ? section.counts.warning : 0;
                  const href = hasCritical ? '/admin/salut?status=critical' : hasWarning ? '/admin/salut?status=warning' : '/admin/salut';
                  return (
                    <Link key={section.scope} href={href} className="admin-cr-health-item hover:opacity-80 transition-opacity">
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
                  <div className="mt-3 space-y-2">
                    {topItems.map((item) => (
                      <Link key={item.id} href={item.href} className="flex items-start gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]">
                        <span className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${item.status === 'critical' ? 'bg-rose-400' : 'bg-amber-400'}`} />
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
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="admin-cr-footnote">
              Últim cron: {d.cronMap['emails.cron.lastRun'] ? formatDateTimeFull(d.cronMap['emails.cron.lastRun']) : 'Mai'}
            </p>
            <Link href="/admin/salut" className="admin-cr-link-inline">Obrir Salut</Link>
          </div>
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
        <div className="admin-stagger-item"><Tooltip text="Quantes reserves tens confirmades ara mateix. Més confirmades = més feina segura."><MetricCard icon="📋" label="Reserves confirmades" value={d.bookingsConfirmed.toString()} change={d.bookingsThisMonth > 0 ? `+${d.bookingsThisMonth} aquest mes` : '-'} changeType="up" accent="emerald" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Consultes noves que han entrat aquest mes. Indica si la web i el màrqueting estan portant feina."><MetricCard icon="📨" label="Consultes del mes" value={d.leadsThisMonth.toString()} change={`${d.leadsCount} totals`} changeType="up" accent="sky" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Clients reals que han contractat. La conversió mostra quin % de consultes acaben en reserva."><MetricCard icon="🏆" label="Clients" value={d.customersCount.toString()} change={`${d.conversionRate}% de conversió`} changeType="up" accent="purple" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Nota mitjana de les ressenyes de Google. Afecta directament la confiança dels nous clients."><MetricCard icon="⭐" label="Valoració mitjana" value={d.rating} change={`${d.testimonialsApproved} ressenyes`} changeType="up" accent="amber" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Visites a la web els últims 30 dies. Si baixa, pot ser que el màrqueting perdi empenta."><MetricCard icon="🌐" label="Sessions web (30d)" value={d.ga4Sessions || '-'} change={d.ga4Users ? `${d.ga4Users} usuaris` : 'GA4 pendent'} changeType="neutral" accent="cyan" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Quant de temps passen els visitants a la web. Més temps = més interès real en el que ofereixes."><MetricCard icon="⏱️" label="Temps mitjà web" value={d.ga4AvgSessionMin ? `${d.ga4AvgSessionMin} min` : '-'} change={d.ga4PageViews ? `${d.ga4PageViews} pàgines` : 'GA4 pendent'} changeType="neutral" accent="rose" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Percentatge que et queda net de cada reserva després de descomptar costos. Per sobre del 50% és excel·lent."><MetricCard icon="📊" label="Marge mitjà" value={`${d.avgMarginPct}%`} change={d.avgMarginPct >= 50 ? 'Excel·lent' : d.avgMarginPct >= 30 ? 'Acceptable' : d.avgMarginPct >= 15 ? 'Vigilar' : 'Crític'} changeType={d.avgMarginPct >= 30 ? 'up' : 'down'} accent={d.avgMarginPct >= 50 ? 'emerald' : d.avgMarginPct >= 30 ? 'amber' : 'rose'} /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Quants diners entraran o sortiran els pròxims 30 dies, segons reserves confirmades i costos previstos."><MetricCard icon="💰" label="Flux net previst" value={`${d.cashFlowNet30 >= 0 ? '+' : ''}${Math.round(d.cashFlowNet30)} €`} change="Pròxims 30 dies" changeType={d.cashFlowNet30 >= 0 ? 'up' : 'down'} accent={d.cashFlowNet30 >= 0 ? 'emerald' : 'rose'} /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Valor estimat de les vendes en curs, ponderat per la probabilitat de tancar cada una."><MetricCard icon="🔮" label="Pipeline ponderat" value={`${Math.round(d.pipelineWeighted30)} €`} change="Vendes probables" changeType="neutral" accent="amber" /></Tooltip></div>
        <div className="admin-stagger-item"><Tooltip text="Total que encara no has cobrat de reserves actives. Inclou bestretes i saldos pendents."><MetricCard icon="💶" label="Pendent de cobrar" value={`${Math.round(d.pendingPayments)} €`} change="Reserves actives" changeType={d.pendingPayments > 0 ? 'down' : 'up'} accent={d.pendingPayments > 5000 ? 'rose' : 'sky'} /></Tooltip></div>
      </div>

      <div className="admin-cr-chart-grid">
        <Card title="Trànsit web (30 dies)" subtitle="Sessions i usuaris" noPadding helpText="Mostra l'evolució recent del trànsit web per veure si hi ha moviment d'audiència i captació.">
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.ga4SessionsSeries, stroke: '#22d3ee', label: 'Sessions', value: d.ga4Sessions || '-' },
              { data: d.ga4UsersSeries, stroke: '#60a5fa', label: 'Usuaris', value: d.ga4Users || '-' },
            ]} />
            {!d.ga4Available && <p className="admin-cr-footnote">GA4 pendent o sense dades.</p>}
          </div>
        </Card>
        <Card title="Entrades i conversió" subtitle="Consultes i tancaments" noPadding helpText="Compara el volum d'entrades amb els tancaments per entendre el rendiment comercial del període.">
          <div className="admin-cr-card-pad">
            <MiniLineChart series={[
              { data: d.leadsSeries, stroke: '#34d399', label: 'Entrades', value: d.leadsThisMonth },
              { data: d.leadsWonSeries, stroke: '#fbbf24', label: 'Guanyats', value: d.wonLeads },
            ]} />
          </div>
        </Card>
        <Card title="Reserves i facturació" subtitle="Esdeveniments confirmats" noPadding helpText="Relaciona reserves confirmades i facturació per veure si la càrrega d'esdeveniments s'està convertint en ingressos.">
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
        <Card title="Ingressos mensuals" subtitle="Comparativa amb any anterior" noPadding helpText="Compara els ingressos mensuals d'aquest any amb l'anterior per detectar tendències i estacionalitat.">
          <div className="admin-cr-card-pad">
            <MonthlyBarChart data={d.monthlyRevenue} />
          </div>
        </Card>
        <Card title="Distribució per tipus" subtitle="Reserves confirmades/completades" noPadding helpText="Desglossa quins tipus d'esdeveniment tens més presents al negoci. Ajuda a veure especialització i dependència.">
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
          <Card title="Activitat" subtitle="Últimes accions" helpText="Recull els últims moviments registrats a l'admin per entendre què s'ha fet recentment.">
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
        <div className="admin-cr-mini-card admin-cr-mini-card--violet" data-help-title="Conversió" data-help-desc="Percentatge de leads que acaben convertint-se en client. És una lectura ràpida de qualitat comercial.">
          <p className="admin-cr-stat-label">Conversió</p>
          <p className="admin-cr-mini-value">{d.conversionRate}%</p>
          <p className="admin-cr-meta">{d.wonLeads}/{d.leadsCount} entrades</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-mini-card--amber" data-help-title="Testimonis" data-help-desc="Resumeix quants testimonis tens publicats o pendents d'aprovar. Serveix per cuidar reputació i prova social.">
          <p className="admin-cr-stat-label">Testimonis</p>
          <p className="admin-cr-mini-value">{d.testimonialsApproved + d.testimonialsPending}</p>
          <p className="admin-cr-meta">{d.testimonialsPending} pendents</p>
        </div>
        <div className="admin-cr-mini-card admin-cr-mini-card--rose" data-help-title="Valoració" data-help-desc="Mostra la puntuació mitjana actual del negoci com a lectura ràpida de reputació.">
          <p className="admin-cr-stat-label">Valoració</p>
          <p className="admin-cr-mini-value">⭐ {d.rating}</p>
          <p className="admin-cr-meta">Mitjana</p>
        </div>
        <Link href="/admin/inventory" className="admin-cr-mini-card admin-cr-mini-card--cyan" data-help-title="Inventari" data-help-desc="Resumeix l'estat ràpid del material: disponible, en ús, en manteniment o avariat.">
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

      <section className="admin-cr-audit" data-help-title="Auditoria recent" data-help-desc="Mostra les últimes accions administratives registrades per saber què s'ha canviat i quan.">
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











