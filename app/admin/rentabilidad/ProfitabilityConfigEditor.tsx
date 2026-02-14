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
        throw new Error(data?.error || 'No se pudo guardar configuración');
      }
      setMsg('Configuración guardada');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500';

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Configurar costes y CAC</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs text-slate-500">
          Coste pack ratio (0-1)
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
        <label className="text-xs text-slate-500">
          Coste extras ratio (0-1)
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
        <label className="text-xs text-slate-500">
          Coste hora extra ratio (0-1)
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
        <label className="text-xs text-slate-500">
          Coste operativo fijo (€)
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
        <p className="text-sm font-semibold text-slate-700">CAC por canal (€)</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(form.channelCac).map(([channel, value]) => (
            <label key={channel} className="text-xs text-slate-500">
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
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
        {msg && <p className="text-sm text-slate-500">{msg}</p>}
      </div>
    </section>
  );
}
