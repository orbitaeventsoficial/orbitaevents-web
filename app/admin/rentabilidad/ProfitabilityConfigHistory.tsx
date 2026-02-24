'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';
import { formatDateTimeFull } from '@/lib/constants';

type HistoryEntry = {
  id: string;
  createdAt: string;
  role: string;
  before: ProfitabilityConfig;
  after: ProfitabilityConfig;
};

function changedNumber(before: number, after: number): boolean {
  return Math.abs(before - after) > 0.000001;
}

function formatDelta(before: number, after: number, suffix = ''): string {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}${suffix}`;
}

export default function ProfitabilityConfigHistory({ entries }: { entries: HistoryEntry[] }) {
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
    if (dateFrom) {
      const fromTs = new Date(`${dateFrom}T00:00:00`).getTime();
      if (ts < fromTs) return false;
    }
    if (dateTo) {
      const toTs = new Date(`${dateTo}T23:59:59`).getTime();
      if (ts > toTs) return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const changedChannels = Object.keys(entry.after.channelCac)
        .filter((channel) => changedNumber(entry.before.channelCac[channel] || 0, entry.after.channelCac[channel] || 0))
        .join(' ')
        .toLowerCase();
      const haystack = [
        entry.role.toLowerCase(),
        changedChannels,
        `${entry.after.fixedOperationalCost}`,
        `${entry.after.packCostRatio}`,
        `${entry.after.extraCostRatio}`,
        `${entry.after.extraHourCostRatio}`,
      ].join(' ');
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  async function restore(entry: HistoryEntry) {
    setRestoringId(entry.id);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/reports/profitability/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: entry.after }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut restaurar la versio');
      }
      setMsg('Versio restaurada');
      router.refresh();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error restaurant');
    } finally {
      setRestoringId(null);
    }
  }

  function buildChangedChannels(entry: HistoryEntry): string[] {
    return Object.keys(entry.after.channelCac).filter((channel) =>
      changedNumber(entry.before.channelCac[channel] || 0, entry.after.channelCac[channel] || 0)
    );
  }

  function exportCsv() {
    const header = [
      'id',
      'created_at',
      'role',
      'pack_cost_ratio_before',
      'pack_cost_ratio_after',
      'extra_cost_ratio_before',
      'extra_cost_ratio_after',
      'extra_hour_cost_ratio_before',
      'extra_hour_cost_ratio_after',
      'fixed_cost_before',
      'fixed_cost_after',
      'changed_channels',
    ];

    const rows = filteredEntries.map((entry) => {
      const values = [
        entry.id,
        entry.createdAt,
        entry.role,
        String(entry.before.packCostRatio),
        String(entry.after.packCostRatio),
        String(entry.before.extraCostRatio),
        String(entry.after.extraCostRatio),
        String(entry.before.extraHourCostRatio),
        String(entry.after.extraHourCostRatio),
        String(entry.before.fixedOperationalCost),
        String(entry.after.fixedOperationalCost),
        buildChangedChannels(entry).join('|'),
      ];
      return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `rendibilitat-history-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-white/10 p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Històric de configuració</h2>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/5"
        >
          Exportar CSV (filtrat)
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          Rol
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'OWNER' | 'MANAGER' | 'VIEWER')}
            className="mt-1 w-full rounded-md border px-2 py-1.5 text-xs"
          >
            <option value="ALL">Tots</option>
            <option value="OWNER">OWNER</option>
            <option value="MANAGER">MANAGER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </label>
        <label className="text-xs">
          Des de
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5 text-xs"
          />
        </label>
        <label className="text-xs">
          Fins a
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 w-full rounded-md border px-2 py-1.5 text-xs"
          />
        </label>
        <label className="text-xs">
          Cercar canvis
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="canal, ràtio, cost..."
            className="mt-1 w-full rounded-md border px-2 py-1.5 text-xs"
          />
        </label>
      </div>
      <div className="mt-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <p className="text-sm">Encara no hi ha versions desades.</p>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {formatDateTimeFull(entry.createdAt)}
                </p>
                <button
                  type="button"
                  onClick={() => restore(entry)}
                  disabled={restoringId === entry.id}
                  className="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/5 disabled:opacity-60"
                >
                  {restoringId === entry.id ? 'Restaurant...' : 'Restaurar'}
                </button>
              </div>
              <p className="text-xs">
                Rol: {entry.role} · Cost fix: {entry.after.fixedOperationalCost}€ ·
                {' '}Pack ratio: {(entry.after.packCostRatio * 100).toFixed(1)}%
              </p>
              <div className="mt-2 rounded-md bg-white/5 p-2">
                <p className="text-xs font-semibold">Canvis</p>
                <div className="mt-1 grid gap-1 text-xs sm:grid-cols-2">
                  {changedNumber(entry.before.packCostRatio, entry.after.packCostRatio) && (
                    <p>
                      packCostRatio: {(entry.before.packCostRatio * 100).toFixed(1)}% → {(entry.after.packCostRatio * 100).toFixed(1)}%
                      {' '}({formatDelta(entry.before.packCostRatio * 100, entry.after.packCostRatio * 100, '%')})
                    </p>
                  )}
                  {changedNumber(entry.before.extraCostRatio, entry.after.extraCostRatio) && (
                    <p>
                      extraCostRatio: {(entry.before.extraCostRatio * 100).toFixed(1)}% → {(entry.after.extraCostRatio * 100).toFixed(1)}%
                      {' '}({formatDelta(entry.before.extraCostRatio * 100, entry.after.extraCostRatio * 100, '%')})
                    </p>
                  )}
                  {changedNumber(entry.before.extraHourCostRatio, entry.after.extraHourCostRatio) && (
                    <p>
                      extraHourCostRatio: {(entry.before.extraHourCostRatio * 100).toFixed(1)}% → {(entry.after.extraHourCostRatio * 100).toFixed(1)}%
                      {' '}({formatDelta(entry.before.extraHourCostRatio * 100, entry.after.extraHourCostRatio * 100, '%')})
                    </p>
                  )}
                  {changedNumber(entry.before.fixedOperationalCost, entry.after.fixedOperationalCost) && (
                    <p>
                      fixedOperationalCost: {entry.before.fixedOperationalCost}€ → {entry.after.fixedOperationalCost}€
                      {' '}({formatDelta(entry.before.fixedOperationalCost, entry.after.fixedOperationalCost, '€')})
                    </p>
                  )}
                </div>
                <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                  {Object.keys(entry.after.channelCac)
                    .filter((channel) => changedNumber(entry.before.channelCac[channel] || 0, entry.after.channelCac[channel] || 0))
                    .map((channel) => (
                      <p key={channel}>
                        CAC {channel}: {entry.before.channelCac[channel] || 0}€ → {entry.after.channelCac[channel] || 0}€
                        {' '}({formatDelta(entry.before.channelCac[channel] || 0, entry.after.channelCac[channel] || 0, '€')})
                      </p>
                    ))}
                </div>
                {!changedNumber(entry.before.packCostRatio, entry.after.packCostRatio)
                  && !changedNumber(entry.before.extraCostRatio, entry.after.extraCostRatio)
                  && !changedNumber(entry.before.extraHourCostRatio, entry.after.extraHourCostRatio)
                  && !changedNumber(entry.before.fixedOperationalCost, entry.after.fixedOperationalCost)
                  && Object.keys(entry.after.channelCac).every(
                    (channel) => !changedNumber(entry.before.channelCac[channel] || 0, entry.after.channelCac[channel] || 0)
                  ) && (
                    <p className="mt-1 text-xs">No s\'han detectat canvis (possible desat identic).</p>
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





