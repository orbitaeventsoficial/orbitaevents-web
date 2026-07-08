import { AdminPage } from '@/app/admin/components/AdminPage';
import Link from 'next/link';
import { loadPayoutSummary } from '@/lib/services/crewScheduleService';
import RepartimentPanel from '@/app/admin/bookings/[id]/RepartimentPanel';
import { formatCurrency } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Repartiment de pasta | Òrbita Admin' };

function monthBounds(month: string): { from: Date; to: Date; label: string; prev: string; next: string } {
  const [y, m] = month.split('-').map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const to = new Date(Date.UTC(y, m, 0, 23, 59, 59));
  const prevD = new Date(Date.UTC(y, m - 2, 1));
  const nextD = new Date(Date.UTC(y, m, 1));
  const fmt = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const MONTHS = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
  return { from, to, label: `${MONTHS[m - 1]} ${y}`, prev: fmt(prevD), next: fmt(nextD) };
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function RepartimentPage({ searchParams }: { searchParams: { month?: string } }) {
  const month = searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month) ? searchParams.month : currentMonth();
  const { from, to, label, prev, next } = monthBounds(month);
  const payout = await loadPayoutSummary(from, to);
  // Noms per al drill-down (des de la vista per persona; el motor només porta ids).
  const names: Record<string, string> = {};
  for (const p of payout.people) if (!p.isOwner) names[p.personKey] = p.personName;

  return (
    <AdminPage
      eyebrow="Operacions"
      title="Repartiment de pasta"
      subtitle={`${label} · ${formatCurrency(payout.totals.revenue)} facturat`}
      back={{ href: '/admin/cuadrant', label: 'Cuadrant' }}
    >
      {/* Selector de mes */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <Link href={`/admin/cuadrant/repartiment?month=${prev}`} className="ap-card px-3 py-1 text-sm adm-row-hover">←</Link>
        <span className="min-w-[140px] text-center text-sm font-semibold capitalize">{label}</span>
        <Link href={`/admin/cuadrant/repartiment?month=${next}`} className="ap-card px-3 py-1 text-sm adm-row-hover">→</Link>
      </div>

      {/* Totals */}
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="ap-card p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Facturat (client)</p>
          <p className="text-xl font-bold">{formatCurrency(payout.totals.revenue)}</p>
        </div>
        <div className="rounded-xl border admin-tone-border-warning admin-tone-bg-warning p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Saldo tercers</p>
          <p className="text-xl font-bold admin-tone-text-warning">{formatCurrency(payout.totals.collaboratorCost)}</p>
          <p className="text-[11px] opacity-50">
            {formatCurrency(payout.totals.collaboratorPayments)} pagaments
            {payout.totals.collaboratorSettlements > 0 ? ` · ${formatCurrency(payout.totals.collaboratorSettlements)} a Òrbita` : ''}
          </p>
        </div>
        <div className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Brut Òrbita</p>
          <p className="text-xl font-bold admin-tone-text-success">{formatCurrency(payout.totals.ownerGross)}</p>
          <p className="text-[11px] opacity-50">{formatCurrency(payout.totals.internalCost)} cost intern</p>
        </div>
        <div className="rounded-xl border admin-tone-border-success admin-tone-bg-success p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Benefici net</p>
          <p className="text-xl font-bold admin-tone-text-success">{formatCurrency(payout.totals.ownerNet)}</p>
        </div>
      </div>

      {/* Per persona */}
      {payout.people.every((p) => p.amount === 0 && p.assignments === 0) ? (
        <p className="ap-card p-6 text-center text-sm opacity-50">
          Cap moviment aquest mes.
        </p>
      ) : (
        <div className="space-y-3">
          {payout.people.map((person) => (
            <section
              key={person.personKey}
              className={`ap-card p-3 ${
                person.isOwner ? 'admin-tone-border-success admin-tone-bg-success' : 'border-[var(--line)] bg-[var(--panel)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <span className={`inline-block h-2 w-2 rounded-full ${person.isOwner ? 'admin-tone-bg-success' : 'admin-tone-bg-warning'}`} />
                  {person.isOwner ? (
                    person.personName
                  ) : (
                    <Link href={`/admin/collaborators/${person.personKey}`} className="hover:underline">
                      {person.personName}
                    </Link>
                  )}
                  <span className="text-xs font-normal opacity-50">
                    {person.isOwner ? 'net' : 'cobra'} · {person.assignments} {person.assignments === 1 ? 'feina' : 'feines'}
                  </span>
                </h3>
                <span className={`text-lg font-bold tabular-nums ${person.isOwner ? 'admin-tone-text-success' : 'admin-tone-text-warning'}`}>
                  {formatCurrency(person.amount)}
                </span>
              </div>
              {person.events.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {person.events.map((e, i) => (
                    <li key={i} className="flex items-center justify-between text-xs opacity-60">
                      <span className="truncate">{e.parentRef}{e.dateKey && <span className="opacity-50"> · {e.dateKey.slice(8)}/{e.dateKey.slice(5, 7)}</span>}</span>
                      <span className="tabular-nums">{formatCurrency(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Drill-down per bolo (#1358): qui cobra què dins de cada event, amb el mateix
          panell que la fitxa de reserva (font única `computeBoloRepartiment` → solidari). */}
      {payout.bolos.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="ap-h2">Detall per bolo</h2>
          {payout.bolos.map((bolo) => (
            <details key={bolo.parentId} className="ap-card overflow-hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm adm-row-hover [&::-webkit-details-marker]:hidden">
                <span className="font-semibold">
                  {bolo.parentRef}
                  {bolo.dateKey && <span className="opacity-50"> · {bolo.dateKey.slice(8)}/{bolo.dateKey.slice(5, 7)}</span>}
                </span>
                <span className="tabular-nums opacity-70">{formatCurrency(bolo.repartiment.totals.clientTotal)}</span>
              </summary>
              <div className="border-t border-[var(--line)] p-3">
                <RepartimentPanel repartiment={bolo.repartiment} names={names} />
              </div>
            </details>
          ))}
        </div>
      )}
    </AdminPage>
  );
}
