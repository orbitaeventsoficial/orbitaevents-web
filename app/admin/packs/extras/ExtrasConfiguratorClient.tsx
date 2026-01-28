"use client";

import { useEffect, useMemo, useState } from 'react';
import { ALL_SERVICES, type ExtraDefinition, type ServiceSlug } from '@/config/packs-config';

const SERVICE_LABELS: Record<ServiceSlug, string> = {
  bodas: 'Bodes',
  fiestas: 'Festes',
  discomovil: 'Discomòbil',
  empresas: 'Empreses',
  produccion: 'Producció',
  alquiler: 'Lloguer',
};

const CATEGORY_OPTIONS: Array<{ value: ExtraDefinition['category']; label: string }> = [
  { value: 'effects', label: 'Efectes' },
  { value: 'visual', label: 'Visual' },
  { value: 'time', label: 'Temps' },
  { value: 'sound', label: 'So' },
  { value: 'lighting', label: 'Il·luminació' },
  { value: 'other', label: 'Altres' },
];

const defaultExtra = (): ExtraDefinition => ({
  id: '',
  name: '',
  description: '',
  price: 0,
  consultarPrecio: false,
  icon: '✨',
  category: 'other',
  compatibleWith: [],
  popular: false,
  premium: false,
});

export default function ExtrasConfiguratorClient() {
  const [extras, setExtras] = useState<ExtraDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const serviceList = useMemo(() => ALL_SERVICES, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/extras', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        setExtras(Array.isArray(data?.config) ? data.config : []);
        setIsDefault(Boolean(data?.isDefault));
        setError(null);
      } catch (err) {
        if (!active) return;
        setError('No s\'ha pogut carregar la configuració.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const updateExtra = (index: number, patch: Partial<ExtraDefinition>) => {
    setExtras((prev) =>
      prev.map((extra, i) => (i === index ? { ...extra, ...patch } : extra))
    );
  };

  const toggleService = (index: number, service: ServiceSlug) => {
    setExtras((prev) =>
      prev.map((extra, i) => {
        if (i !== index) return extra;
        const current = new Set(extra.compatibleWith ?? []);
        if (current.has(service)) {
          current.delete(service);
        } else {
          current.add(service);
        }
        return { ...extra, compatibleWith: Array.from(current) };
      })
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/admin/extras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: extras }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Error guardant');
      }
      setIsDefault(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 text-slate-300">
        Carregant configuració d\'extres...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Extres del configurador</h2>
          <p className="text-sm text-slate-400">
            Defineix nom, descripció i preu una sola vegada. Després activa cada extra per família.
          </p>
          {isDefault && (
            <p className="mt-2 text-xs text-amber-300">
              Estàs veient els valors per defecte del config.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExtras((prev) => [...prev, defaultExtra()])}
            className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
          >
            + Nou extra
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-xl bg-emerald-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {saving ? 'Guardant…' : 'Guardar canvis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {extras.map((extra, index) => (
          <div
            key={`${extra.id}-${index}`}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium text-slate-400">
                  ID
                  <input
                    value={extra.id}
                    onChange={(e) => updateExtra(index, { id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                    placeholder="id-extra"
                  />
                </label>
                <label className="text-xs font-medium text-slate-400">
                  Icona
                  <input
                    value={extra.icon || ''}
                    onChange={(e) => updateExtra(index, { icon: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                    placeholder="✨"
                  />
                </label>
                <label className="text-xs font-medium text-slate-400">
                  Nom
                  <input
                    value={extra.name}
                    onChange={(e) => updateExtra(index, { name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                    placeholder="Nom de l\'extra"
                  />
                </label>
                <label className="text-xs font-medium text-slate-400">
                  Categoria
                  <select
                    value={extra.category || 'other'}
                    onChange={(e) => updateExtra(index, { category: e.target.value as ExtraDefinition['category'] })}
                    className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-slate-400 sm:col-span-2">
                  Descripció
                  <input
                    value={extra.description || ''}
                    onChange={(e) => updateExtra(index, { description: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                    placeholder="Descripció breu"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-400">
                    Preu (€)
                    <input
                      type="number"
                      value={extra.consultarPrecio ? '' : (extra.price ?? '')}
                      onChange={(e) =>
                        updateExtra(index, {
                          price: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      disabled={Boolean(extra.consultarPrecio)}
                      className="mt-1 w-full rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <input
                      type="checkbox"
                      checked={Boolean(extra.consultarPrecio)}
                      onChange={(e) =>
                        updateExtra(index, {
                          consultarPrecio: e.target.checked,
                          price: e.target.checked ? null : extra.price ?? 0,
                        })
                      }
                    />
                    Preu a consultar
                  </label>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(extra.popular)}
                      onChange={(e) => updateExtra(index, { popular: e.target.checked })}
                    />
                    Popular
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(extra.premium)}
                      onChange={(e) => updateExtra(index, { premium: e.target.checked })}
                    />
                    Premium
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExtras((prev) => prev.filter((_, i) => i !== index))}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/20"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase text-slate-400 mb-2">Families disponibles</p>
              <div className="flex flex-wrap gap-2">
                {serviceList.map((service) => {
                  const active = extra.compatibleWith?.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(index, service)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                          : 'border-slate-600/50 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      {SERVICE_LABELS[service]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
