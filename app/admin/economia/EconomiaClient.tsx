'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentToggleButton from '../finanzas/PaymentToggleButton';
import PaymentReminderActions from '../finanzas/PaymentReminderActions';
import ProfitabilityConfigEditor from '../rentabilidad/ProfitabilityConfigEditor';
import ProfitabilityConfigHistory from '../rentabilidad/ProfitabilityConfigHistory';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';
import PackPricingModelEditor from './PackPricingModelEditor';
import PackPricingModelHistory from './PackPricingModelHistory';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'resum' | 'cobraments' | 'rendibilitat' | 'config';

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

interface EconomiaClientProps {
  outstandingTotal: number;
  overdueTotal: number;
  dueSoonTotal: number;
  monthCollected: number;
  atRiskRows: PaymentRow[];
  upcomingDueRows: PaymentRow[];
  hasReport: boolean;
  reportError: boolean;
  realized: { revenue: number; netMargin: number; avgMarginPct: number; bookings: number };
  forecast: { revenue: number; netMargin: number; avgMarginPct: number; bookings: number };
  topProfitability: ProfitabilityRow[];
  riskProfitability: ProfitabilityRow[];
  bySource: BySourceRow[];
  config: ProfitabilityConfig;
  packPricingConfig: PackPricingModelConfig;
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function money(value: number) {
  return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

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

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string; mobileLabel: string }[] = [
  { id: 'resum', label: 'Resum general', icon: '📊', mobileLabel: 'Resum' },
  { id: 'cobraments', label: 'Cobraments', icon: '💶', mobileLabel: 'Cobrar' },
  { id: 'rendibilitat', label: 'Rendibilitat', icon: '📈', mobileLabel: 'Marge' },
  { id: 'config', label: 'Configuraci\u00f3', icon: '\u2699\ufe0f', mobileLabel: 'Config' },
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
      className={`rounded-2xl border ${borderColor} ${bgColor} p-5 shadow-lg backdrop-blur-sm`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-black tracking-tight ${color}`}>{value}</p>
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
  const label = score >= 75 ? 'Excel\u00b7lent' : score >= 50 ? 'Acceptable' : 'Atenciu\u00f3';

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-lg"
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Salut financera</p>
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

export default function EconomiaClient(props: EconomiaClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('resum');

  const totalAlerts = useMemo(() =>
    props.atRiskRows.length + props.riskProfitability.length,
    [props.atRiskRows, props.riskProfitability]
  );

  return (
    <div className="space-y-5">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-amber-950/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                Economia
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Control de caixa, cobraments i marge en una sola pantalla.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/admin/reports/profitability"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
              >
                Exportar JSON
              </a>
              <Link
                href="/admin/sales-ops"
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                Operativa de vendes
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ TAB NAVIGATION ═══════════ */}
      <nav className="flex gap-1 rounded-2xl border border-white/10 bg-slate-950/60 p-1.5 shadow-lg backdrop-blur-sm">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'cobraments' && props.atRiskRows.length > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 rounded-xl px-3 py-3 text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/15 text-amber-300 shadow-md shadow-amber-500/10 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg shadow-rose-500/30">
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
          className="space-y-5"
        >

          {/* ═══════════ RESUM ═══════════ */}
          {activeTab === 'resum' && (
            <>
              {/* Health + KPIs */}
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="lg:col-span-1">
                  <HealthScore
                    overdueTotal={props.overdueTotal}
                    outstandingTotal={props.outstandingTotal}
                    marginPct={props.realized.avgMarginPct}
                  />
                </div>
                <div className="lg:col-span-4 grid gap-3 grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Total pendent de cobrar"
                    value={money(props.outstandingTotal)}
                    color="text-slate-100"
                    borderColor="border-white/10"
                    bgColor="bg-slate-950/60"
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

              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-xs text-slate-300">
                <strong className="text-slate-100">Com llegir aquest resum:</strong> pendent = import total per cobrar, fora de termini = cobrament que ja havia d&apos;estar pagat, a 7 dies = cobrament proper.
              </div>

              {/* Profitability KPIs */}
              {props.hasReport && (
                <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Ingressos realitzats"
                    value={money(props.realized.revenue)}
                    sub={`${props.realized.bookings} completats`}
                    color="text-slate-100"
                    borderColor="border-white/10"
                    bgColor="bg-slate-950/60"
                    delay={0.05}
                  />
                  <KpiCard
                    label="Marge net realitzat"
                    value={money(props.realized.netMargin)}
                    sub={`Mitj\u00e0 ${pct(props.realized.avgMarginPct)}`}
                    color="text-emerald-300"
                    borderColor="border-emerald-400/30"
                    bgColor="bg-emerald-950/30"
                    delay={0.1}
                  />
                  <KpiCard
                    label="Ingressos previstos"
                    value={money(props.forecast.revenue)}
                    sub={`${props.forecast.bookings} en pipeline`}
                    color="text-slate-100"
                    borderColor="border-white/10"
                    bgColor="bg-slate-950/60"
                    delay={0.15}
                  />
                  <KpiCard
                    label="Marge previst"
                    value={money(props.forecast.netMargin)}
                    sub={`Mitj\u00e0 ${pct(props.forecast.avgMarginPct)}`}
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
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-200">Progr\u00e9s de cobrament</p>
                    <p className="text-xs text-slate-400">
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
                  className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-slate-950/60 p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Valor d&apos;inventari</p>
                      <p className="mt-1 text-2xl font-black text-cyan-300">{money(props.inventoryValue)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{props.inventoryCount} elements actius</p>
                    </div>
                    <Link
                      href="/admin/inventory"
                      className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
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
                      className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-rose-900/10 p-5 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-lg">
                          \u26a0\ufe0f
                        </span>
                        <div className="flex-1">
                          <h2 className="text-base font-bold text-rose-200">Cobraments ven\u00e7uts</h2>
                          <p className="text-sm text-rose-300/80 mt-0.5">
                            {props.atRiskRows.length} pagament{props.atRiskRows.length !== 1 ? 's' : ''} pendent{props.atRiskRows.length !== 1 ? 's' : ''} &middot; {money(props.overdueTotal)}
                          </p>
                          <button
                            onClick={() => setActiveTab('cobraments')}
                            className="mt-3 rounded-xl bg-rose-500/20 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30 border border-rose-500/30 transition-colors"
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
                      className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/30 to-orange-900/10 p-5 shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-lg">
                          \ud83d\udcc9
                        </span>
                        <div className="flex-1">
                          <h2 className="text-base font-bold text-orange-200">Esdeveniments amb marge baix</h2>
                          <p className="text-sm text-orange-300/80 mt-0.5">
                            {props.riskProfitability.length} esdeveniment{props.riskProfitability.length !== 1 ? 's' : ''} per sota del 15% de marge
                          </p>
                          <button
                            onClick={() => setActiveTab('rendibilitat')}
                            className="mt-3 rounded-xl bg-orange-500/20 px-4 py-2 text-xs font-bold text-orange-200 hover:bg-orange-500/30 border border-orange-500/30 transition-colors"
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
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-100">Top 5 &mdash; Millors marges</h2>
                    <button
                      onClick={() => setActiveTab('rendibilitat')}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
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
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-sm font-black text-emerald-400">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-200 transition-colors">
                            {row.reference} &middot; {row.clientName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(row.eventDate).toLocaleDateString('ca-ES')} &middot; {row.source}
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
                <KpiCard label="Total pendent de cobrar" value={money(props.outstandingTotal)} color="text-slate-100" borderColor="border-white/10" bgColor="bg-slate-950/60" />
                <KpiCard label="Pendent fora de termini" value={money(props.overdueTotal)} color="text-rose-300" borderColor="border-rose-500/30" bgColor="bg-rose-500/10" delay={0.05} />
                <KpiCard label="Vencen en 7 dies" value={money(props.dueSoonTotal)} color="text-amber-300" borderColor="border-amber-500/30" bgColor="bg-amber-500/10" delay={0.1} />
                <KpiCard label="Cobrat aquest mes" value={money(props.monthCollected)} color="text-emerald-300" borderColor="border-emerald-500/30" bgColor="bg-emerald-500/10" delay={0.15} />
              </div>

              <section className="rounded-xl border border-slate-700/60 bg-slate-900/45 px-4 py-3 text-xs text-slate-300">
                <p>
                  <span className="font-semibold text-slate-100">Guia:</span> codi `OE-...` = referència interna de la reserva.
                  <span className="font-semibold text-slate-100"> Bestreta</span> = primer pagament per confirmar la data.
                  <span className="font-semibold text-slate-100"> Saldo restant</span> = import final pendent.
                </p>
              </section>

              {/* Ven\u00e7uts */}
              <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-sm">\u26a0\ufe0f</span>
                    <h2 className="text-lg font-bold text-slate-100">Fora de termini</h2>
                    {props.atRiskRows.length > 0 && (
                      <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300">
                        {props.atRiskRows.length}
                      </span>
                    )}
                  </div>
                  <Link href="/admin/bookings" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                    Totes les reserves &rarr;
                  </Link>
                </div>
                <div className="grid gap-2 lg:grid-cols-2">
                  {props.atRiskRows.length === 0 ? (
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-6 text-center">
                      <p className="text-emerald-400 font-semibold">Tot al dia!</p>
                      <p className="text-sm text-emerald-400/70 mt-1">
                        No hi ha cap cobrament pendent amb data de venciment passada.
                      </p>
                    </div>
                  ) : (
                    props.atRiskRows.map((row) => (
                      <motion.details
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group rounded-xl border border-white/10 bg-slate-900/50 p-3 transition-colors open:border-rose-500/30 open:bg-rose-950/10"
                      >
                        <summary className="list-none cursor-pointer">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-100">{row.reference} · {row.clientName}</p>
                              <p className="mt-0.5 text-xs text-slate-400">
                                {new Date(row.eventDate).toLocaleDateString('ca-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
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
                              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                                Veure detall
                              </span>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 border-t border-white/10 pt-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-500">Codi reserva: {row.reference}</p>
                            <Link href={`/admin/bookings/${row.id}`} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors">
                              Obrir reserva
                            </Link>
                          </div>
                          <div className="mb-3 grid gap-2 sm:grid-cols-2">
                            <div className={`rounded-lg border p-3 ${row.depositPaid ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${row.depositPaid ? 'text-emerald-300' : 'text-rose-300'}`}>Bestreta</p>
                                <p className={`text-sm font-bold ${row.depositPaid ? 'text-emerald-200' : 'text-rose-200'}`}>{money(row.depositAmount)}</p>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-2">
                                Venciment: {new Date(row.depositDueAt).toLocaleDateString('ca-ES')}
                              </p>
                              <PaymentToggleButton bookingId={row.id} field="depositPaid" currentValue={row.depositPaid} />
                            </div>
                            <div className={`rounded-lg border p-3 ${row.remainingPaid ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-rose-500/20 bg-rose-500/5'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${row.remainingPaid ? 'text-emerald-300' : 'text-rose-300'}`}>Saldo restant</p>
                                <p className={`text-sm font-bold ${row.remainingPaid ? 'text-emerald-200' : 'text-rose-200'}`}>{money(row.remainingAmount)}</p>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-2">
                                Venciment: {new Date(row.remainingDueAt).toLocaleDateString('ca-ES')}
                              </p>
                              <PaymentToggleButton bookingId={row.id} field="remainingPaid" currentValue={row.remainingPaid} />
                            </div>
                          </div>
                          <p className="mb-2 text-xs text-slate-400">
                            Seguiment: <span className="font-semibold text-slate-300">{row.paymentFlowState}</span>
                          </p>
                          <PaymentReminderActions
                            bookingId={row.id}
                            phone={row.clientPhone}
                            message={`Hola ${row.clientName}, et recordem el cobrament pendent del teu esdeveniment ${row.reference}. Gr\u00e0cies.`}
                          />
                        </div>
                      </motion.details>
                    ))
                  )}
                </div>
              </section>

