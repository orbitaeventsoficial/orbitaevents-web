// ─────────────────────────────────────────────────────────
// AVUI — la pantalla d'aterratge calmada de l'admin (Onada 0)
// «La màquina et parla»: en comptes d'obrir 30 panells, el propietari
// aterra en UNA superfície amb la lectura del dia, les 3 accions que
// importen ara, les alertes que criden i 6 números clau. Tot ve dels
// cervells ja existents (dailyBrief, dashboard-data, capacityConflict);
// aquesta pàgina NO calcula res de domini, només projecta. El tauler
// exhaustiu de sempre viu íntegre a /admin/control.
// ─────────────────────────────────────────────────────────
import Link from 'next/link';
import { AdminPage, AdminSection, AdminKpiRow, AdminKpi } from './components/AdminPage';
import { Button } from './lib/dashboard-widgets';
import { buildPostEventNextActionHref } from './lib/post-event-actions';
import { projectAdminTodayActions, projectContractWorkflowTodayAction, projectDossierDraftTodayAction, projectNextEventEconomicTodayAction, projectPostEventTodayAction, projectProposalBookingConversionTodayAction, projectProposalDraftTodayAction } from './lib/today-actions';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { fetchDashboardData } from './lib/dashboard-data';
import { formatCurrency, formatDate, formatWeekdayDateShort, getEventLabel } from '@/lib/constants';
import { loadDailyBrief } from '@/lib/services/dailyBriefService';
import { loadCapacityConflicts } from '@/lib/services/capacityConflictService';
import { loadDayCollisions } from '@/lib/services/dayCollisionService';
import { loadContractWorkflowSuggestions } from '@/lib/services/contractWorkflowSuggestionService';
import { loadDossierDraftSuggestions } from '@/lib/services/dossierDraftSuggestionService';
import { loadTopLeadsToWork } from '@/lib/services/leadPriorityService';
import { loadNextBestActions } from '@/lib/services/nextBestActionService';
import { loadPostEventPlaybook } from '@/lib/services/postEventPlaybookService';
import { loadProposalBookingConversionSuggestions } from '@/lib/services/proposalBookingConversionSuggestionService';
import { loadProposalDraftSuggestions } from '@/lib/services/proposalDraftSuggestionService';
import { getPaymentBand, getPaymentLabel } from '@/lib/payment-status';

export const dynamic = 'force-dynamic';

const ALERT_TONE: Record<'CRITICAL' | 'WARNING' | 'INFO', { border: string; dot: string }> = {
  CRITICAL: { border: 'admin-tone-border-danger', dot: 'bg-[var(--o-danger)]' },
  WARNING: { border: 'admin-tone-border-warning', dot: 'bg-[var(--o-warning)]' },
  INFO: { border: 'admin-tone-border-info', dot: 'bg-[var(--o-info)]' },
};

// Banda de probabilitat del score comercial → to del badge (verd = tancable, ambre
// = a treballar, neutre = fred). El número i la banda vénen del cervell `scoreLead`.
const LEAD_BAND_BADGE: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  HIGH: 'ap-badge ap-badge--success',
  MEDIUM: 'ap-badge ap-badge--warning',
  LOW: 'ap-badge',
};

// Prioritat del playbook post-event → to de la vora (vermell = ja se't passa,
// ambre = a fer, neutre). El nombre i la propera acció vénen del cervell del playbook.
const PLAYBOOK_TONE: Record<'ALTA' | 'MITJANA' | 'BAIXA' | 'DONE', string> = {
  ALTA: 'admin-tone-border-danger',
  MITJANA: 'admin-tone-border-warning',
  BAIXA: '',
  DONE: '',
};

