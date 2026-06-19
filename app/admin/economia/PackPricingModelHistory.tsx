'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { formatDateTimeFull } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

type PackHistoryEntry = {
  id: string;
  createdAt: string;
  role: string;
  before: PackPricingModelConfig;
  after: PackPricingModelConfig;
};

function changedNumber(before: number, after: number): boolean {
  return Math.abs(before - after) > 0.000001;
}

function formatDelta(before: number, after: number, suffix = ''): string {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}${suffix}`;
}

export default function PackPricingModelHistory({ entries }: { entries: PackHistoryEntry[] }) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'MANAGER' | 'VIEWER'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const filteredEntries = entries.filter((entry) => {
    if (roleFilter !== 'ALL' && entry.role !== roleFilter) return false;

    const ts = new Date(entry.createdAt).getTime();
    if (dateFrom && ts < new Date(`${dateFrom}T00:00:00`).getTime()) return false;
    if (dateTo && ts > new Date(`${dateTo}T23:59:59`).getTime()) return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [
        entry.role.toLowerCase(),
        entry.after.specialistServices.join(' '),
        `${entry.after.marginTargetPct}`,
        `${entry.after.operatorCostPerHour}`,
        `${entry.after.specialistCostPerHour}`,
        `${entry.after.alertDivergencePct}`,
      ].join(' ');
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  async function restore(entry: PackHistoryEntry) {
    setRestoringId(entry.id);
    setMsg(null);
    try {
      const res = await fetchWithCsrf('/api/admin/pricing/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: entry.after }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut restaurar el model');
      }
      setMsg('Model de packs restaurat');
      router.refresh();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error restaurant');
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="ap-card p-5">
      <h2 className="text-lg font-semibold">Històric model econòmic packs</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          Rol
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'OWNER' | 'MANAGER' | 'VIEWER')}
            className="adm-input mt-1 w-full text-xs"
          >
            <option value="ALL">Tots</option>
            <option value="OWNER">OWNER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </label>
        <label className="text-xs">
          Des de
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="adm-input mt-1 w-full text-xs" />
        </label>
        <label className="text-xs">
          Fins a
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="adm-input mt-1 w-full text-xs" />
        </label>
        <label className="text-xs">
          Cercar canvis
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="marge, operari, especialista..." className="adm-input mt-1 w-full text-xs" />
        </label>
      </div>

      <div className="mt-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <p className="text-sm">Encara no hi ha versions desades del model de packs.</p>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{formatDateTimeFull(entry.createdAt)}</p>
                <button
                  type="button"
                  onClick={() => restore(entry)}
                  disabled={restoringId === entry.id}
                  className="ap-btn ap-btn--xs"
                >
                  {restoringId === entry.id ? 'Restaurant...' : 'Restaurar'}
                </button>
              </div>
              <p className="text-xs">
                Rol: {entry.role} · Objectiu marge: {(entry.after.marginTargetPct * 100).toFixed(1)}% · Llindar alerta: {entry.after.alertDivergencePct.toFixed(0)}%
              </p>
              <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                {changedNumber(entry.before.marginTargetPct, entry.after.marginTargetPct) && (
                  <p>margeTarget: {(entry.before.marginTargetPct * 100).toFixed(1)}% → {(entry.after.marginTargetPct * 100).toFixed(1)}% ({formatDelta(entry.before.marginTargetPct * 100, entry.after.marginTargetPct * 100, '%')})</p>
                )}
                {changedNumber(entry.before.socialSecurityPct, entry.after.socialSecurityPct) && (
                  <p>SS: {(entry.before.socialSecurityPct * 100).toFixed(1)}% → {(entry.after.socialSecurityPct * 100).toFixed(1)}% ({formatDelta(entry.before.socialSecurityPct * 100, entry.after.socialSecurityPct * 100, '%')})</p>
                )}
                {changedNumber(entry.before.withholdingPct, entry.after.withholdingPct) && (
                  <p>IRPF: {(entry.before.withholdingPct * 100).toFixed(1)}% → {(entry.after.withholdingPct * 100).toFixed(1)}% ({formatDelta(entry.before.withholdingPct * 100, entry.after.withholdingPct * 100, '%')})</p>
                )}
                {changedNumber(entry.before.operatorCostPerHour, entry.after.operatorCostPerHour) && (
                  <p>operari brut/h: {entry.before.operatorCostPerHour}€ → {entry.after.operatorCostPerHour}€ ({formatDelta(entry.before.operatorCostPerHour, entry.after.operatorCostPerHour, '€')})</p>
                )}
                {changedNumber(entry.before.specialistCostPerHour, entry.after.specialistCostPerHour) && (
                  <p>especialista brut/h: {entry.before.specialistCostPerHour}€ → {entry.after.specialistCostPerHour}€ ({formatDelta(entry.before.specialistCostPerHour, entry.after.specialistCostPerHour, '€')})</p>
                )}
                {changedNumber(entry.before.fixedPackCost, entry.after.fixedPackCost) && (
                  <p>cost fix pack: {entry.before.fixedPackCost}€ → {entry.after.fixedPackCost}€ ({formatDelta(entry.before.fixedPackCost, entry.after.fixedPackCost, '€')})</p>
                )}
                {changedNumber(entry.before.alertDivergencePct, entry.after.alertDivergencePct) && (
                  <p>llindar alerta: {entry.before.alertDivergencePct}% → {entry.after.alertDivergencePct}% ({formatDelta(entry.before.alertDivergencePct, entry.after.alertDivergencePct, '%')})</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </section>
  );
}

