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
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildLeadWorkspaceHref } from '@/lib/admin/leadWorkspaceHref';
import { fetchDashboardData } from './lib/dashboard-data';
import { formatCurrency, formatDate, formatWeekdayDateShort, getEventLabel } from '@/lib/constants';
import { loadDailyBrief } from '@/lib/services/dailyBriefService';
import { loadCapacityConflicts } from '@/lib/services/capacityConflictService';
import { loadTopLeadsToWork } from '@/lib/services/leadPriorityService';
import { loadPostEventPlaybook } from '@/lib/services/postEventPlaybookService';
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
  const [d, brief, capacity, topLeads, playbook] = await Promise.all([
    fetchDashboardData(),
    loadDailyBrief(),
    loadCapacityConflicts(),
    loadTopLeadsToWork(5),
    loadPostEventPlaybook(),
  ]);

  const actions = brief.actions.slice(0, 3);
  // Bolos fets amb el cercle encara obert (agraïment/ressenya/testimoni/referral):
  // el CAC més barat. Només els que tenen feina, els 3 més prioritaris.
  const closeLoop = playbook.items.filter((it) => it.priority !== 'DONE' && it.nextAction).slice(0, 3);
  const alerts = brief.alerts.filter((a) => a.level !== 'INFO').slice(0, 4);
  const conflicts = capacity.conflicts.slice(0, 2);

  const ne = d.nextEvent;
  const nePaymentBand = ne ? getPaymentBand(ne.depositPaid, ne.remainingPaid) : null;
  const nePaymentDot = nePaymentBand === 'paid'
    ? 'bg-[var(--o-success)]'
    : nePaymentBand === 'partial'
      ? 'bg-[var(--o-warning)]'
      : 'bg-[var(--o-danger)]';

  // Els 6 números que mereixen la mirada del dia (tot ja calculat pels cervells).
  const kpis = [
    { label: 'Leads oberts', value: String(brief.kpis.openLeads), href: '/admin/leads' },
    { label: 'Nous avui', value: String(brief.kpis.newLeadsToday), href: '/admin/leads' },
    { label: 'Per cobrar', value: formatCurrency(d.pendingPayments), href: '/admin/bookings?payment=overdue' },
    { label: 'Bolos 7 dies', value: String(brief.kpis.upcomingBookings7d), href: '/admin/calendario' },
    { label: 'Caixa 30d', value: `${d.cashFlowNet30 >= 0 ? '+' : '−'}${formatCurrency(Math.abs(d.cashFlowNet30))}`, href: '/admin/economia' },
    { label: 'Pipeline', value: formatCurrency(d.pipelineWeighted30), href: '/admin/leads' },
  ];

  const hasSignals = actions.length > 0 || alerts.length > 0 || conflicts.length > 0;

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
      <section className="ap-card p-5 border-l-[3px] border-l-[var(--gold)]">
        <p className="text-[var(--gold)] font-[family-name:var(--mono)] text-xs font-bold uppercase tracking-wider">La lectura d&apos;avui</p>
        <p className="mt-2 text-[var(--t)] font-[family-name:var(--display)] text-xl sm:text-2xl font-bold leading-snug max-w-[60ch]">{brief.summary}</p>
      </section>

      {/* ═══ FES AIXÒ AVUI (top 3 accions) ═══ */}
      <AdminSection
        title="Fes això avui"
        description="Les accions que la màquina prioritza ara mateix."
        actions={<Link href="/admin/tasks" className="ap-btn ap-btn--secondary ap-btn--xs">Totes les tasques</Link>}
      >
        {actions.length > 0 ? (
          <div className="grid gap-2.5">
            {actions.map((action, i) => (
              <Link key={`${action.href}-${i}`} href={action.href} className="ap-card ap-card-body flex items-center gap-4 no-underline">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--gold)] font-[family-name:var(--display)] text-base font-bold text-[var(--gold-bright)]">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold text-[var(--t)]">{action.label}</span>
                  <span className="block truncate text-sm text-[var(--t3)]">{action.detail}</span>
                </span>
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
              <Link key={it.bookingId} href="/admin/post-event" className={`ap-card p-3 flex items-center gap-3 no-underline ${PLAYBOOK_TONE[it.priority]}`}>
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

      {/* ═══ CAL QUE HO MIRIS (alertes + conflictes de capacitat) ═══ */}
      {(alerts.length > 0 || conflicts.length > 0) && (
        <AdminSection title="Cal que ho miris" description="Avisos i xocs de capacitat oberts.">
          <div className="grid gap-2.5 md:grid-cols-2">
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
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-2xl font-bold tabular-nums text-[var(--t)]">{formatCurrency(ne.total)}</p>
                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${nePaymentDot}`} />
                  <span className="text-xs text-[var(--t3)]">{getPaymentLabel(ne.depositPaid, ne.remainingPaid)}</span>
                </div>
              </div>
            </div>
          </Link>
        </AdminSection>
      )}

      {/* ═══ ELS NÚMEROS D'AVUI ═══ */}
      <AdminSection title="Els números d'avui" description="Sis xifres per prendre el pols. Toca'n una per anar-hi.">
        <AdminKpiRow>
          {kpis.map((k) => (
            <AdminKpi key={k.label} label={k.label} value={k.value} href={k.href} />
          ))}
        </AdminKpiRow>
      </AdminSection>

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
