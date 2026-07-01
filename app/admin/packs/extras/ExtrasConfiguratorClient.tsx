"use client";

import { useEffect, useMemo, useState } from 'react';
import { ALL_SERVICES, type ExtraDefinition, type ServiceSlug } from '@/config/packs-config';
import { fetchWithCsrf } from '@/lib/csrf';
import { ADMIN_EXTRA_CATEGORY_OPTIONS, ADMIN_EXTRA_SERVICE_LABELS } from '@/lib/constants/admin';

const SERVICE_LABELS: Record<ServiceSlug, string> = ADMIN_EXTRA_SERVICE_LABELS;

const CATEGORY_OPTIONS: Array<{ value: ExtraDefinition['category']; label: string }> = [...ADMIN_EXTRA_CATEGORY_OPTIONS];

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
        const res = await fetchWithCsrf('/api/admin/extras', { cache: 'no-store' });
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
      const res = await fetchWithCsrf('/api/admin/extras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: extras }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Error desant');
      }
      setIsDefault(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desant');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ap-card p-6">
        Carregant configuració d\'extres...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Extres del configurador</h2>
          <p className="text-sm">
            Defineix nom, descripció i preu una sola vegada. Després activa cada extra per família.
          </p>
          {isDefault && (
            <p className="mt-2 text-xs">
              Estàs veient els valors per defecte del config.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExtras((prev) => [...prev, defaultExtra()])}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-colors"
          >
            + Nou extra
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ap-btn ap-btn--primary"
          >
            {saving ? 'Desant…' : 'Desar canvis'}
          </button>
        </div>
      </div>

      {error && (
        <div className="ap-card p-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {extras.map((extra, index) => (
          <div
            key={`${extra.id}-${index}`}
            className="ap-card p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-medium">
                  ID
                  <input
                    value={extra.id}
                    onChange={(e) => updateExtra(index, { id: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="id-extra"
                  />
                </label>
                <label className="text-xs font-medium">
                  Icona
                  <input
                    value={extra.icon || ''}
                    onChange={(e) => updateExtra(index, { icon: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="✨"
                  />
                </label>
                <label className="text-xs font-medium">
                  Nom
                  <input
                    value={extra.name}
                    onChange={(e) => updateExtra(index, { name: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Nom de l\'extra"
                  />
                </label>
                <label className="text-xs font-medium">
                  Categoria
                  <select
                    value={extra.category || 'other'}
                    onChange={(e) => updateExtra(index, { category: e.target.value as ExtraDefinition['category'] })}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium sm:col-span-2">
                  Descripció
                  <input
                    value={extra.description || ''}
                    onChange={(e) => updateExtra(index, { description: e.target.value })}
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Descripció breu"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-medium">
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
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium">
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
                <div className="flex flex-wrap gap-4 text-xs">
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
                className="rounded-xl border px-3 py-2 text-xs font-semibold"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase mb-2">Families disponibles</p>
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
                          ? 'admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
                          : 'border-[var(--line)] bg-[var(--raised)] text-[var(--t2)] hover:bg-[var(--raised)]'
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

