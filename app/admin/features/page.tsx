'use client';

import { useState, useEffect } from 'react';

// Metadata se afegirà via layout o cal exportar-ho manualment

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
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const res = await fetch('/api/admin/features');
      const data = await res.json();
      if (data.ok) {
        setFeatures(data.features);
      }
    } catch (error) {
      console.error('Error loading features:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(key: string, enabled: boolean) {
    setSaving(key);
    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      });

      const data = await res.json();
      if (data.ok) {
        setFeatures(features.map(f =>
          f.key === key ? { ...f, enabled } : f
        ));
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeCount = features.filter(f => f.enabled).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          🎛️ Features Toggle
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Activa o desactiva funcionalitats del lloc web
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Total Features</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{features.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">Actives</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200 rounded-xl p-4">
          <div className="text-sm text-slate-600 font-medium">Desactivades</div>
          <div className="text-3xl font-bold text-slate-700 mt-1">{features.length - activeCount}</div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Funcionalitats</h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="bg-stone-100 border border-stone-200 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-700">{feature.label}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{feature.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFeature(feature.key, !feature.enabled)}
                disabled={saving === feature.key}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  feature.enabled ? 'bg-green-500' : 'bg-gray-300'
                } ${saving === feature.key ? 'opacity-50' : ''}`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    feature.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
