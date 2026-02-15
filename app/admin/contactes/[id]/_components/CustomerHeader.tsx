'use client';

import Link from 'next/link';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

type TabKey = 'summary' | 'proposals' | 'bookings' | 'margin' | 'comms' | 'tasks';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'summary', label: 'Resum' },
  { key: 'proposals', label: 'Pressupostos' },
  { key: 'bookings', label: 'Reserva / Dates' },
  { key: 'margin', label: 'Extres / Marge' },
  { key: 'comms', label: 'Comunicacions' },
  { key: 'tasks', label: 'Tasques / Notes' },
];

export default function CustomerHeader({
  data,
  tab,
  setTab,
}: {
  data: CustomerHubDTO;
  tab: TabKey;
  setTab: (tab: TabKey) => void;
}) {
  const id = data.customer.id;
  const statusTone =
    data.customer.status === 'CONFIRMED'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : data.customer.status === 'NEGOTIATION'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        : data.customer.status === 'POSTEVENT'
          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
          : data.customer.status === 'LOST'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : 'bg-slate-500/20 text-slate-300 border-slate-500/40';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-zinc-900/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href="/admin/clientes" className="text-xs text-slate-400 hover:text-slate-200">
                ← Clients
              </Link>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusTone}`}>
                {data.customer.status}
              </span>
            </div>
            <h1 className="mt-1 truncate text-xl font-semibold text-slate-100">{data.customer.name}</h1>
            <p className="text-sm text-slate-400">
              {data.customer.email || 'Sense email'} {data.customer.phone ? `· ${data.customer.phone}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/presupuestos?customerId=${id}`}
              className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600"
            >
              Nou pressupost
            </Link>
            <Link
              href={`/admin/bookings/new?customerId=${id}`}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
            >
              Nova reserva
            </Link>
            <Link
              href={`/admin/tasks?customerId=${id}`}
              className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
            >
              Nova tasca
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-600/80 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Enviar missatge
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <KpiChip label="Pròxim event" value={formatDate(data.kpis.nextEventDate)} />
          <KpiChip label="Total pressupostat" value={money(data.kpis.totalQuoted)} />
          <KpiChip label="Total cobrat" value={money(data.kpis.totalPaid)} />
          <KpiChip label="Marge estimat" value={money(data.kpis.marginEstimated)} />
          <KpiChip label="Últim contacte" value={formatDate(data.kpis.lastContactAt)} />
        </div>

        <div className="hidden md:flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === item.key
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <select
            value={tab}
            onChange={(event) => setTab(event.target.value as TabKey)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          >
            {TABS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function money(value?: number) {
  if (typeof value !== 'number') return '—';
  return `${value.toLocaleString('ca-ES', { maximumFractionDigits: 0 })}€`;
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