              {/* Pr\u00f2xims */}
              <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-sm">\u23f0</span>
                  <h2 className="text-lg font-bold text-slate-100">Venciments en 7 dies</h2>
                  {props.upcomingDueRows.length > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                      {props.upcomingDueRows.length}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {props.upcomingDueRows.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-slate-900 p-4 text-center">
                      <p className="text-sm font-semibold text-slate-200">Cap venciment en 7 dies.</p>
                      <p className="mt-1 text-xs text-slate-400">
                        No tens cap cobrament pendent que caduqui entre avui i els pròxims 7 dies.
                      </p>
                    </div>
                  ) : (
                    props.upcomingDueRows.map((row) => (
                      <div key={row.id} className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-100 truncate">{row.reference} &middot; {row.clientName}</p>
                          <p className="text-xs text-slate-400">{new Date(row.eventDate).toLocaleDateString('ca-ES')}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {row.dueSoonDeposit && <p className="text-xs text-amber-300">Bestreta: {money(row.depositAmount)}</p>}
                          {row.dueSoonRemaining && <p className="text-xs text-amber-300">Saldo: {money(row.remainingAmount)}</p>}
                        </div>
                        <Link href={`/admin/bookings/${row.id}`} className="shrink-0 text-xs text-slate-400 hover:text-slate-200">
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
                <section className="rounded-2xl border border-amber-300/30 bg-gradient-to-br from-amber-950/30 to-amber-900/10 p-6 shadow-lg">
                  <h2 className="text-lg font-bold text-amber-200">Sense dades disponibles</h2>
                  <p className="mt-1 text-sm text-amber-100/80">
                    {props.reportError
                      ? 'Hi ha hagut un error calculant la rendibilitat. Revisa la configuraci\u00f3 o torna-ho a provar.'
                      : 'Encara no hi ha prou esdeveniments completats per generar l\u2019informe.'}
                  </p>
                </section>
              )}

              {props.hasReport && (
                <>
                  <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                    <KpiCard label="Ingressos realitzats" value={money(props.realized.revenue)} sub={`${props.realized.bookings} completats`} color="text-slate-100" borderColor="border-white/10" bgColor="bg-slate-950/60" />
                    <KpiCard label="Marge net realitzat" value={money(props.realized.netMargin)} sub={`Mitj\u00e0 ${pct(props.realized.avgMarginPct)}`} color="text-emerald-300" borderColor="border-emerald-400/30" bgColor="bg-emerald-950/30" delay={0.05} />
                    <KpiCard label="Previsi\u00f3 d'ingressos" value={money(props.forecast.revenue)} sub={`${props.forecast.bookings} en pipeline`} color="text-slate-100" borderColor="border-white/10" bgColor="bg-slate-950/60" delay={0.1} />
                    <KpiCard label="Previsi\u00f3 de marge" value={money(props.forecast.netMargin)} sub={`Mitj\u00e0 ${pct(props.forecast.avgMarginPct)}`} color="text-amber-300" borderColor="border-amber-400/30" bgColor="bg-amber-950/30" delay={0.15} />
                  </div>

                  {/* Top + Risc */}
                  <div className="grid gap-5 xl:grid-cols-2">
                    <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-sm">\ud83c\udfc6</span>
                        <h2 className="text-base font-bold text-slate-100">Top esdeveniments per marge</h2>
                      </div>
                      <div className="space-y-2">
                        {props.topProfitability.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center p-4">Encara no hi ha esdeveniments completats.</p>
                        ) : (
                          props.topProfitability.slice(0, 12).map((row, i) => (
                            <Link
                              key={row.id}
                              href={`/admin/bookings/${row.id}`}
                              className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors group"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-black text-emerald-400">
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-200 transition-colors">
                                  {row.reference} &middot; {row.clientName}
                                </p>
                                <p className="text-xs text-slate-400">{new Date(row.eventDate).toLocaleDateString('ca-ES')} &middot; {row.source}</p>
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

                    <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-sm">\u26a0\ufe0f</span>
                        <h2 className="text-base font-bold text-slate-100">Esdeveniments en risc</h2>
                        {props.riskProfitability.length > 0 && (
                          <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300">
                            {props.riskProfitability.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {props.riskProfitability.length === 0 ? (
                          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-6 text-center">
                            <p className="text-emerald-400 font-semibold">Sense alertes!</p>
                            <p className="text-sm text-emerald-400/70 mt-1">Tots els marges s\u00f3n saludables.</p>
                          </div>
                        ) : (
                          props.riskProfitability.slice(0, 12).map((row) => (
                            <Link
                              key={row.id}
                              href={`/admin/bookings/${row.id}`}
                              className="flex items-center gap-3 rounded-xl border border-rose-500/10 p-3 hover:bg-rose-500/5 transition-colors group"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-xs">\ud83d\udcc9</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-rose-200 transition-colors">
                                  {row.reference} &middot; {row.clientName}
                                </p>
                                <p className="text-xs text-slate-400">{new Date(row.eventDate).toLocaleDateString('ca-ES')} &middot; {row.source}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-rose-400">{money(row.netMargin)}</p>
                                <p className="text-xs text-rose-400">{pct(row.marginPct)}</p>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Taula per canal */}
                  <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-sm">\ud83d\udcca</span>
                      <h2 className="text-base font-bold text-slate-100">Rendibilitat per canal d&apos;adquisici\u00f3</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                            <th className="py-3 pr-4">Canal</th>
                            <th className="py-3 pr-4">Esdeveniments</th>
                            <th className="py-3 pr-4">Ingressos</th>
                            <th className="py-3 pr-4">Marge net</th>
                            <th className="py-3">Marge %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {props.bySource.map((row) => (
                            <tr key={row.source} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 pr-4 font-semibold text-slate-200">{row.source}</td>
                              <td className="py-3 pr-4 text-slate-300">{row.bookings}</td>
                              <td className="py-3 pr-4 text-slate-300">{money(row.revenue)}</td>
                              <td className="py-3 pr-4 text-slate-300">{money(row.netMargin)}</td>
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

          {/* ═══════════ CONFIG ═══════════ */}
          {activeTab === 'config' && (
            <>
              <PackPricingModelEditor initial={props.packPricingConfig} />
              <PackPricingModelHistory entries={props.packPricingHistoryEntries} />
              <ProfitabilityConfigEditor initial={props.config} />
              <ProfitabilityConfigHistory entries={props.historyEntries} />
            </>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