export default async function AdminTodayPage() {
  const now = new Date();
  const capacityPromise = loadCapacityConflicts(now);
  const [d, brief, capacity, topLeads, playbook, dayCollisions, dossierDraftSuggestions, contractWorkflowSuggestions, proposalDraftSuggestions, proposalBookingSuggestions, nba] = await Promise.all([
    fetchDashboardData(),
    loadDailyBrief(now),
    capacityPromise,
    loadTopLeadsToWork(5),
    loadPostEventPlaybook(),
    loadDayCollisions(),
    loadDossierDraftSuggestions(3, now),
    loadContractWorkflowSuggestions(3, now),
    loadProposalDraftSuggestions(3, now),
    loadProposalBookingConversionSuggestions(3, now),
    capacityPromise.then((report) => loadNextBestActions(now, { capacity: report })),
  ]);

  // Bolos fets amb el cercle encara obert (agraïment/ressenya/testimoni/referral):
  // el CAC més barat. Només els que tenen feina, els 3 més prioritaris.
  const closeLoopItems = playbook.items
    .filter((it) => it.priority !== 'DONE' && it.nextAction)
    .slice(0, 3)
    .map((it) => ({ ...it, actionHref: buildPostEventNextActionHref(it) }));
  const postEventTodayActions = closeLoopItems.map((it) => projectPostEventTodayAction({
    bookingId: it.bookingId,
    href: it.actionHref,
    clientName: it.clientName,
    nextActionLabel: it.nextAction?.label ?? 'Post-event',
    daysSinceEvent: it.daysSinceEvent,
    priority: it.priority,
  }));
  const alerts = brief.alerts.filter((a) => a.level !== 'INFO').slice(0, 4);
  const conflicts = capacity.conflicts.slice(0, 2);
  // Guàrdia de dissabtes: dies amb 2+ bolos (no pots ser a dos llocs). Els 3 primers.
  const collisions = dayCollisions.slice(0, 3);

  const ne = d.nextEvent;
  const economicTodayActions = d.economicRiskBookings
    .map((booking) => projectNextEventEconomicTodayAction({
      bookingId: booking.id,
      href: buildBookingHref(booking.id),
      clientName: booking.clientName,
      daysUntil: booking.daysUntil,
      marginPct: booking.marginPct,
      netMargin: booking.netMargin,
      outstandingAmount: booking.outstandingAmount,
    }))
    .filter((action): action is NonNullable<typeof action> => Boolean(action));
  const supplementalTodayActions = [
    ...economicTodayActions,
    ...proposalBookingSuggestions.map(projectProposalBookingConversionTodayAction),
    ...contractWorkflowSuggestions.map(projectContractWorkflowTodayAction),
    ...proposalDraftSuggestions.map(projectProposalDraftTodayAction),
    ...dossierDraftSuggestions.map(projectDossierDraftTodayAction),
    ...postEventTodayActions,
  ];
  const actions = projectAdminTodayActions(nba.actions, brief.actions, 3, supplementalTodayActions);
  const surfacedPostEventIds = new Set(
    actions.filter((action) => action.source === 'postEvent').map((action) => action.sourceId)
  );
  const closeLoop = closeLoopItems.filter((it) => !surfacedPostEventIds.has(it.bookingId));
  const nePaymentCoverage = ne
    ? { cashAmount: Math.max(0, ne.total - ne.outstandingAmount), total: ne.total }
    : undefined;
  const nePaymentBand = ne ? getPaymentBand(ne.depositPaid, ne.remainingPaid, nePaymentCoverage) : null;
  const nePaymentDot = nePaymentBand === 'paid'
    ? 'bg-[var(--o-success)]'
    : nePaymentBand === 'partial'
      ? 'bg-[var(--o-warning)]'
      : 'bg-[var(--o-danger)]';
  const neMarginClass = ne && ne.marginPct >= 45
    ? 'admin-tone-text-success'
    : ne && ne.marginPct >= 25
      ? 'admin-tone-text-warning'
      : 'admin-tone-text-danger';
  const neOutstandingClass = ne && ne.outstandingAmount <= 0
    ? 'admin-tone-text-success'
    : ne && ne.daysUntil <= 3
      ? 'admin-tone-text-danger'
      : 'admin-tone-text-warning';

  // Els 6 números que mereixen la mirada del dia (tot ja calculat pels cervells).
  const kpis = [
    { label: 'Leads oberts', value: String(brief.kpis.openLeads), href: '/admin/leads' },
    { label: 'Nous avui', value: String(brief.kpis.newLeadsToday), href: '/admin/leads' },
    { label: 'Per cobrar', value: formatCurrency(d.pendingPayments), href: '/admin/bookings?payment=overdue' },
    { label: 'Bolos 7 dies', value: String(brief.kpis.upcomingBookings7d), href: '/admin/calendario' },
    { label: 'Caixa 30d', value: `${d.cashFlowNet30 >= 0 ? '+' : '−'}${formatCurrency(Math.abs(d.cashFlowNet30))}`, href: '/admin/economia' },
    { label: 'Pipeline', value: formatCurrency(d.pipelineWeighted30), href: '/admin/leads' },
  ];

  const hasSignals = actions.length > 0 || alerts.length > 0 || conflicts.length > 0 || collisions.length > 0;

  return (
    <AdminPage
      eyebrow={brief.greeting}
      title="Avui"
      subtitle={formatWeekdayDateShort(brief.date)}
      actions={
        <>
          <Link href="/admin/control" className="hidden sm:inline-flex">
            <Button variant="secondary" label="Control complet" helpText="Obre el tauler exhaustiu amb totes les mètriques, gràfiques i panells." />
          </Link>
          <Link href="/admin/leads">
            <Button variant="primary" icon="+" label="Nou lead" />
          </Link>
        </>
      }
    >
      {/* ═══ LA LECTURA DE LA MÀQUINA ═══ */}
      <section className="ap-card p-4 border-l-[3px] border-l-[var(--gold)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.3fr)] xl:items-center">
          <div className="min-w-0">
            <p className="text-[var(--gold)] font-[family-name:var(--mono)] text-xs font-bold uppercase tracking-wider">La lectura d&apos;avui</p>
            <p className="mt-1.5 text-[var(--t)] font-[family-name:var(--display)] text-lg sm:text-xl font-bold leading-snug">{brief.summary}</p>
          </div>
          <div className="min-w-0">
            <p className="mb-2 text-[var(--t3)] font-[family-name:var(--mono)] text-xs font-bold uppercase tracking-wider">Els números d&apos;avui</p>
            <AdminKpiRow>
              {kpis.map((k) => (
                <AdminKpi key={k.label} label={k.label} value={k.value} href={k.href} />
              ))}
            </AdminKpiRow>
          </div>
        </div>
      </section>

      {/* ═══ GRAELLA D'ACCIÓ — 2 columnes al desktop perquè càpiga d'un cop d'ull ═══ */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
      {/* ═══ FES AIXÒ AVUI (top 3 accions) ═══ */}
      <AdminSection
        title="Fes això ara"
        description="Ranking transversal de leads, clients, tasques, seguiments, capacitat i pipeline."
        actions={<Link href="/admin/control" className="ap-btn ap-btn--secondary ap-btn--xs">Control complet</Link>}
      >
        {actions.length > 0 ? (
          <div className="grid gap-2.5">
            {actions.map((action, i) => (
              <Link key={action.id} href={action.href} className="ap-card ap-card-body flex items-center gap-4 no-underline">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--gold)] font-[family-name:var(--display)] text-base font-bold text-[var(--gold-bright)]">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-[var(--t)]">{action.label}</span>
                  <span className="block truncate text-sm text-[var(--t3)]">{action.detail}</span>
                </span>
                {action.badge && (
                  <span className={`${action.badgeClass} hidden shrink-0 sm:inline-flex`}>{action.badge}</span>
                )}
                <span className="shrink-0 text-sm font-bold text-[var(--t3)]">Obrir →</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="ap-card ap-card-body flex items-center gap-3 admin-tone-border-success">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--o-success)]" />
            <span className="text-sm font-semibold text-[var(--t)]">Tot al dia. Cap acció comercial urgent ara mateix.</span>
          </div>
        )}
      </AdminSection>

      {/* ═══ LEADS A TREBALLAR AVUI (prioritzats pel score comercial) ═══ */}
      <AdminSection
        title="Leads a treballar avui"
        description="Ordenats pel score comercial: comença per dalt."
        actions={<Link href="/admin/leads" className="ap-btn ap-btn--secondary ap-btn--xs">Tots els leads</Link>}
      >
        {topLeads.length > 0 ? (
          <div className="grid gap-2">
            {topLeads.map((lead) => (
              <Link key={lead.id} href={buildLeadWorkspaceHref(lead.id)} className="ap-card p-3 flex items-center gap-3 no-underline">
                <span className={`${LEAD_BAND_BADGE[lead.band]} shrink-0 font-mono tabular-nums`} title={`Score comercial ${lead.score}/100 · ${lead.probability}% probabilitat`}>{lead.score}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--t)]">{lead.name}</span>
                  <span className="block truncate text-xs text-[var(--t3)]">{lead.topReason ?? lead.topRisk ?? 'Sense senyals'}{lead.eventDate ? ` · ${formatDate(lead.eventDate)}` : ''}</span>
                </span>
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--t3)]">{lead.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--t3)]">Cap lead obert ara mateix. Bona feina.</p>
        )}
      </AdminSection>

      {/* ═══ TANCA EL CERCLE (post-event: el CAC més barat) ═══ */}
      {closeLoop.length > 0 && (
        <AdminSection
          title="Tanca el cercle"
          description="Bolos fets amb feina de post-event pendent: agraïment, ressenya, testimoni o referral."
          actions={<Link href="/admin/post-event" className="ap-btn ap-btn--secondary ap-btn--xs">Post-esdeveniment</Link>}
        >
          <div className="grid gap-2">
            {closeLoop.map((it) => (
              <Link key={it.bookingId} href={it.actionHref} className={`ap-card p-3 flex items-center gap-3 no-underline ${PLAYBOOK_TONE[it.priority]}`}>
                <span className="ap-badge shrink-0 font-mono tabular-nums" title={`${it.completedCount}/${it.totalCount} accions fetes`}>{it.completedCount}/{it.totalCount}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--t)]">{it.clientName}</span>
                  <span className="block truncate text-xs text-[var(--t3)]">Ara toca: {it.nextAction?.label ?? '—'} · fa {it.daysSinceEvent} {it.daysSinceEvent === 1 ? 'dia' : 'dies'}</span>
                </span>
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-[var(--t3)]">{it.priority}</span>
              </Link>
            ))}
          </div>
        </AdminSection>
      )}

      {/* ═══ CAL QUE HO MIRIS (alertes + xocs de capacitat + guàrdia de dissabtes) ═══ */}
      {(alerts.length > 0 || conflicts.length > 0 || collisions.length > 0) && (
        <AdminSection title="Cal que ho miris" description="Avisos, xocs de capacitat i dies amb més d'un bolo.">
          <div className="grid gap-2.5 md:grid-cols-2">
            {collisions.map((c) => (
              <Link key={`collision-${c.date}`} href="/admin/calendario" className={`ap-card p-3 no-underline ${c.isWeekend ? 'admin-tone-border-danger' : 'admin-tone-border-warning'}`}>
                <div className="flex items-start gap-2.5">
                  <span className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${c.isWeekend ? 'bg-[var(--o-danger)]' : 'bg-[var(--o-warning)]'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--t)]">🗓 {c.count} bolos el mateix dia{c.isWeekend ? ' (cap de setmana)' : ''}</p>
                    <p className="mt-0.5 text-xs text-[var(--t2)]">{formatDate(c.date)} · {c.bookings.map((b) => `${b.eventStartTime ? b.eventStartTime + ' ' : ''}${b.clientName}`).join(' · ')}</p>
                  </div>
                </div>
              </Link>
            ))}
            {alerts.map((alert, i) => {
              const tone = ALERT_TONE[alert.level];
              return (
                <Link key={`${alert.href}-${i}`} href={alert.href} className={`ap-card p-3 no-underline ${tone.border}`}>
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--t)]">{alert.icon} {alert.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--t2)]">{alert.detail}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {conflicts.map((c, i) => (
              <Link key={`conflict-${i}`} href="/admin/cuadrant" className="ap-card p-3 no-underline admin-tone-border-danger">
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--o-danger)]" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--t)]">⚠ Xoc de capacitat · {c.itemName}</p>
                    <p className="mt-0.5 text-xs text-[var(--t2)]">{formatDate(c.date)} · falten {c.deficit} · {c.bookings.map((b) => b.clientName).join(', ')}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </AdminSection>
      )}
      </div>

      {/* ═══ EL FOCUS: PRÒXIM BOLO ═══ */}
      {ne && (
        <AdminSection title="El focus" description="El pròxim esdeveniment a l'agenda.">
          <Link href={buildBookingHref(ne.id)} className={`ap-card p-4 block no-underline ${ne.daysUntil <= 1 ? 'admin-tone-border-warning' : ne.daysUntil <= 3 ? 'admin-tone-border-info' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                  {ne.daysUntil === 0 ? 'Bolo avui' : ne.daysUntil === 1 ? 'Bolo demà' : `Bolo en ${ne.daysUntil} dies`}
                </span>
                <h2 className="mt-1 truncate text-xl font-bold text-[var(--t)]">{ne.clientName}</h2>
                <p className="mt-1 text-sm text-[var(--t3)]">
                  {[formatDate(ne.eventDate), ne.eventStartTime, ne.eventType ? getEventLabel(ne.eventType) : null, ne.eventVenue || ne.eventLocation].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <span className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--raised)] px-2.5 py-2">
                    <span className="block font-mono uppercase tracking-wider text-[var(--t3)]">Marge</span>
                    <strong className={neMarginClass}>{ne.marginPct}% · {formatCurrency(ne.netMargin)}</strong>
                  </span>
                  <span className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--raised)] px-2.5 py-2">
                    <span className="block font-mono uppercase tracking-wider text-[var(--t3)]">Pendent</span>
                    <strong className={neOutstandingClass}>{formatCurrency(ne.outstandingAmount)}</strong>
                  </span>
                  <span className="rounded-[var(--o-r-sm)] border border-[var(--line)] bg-[var(--raised)] px-2.5 py-2">
                    <span className="block font-mono uppercase tracking-wider text-[var(--t3)]">Checklist</span>
                    <strong className="text-[var(--t)]">{ne.checklistDone}/{ne.checklistTotal}</strong>
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-2xl font-bold tabular-nums text-[var(--t)]">{formatCurrency(ne.total)}</p>
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${nePaymentDot}`} />
                  <span className="text-xs text-[var(--t3)]">{getPaymentLabel(ne.depositPaid, ne.remainingPaid, nePaymentCoverage)}</span>
                </div>
              </div>
            </div>
          </Link>
        </AdminSection>
      )}

      {/* ═══ PEU CALM: la porta al detall ═══ */}
      {!hasSignals && (
        <p className="text-center text-sm text-[var(--t3)]">Res urgent avui. {' '}
          <Link href="/admin/control" className="text-[var(--gold)] underline">Obre el control complet</Link> si vols revisar el detall.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-xs text-[var(--t3)]">
        <Link href="/admin/control" className="underline hover:text-[var(--gold)]">Control complet</Link>
        <Link href="/admin/economia" className="underline hover:text-[var(--gold)]">Economia</Link>
        <Link href="/admin/calendario" className="underline hover:text-[var(--gold)]">Calendari</Link>
        <Link href="/admin/manual" className="underline hover:text-[var(--gold)]">Manual</Link>
      </div>
    </AdminPage>
  );
}
