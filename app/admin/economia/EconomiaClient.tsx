'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPage } from '../components/AdminPage';
import PaymentToggleButton from './PaymentToggleButton';
import PaymentReminderActions from './PaymentReminderActions';
import { formatDateSimple, formatDateFull, formatCurrency, DEFAULT_LOCALE } from '@/lib/constants';
import ExportCsvButton from '../components/ExportCsvButton';
import ProfitabilityConfigEditor from './ProfitabilityConfigEditor';
import ProfitabilityConfigHistory from './ProfitabilityConfigHistory';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';
import PackPricingModelEditor from './PackPricingModelEditor';
import PackPricingModelHistory from './PackPricingModelHistory';
import { fetchWithCsrf } from '@/lib/csrf';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'resum' | 'cobraments' | 'rendibilitat' | 'tresoreria' | 'previsions' | 'config';

interface PaymentRow {
  id: string;
  reference: string;
  status: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  total: number;
  depositAmount: number;
  depositPaid: boolean;
  depositPaidAt: string | null;
  remainingAmount: number;
  remainingPaid: boolean;
  remainingPaidAt: string | null;
  depositDueAt: string;
  remainingDueAt: string;
  overdueDeposit: boolean;
  overdueRemaining: boolean;
  dueSoonDeposit: boolean;
  dueSoonRemaining: boolean;
  paymentFlowState: string;
}

interface ProfitabilityRow {
  id: string;
  reference: string;
  clientName: string;
  eventDate: string;
  source: string;
  netMargin: number;
  marginPct: number;
  travelCost: number;
}

interface BySourceRow {
  source: string;
  bookings: number;
  revenue: number;
  netMargin: number;
  avgMarginPct: number;
}

interface HistoryEntry {
  id: string;
  createdAt: string;
  role: string;
  before: ProfitabilityConfig;
  after: ProfitabilityConfig;
}

interface PackPricingRow {
  id: string;
  name: string;
  slug: string;
  service: string;
  price: number;
  recommendedPrice: number;
  directCost: number;
  profit: number;
  marginPct: number;
  extraHourPrice: number;
  recommendedExtraHourPrice: number;
  extraHourCostEstimated: number;
  extraHourProfit: number;
  extraHourMarginPct: number;
  divergencePct: number;
  extraHourDivergencePct: number;
  hasAlert: boolean;
}

interface CashFlowMonth {
  month: string;
  income: number;
  costs: number;
  netFlow: number;
  cumulative: number;
}

interface ForecastMonth {
  month: string;
  historicalAvg: number;
  pipeline: number;
  combined: number;
}

interface CacChannelRow {
  channel: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  estimatedCac: number;
  realCac: number | null;
}

interface VehicleConfig {
  fuelPricePerLiter: number;
  consumptionL100: number;
  maintenanceCostPerKm: number;
  effectiveCostPerKm: number;
  updatedAt: string | null;
}

