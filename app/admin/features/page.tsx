'use client';

import { useEffect, useState } from 'react';
import { log } from '@/lib/logger';

interface Feature {
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      const res = await fetch('/api/admin/features');
      const data = await res.json();
      if (data.ok) {
        setFeatures(data.features);
      }
    } catch (error) {
      log.error('Error cargando features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentValue: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          enabled: !currentValue,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadFeatures();
      } else {
        alert(data.error || 'Error actualizando feature');
      }
    } catch (error) {
      log.error('Error actualizando feature:', error);
      alert('Error actualizando feature');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  const enabledCount = features.filter((f) => f.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          Features Toggle
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Activa o desactiva funcionalidades del sitio web
        </p>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Features</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{features.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Activas</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{enabledCount}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-orange-600 uppercase">Desactivadas</p>
          <p className="mt-2 text-3xl font-bold text-orange-700">
            {features.length - enabledCount}
          </p>
        </div>
      </section>

      {/* Info Alert */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Desactivar una funcionalidad la ocultará de la web pública,
          pero los datos asociados permanecerán en la base de datos.
        </p>
      </div>

      {/* Features List */}
      <section className="space-y-3">
        {features.map((feature) => (
          <div
            key={feature.key}
            className={`rounded-xl border bg-stone-50 p-6 shadow-sm transition-all ${
              feature.enabled
                ? 'border-green-200 ring-2 ring-green-100'
                : 'border-stone-200 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <h3 className="font-semibold text-slate-700">{feature.label}</h3>
                    <p className="text-xs text-slate-400 font-mono">{feature.key}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 ml-12">{feature.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span
                    className={`text-xs font-medium uppercase ${
                      feature.enabled ? 'text-green-700' : 'text-slate-500'
                    }`}
                  >
                    {feature.enabled ? 'Activa' : 'Desactivada'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggle(feature.key, feature.enabled)}
                  disabled={saving}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    feature.enabled ? 'bg-green-500' : 'bg-stone-300'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      feature.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {features.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
          <span className="text-4xl">🎛️</span>
          <p className="mt-4 text-slate-600">No hay features configuradas</p>
          <p className="text-sm text-slate-400">Ejecuta el seed para cargar las features iniciales</p>
        </div>
      )}
    </div>
  );
}
