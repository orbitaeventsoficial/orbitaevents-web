'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPage } from '../components/AdminPage';
import { ADMIN_ECONOMY_HELP, helpAttrs } from '../components/adminHelpContent';
import PaymentToggleButton from './PaymentToggleButton';
import PaymentReminderActions from './PaymentReminderActions';
import { formatDateSimple, formatDateFull } from '@/lib/constants';
import ExportCsvButton from '../components/ExportCsvButton';
import ProfitabilityConfigEditor from './ProfitabilityConfigEditor';
import ProfitabilityConfigHistory from './ProfitabilityConfigHistory';
import PackPricingModelEditor from './PackPricingModelEditor';
import PackPricingModelHistory from './PackPricingModelHistory';
import {
  type Tab, type EconomiaClientProps,
  money, pct, marginColor, marginBg, paymentStateBadge, packMarginBadge, TABS,
} from './economia-types';
import {
  KpiCard, ProgressBar, HealthScore, PaymentTimelineBar, CobramentFiltersSection,
} from './economia-components';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';



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
            data={[...props.topProfitability, ...props.riskProfitability]}
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
      <nav role="tablist" aria-label="Seccions d'economia" className="admin-economia-tabs flex gap-1 ap-card p-1" {...helpAttrs(ADMIN_ECONOMY_HELP.tabs)}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'cobraments' && props.atRiskRows.length > 0;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-economia-tab relative flex-1 rounded-[var(--o-r-sm)] px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive ? 'admin-economia-tab--active' : 'admin-economia-tab--idle'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
              {showBadge && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold bg-[var(--o-danger)] text-[var(--o-admin-light)]">
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
                  />
                  <KpiCard
                    label="Pendent fora de termini"
                    value={money(props.overdueTotal)}
                    sub={props.atRiskRows.length > 0 ? `${props.atRiskRows.length} cobraments amb retard` : undefined}
                    color="admin-tone-text-danger"
                  />
                  <KpiCard
                    label="Cobrat aquest mes"
                    value={money(props.monthCollected)}
                    sub="Ingressos ja cobrats"
                    color="admin-tone-text-success"
                  />
                  <KpiCard
                    label="Vencen en 7 dies"
                    value={money(props.dueSoonTotal)}
                    sub={props.upcomingDueRows.length > 0 ? `${props.upcomingDueRows.length} cobraments pròxims` : undefined}
                    color="admin-tone-text-warning"
                  />
                </div>
              </div>

              <div className="ap-card px-3 py-2.5 text-xs text-[var(--t3)]" {...helpAttrs(ADMIN_ECONOMY_HELP.summaryGuide)}>
                <strong className="text-[var(--t2)] font-semibold">Com llegir aquest resum:</strong> pendent = import total per cobrar, fora de termini = cobrament que ja havia d&apos;estar pagat, a 7 dies = cobrament proper.
              </div>

              {/* Profitability KPIs */}
              {props.hasReport && (
                <div className="grid gap-2 grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Ingressos realitzats"
                    value={money(props.realized.revenue)}
                    sub={`${props.realized.bookings} completats`}
                    color="text-white/90"
                  />
                  <KpiCard
                    label="Marge net realitzat"
                    value={money(props.realized.netMargin)}
                    sub={`Mitjà ${pct(props.realized.avgMarginPct)}`}
                    color="admin-tone-text-success"
                  />
                  <KpiCard
                    label="Ingressos previstos"
                    value={money(props.forecast.revenue)}
                    sub={`${props.forecast.bookings} en pipeline`}
                    color="text-white/90"
                  />
                  <KpiCard
                    label="Marge previst"
                    value={money(props.forecast.netMargin)}
                    sub={`Mitjà ${pct(props.forecast.avgMarginPct)}`}
                    color="admin-tone-text-warning"
                  />
                </div>
              )}

              {/* Collection progress bar */}
              {props.outstandingTotal > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="ap-card p-4"
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
                    color="admin-gradient--progress-emerald"
                  />
                </motion.section>
              )}

              {/* Inventory asset value */}
              {props.inventoryCount > 0 && (
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="ap-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider">Valor d&apos;inventari</p>
                      <p className="mt-1 font-[family-name:var(--display)] text-[length:var(--o-text-xl)] font-bold leading-none">{money(props.inventoryValue)}</p>
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
                      className="ap-card p-5"
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
                      className="ap-card p-5"
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
                  className="ap-card p-5" {...helpAttrs(ADMIN_ECONOMY_HELP.topMargins)}
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
                        href={buildBookingHref(row.id)}
                        className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors group"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
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
                <KpiCard label="Total pendent de cobrar" value={money(props.outstandingTotal)} color="text-white/90" />
                <KpiCard label="Pendent fora de termini" value={money(props.overdueTotal)} color="admin-tone-text-danger" />
                <KpiCard label="Vencen en 7 dies" value={money(props.dueSoonTotal)} color="admin-tone-text-warning" />
                <KpiCard label="Cobrat aquest mes" value={money(props.monthCollected)} color="admin-tone-text-success" />
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
              <section className="ap-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">⚠️</span>
                    <h2 className="ap-h2">Fora de termini</h2>
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
                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-semibold uppercase">{row.status}</span>
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${paymentStateBadge(row.depositPaid)}`}>
                                Bestreta {row.depositPaid ? 'pagada' : 'pendent'}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${paymentStateBadge(row.remainingPaid)}`}>
                                Saldo {row.remainingPaid ? 'pagat' : 'pendent'}
                              </span>
                              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-semibold">
                                Veure detall
                              </span>
                            </div>
                          </div>
                        </summary>

                        <div className="mt-3 border-t border-white/10 pt-3">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <p className="text-xs">Codi reserva: {row.reference}</p>
                            <Link href={buildBookingHref(row.id)} className="ap-btn ap-btn--xs shrink-0">
                              Obrir reserva
                            </Link>
                          </div>
                          <div className="mb-3 grid gap-2 sm:grid-cols-2">
                            <div className={`rounded-xl border p-3 ${row.depositPaid ? 'admin-tone-border-success admin-tone-bg-success' : 'admin-tone-border-danger admin-tone-bg-danger'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${row.depositPaid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>Bestreta</p>
                                <p className={`text-sm font-bold ${row.depositPaid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>{money(row.depositAmount)}</p>
                              </div>
                              <p className="text-xs mb-2">
                                Venciment: {formatDateSimple(row.depositDueAt)}
                              </p>
                              <PaymentToggleButton bookingId={row.id} field="depositPaid" currentValue={row.depositPaid} />
                            </div>
                            <div className={`rounded-xl border p-3 ${row.remainingPaid ? 'admin-tone-border-success admin-tone-bg-success' : 'admin-tone-border-danger admin-tone-bg-danger'}`}>
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-semibold ${row.remainingPaid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>Saldo restant</p>
                                <p className={`text-sm font-bold ${row.remainingPaid ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>{money(row.remainingAmount)}</p>
                              </div>
                              <p className="text-xs mb-2">
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
              <section className="ap-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm">⏰</span>
                  <h2 className="ap-h2">Venciments en 7 dies</h2>
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
                        <Link href={buildBookingHref(row.id)} className="shrink-0 text-xs">
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
                <section className="ap-card p-6">
                  <h2 className="ap-h2">Sense dades disponibles</h2>
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
                    <KpiCard label="Ingressos realitzats" value={money(props.realized.revenue)} sub={`${props.realized.bookings} completats`} color="text-white/90" />
                    <KpiCard label="Marge net realitzat" value={money(props.realized.netMargin)} sub={`Mitjà ${pct(props.realized.avgMarginPct)}`} color="admin-tone-text-success" />
                    <KpiCard label="Previsió d'ingressos" value={money(props.forecast.revenue)} sub={`${props.forecast.bookings} en pipeline`} color="text-white/90" />
                    <KpiCard label="Previsió de marge" value={money(props.forecast.netMargin)} sub={`Mitjà ${pct(props.forecast.avgMarginPct)}`} color="admin-tone-text-warning" />
                  </div>

                  {/* Top + Risc */}
                  <div className="grid gap-5 xl:grid-cols-2">
                    <section className="ap-card p-5" {...helpAttrs(ADMIN_ECONOMY_HELP.topMargins)}>
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
                              href={buildBookingHref(row.id)}
                              className="flex items-center gap-3 rounded-xl border border-white/5 p-3 hover:bg-white/5 transition-colors group"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold">
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
                                  <span className={`text-xs font-semibold ${marginColor(row.marginPct)}`}>{pct(row.marginPct)}</span>
                                </div>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="ap-card p-5" {...helpAttrs(ADMIN_ECONOMY_HELP.topMargins)}>
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
                              href={buildBookingHref(row.id)}
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
                  <section className="ap-card p-5" {...helpAttrs(ADMIN_ECONOMY_HELP.topMargins)}>
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
                            <tr key={row.source} className="border-b border-white/5 adm-row-hover transition-colors">
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
              <section className="ap-card p-5">
                <h2 className="ap-h2 mb-1">Previsió de tresoreria</h2>
                <p className="text-xs mb-4">Projecció mensual d'ingressos i costos basada en reserves confirmades.</p>

                {props.cashFlow && props.cashFlow.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-[700px] w-full text-sm" aria-label="Projecció de tresoreria">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider">
                          <th scope="col" className="px-3 py-2">Mes</th>
                          <th scope="col" className="px-3 py-2 text-right">Ingressos previstos</th>
                          <th scope="col" className="px-3 py-2 text-right">Costos estimats</th>
                          <th scope="col" className="px-3 py-2 text-right">Flux net</th>
                          <th scope="col" className="px-3 py-2 text-right">Acumulat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {props.cashFlow.map((row) => (
                          <tr key={row.month} className="adm-row-hover">
                            <td className="px-3 py-2 font-medium">{row.month}</td>
                            <td className="px-3 py-2 text-right">{money(row.income)}</td>
                            <td className="px-3 py-2 text-right">{money(row.costs)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.netFlow >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
                              {money(row.netFlow)}
                            </td>
                            <td className={`px-3 py-2 text-right font-bold ${row.cumulative >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>
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
              <section className="ap-card p-5">
                <h2 className="ap-h2 mb-1">Previsió de vendes</h2>
                <p className="text-xs mb-4">
                  Combinació de pipeline ponderat i tendència històrica amb estacionalitat. La columna
                  <span className="font-semibold"> Rang ±1σ</span> reflecteix el ventall esperat segons la
                  variància Bernoulli per lead (banda al ~68%). <span className="font-semibold">YoY</span> compara
                  amb el mateix mes l'any anterior; <span className="font-semibold">Confirmades</span> mostra reserves ja en agenda.
                </p>

                {props.forecast_pipeline && props.forecast_pipeline.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-[1080px] w-full text-sm" aria-label="Previsió de vendes">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider">
                          <th scope="col" className="px-3 py-2">Mes</th>
                          <th scope="col" className="px-3 py-2 text-right">Mitjana històrica</th>
                          <th scope="col" className="px-3 py-2 text-right">Pipeline ponderat</th>
                          <th scope="col" className="px-3 py-2 text-right">Previsió combinada</th>
                          <th scope="col" className="px-3 py-2 text-right">Rang ±1σ</th>
                          <th scope="col" className="px-3 py-2 text-right">YoY (any anterior)</th>
                          <th scope="col" className="px-3 py-2 text-right">Confirmades</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {props.forecast_pipeline.map((row) => {
                          const hasBand = row.combinedHigh > row.combinedLow;
                          const yoyDelta = row.previousYearActual > 0
                            ? (row.combined - row.previousYearActual) / row.previousYearActual
                            : null;
                          const yoyToneClass = yoyDelta == null
                            ? 'opacity-50'
                            : yoyDelta >= 0.1
                              ? 'admin-tone-text-success'
                              : yoyDelta <= -0.1
                                ? 'admin-tone-text-danger'
                                : 'opacity-70';
                          return (
                            <tr key={row.month} className="adm-row-hover">
                              <td className="px-3 py-2 font-medium">{row.month}</td>
                              <td className="px-3 py-2 text-right">{money(row.historicalAvg)}</td>
                              <td className="px-3 py-2 text-right">{money(row.pipeline)}</td>
                              <td className="px-3 py-2 text-right font-bold">{money(row.combined)}</td>
                              <td className="px-3 py-2 text-right text-xs">
                                {hasBand ? (
                                  <span className="font-mono">{money(row.combinedLow)} – {money(row.combinedHigh)}</span>
                                ) : (
                                  <span className="opacity-50">—</span>
                                )}
                              </td>
                              <td className={`px-3 py-2 text-right text-xs ${yoyToneClass}`}>
                                {row.previousYearActual > 0 ? (
                                  <span className="font-mono">
                                    {money(row.previousYearActual)}
                                    {yoyDelta != null && (
                                      <span className="ml-1">
                                        ({yoyDelta >= 0 ? '+' : ''}{Math.round(yoyDelta * 100)}%)
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span>—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right text-xs">
                                {row.confirmedBookings > 0 ? (
                                  <span className="font-mono">
                                    {row.confirmedBookings} · {money(row.confirmedRevenue)}
                                  </span>
                                ) : (
                                  <span className="opacity-50">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm">Sense dades de previsió. Necessitem leads actius i/o reserves passades per generar previsions.</p>
                )}
              </section>

              {/* CAC per canal */}
              {props.cacByChannel && props.cacByChannel.length > 0 && (
                <section className="ap-card p-5">
                  <h2 className="ap-h2 mb-1">CAC per canal</h2>
                  <p className="text-xs mb-4">Cost d'adquisició de client real vs estimat, derivat de dades.</p>

                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-[600px] w-full text-sm" aria-label="CAC per canal">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider">
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
                          <tr key={row.channel} className="adm-row-hover">
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
              <section className="ap-card p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="ap-h2">Semàfor de packs (clar)</h2>
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
                    <p className="text-xl font-bold">{props.packPricingSummary.healthy}</p>
                  </article>
                  <article className="rounded-xl border p-3">
                    <p className="text-xs">Vigilar</p>
                    <p className="text-xl font-bold">{props.packPricingSummary.warning}</p>
                  </article>
                  <article className="rounded-xl border p-3">
                    <p className="text-xs">Crític</p>
                    <p className="text-xl font-bold">{props.packPricingSummary.critical}</p>
                  </article>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
                  <table className="min-w-[1250px] w-full text-sm" aria-label="Rendibilitat per pack">
                    <thead className="">
                      <tr className="text-left text-xs uppercase tracking-wider">
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
                          <tr key={row.id} className="adm-row-hover">
                            <td className="px-3 py-2">
                              <Link href={buildPackHref(row.id)} className="font-semibold">
                                {row.name}
                              </Link>
                              <p className="text-xs">{row.slug} · {row.service}</p>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                                <span className={`inline-block h-2 w-2 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">{money(row.price)}</td>
                            <td className="px-3 py-2 text-right">{money(row.directCost)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.profit >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>{money(row.profit)}</td>
                            <td className="px-3 py-2 text-right">{pct(row.marginPct)}</td>
                            <td className="px-3 py-2 text-right">{money(row.extraHourPrice)}</td>
                            <td className="px-3 py-2 text-right">{money(row.extraHourCostEstimated)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${row.extraHourProfit >= 0 ? 'admin-tone-text-success' : 'admin-tone-text-danger'}`}>{money(row.extraHourProfit)}</td>
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
                <section className="ap-card p-5">
                  <h2 className="ap-h2 mb-1">Vehicle i desplaçament</h2>
                  <p className="text-xs mb-4">
                    Cost per km derivat del preu MITECO + manteniment. Actualitzat automàticament.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-xs uppercase tracking-wide">Preu combustible</p>
                      <p className="text-lg font-bold">
                        {props.vehicleConfig.fuelPricePerLiter > 0
                          ? `${props.vehicleConfig.fuelPricePerLiter.toFixed(3)} €/L`
                          : 'Sense dada MITECO'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-xs uppercase tracking-wide">Consum vehicle</p>
                      <p className="text-lg font-bold">{props.vehicleConfig.consumptionL100.toFixed(1)} L/100km</p>
                    </div>
                    <div className="rounded-xl border border-white/10 p-3">
                      <p className="text-xs uppercase tracking-wide">Manteniment</p>
                      <p className="text-lg font-bold">{props.vehicleConfig.maintenanceCostPerKm.toFixed(2)} €/km</p>
                    </div>
                    <div className="rounded-xl border p-3">
                      <p className="text-xs uppercase tracking-wide">Cost efectiu per km</p>
                      <p className="text-lg font-bold">{props.vehicleConfig.effectiveCostPerKm.toFixed(3)} €/km</p>
                      {props.vehicleConfig.updatedAt && (
                        <p className="text-xs">Act: {formatDateSimple(props.vehicleConfig.updatedAt)}</p>
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