interface EconomiaClientProps {
  outstandingTotal: number;
  overdueTotal: number;
  dueSoonTotal: number;
  monthCollected: number;
  atRiskRows: PaymentRow[];
  upcomingDueRows: PaymentRow[];
  allPaymentRows?: PaymentRow[];
  hasReport: boolean;
  reportError: boolean;
  realized: { revenue: number; netMargin: number; avgMarginPct: number; bookings: number };
  forecast: { revenue: number; netMargin: number; avgMarginPct: number; bookings: number };
  topProfitability: ProfitabilityRow[];
  riskProfitability: ProfitabilityRow[];
  bySource: BySourceRow[];
  config: ProfitabilityConfig;
  packPricingConfig: PackPricingModelConfig;
  packPricingRows: PackPricingRow[];
  packPricingSummary: {
    healthy: number;
    warning: number;
    critical: number;
  };
  packPricingHistoryEntries: Array<{
    id: string;
    createdAt: string;
    role: string;
    before: PackPricingModelConfig;
    after: PackPricingModelConfig;
  }>;
  historyEntries: HistoryEntry[];
  inventoryValue: number;
  inventoryCount: number;
  // Tresoreria (Bloc 2)
  cashFlow?: CashFlowMonth[];
  // Previsions (Bloc 3)
  forecast_pipeline?: ForecastMonth[];
  // Vehicle (Bloc 1)
  vehicleConfig?: VehicleConfig;
  // CAC (Bloc 10)
  cacByChannel?: CacChannelRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const money = formatCurrency;

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function marginColor(pctValue: number): string {
  const p = pctValue * 100;
  if (p >= 50) return 'text-emerald-400';
  if (p >= 30) return 'text-amber-300';
  if (p >= 15) return 'text-orange-400';
  return 'text-rose-400';
}

function marginBg(pctValue: number): string {
  const p = pctValue * 100;
  if (p >= 50) return 'bg-emerald-500';
  if (p >= 30) return 'bg-amber-500';
  if (p >= 15) return 'bg-orange-500';
  return 'bg-rose-500';
}

function paymentStateBadge(paid: boolean) {
  return paid
    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200'
    : 'border-rose-500/40 bg-rose-500/15 text-rose-200';
}

function packMarginBadge(marginPct: number, targetMarginPct: number) {
  if (marginPct >= targetMarginPct) {
    return {
      label: 'Sa',
      cls: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
      dot: 'bg-emerald-400',
    };
  }
  if (marginPct >= (targetMarginPct - 0.08)) {
    return {
      label: 'Vigilar',
      cls: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
      dot: 'bg-amber-400',
    };
  }
  return {
    label: 'Crític',
    cls: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
    dot: 'bg-rose-400',
  };
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string; mobileLabel: string }[] = [
  { id: 'resum', label: 'Resum general', icon: '📊', mobileLabel: 'Resum' },
  { id: 'cobraments', label: 'Cobraments', icon: '💶', mobileLabel: 'Cobrar' },
  { id: 'rendibilitat', label: 'Rendibilitat', icon: '📈', mobileLabel: 'Marge' },
  { id: 'tresoreria', label: 'Tresoreria', icon: '💰', mobileLabel: 'Caixa' },
  { id: 'previsions', label: 'Previsions', icon: '🔮', mobileLabel: 'Previsió' },
  { id: 'config', label: 'Configuració', icon: '⚙️', mobileLabel: 'Config' },
];

// ─── Animated KPI Card ───────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, borderColor, bgColor, delay = 0 }: {
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
    >
      <p className="text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${color}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${color} opacity-80`}>{sub}</p>}
    </motion.div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

// ─── Health Score ────────────────────────────────────────────────────────────

function HealthScore({ overdueTotal, outstandingTotal, marginPct }: { overdueTotal: number; outstandingTotal: number; marginPct: number }) {
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
      <p className={`mt-2 text-sm font-bold ${color}`}>{label}</p>
    </motion.div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Payment Timeline Bar ─────────────────────────────────────────────────────

function PaymentTimelineBar({ row }: { row: PaymentRow }) {
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
    <div className="space-y-1">
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

// ─── Cobrement Filters Section ──────────────────────────────────────────────

type PaymentFilter = 'tots' | 'pendents' | 'vencits' | 'proxims' | 'pagats';

function CobramentFiltersSection({
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

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) => r.reference.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q)
      );
    }

