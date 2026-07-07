'use client';

import { useState } from 'react';
import type { PackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { fetchWithCsrf } from '@/lib/csrf';

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

// Chips canònics: les classes `.admin-pack-model-chip--*` només existien sota el
// selector mort `.admin-shell` → els semàfors queien sense color. Ara `admin-tone-*`.
const CHIP_BASE = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold';
function statusBadge(value: number, warn: number, danger: number) {
  if (value >= danger) return `${CHIP_BASE} admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger`;
  if (value >= warn) return `${CHIP_BASE} admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning`;
  return `${CHIP_BASE} admin-tone-border-success admin-tone-bg-success admin-tone-text-success`;
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
      const res = await fetchWithCsrf('/api/admin/pricing/model-config', {
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

  // Input canònic de la sèrie (admin-shell.css). Abans `admin-pack-model-input`
  // no existia al CSS → els inputs queien al fons blanc per defecte del navegador.
  const inputClass = 'adm-input w-full';
  const marginClass = statusBadge(form.marginTargetPct, 0.6, 0.75);
  const ssClass = statusBadge(form.socialSecurityPct, 0.38, 0.5);
  const irpfClass = statusBadge(form.withholdingPct, 0.18, 0.26);
  const divergenceClass = form.alertDivergencePct >= 30
    ? `${CHIP_BASE} admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger`
    : form.alertDivergencePct >= 20
      ? `${CHIP_BASE} admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning`
      : `${CHIP_BASE} admin-tone-border-success admin-tone-bg-success admin-tone-text-success`;

  return (
    <section className="ap-card p-5">
      <h2 className="ap-h2">Model econòmic de packs</h2>
      <p className="mt-1 text-xs">
        Aquesta configuració calcula PVP recomanat, hora extra recomanada i alertes de divergència a packs. El recomanat comercial s'arrodoneix sempre amunt a desenes.
      </p>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs">
              Objectiu marge (0-1)
              <input id="pack-model-marginTargetPct" type="number" step="0.01" min={0.1} max={0.9} className={inputClass} value={form.marginTargetPct} onChange={(e) => update('marginTargetPct', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              SS empresa (0-1)
              <input id="pack-model-socialSecurityPct" type="number" step="0.01" min={0} max={1} className={inputClass} value={form.socialSecurityPct} onChange={(e) => update('socialSecurityPct', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              IRPF (0-1)
              <input id="pack-model-withholdingPct" type="number" step="0.01" min={0} max={1} className={inputClass} value={form.withholdingPct} onChange={(e) => update('withholdingPct', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Operari net €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.operatorNetCostPerHour} onChange={(e) => update('operatorNetCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Operari brut €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.operatorCostPerHour} onChange={(e) => update('operatorCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Especialista net €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.specialistNetCostPerHour} onChange={(e) => update('specialistNetCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Especialista brut €/h
              <input type="number" step="0.1" min={0} className={inputClass} value={form.specialistCostPerHour} onChange={(e) => update('specialistCostPerHour', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Cost fix per pack (€)
              <input type="number" step="1" min={0} className={inputClass} value={form.fixedPackCost} onChange={(e) => update('fixedPackCost', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Llindar alerta divergència (%)
              <input id="pack-model-alertDivergencePct" type="number" step="1" min={1} className={inputClass} value={form.alertDivergencePct} onChange={(e) => update('alertDivergencePct', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Operari si convidats ≥
              <input type="number" step="1" min={1} className={inputClass} value={form.supportOperatorMinGuests} onChange={(e) => update('supportOperatorMinGuests', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Operari si hores DJ ≥
              <input type="number" step="1" min={1} className={inputClass} value={form.supportOperatorMinDjHours} onChange={(e) => update('supportOperatorMinDjHours', Number(e.target.value))} />
            </label>
            <label className="text-xs">
              Operari si watts ≥
              <input type="number" step="100" min={1} className={inputClass} value={form.supportOperatorMinWatts} onChange={(e) => update('supportOperatorMinWatts', Number(e.target.value))} />
            </label>
          </div>

          <label className="block text-xs">
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
              className="ap-btn ap-btn--primary"
            >
              {saving ? 'Desant...' : 'Desar model packs'}
            </button>
            {msg && <p className="text-sm">{msg}</p>}
          </div>
        </div>

        <aside className="rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-4">
          <h3 className="text-sm font-semibold">Lectura ràpida de coeficients</h3>
          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3">
              <p className="font-semibold">Objectiu marge: {pct(form.marginTargetPct)}</p>
              <button
                type="button"
                onClick={() => focusField('pack-model-marginTargetPct')}
                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${marginClass}`}
              >
                Semàfor marge
              </button>
            </div>
            <div className="rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3">
              <p className="font-semibold">SS: {pct(form.socialSecurityPct)} · IRPF: {pct(form.withholdingPct)}</p>
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
            <div className="rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3">
              <p className="font-semibold">Llindar alerta: {form.alertDivergencePct.toFixed(0)}%</p>
              <button
                type="button"
                onClick={() => focusField('pack-model-alertDivergencePct')}
                className={`mt-1 inline-flex rounded-full border px-2 py-0.5 font-semibold ${divergenceClass}`}
              >
                Semàfor divergència
              </button>
            </div>
            <div className="rounded-[var(--o-r-md)] border border-[var(--line)] bg-[var(--sunk)] p-3">
              <p>Cost equip/hora usat al càlcul = inventari/h + personal/h + cost fix.</p>
              <p className="mt-1">PVP recomanat = cost / (1 - objectiu marge), arrodonit amunt a acabat en 0.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
