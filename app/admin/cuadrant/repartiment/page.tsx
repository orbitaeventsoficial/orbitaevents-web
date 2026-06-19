import { AdminPage } from '@/app/admin/components/AdminPage';
import Link from 'next/link';
import { loadPayoutSummary } from '@/lib/services/crewScheduleService';
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

  return (
    <AdminPage
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
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="ap-card p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Facturat (client)</p>
          <p className="text-xl font-bold">{formatCurrency(payout.totals.revenue)}</p>
        </div>
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">A col·laboradors</p>
          <p className="text-xl font-bold text-amber-300">{formatCurrency(payout.totals.collaboratorCost)}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-50">La teva part</p>
          <p className="text-xl font-bold text-emerald-300">{formatCurrency(payout.totals.ownerNet)}</p>
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
              className={`rounded-xl border p-3 ${
                person.isOwner ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-[var(--line)] bg-[var(--panel)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold">
                  <span className={`inline-block h-2 w-2 rounded-full ${person.isOwner ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {person.isOwner ? (
                    person.personName
                  ) : (
                    <Link href={`/admin/collaborators/${person.personKey}`} className="hover:underline">
                      {person.personName}
                    </Link>
                  )}
                  <span className="text-xs font-normal opacity-50">
                    {person.isOwner ? 'es queda' : 'cobra'} · {person.assignments} {person.assignments === 1 ? 'feina' : 'feines'}
                  </span>
                </h3>
                <span className={`text-lg font-bold tabular-nums ${person.isOwner ? 'text-emerald-300' : 'text-amber-300'}`}>
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
    </AdminPage>
  );
}
