import { MetricCard, Card, Button } from './components/ui';
import { MiniLineChart } from './components/Charts';
import Link from 'next/link';
import QuickActions from './components/QuickActions';
import LeadStatusQuickActions from './components/LeadStatusQuickActions';
import BookingStatusQuickActions from './components/BookingStatusQuickActions';
import { fetchDashboardData, timeAgo, formatEventDate } from './lib/dashboard-data';
import { formatDateTimeFull } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const d = await fetchDashboardData();

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
      {/* Header */}
      <div className="admin-cr-header">
        <div className="admin-cr-header-top">
          <div>
            <h1 className="admin-cr-title">Resum ràpid</h1>
            <p className="admin-cr-subtitle">Visió general del negoci</p>
          </div>
          <Link href="/admin/leads" className="admin-cr-mobile-only">
            <Button variant="primary" icon="+" label="Nou" />
          </Link>
        </div>
        <div className="admin-cr-desktop-actions">
          <Link href="/admin/analytics">
            <Button variant="secondary" icon="📈" label="Analítica" />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" />
          </Link>
        </div>
        <div className="admin-cr-quick-links">
          <Link href="/admin/inbox" className="admin-cr-quick-link">📥 Inbox (IMAP)</Link>
          <Link href="/admin/emails" className="admin-cr-quick-link">🤖 Correus automàtics</Link>
          <Link href="/admin/bookings" className="admin-cr-quick-link">📋 Reserves</Link>
          <Link href="/admin/economia" className="admin-cr-quick-link">💶 Economia</Link>
          <Link href="/admin/calendario" className="admin-cr-quick-link">📅 Calendari</Link>
        </div>
      </div>

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
          <div className="admin-cr-stat-box">
            <p className="admin-cr-stat-label">Progrés</p>
            <p className="admin-cr-stat-value">
              {d.checklistTodayDoneCount + d.checklistTodayPendingCount > 0
                ? `${Math.round((d.checklistTodayDoneCount / (d.checklistTodayDoneCount + d.checklistTodayPendingCount)) * 100)}%`
                : '0%'}
            </p>
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
                    <LeadStatusQuickActions
                      leadId={lead.id}
                      currentStatus={lead.status as 'NEW' | 'CONTACTED' | 'QUOTE_SENT' | 'NEGOTIATING' | 'WON' | 'LOST'}
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
                    <BookingStatusQuickActions
                      bookingId={booking.id}
                      currentStatus={booking.status as 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'COMPLETED' | 'CANCELLED'}
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
          <Link href="/admin/leads" className="admin-cr-radar-card admin-cr-radar-card--rose">
            <p className="admin-cr-stat-label">Temps sense resposta</p>
            <p className={`admin-cr-radar-value ${d.staleLeadsCount > 0 ? 'admin-cr-tone-rose' : 'admin-cr-tone-emerald'}`}>{d.staleLeadsCount}</p>
            <p className="admin-cr-small">Leads amb més de 24h sense avançar. Primer punt a netejar cada dia.</p>
          </Link>
          <Link href="/admin/leads" className="admin-cr-radar-card admin-cr-radar-card--amber">
            <p className="admin-cr-stat-label">Leads calents</p>
            <p className={`admin-cr-radar-value ${d.hotLeadsCount > 0 ? 'admin-cr-tone-amber' : 'admin-cr-tone-emerald'}`}>{d.hotLeadsCount}</p>
            <p className="admin-cr-small">Prioritat alta/urgent. Són els que poden tancar abans.</p>
          </Link>
          <Link href="/admin/presupuestos" className="admin-cr-radar-card admin-cr-radar-card--cyan">
            <p className="admin-cr-stat-label">Pressupostos en joc</p>
            <p className={`admin-cr-radar-value ${d.quotesInFlightCount > 0 ? 'admin-cr-tone-cyan' : 'admin-cr-tone-emerald'}`}>{d.quotesInFlightCount}</p>
            <p className="admin-cr-small">Enviats o negociant. Seguiment curt per convertir-los en reserva.</p>
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
            {d.healthItems.map((item) => (
              <div key={item.label} className="admin-cr-health-item">
                <p className="admin-cr-health-label">{item.label}</p>
                <p className={`admin-cr-health-value ${item.status === 'OK' ? 'admin-cr-tone-emerald' : item.status === 'ERROR' ? 'admin-cr-tone-rose' : 'admin-cr-tone-amber'}`}>
                  {item.status}
                </p>
              </div>
            ))}
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
              d.upcomingTasks.map((task) => (
                <Link key={task.id} href={`/admin/leads/${task.lead.id}`} className="admin-cr-list-row admin-cr-list-row--link">
                  <span className="admin-cr-truncate">{task.title}</span>
                  <span className="admin-cr-meta">{task.lead.name}</span>
                </Link>
              ))
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
        <MetricCard icon="📋" label="Reserves confirmades" value={d.bookingsConfirmed.toString()} change={d.bookingsThisMonth > 0 ? `+${d.bookingsThisMonth} aquest mes` : '-'} changeType="up" accent="emerald" />
        <MetricCard icon="📨" label="Consultes del mes" value={d.leadsThisMonth.toString()} change={`${d.leadsCount} totals`} changeType="up" accent="sky" />
        <MetricCard icon="🏆" label="Clients" value={d.customersCount.toString()} change={`${d.conversionRate}% de conversió`} changeType="up" accent="purple" />
        <MetricCard icon="⭐" label="Valoració mitjana" value={d.rating} change={`${d.testimonialsApproved} ressenyes`} changeType="up" accent="amber" />
        <MetricCard icon="🌐" label="Sessions web (30d)" value={d.ga4Sessions || '-'} change={d.ga4Users ? `${d.ga4Users} usuaris` : 'GA4 pendent'} changeType="neutral" accent="cyan" />
        <MetricCard icon="⏱️" label="Temps mitjà web" value={d.ga4AvgSessionMin ? `${d.ga4AvgSessionMin} min` : '-'} change={d.ga4PageViews ? `${d.ga4PageViews} pàgines` : 'GA4 pendent'} changeType="neutral" accent="rose" />
        <MetricCard icon="📊" label="Marge mitjà" value={`${d.avgMarginPct}%`} change={d.avgMarginPct >= 50 ? 'Excel·lent' : d.avgMarginPct >= 30 ? 'Acceptable' : d.avgMarginPct >= 15 ? 'Vigilar' : 'Crític'} changeType={d.avgMarginPct >= 30 ? 'up' : 'down'} accent={d.avgMarginPct >= 50 ? 'emerald' : d.avgMarginPct >= 30 ? 'amber' : 'rose'} />
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
                    <svg className="admin-cr-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  <svg className="admin-cr-chevron admin-cr-mobile-only-inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