    // Filter by status
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
      {/* Filter bar */}
      <section className="rounded-xl border border-white/10 p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Cerca referència o client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none"
          />
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
            >
              {chip.label}
              {chip.count !== undefined && (
                <span className="ml-1.5 text-[10px] opacity-70">({chip.count})</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <section className="rounded-xl border p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{selected.size} seleccionat{selected.size !== 1 ? 's' : ''}</span>
          <button
            type="button"
            onClick={() => bulkMarkPaid('depositPaid')}
            disabled={bulkBusy}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {bulkBusy ? '...' : 'Marcar dipòsit pagat'}
          </button>
          <button
            type="button"
            onClick={() => bulkMarkPaid('remainingPaid')}
            disabled={bulkBusy}
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {bulkBusy ? '...' : 'Marcar resta pagada'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-xs text-white/40 hover:text-white/60"
          >
            Netejar selecció
          </button>
          {bulkError && <p className="text-xs">{bulkError}</p>}
        </section>
      )}

      {/* Table with timeline */}
      <section className="rounded-2xl border p-3 shadow-lg overflow-x-auto">
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
                  <Link href={`/admin/bookings/${row.id}`} className="text-xs text-white/40 hover:text-white/70">
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

export default function EconomiaClient(props: EconomiaClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('resum');

  const totalAlerts = useMemo(() =>
    props.atRiskRows.length + props.riskProfitability.length,
    [props.atRiskRows, props.riskProfitability]
  );
  const overdueDepositCount = useMemo(
    () => props.atRiskRows.filter((row) => row.overdueDeposit).length,
    [props.atRiskRows]
  );
  const overdueRemainingCount = useMemo(
    () => props.atRiskRows.filter((row) => row.overdueRemaining).length,
    [props.atRiskRows]
  );
  const dueSoonDepositCount = useMemo(
    () => props.upcomingDueRows.filter((row) => row.dueSoonDeposit).length,
    [props.upcomingDueRows]
  );
  const dueSoonRemainingCount = useMemo(
    () => props.upcomingDueRows.filter((row) => row.dueSoonRemaining).length,
    [props.upcomingDueRows]
  );

  return (
    <AdminPage
      title="Economia"
      subtitle="Control de caixa, cobraments i marge en una sola pantalla."
      actions={
        <div className="flex flex-wrap gap-2">
          <ExportCsvButton
            filename="rendibilitat"
            data={[...props.topProfitability, ...props.riskProfitability] as unknown as Record<string, unknown>[]}
            columns={[
              { header: 'Referència', accessor: (r) => String(r.reference || '') },
              { header: 'Client', accessor: (r) => String(r.clientName || '') },
              { header: 'Data', accessor: (r) => formatDateSimple(r.eventDate as string) },
              { header: 'Origen', accessor: (r) => String(r.source || '') },
              { header: 'Marge net (€)', accessor: (r) => Number(r.netMargin || 0) },
              { header: 'Marge (%)', accessor: (r) => Number(r.marginPct || 0) },
            ]}
          />
          <Link
            href="/admin/sales-ops"
            className="ap-btn ap-btn--primary"
          >
            Operativa de vendes
          </Link>
        </div>
      }
    >

      {/* ═══════════ TAB NAVIGATION ═══════════ */}
      <nav className="admin-economia-tabs flex gap-1 rounded-xl border border-white/10 p-1 shadow-md admin-card-glass">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'cobraments' && props.atRiskRows.length > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-economia-tab relative flex-1 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'admin-economia-tab--active shadow-md border'
                  : 'admin-economia-tab--idle border border-transparent'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white shadow-lg">
                  {props.atRiskRows.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ═══════════ TAB CONTENT ═══════════ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >

          {/* ═══════════ RESUM ═══════════ */}
          {activeTab === 'resum' && (
            <>
              {/* Health + KPIs */}
              <div className="grid gap-3 lg:grid-cols-6">
                <div className="lg:col-span-1">
                  <HealthScore
                    overdueTotal={props.overdueTotal}
                    outstandingTotal={props.outstandingTotal}
                    marginPct={props.realized.avgMarginPct}
                  />
                </div>
                <div className="lg:col-span-5 grid gap-2 grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Total pendent de cobrar"
                    value={money(props.outstandingTotal)}
                    color="text-white/90"
                    borderColor="border-white/10"
                    bgColor="bg-white/[0.03]"
                    delay={0.05}
                  />
                  <KpiCard
                    label="Pendent fora de termini"
                    value={money(props.overdueTotal)}
                    sub={props.atRiskRows.length > 0 ? `${props.atRiskRows.length} cobraments amb retard` : undefined}
                    color="text-rose-300"
                    borderColor="border-rose-500/30"
                    bgColor="bg-rose-500/10"
                    delay={0.1}
                  />
                  <KpiCard
                    label="Cobrat aquest mes"
                    value={money(props.monthCollected)}
                    sub="Ingressos ja cobrats"
                    color="text-emerald-300"
                    borderColor="border-emerald-500/30"
                    bgColor="bg-emerald-500/10"
                    delay={0.15}
                  />
                  <KpiCard
                    label="Vencen en 7 dies"
                    value={money(props.dueSoonTotal)}
                    sub={props.upcomingDueRows.length > 0 ? `${props.upcomingDueRows.length} cobraments pròxims` : undefined}
                    color="text-amber-300"
                    borderColor="border-amber-500/30"
                    bgColor="bg-amber-500/10"
                    delay={0.2}
                  />
                </div>
              </div>

              <div className="rounded-xl border px-3 py-2 text-xs">
                <strong className="">Com llegir aquest resum:</strong> pendent = import total per cobrar, fora de termini = cobrament que ja havia d&apos;estar pagat, a 7 dies = cobrament proper.
              </div>

              {/* Profitability KPIs */}
              {props.hasReport && (
                <div className="grid gap-2 grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Ingressos realitzats"
                    value={money(props.realized.revenue)}
                    sub={`${props.realized.bookings} completats`}
                    color="text-white/90"
                    borderColor="border-white/10"
                    bgColor="bg-white/[0.03]"
                    delay={0.05}
                  />
                  <KpiCard
                    label="Marge net realitzat"
                    value={money(props.realized.netMargin)}
                    sub={`Mitjà ${pct(props.realized.avgMarginPct)}`}
                    color="text-emerald-300"
                    borderColor="border-emerald-400/30"
                    bgColor="bg-emerald-950/30"
                    delay={0.1}
                  />
                  <KpiCard
                    label="Ingressos previstos"
                    value={money(props.forecast.revenue)}
                    sub={`${props.forecast.bookings} en pipeline`}
                    color="text-white/90"
                    borderColor="border-white/10"
                    bgColor="bg-white/[0.03]"
                    delay={0.15}
                  />
                  <KpiCard
                    label="Marge previst"
                    value={money(props.forecast.netMargin)}
                    sub={`Mitjà ${pct(props.forecast.avgMarginPct)}`}
                    color="text-amber-300"
                    borderColor="border-amber-400/30"
                    bgColor="bg-amber-950/30"
                    delay={0.2}
                  />
                </div>
              )}

              {/* Collection progress bar */}
              {props.outstandingTotal > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border border-white/10 p-4 shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Progrés de cobrament</p>
                    <p className="text-xs">
                      Cobrat ara: {money(props.monthCollected)} · Total a gestionar: {money(props.monthCollected + props.outstandingTotal)}
                    </p>
                  </div>
                  <ProgressBar
                    value={props.monthCollected}
                    max={props.monthCollected + props.outstandingTotal}
                    color="bg-gradient-to-r from-emerald-500 to-emerald-400"
                  />
                </motion.section>
              )}

              {/* Inventory asset value */}
              {props.inventoryCount > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-xl border p-4 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider">Valor d&apos;inventari</p>
                      <p className="mt-1 text-2xl font-black">{money(props.inventoryValue)}</p>
                      <p className="text-xs mt-0.5">{props.inventoryCount} elements actius</p>
                    </div>
                    <Link
                      href="/admin/inventory"
                      className="rounded-xl border px-4 py-2 text-xs font-bold transition-colors"
                    >
                      Veure inventari
                    </Link>
                  </div>
                </motion.section>
              )}

              {/* Alert cards */}
              {totalAlerts > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {props.atRiskRows.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                      className="rounded-2xl border p-5 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg">
                          ⚠️
                        </span>
                        <div className="flex-1">
                          <h2 className="text-base font-bold">Cobraments vençuts</h2>
                          <p className="text-sm mt-0.5">
                            {props.atRiskRows.length} pagament{props.atRiskRows.length !== 1 ? 's' : ''} pendent{props.atRiskRows.length !== 1 ? 's' : ''} &middot; {money(props.overdueTotal)}
                          </p>
                          <button
                            onClick={() => setActiveTab('cobraments')}
                            className="mt-3 rounded-xl px-4 py-2 text-xs font-bold border transition-colors"
                          >
                            Obrir detall de cobraments
                          </button>
                        </div>
                      </div>
                    </motion.section>
                  )}
                  {props.riskProfitability.length > 0 && (
                    <motion.section
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="rounded-2xl border p-5 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg">
                          📉
                        </span>
                        <div className="flex-1">
                          <h2 className="text-base font-bold">Esdeveniments amb marge baix</h2>
                          <p className="text-sm mt-0.5">
                            {props.riskProfitability.length} esdeveniment{props.riskProfitability.length !== 1 ? 's' : ''} per sota del 15% de marge
                          </p>
                          <button
                            onClick={() => setActiveTab('rendibilitat')}
                            className="mt-3 rounded-xl px-4 py-2 text-xs font-bold border transition-colors"
                          >
                            Veure rendibilitat
                          </button>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </div>
              )}

              {/* Top 5 quick view */}
              {props.hasReport && props.topProfitability.length > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-2xl border border-white/10 p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold">Top 5 &mdash; Millors marges</h2>
                    <button
                      onClick={() => setActiveTab('rendibilitat')}
                      className="text-xs font-semibold transition-colors"
                    >
                      Veure tots &rarr;
                    </button>
                  </div>
                  <div className="space-y-2">
                    {props.topProfitability.slice(0, 5).map((row, i) => (
                      <Link
                        key={row.id}
                        href={`/admin/bookings/${row.id}`}
                        className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors group"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate transition-colors">
                            {row.reference} &middot; {row.clientName}
                          </p>
                          <p className="text-xs">
                            {formatDateSimple(row.eventDate)} &middot; {row.source}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${marginColor(row.marginPct)}`}>
                            {money(row.netMargin)}
                          </p>
                          <p className={`text-xs ${marginColor(row.marginPct)}`}>
                            {pct(row.marginPct)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </>
          )}

          {/* ═══════════ COBRAMENTS ═══════════ */}
          {activeTab === 'cobraments' && (
            <>
              <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Total pendent de cobrar" value={money(props.outstandingTotal)} color="text-white/90" borderColor="border-white/10" bgColor="bg-white/[0.03]" />
                <KpiCard label="Pendent fora de termini" value={money(props.overdueTotal)} color="text-rose-300" borderColor="border-rose-500/30" bgColor="bg-rose-500/10" delay={0.05} />
                <KpiCard label="Vencen en 7 dies" value={money(props.dueSoonTotal)} color="text-amber-300" borderColor="border-amber-500/30" bgColor="bg-amber-500/10" delay={0.1} />
                <KpiCard label="Cobrat aquest mes" value={money(props.monthCollected)} color="text-emerald-300" borderColor="border-emerald-500/30" bgColor="bg-emerald-500/10" delay={0.15} />
              </div>

              {/* Filtres + Accions massives */}
              <CobramentFiltersSection
                allRows={props.allPaymentRows || [...props.atRiskRows, ...props.upcomingDueRows]}
                overdueDepositCount={overdueDepositCount}
                overdueRemainingCount={overdueRemainingCount}
                dueSoonDepositCount={dueSoonDepositCount}
                dueSoonRemainingCount={dueSoonRemainingCount}
              />

              {/* Vençuts */}
              <section className="rounded-2xl border p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">⚠️</span>
                    <h2 className="text-lg font-bold">Fora de termini</h2>
                    {props.atRiskRows.length > 0 && (
                      <span className="rounded-full px-2 py-0.5 text-xs font-bold">
                        {props.atRiskRows.length}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/bookings" className="text-xs transition-colors">
                    Totes les reserves &rarr;
                  </Link>
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  {props.atRiskRows.length === 0 ? (
                    <div className="rounded-xl border p-6 text-center">
                      <p className="font-semibold">Tot al dia!</p>
                      <p className="text-sm mt-1">
                        No hi ha cap cobrament pendent amb data de venciment passada.
                      </p>
                    </div>
                  ) : (
                    props.atRiskRows.map((row) => (
                      <motion.details
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group rounded-xl border border-white/10 p-3 transition-colors"
                      >
                        <summary className="list-none cursor-pointer">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold">{row.reference} · {row.clientName}</p>
                              <p className="mt-0.5 text-xs">
                                {formatDateFull(row.eventDate)}
                                &nbsp;·&nbsp;
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase">{row.status}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentStateBadge(row.depositPaid)}`}>
                                Bestreta {row.depositPaid ? 'pagada' : 'pendent'}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentStateBadge(row.remainingPaid)}`}>
                                Saldo {row.remainingPaid ? 'pagat' : 'pendent'}
                              </span>
                              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold">
                                Veure detall
                              </span>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 border-t border-white/10 pt-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-[11px]">Codi reserva: {row.reference}</p>
                            <Link href={`/admin/bookings/${row.id}`} className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:bg-white/10 transition-colors">
                              Obrir reserva
                            </Link>
                          </div>
                          <div className="mb-3 grid gap-2 sm:grid-cols-2">
                            <div className={`rounded-xl border p-3 ${row.depositPaid ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${row.depositPaid ? 'text-emerald-300' : 'text-rose-300'}`}>Bestreta</p>
                                <p className={`text-sm font-bold ${row.depositPaid ? 'text-emerald-200' : 'text-rose-200'}`}>{money(row.depositAmount)}</p>
                              </div>
                              <p className="text-[11px] mb-2">
                                Venciment: {formatDateSimple(row.depositDueAt)}
                              </p>
                              <PaymentToggleButton bookingId={row.id} field="depositPaid" currentValue={row.depositPaid} />
                            </div>
                            <div className={`rounded-xl border p-3 ${row.remainingPaid ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${row.remainingPaid ? 'text-emerald-300' : 'text-rose-300'}`}>Saldo restant</p>
                                <p className={`text-sm font-bold ${row.remainingPaid ? 'text-emerald-200' : 'text-rose-200'}`}>{money(row.remainingAmount)}</p>
                              </div>
                              <p className="text-[11px] mb-2">
                                Venciment: {formatDateSimple(row.remainingDueAt)}
                              </p>
                              <PaymentToggleButton bookingId={row.id} field="remainingPaid" currentValue={row.remainingPaid} />
                            </div>
                          </div>
                          <p className="mb-2 text-xs">
                            Seguiment: <span className="font-semibold">{row.paymentFlowState}</span>
                          </p>
                          <PaymentReminderActions
                            bookingId={row.id}
                            phone={row.clientPhone}
                            message={`Hola ${row.clientName}, et recordem el cobrament pendent del teu esdeveniment ${row.reference}. Gràcies.`}
                          />
                        </div>
                      </motion.details>
                    ))
                  )}
                </div>
              </section>

              {/* Pròxims */}
              <section className="rounded-2xl border p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">⏰</span>
                  <h2 className="text-lg font-bold">Venciments en 7 dies</h2>
                  {props.upcomingDueRows.length > 0 && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold">
                      {props.upcomingDueRows.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {props.upcomingDueRows.length === 0 ? (
                    <div className="rounded-xl border border-white/10 p-4 text-center">
                      <p className="text-sm font-semibold">Cap venciment en 7 dies.</p>
                      <p className="mt-1 text-xs">
                        No tens cap cobrament pendent que caduqui entre avui i els pròxims 7 dies.
                      </p>
                    </div>
                  ) : (
                    props.upcomingDueRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{row.reference} &middot; {row.clientName}</p>
                          <p className="text-xs">{formatDateSimple(row.eventDate)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {row.dueSoonDeposit && <p className="text-xs">Bestreta: {money(row.depositAmount)}</p>}
                          {row.dueSoonRemaining && <p className="text-xs">Saldo: {money(row.remainingAmount)}</p>}
                        </div>
                        <Link href={`/admin/bookings/${row.id}`} className="shrink-0 text-xs">
                          &rarr;
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {/* ═══════════ RENDIBILITAT ═══════════ */}
          {activeTab === 'rendibilitat' && (
            <>
              {!props.hasReport && (
                <section className="rounded-2xl border p-6 shadow-lg">
                  <h2 className="text-lg font-bold">Sense dades disponibles</h2>
                  <p className="mt-1 text-sm">
                    {props.reportError
                      ? 'Hi ha hagut un error calculant la rendibilitat. Revisa la Configuració o torna-ho a provar.'
                      : 'Encara no hi ha prou esdeveniments completats per generar l’informe.'}
                  </p>
                </section>
              )}

              {props.hasReport && (
                <>
                  <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                    <KpiCard label="Ingressos realitzats" value={money(props.realized.revenue)} sub={`${props.realized.bookings} completats`} color="text-white/90" borderColor="border-white/10" bgColor="bg-white/[0.03]" />
                    <KpiCard label="Marge net realitzat" value={money(props.realized.netMargin)} sub={`Mitjà ${pct(props.realized.avgMarginPct)}`} color="text-emerald-300" borderColor="border-emerald-400/30" bgColor="bg-emerald-950/30" delay={0.05} />
                    <KpiCard label="Previsió d'ingressos" value={money(props.forecast.revenue)} sub={`${props.forecast.bookings} en pipeline`} color="text-white/90" borderColor="border-white/10" bgColor="bg-white/[0.03]" delay={0.1} />
                    <KpiCard label="Previsió de marge" value={money(props.forecast.netMargin)} sub={`Mitjà ${pct(props.forecast.avgMarginPct)}`} color="text-amber-300" borderColor="border-amber-400/30" bgColor="bg-amber-950/30" delay={0.15} />
                  </div>

                  {/* Top + Risc */}
                  <div className="grid gap-5 xl:grid-cols-2">
                    <section className="rounded-2xl border border-white/10 p-5 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">🏆</span>
                        <h2 className="text-base font-bold">Top esdeveniments per marge</h2>
                      </div>
                      <div className="space-y-2">
                        {props.topProfitability.length === 0 ? (
                          <p className="text-sm text-center p-4">Encara no hi ha esdeveniments completats.</p>
                        ) : (
                          props.topProfitability.slice(0, 12).map((row, i) => (
                            <Link
                              key={row.id}
                              href={`/admin/bookings/${row.id}`}
                              className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors group"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black">
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate transition-colors">
                                  {row.reference} &middot; {row.clientName}
                                </p>
                                <p className="text-xs">{formatDateSimple(row.eventDate)} &middot; {row.source}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-sm font-bold ${marginColor(row.marginPct)}`}>{money(row.netMargin)}</p>
                                <div className="flex items-center gap-1.5 justify-end mt-1">
                                  <div className="h-1.5 w-12 rounded-full bg-white/5 overflow-hidden">
                                    <div className={`h-full rounded-full ${marginBg(row.marginPct)}`} style={{ width: `${Math.min(row.marginPct * 100, 100)}%` }} />
                                  </div>
                                  <span className={`text-[11px] font-semibold ${marginColor(row.marginPct)}`}>{pct(row.marginPct)}</span>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 p-5 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">⚠️</span>
                        <h2 className="text-base font-bold">Esdeveniments en risc</h2>
                        {props.riskProfitability.length > 0 && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-bold">
                            {props.riskProfitability.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {props.riskProfitability.length === 0 ? (
                          <div className="rounded-xl border p-6 text-center">
                            <p className="font-semibold">Sense alertes!</p>
                            <p className="text-sm mt-1">Tots els marges són saludables.</p>
                          </div>
                        ) : (
                          props.riskProfitability.slice(0, 12).map((row) => (
                            <Link
                              key={row.id}
                              href={`/admin/bookings/${row.id}`}
                              className="flex items-center gap-3 rounded-xl border p-3 transition-colors group"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs">📉</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate transition-colors">
                                  {row.reference} &middot; {row.clientName}
                                </p>
                                <p className="text-xs">{formatDateSimple(row.eventDate)} &middot; {row.source}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold">{money(row.netMargin)}</p>
                                <p className="text-xs">{pct(row.marginPct)}</p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Taula per canal */}
                  <section className="rounded-2xl border border-white/10 p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">📊</span>
                      <h2 className="text-base font-bold">Rendibilitat per canal d&apos;adquisició</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm" aria-label="Rendibilitat per canal">
                        <thead>
                          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider">
                            <th scope="col" className="py-3 pr-4">Canal</th>
                            <th scope="col" className="py-3 pr-4">Esdeveniments</th>
                            <th scope="col" className="py-3 pr-4">Ingressos</th>
                            <th scope="col" className="py-3 pr-4">Marge net</th>
                            <th scope="col" className="py-3">Marge %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {props.bySource.map((row) => (
                            <tr key={row.source} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 pr-4 font-semibold">{row.source}</td>
                              <td className="py-3 pr-4">{row.bookings}</td>
                              <td className="py-3 pr-4">{money(row.revenue)}</td>
                              <td className="py-3 pr-4">{money(row.netMargin)}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 rounded-full bg-white/5 overflow-hidden">
                                    <div className={`h-full rounded-full ${marginBg(row.avgMarginPct)}`} style={{ width: `${Math.min(row.avgMarginPct * 100, 100)}%` }} />
                                  </div>
                                  <span className={`text-xs font-semibold ${marginColor(row.avgMarginPct)}`}>{pct(row.avgMarginPct)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </>
          )}

          {/* ═══════════ TRESORERIA ═══════════ */}
          {activeTab === 'tresoreria' && (
            <>
              <section className="rounded-2xl border border-white/10 p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-1">Previsió de tresoreria</h2>
                <p className="text-xs mb-4">Projecció mensual d'ingressos i costos basada en reserves confirmades.</p>

                {props.cashFlow && props.cashFlow.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-[700px] w-full text-sm" aria-label="Projecció de tresoreria">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider">
                          <th scope="col" className="px-3 py-2">Mes</th>
                          <th scope="col" className="px-3 py-2 text-right">Ingressos previstos</th>
                          <th scope="col" className="px-3 py-2 text-right">Costos estimats</th>
                          <th scope="col" className="px-3 py-2 text-right">Flux net</th>
                          <th scope="col" className="px-3 py-2 text-right">Acumulat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {props.cashFlow.map((row) => (
                          <tr key={row.month} className="hover:bg-white/[0.03]">
                            <td className="px-3 py-2 font-medium">{row.month}</td>
                            <td className="px-3 py-2 text-right">{money(row.income)}</td>
                            <td className="px-3 py-2 text-right">{money(row.costs)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.netFlow >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                              {money(row.netFlow)}
                            </td>
                            <td className={`px-3 py-2 text-right font-bold ${row.cumulative >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {money(row.cumulative)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm">Sense dades de tresoreria. Les reserves confirmades amb dates futures apareixeran aquí.</p>
                )}
              </section>
            </>
          )}

          {/* ═══════════ PREVISIONS ═══════════ */}
          {activeTab === 'previsions' && (
            <>
              <section className="rounded-2xl border border-white/10 p-5 shadow-sm">
                <h2 className="text-lg font-semibold mb-1">Previsió de vendes</h2>
                <p className="text-xs mb-4">Combinació de pipeline ponderat i tendència històrica amb estacionalitat.</p>

                {props.forecast_pipeline && props.forecast_pipeline.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-[700px] w-full text-sm" aria-label="Previsió de vendes">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider">
                          <th scope="col" className="px-3 py-2">Mes</th>
                          <th scope="col" className="px-3 py-2 text-right">Mitjana històrica</th>
                          <th scope="col" className="px-3 py-2 text-right">Pipeline ponderat</th>
                          <th scope="col" className="px-3 py-2 text-right">Previsió combinada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {props.forecast_pipeline.map((row) => (
                          <tr key={row.month} className="hover:bg-white/[0.03]">
                            <td className="px-3 py-2 font-medium">{row.month}</td>
                            <td className="px-3 py-2 text-right">{money(row.historicalAvg)}</td>
                            <td className="px-3 py-2 text-right">{money(row.pipeline)}</td>
                            <td className="px-3 py-2 text-right font-bold">{money(row.combined)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm">Sense dades de previsió. Necessitem leads actius i/o reserves passades per generar previsions.</p>
                )}
              </section>

              {/* CAC per canal */}
              {props.cacByChannel && props.cacByChannel.length > 0 && (
                <section className="rounded-2xl border border-white/10 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold mb-1">CAC per canal</h2>
                  <p className="text-xs mb-4">Cost d'adquisició de client real vs estimat, derivat de dades.</p>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-[600px] w-full text-sm" aria-label="CAC per canal">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider">
                          <th scope="col" className="px-3 py-2">Canal</th>
                          <th scope="col" className="px-3 py-2 text-right">Leads</th>
                          <th scope="col" className="px-3 py-2 text-right">Guanyats</th>
                          <th scope="col" className="px-3 py-2 text-right">Conversió</th>
                          <th scope="col" className="px-3 py-2 text-right">CAC estimat</th>
                          <th scope="col" className="px-3 py-2 text-right">CAC real</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {props.cacByChannel.map((row) => (
                          <tr key={row.channel} className="hover:bg-white/[0.03]">
                            <td className="px-3 py-2 font-medium">{row.channel}</td>
                            <td className="px-3 py-2 text-right">{row.totalLeads}</td>
                            <td className="px-3 py-2 text-right">{row.wonLeads}</td>
                            <td className="px-3 py-2 text-right">{(row.conversionRate * 100).toFixed(1)}%</td>
                            <td className="px-3 py-2 text-right">{money(row.estimatedCac)}</td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {row.realCac !== null ? money(row.realCac) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          {/* ═══════════ CONFIG ═══════════ */}
          {activeTab === 'config' && (
            <>
              <section className="rounded-2xl border border-white/10 p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Semàfor de packs (clar)</h2>
                    <p className="text-xs">
                      Mostra PVP, hora extra, cost estimat i benefici real estimat per pack.
                    </p>
                  </div>
                  <p className="text-xs">
                    Objectiu marge pack: <span className="font-semibold">{pct(props.packPricingConfig.marginTargetPct)}</span>
                  </p>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <article className="rounded-xl border p-3">
                    <p className="text-xs">Sa</p>
                    <p className="text-xl font-black">{props.packPricingSummary.healthy}</p>
                  </article>
                  <article className="rounded-xl border p-3">
                    <p className="text-xs">Vigilar</p>
                    <p className="text-xl font-black">{props.packPricingSummary.warning}</p>
                  </article>
                  <article className="rounded-xl border p-3">
                    <p className="text-xs">Crític</p>
                    <p className="text-xl font-black">{props.packPricingSummary.critical}</p>
                  </article>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-[1250px] w-full text-sm" aria-label="Rendibilitat per pack">
                    <thead className="">
                      <tr className="text-left text-[11px] uppercase tracking-wider">
                        <th scope="col" className="px-3 py-2">Pack</th>
                        <th scope="col" className="px-3 py-2">Semàfor</th>
                        <th scope="col" className="px-3 py-2 text-right">PVP</th>
                        <th scope="col" className="px-3 py-2 text-right">Cost estimat</th>
                        <th scope="col" className="px-3 py-2 text-right">Benefici</th>
                        <th scope="col" className="px-3 py-2 text-right">Marge</th>
                        <th scope="col" className="px-3 py-2 text-right">Hora extra</th>
                        <th scope="col" className="px-3 py-2 text-right">Cost/h extra</th>
                        <th scope="col" className="px-3 py-2 text-right">Benefici/h extra</th>
                        <th scope="col" className="px-3 py-2 text-right">Marge h extra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {props.packPricingRows.map((row) => {
                        const badge = packMarginBadge(row.marginPct, props.packPricingConfig.marginTargetPct);
                        return (
                          <tr key={row.id} className="hover:bg-white/[0.03]">
                            <td className="px-3 py-2">
                              <Link href={`/admin/packs/${row.id}`} className="font-semibold">
                                {row.name}
                              </Link>
                              <p className="text-[11px]">{row.slug} · {row.service}</p>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                                <span className={`inline-block h-2 w-2 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">{money(row.price)}</td>
                            <td className="px-3 py-2 text-right">{money(row.directCost)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{money(row.profit)}</td>
                            <td className="px-3 py-2 text-right">{pct(row.marginPct)}</td>
                            <td className="px-3 py-2 text-right">{money(row.extraHourPrice)}</td>
                            <td className="px-3 py-2 text-right">{money(row.extraHourCostEstimated)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.extraHourProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{money(row.extraHourProfit)}</td>
                            <td className="px-3 py-2 text-right">{pct(row.extraHourMarginPct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              <PackPricingModelEditor initial={props.packPricingConfig} />
              <PackPricingModelHistory entries={props.packPricingHistoryEntries} />
              {/* Vehicle config */}
              {props.vehicleConfig && (
                <section className="rounded-2xl border border-white/10 p-5 shadow-sm">
                  <h2 className="text-lg font-semibold mb-1">Vehicle i desplaçament</h2>
                  <p className="text-xs mb-4">
                    Cost per km derivat del preu MITECO + manteniment. Actualitzat automàticament.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-[11px] uppercase tracking-wide">Preu combustible</p>
                      <p className="text-lg font-bold">
                        {props.vehicleConfig.fuelPricePerLiter > 0
                          ? `${props.vehicleConfig.fuelPricePerLiter.toFixed(3)} €/L`
                          : 'Sense dada MITECO'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-[11px] uppercase tracking-wide">Consum vehicle</p>
                      <p className="text-lg font-bold">{props.vehicleConfig.consumptionL100.toFixed(1)} L/100km</p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-[11px] uppercase tracking-wide">Manteniment</p>
                      <p className="text-lg font-bold">{props.vehicleConfig.maintenanceCostPerKm.toFixed(2)} €/km</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-[11px] uppercase tracking-wide">Cost efectiu per km</p>
                      <p className="text-lg font-bold">{props.vehicleConfig.effectiveCostPerKm.toFixed(3)} €/km</p>
                      {props.vehicleConfig.updatedAt && (
                        <p className="text-[11px]">Act: {formatDateSimple(props.vehicleConfig.updatedAt)}</p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <ProfitabilityConfigEditor initial={props.config} />
              <ProfitabilityConfigHistory entries={props.historyEntries} />
            </>
          )}

        </motion.div>
      </AnimatePresence>
    </AdminPage>
  );
}


