'use client';

import { useState } from 'react';
import type { ProfitabilityConfig } from '@/lib/services/profitabilityService';

export default function ProfitabilityConfigEditor({ initial }: { initial: ProfitabilityConfig }) {
  const [form, setForm] = useState<ProfitabilityConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof ProfitabilityConfig>(key: K, value: ProfitabilityConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCac(channel: string, value: number) {
    setForm((prev) => ({
      ...prev,
      channelCac: {
        ...prev.channelCac,
        [channel]: value,
      },
    }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/reports/profitability/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut desar la configuració');
      }
      setMsg('Configuració desada');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error en desar');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-stone-300 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500';

  function ratioBadge(value: number, warnAt: number, dangerAt: number) {
    if (value >= dangerAt) return { label: 'Fora marge', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' };
    if (value >= warnAt) return { label: 'A vigilar', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
    return { label: 'Dins marge', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
  }

  const packState = ratioBadge(form.packCostRatio, 0.45, 0.55);
  const extrasState = ratioBadge(form.extraCostRatio, 0.35, 0.45);
  const extraHourState = ratioBadge(form.extraHourCostRatio, 0.30, 0.40);
  const fixedState =
    form.fixedOperationalCost >= 120
      ? { label: 'Fora marge', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/40' }
      : form.fixedOperationalCost >= 80
        ? { label: 'A vigilar', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' }
        : { label: 'Dins marge', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
  const criticalIssues = [
    form.packCostRatio <= 0 ? 'Falta ratio de cost del pack' : null,
    form.extraCostRatio <= 0 ? 'Falta ratio de cost dels extres' : null,
    form.extraHourCostRatio <= 0 ? 'Falta ratio de cost d’hora extra' : null,
    form.fixedOperationalCost <= 0 ? 'Falta cost operatiu fix' : null,
  ].filter(Boolean) as string[];

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-100">Configuració de costos i CAC</h2>
      {criticalIssues.length > 0 && (
        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          <p className="font-semibold">Dades crítiques pendents</p>
          <p className="mt-1">{criticalIssues.join(' · ')}</p>
        </div>
      )}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs text-slate-400">
              Ratio cost pack (0-1)
              <input
                type="number"
                step="0.01"
                min={0}
                max={1}
                className={inputClass}
                value={form.packCostRatio}
                onChange={(e) => update('packCostRatio', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Ratio cost extres (0-1)
              <input
                type="number"
                step="0.01"
                min={0}
                max={1}
                className={inputClass}
                value={form.extraCostRatio}
                onChange={(e) => update('extraCostRatio', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Ratio cost hora extra (0-1)
              <input
                type="number"
                step="0.01"
                min={0}
                max={1}
                className={inputClass}
                value={form.extraHourCostRatio}
                onChange={(e) => update('extraHourCostRatio', Number(e.target.value))}
              />
            </label>
            <label className="text-xs text-slate-400">
              Cost operatiu fix (EUR)
              <input
                type="number"
                step="1"
                className={inputClass}
                value={form.fixedOperationalCost}
                onChange={(e) => update('fixedOperationalCost', Number(e.target.value))}
              />
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-200">CAC per canal (EUR)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(form.channelCac).map(([channel, value]) => (
                <label key={channel} className="text-xs text-slate-400">
                  {channel}
                  <input
                    type="number"
                    step="1"
                    className={inputClass}
                    value={value}
                    onChange={(e) => updateCac(channel, Number(e.target.value))}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? 'Desant...' : 'Desar configuració'}
            </button>
            {msg && <p className="text-sm text-slate-400">{msg}</p>}
          </div>
        </div>

        <aside className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <h3 className="text-sm font-semibold text-slate-100">Guia ràpida de coeficients</h3>
          <p className="mt-1 text-xs text-slate-400">
            Cada ratio és un coeficient de cost. A més ratio, menys marge.
          </p>
          <div className="mt-3 space-y-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-slate-200">Pack: {(form.packCostRatio * 100).toFixed(1)}%</p>
              <p className="text-slate-400">Calcula el cost directe del pack.</p>
              <p className="text-slate-400">Marge teòric: {(100 - form.packCostRatio * 100).toFixed(1)}%</p>
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${packState.cls}`}>{packState.label}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-slate-200">Extres: {(form.extraCostRatio * 100).toFixed(1)}%</p>
              <p className="text-slate-400">Cost intern estimat dels extres.</p>
              <p className="text-slate-400">Marge teòric: {(100 - form.extraCostRatio * 100).toFixed(1)}%</p>
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${extrasState.cls}`}>{extrasState.label}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-slate-200">Hora extra: {(form.extraHourCostRatio * 100).toFixed(1)}%</p>
              <p className="text-slate-400">Cost intern de cada hora addicional.</p>
              <p className="text-slate-400">Marge teòric: {(100 - form.extraHourCostRatio * 100).toFixed(1)}%</p>
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${extraHourState.cls}`}>{extraHourState.label}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="font-semibold text-slate-200">Cost operatiu fix: {form.fixedOperationalCost.toFixed(0)}€</p>
              <p className="text-slate-400">Cost fix per servei (temps, gestió, logística).</p>
              <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${fixedState.cls}`}>{fixedState.label}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}


