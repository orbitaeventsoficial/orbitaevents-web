'use client';

import { useState } from 'react';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function statusBadge(value: number, warn: number, danger: number) {
  if (value >= danger) return 'admin-pack-model-chip admin-pack-model-chip--danger';
  if (value >= warn) return 'admin-pack-model-chip admin-pack-model-chip--warn';
  return 'admin-pack-model-chip admin-pack-model-chip--ok';
}

export default function PackPricingModelEditor({ initial }: { initial: PackPricingModelConfig }) {
  const [form, setForm] = useState<PackPricingModelConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof PackPricingModelConfig>(key: K, value: PackPricingModelConfig[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/pricing/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No s\'ha pogut desar la configuració');
      }
      setMsg('Configuració de packs desada');
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'Error en desar');
    } finally {
      setSaving(false);
    }
  }

  function focusField(fieldId: string) {
    if (typeof document === 'undefined') return;
    const field = document.getElementById(fieldId) as HTMLInputElement | null;
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      field.focus();
      field.select?.();
    }, 120);
  }

  const inputClass = 'admin-pack-model-input w-full rounded-xl border px-3 py-2 text-sm';
  const marginClass = statusBadge(form.marginTargetPct, 0.6, 0.75);
  const ssClass = statusBadge(form.socialSecurityPct, 0.38, 0.5);
  const irpfClass = statusBadge(form.withholdingPct, 0.18, 0.26);
  const divergenceClass = form.alertDivergencePct >= 30
    ? 'admin-pack-model-chip admin-pack-model-chip--danger'
    : form.alertDivergencePct >= 20
      ? 'admin-pack-model-chip admin-pack-model-chip--warn'
      : 'admin-pack-model-chip admin-pack-model-chip--ok';

  return (
    <section className="admin-pack-model rounded-2xl border p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-100">Model econòmic de packs</h2>
      <p className="mt-1 text-xs text-slate-400">
        Aquesta configuració calcula PVP recomanat, hora extra recomanada i alertes de divergència a packs.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs text-slate-400">
              Objectiu marge (0-1)
              <input id="pack-model-marginTargetPct" type="number" step="0.01" min={0.1} max={0.9} className={inputClass} value={form.marginTargetPct} onChange={(e) => update('marginTargetPct', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              SS empresa (0-1)
              <input id="pack-model-socialSecurityPct" type="number" step="0.01" min={0} max={1} className={inputClass} value={form.socialSecurityPct} onChange={(e) => update('socialSecurityPct', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              IRPF (0-1)
              <input id="pack-model-withholdingPct" type="number" step="0.01" min={0} max={1} className={inputClass} value={form.withholdingPct} onChange={(e) => update('withholdingPct', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Operari net €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.operatorNetCostPerHour} onChange={(e) => update('operatorNetCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Operari brut €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.operatorCostPerHour} onChange={(e) => update('operatorCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Especialista net €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.specialistNetCostPerHour} onChange={(e) => update('specialistNetCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Especialista brut €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.specialistCostPerHour} onChange={(e) => update('specialistCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Cost fix per pack (€)
              <input type="number" step="1" min={0} className={inputClass} value={form.fixedPackCost} onChange={(e) => update('fixedPackCost', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Llindar alerta divergència (%)
              <input id="pack-model-alertDivergencePct" type="number" step="1" min={1} className={inputClass} value={form.alertDivergencePct} onChange={(e) => update('alertDivergencePct', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Operari si convidats ≥
              <input type="number" step="1" min={1} className={inputClass} value={form.supportOperatorMinGuests} onChange={(e) => update('supportOperatorMinGuests', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Operari si hores DJ ≥
              <input type="number" step="1" min={1} className={inputClass} value={form.supportOperatorMinDjHours} onChange={(e) => update('supportOperatorMinDjHours', Number(e.target.value))} />
            </label>
            <label className="text-xs text-slate-400">
              Operari si watts ≥
              <input type="number" step="100" min={1} className={inputClass} value={form.supportOperatorMinWatts} onChange={(e) => update('supportOperatorMinWatts', Number(e.target.value))} />
            </label>
          </div>

          <label className="block text-xs text-slate-400">
            Serveis amb especialista (CSV)
            <input
              type="text"
              className={inputClass}
              value={form.specialistServices.join(',')}
              onChange={(e) =>
                update('specialistServices', e.target.value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean))
              }
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="admin-pack-model-save rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Desant...' : 'Desar model packs'}
            </button>
            {msg && <p className="text-sm text-slate-400">{msg}</p>}
          </div>
        </div>

        <aside className="admin-pack-model-aside rounded-xl border p-4">
          <h3 className="text-sm font-semibold text-slate-100">Lectura ràpida de coeficients</h3>
          <div className="mt-3 space-y-2 text-xs">
            <div className="admin-pack-model-note rounded-lg border p-3">
              <p className="font-semibold text-slate-200">Objectiu marge: {pct(form.marginTargetPct)}</p>
              <button
                type="button"
                onClick={() => focusField('pack-model-marginTargetPct')}
                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${marginClass}`}
              >
                Semàfor marge
              </button>
            </div>
            <div className="admin-pack-model-note rounded-lg border p-3">
              <p className="font-semibold text-slate-200">SS: {pct(form.socialSecurityPct)} · IRPF: {pct(form.withholdingPct)}</p>
              <button
                type="button"
                onClick={() => focusField('pack-model-socialSecurityPct')}
                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${ssClass}`}
              >
                Semàfor SS
              </button>
              <button
                type="button"
                onClick={() => focusField('pack-model-withholdingPct')}
                className={`ml-2 inline-flex rounded-full border px-2 py-0.5 font-semibold ${irpfClass}`}
              >
                Semàfor IRPF
              </button>
            </div>
            <div className="admin-pack-model-note rounded-lg border p-3">
              <p className="font-semibold text-slate-200">Llindar alerta: {form.alertDivergencePct.toFixed(0)}%</p>
              <button
                type="button"
                onClick={() => focusField('pack-model-alertDivergencePct')}
                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${divergenceClass}`}
              >
                Semàfor divergència
              </button>
            </div>
            <div className="admin-pack-model-note rounded-lg border p-3 text-slate-300">
              <p>Cost equip/hora usat al càlcul = inventari/h + personal/h + cost fix.</p>
              <p className="mt-1">PVP recomanat = cost / (1 - objectiu marge).</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
