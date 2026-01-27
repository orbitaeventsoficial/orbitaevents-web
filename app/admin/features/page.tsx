'use client';

import { useState, useEffect } from 'react';
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
      log.error('Error loading features:', error);
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
      log.error('Error toggling feature:', error);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeCount = features.filter(f => f.enabled).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
          🎛️ Features Toggle
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Activa o desactiva funcionalitats del lloc web
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-600/5 backdrop-blur-sm p-4">
          <div className="text-xs font-medium text-cyan-400 uppercase">Total Features</div>
          <div className="text-3xl font-bold text-slate-100 mt-2">{features.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-4">
          <div className="text-xs font-medium text-emerald-400 uppercase">Actives</div>
          <div className="text-3xl font-bold text-slate-100 mt-2">{activeCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
          <div className="text-xs font-medium text-slate-400 uppercase">Desactivades</div>
          <div className="text-3xl font-bold text-slate-100 mt-2">{features.length - activeCount}</div>
        </div>
      </div>

      {/* Features List */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Funcionalitats</h2>
        <div className="space-y-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="bg-slate-700/30 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-100">{feature.label}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{feature.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFeature(feature.key, !feature.enabled)}
                disabled={saving === feature.key}
                type="button"
                role="switch"
                aria-checked={feature.enabled}
                aria-busy={saving === feature.key}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  feature.enabled ? 'bg-emerald-500' : 'bg-slate-600'
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
