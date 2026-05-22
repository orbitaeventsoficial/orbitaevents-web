'use client';

/**
 * Sub-components reutilitzables per a la pàgina d'Economia.
 * Extrets d'EconomiaClient.tsx per reduir la mida del component principal.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PaymentToggleButton from './PaymentToggleButton';
import PaymentReminderActions from './PaymentReminderActions';
import { formatDateSimple } from '@/lib/constants';
import ExportCsvButton from '../components/ExportCsvButton';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_ECONOMY_HELP, helpAttrs } from '@/app/admin/components/adminHelpContent';
import { type PaymentRow, money, paymentStateBadge } from './economia-types';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

export function KpiCard({ label, value, sub, color, borderColor, bgColor, delay = 0 }: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  borderColor: string;
  bgColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-xl border ${borderColor} ${bgColor} p-4 shadow-md admin-card-glass`}
      {...helpAttrs(ADMIN_ECONOMY_HELP.kpiCard(label, sub))}
    >
      <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${color}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${color} opacity-80`}>{sub}</p>}
    </motion.div>
  );
}

export function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden" {...helpAttrs(ADMIN_ECONOMY_HELP.progressBar)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

export function HealthScore({ overdueTotal, outstandingTotal, marginPct }: { overdueTotal: number; outstandingTotal: number; marginPct: number }) {
  const overdueRatio = outstandingTotal > 0 ? overdueTotal / outstandingTotal : 0;
  const marginScore = Math.min(marginPct * 100 / 50, 1);
  const paymentScore = 1 - overdueRatio;
  const score = Math.round((marginScore * 0.6 + paymentScore * 0.4) * 100);

  const color = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
  const ringColor = score >= 75 ? 'stroke-emerald-400' : score >= 50 ? 'stroke-amber-400' : 'stroke-rose-400';
  const label = score >= 75 ? 'Excel·lent' : score >= 50 ? 'Acceptable' : 'Atenció';

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-white/10 p-6 shadow-lg admin-card-glass"
      {...helpAttrs(ADMIN_ECONOMY_HELP.healthScore)}
    >
      <p className="text-xs font-medium uppercase tracking-wider mb-3">Salut financera</p>
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none"
            strokeWidth="8" strokeLinecap="round"
            className={ringColor}
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-black ${color}`}>{score}</span>
        </div>
      </div>
      <p className={`mt-2 text-sm font-bold ${color}`} {...helpAttrs(ADMIN_ECONOMY_HELP.healthLabel(label))}>{label}</p>
    </motion.div>
  );
}

export function PaymentTimelineBar({ row }: { row: PaymentRow }) {
  const rawDepositPct = row.total > 0 ? (row.depositAmount / row.total) * 100 : 30;
  const depositPct = Math.max(0, Math.min(100, rawDepositPct));
  const remainingPct = 100 - depositPct;

  const depositColor = row.depositPaid
    ? 'bg-emerald-500'
    : row.overdueDeposit
      ? 'bg-rose-500'
      : row.dueSoonDeposit
        ? 'bg-amber-500'
        : 'bg-white/15';

  const remainingColor = row.remainingPaid
    ? 'bg-emerald-500'
    : row.overdueRemaining
      ? 'bg-rose-500'
      : row.dueSoonRemaining
        ? 'bg-amber-500'
        : 'bg-white/15';

  const depositLabel = `Diposit: ${money(row.depositAmount)} ${row.depositPaid ? '(pagat)' : '(pendent)'}`;
  const remainingLabel = `Resta: ${money(row.remainingAmount)} ${row.remainingPaid ? '(pagat)' : '(pendent)'}`;

  return (
    <div className="space-y-1" {...helpAttrs(ADMIN_ECONOMY_HELP.paymentTimeline)}>
      <div className="flex items-center gap-0.5 h-4 rounded-full overflow-hidden bg-white/5 w-full">
        <div
          className={`h-full ${depositColor} transition-all duration-300 relative group`}
          style={{ width: `${depositPct}%` }}
          title={depositLabel}
          role="meter"
          aria-valuenow={depositPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={depositLabel}
          {...helpAttrs(ADMIN_ECONOMY_HELP.paymentTimelineSegment(depositLabel))}
        >
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
            {depositPct > 15 ? `${Math.round(depositPct)}%` : ''}
          </span>
        </div>
        <div
          className={`h-full ${remainingColor} transition-all duration-300 relative group`}
          style={{ width: `${remainingPct}%` }}
          title={remainingLabel}
          role="meter"
          aria-valuenow={remainingPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={remainingLabel}
          {...helpAttrs(ADMIN_ECONOMY_HELP.paymentTimelineSegment(remainingLabel))}
        >
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
            {remainingPct > 15 ? `${Math.round(remainingPct)}%` : ''}
          </span>
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-white/40">
        <span className="flex items-center gap-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${depositColor}`} />
          Diposit {row.depositPaid ? '✓' : ''}
        </span>
        <span className="flex items-center gap-1">
          Resta {row.remainingPaid ? '✓' : ''}
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${remainingColor}`} />
        </span>
      </div>
    </div>
  );
}

type PaymentFilter = 'tots' | 'pendents' | 'vencits' | 'proxims' | 'pagats';

export function CobramentFiltersSection({
  allRows,
  overdueDepositCount,
  overdueRemainingCount,
  dueSoonDepositCount,
  dueSoonRemainingCount,
}: {
  allRows: PaymentRow[];
  overdueDepositCount: number;
  overdueRemainingCount: number;
  dueSoonDepositCount: number;
  dueSoonRemainingCount: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PaymentFilter>('pendents');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const filteredRows = useMemo(() => {
    let rows = allRows;

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.reference.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case 'pendents':
        rows = rows.filter((r) => !r.depositPaid || !r.remainingPaid);
        break;
      case 'vencits':
        rows = rows.filter((r) => r.overdueDeposit || r.overdueRemaining);
        break;
      case 'proxims':
        rows = rows.filter((r) => r.dueSoonDeposit || r.dueSoonRemaining);
        break;
      case 'pagats':
        rows = rows.filter((r) => r.depositPaid && r.remainingPaid);
        break;
    }

    return rows;
  }, [allRows, search, filter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredRows.map((r) => r.id)));
    }
  };

  const [bulkError, setBulkError] = useState<string | null>(null);

  const bulkMarkPaid = async (field: 'depositPaid' | 'remainingPaid') => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/bookings/bulk-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: Array.from(selected),
          field,
          value: true,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        setBulkError(payload?.error || 'Error actualitzant pagaments');
        return;
      }
      setSelected(new Set());
      router.refresh();
    } catch {
      setBulkError('Error de connexió');
    } finally {
      setBulkBusy(false);
    }
  };

  const csvData = filteredRows.map((r) => ({
    Referencia: r.reference,
    Client: r.clientName,
    Telefon: r.clientPhone,
    'Data event': r.eventDate.split('T')[0],
    Total: r.total,
    Diposit: r.depositAmount,
    'Diposit pagat': r.depositPaid ? 'Sí' : 'No',
    Resta: r.remainingAmount,
    'Resta pagat': r.remainingPaid ? 'Sí' : 'No',
    Estat: r.status,
  }));

  const filterChips: { id: PaymentFilter; label: string; count?: number }[] = [
    { id: 'tots', label: 'Tots', count: allRows.length },
    { id: 'pendents', label: 'Pendents', count: allRows.filter((r) => !r.depositPaid || !r.remainingPaid).length },
    { id: 'vencits', label: 'Vencits', count: overdueDepositCount + overdueRemainingCount },
    { id: 'proxims', label: 'Pròxims 7d', count: dueSoonDepositCount + dueSoonRemainingCount },
    { id: 'pagats', label: 'Pagats', count: allRows.filter((r) => r.depositPaid && r.remainingPaid).length },
  ];

  return (
    <>
      <section className="rounded-xl border border-white/10 p-3 space-y-3" {...helpAttrs(ADMIN_ECONOMY_HELP.filters)}>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Cerca referència o client..."
            aria-label="Cercar per referència o client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none"
            {...helpAttrs(ADMIN_ECONOMY_HELP.search)}
          />
          <div {...helpAttrs(ADMIN_ECONOMY_HELP.exportCsv)}>
            <ExportCsvButton
              data={csvData}
              filename="cobraments"
              columns={[
                { header: 'Referència', accessor: (r) => String(r.Referencia || '') },
                { header: 'Client', accessor: (r) => String(r.Client || '') },
                { header: 'Telèfon', accessor: (r) => String(r.Telefon || '') },
                { header: 'Data event', accessor: (r) => String(r['Data event'] || '') },
                { header: 'Total', accessor: (r) => Number(r.Total || 0) },
                { header: 'Dipòsit', accessor: (r) => Number(r.Diposit || 0) },
                { header: 'Dipòsit pagat', accessor: (r) => String(r['Diposit pagat'] || '') },
                { header: 'Resta', accessor: (r) => Number(r.Resta || 0) },
                { header: 'Resta pagat', accessor: (r) => String(r['Resta pagat'] || '') },
                { header: 'Estat', accessor: (r) => String(r.Estat || '') },
              ]}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filter === chip.id
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              {...helpAttrs(ADMIN_ECONOMY_HELP.filterChip(chip.label))}
            >
              {chip.label}
              {chip.count !== undefined && (
                <span className="ml-1.5 text-[10px] opacity-70">({chip.count})</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {selected.size > 0 && (
        <section className="rounded-xl border p-3 flex flex-wrap items-center gap-3" {...helpAttrs(ADMIN_ECONOMY_HELP.bulkActions)}>
          <span className="text-sm font-medium">{selected.size} seleccionat{selected.size !== 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={() => bulkMarkPaid('depositPaid')}
            disabled={bulkBusy}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            {...helpAttrs(ADMIN_ECONOMY_HELP.bulkDeposit)}
          >
            {bulkBusy ? '...' : 'Marcar dipòsit pagat'}
          </button>
          <button
            type="button"
            onClick={() => bulkMarkPaid('remainingPaid')}
            disabled={bulkBusy}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            {...helpAttrs(ADMIN_ECONOMY_HELP.bulkRemaining)}
          >
            {bulkBusy ? '...' : 'Marcar resta pagada'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-white/40 hover:text-white/60"
            {...helpAttrs(ADMIN_ECONOMY_HELP.clearSelection)}
          >
            Netejar selecció
          </button>
          {bulkError && <p className="text-xs">{bulkError}</p>}
        </section>
      )}

      <section className="rounded-2xl border p-3 shadow-lg overflow-x-auto" {...helpAttrs(ADMIN_ECONOMY_HELP.table)}>
        <table className="w-full text-sm" aria-label="Cobraments pendents">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/50">
              <th scope="col" className="px-2 py-2 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === filteredRows.length && filteredRows.length > 0}
                  onChange={toggleAll}
                  className="accent-amber-500"
                />
              </th>
              <th scope="col" className="px-2 py-2">Referència</th>
              <th scope="col" className="px-2 py-2">Client</th>
              <th scope="col" className="px-2 py-2 hidden sm:table-cell">Data</th>
              <th scope="col" className="px-2 py-2 hidden md:table-cell">Progrés</th>
              <th scope="col" className="px-2 py-2 text-right">Dipòsit</th>
              <th scope="col" className="px-2 py-2 text-right">Resta</th>
              <th scope="col" className="px-2 py-2 text-right hidden sm:table-cell">Total</th>
              <th scope="col" className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2 py-8 text-center text-white/40">
                  Cap resultat amb els filtres actuals.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="accent-amber-500"
                  />
                </td>
                <td className="px-2 py-2 font-mono text-xs font-semibold">{row.reference}</td>
                <td className="px-2 py-2 truncate max-w-[120px]">{row.clientName}</td>
                <td className="px-2 py-2 hidden sm:table-cell text-xs">{formatDateSimple(row.eventDate)}</td>
                <td className="px-2 py-2 hidden md:table-cell min-w-[100px]">
                  <PaymentTimelineBar row={row} />
                </td>
                <td className="px-2 py-2 text-right">
                  <span className={`text-xs font-medium ${row.depositPaid ? 'text-emerald-400' : row.overdueDeposit ? 'text-rose-400' : 'text-white/60'}`}>
                    {money(row.depositAmount)}
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  <span className={`text-xs font-medium ${row.remainingPaid ? 'text-emerald-400' : row.overdueRemaining ? 'text-rose-400' : 'text-white/60'}`}>
                    {money(row.remainingAmount)}
                  </span>
                </td>
                <td className="px-2 py-2 text-right hidden sm:table-cell font-semibold text-xs">{money(row.total)}</td>
                <td className="px-2 py-2">
                  <Link
                    href={buildBookingHref(row.id)}
                    className="text-xs text-white/40 hover:text-white/70"
                    {...helpAttrs(ADMIN_ECONOMY_HELP.rowLink(row.reference))}
                  >
                    &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
