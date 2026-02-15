'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';

interface Stat {
  key: string;
  label: string;
  description: string;
  icon: string;
  value: number;
  fallback: number;
  calculated: number;
  isManual: boolean;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStat, setEditingStat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      log.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEdit(stat: Stat) {
    setEditingStat(stat.key);
    setEditValue(stat.fallback.toString());
  }

  async function saveStat(key: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, fallback: parseFloat(editValue) }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadStats();
        setEditingStat(null);
      }
    } catch (error) {
      log.error('Error saving stat:', error);
    } finally {
      setSaving(false);
    }
  }

  async function resetStat(key: string) {
    if (!confirm('Resetar al valor calculat automàticament?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, resetToCalculated: true }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadStats();
      }
    } catch (error) {
      log.error('Error resetting stat:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const manualStats = stats.filter(s => s.isManual).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-200">
          📊 Estadístiques Públiques
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona les estadístiques que es mostren al lloc web
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/30 p-4">
          <div className="text-sm font-medium text-cyan-300">Valors automàtics</div>
          <div className="mt-1 text-3xl font-bold text-cyan-200">{stats.length - manualStats}</div>
          <div className="mt-1 text-xs text-cyan-300">Calculats des de la BD</div>
        </div>
        <div className="rounded-xl border border-orange-400/30 bg-orange-950/30 p-4">
          <div className="text-sm font-medium text-orange-300">Valors manuals</div>
          <div className="mt-1 text-3xl font-bold text-orange-200">{manualStats}</div>
          <div className="mt-1 text-xs text-orange-300">Configurats manualment</div>
        </div>
      </div>

      {/* Stats List */}
      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`border rounded-xl p-6 ${
              stat.isManual
                ? 'bg-orange-950/30 border-orange-400/30'
                : 'bg-slate-950/60 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-200">{stat.label}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{stat.description}</p>
                </div>
              </div>
              {stat.isManual && (
                <span className="px-2 py-1 bg-orange-500/15 text-orange-300 text-xs rounded font-medium">
                  Manual
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Valor Actual</div>
                <div className="text-2xl font-bold text-slate-200">{stat.value}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Valor Calculat</div>
                <div className="text-2xl font-bold text-cyan-300">{stat.calculated}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Valor Manual</div>
                <div className="text-2xl font-bold text-orange-300">
                  {stat.fallback || '—'}
                </div>
              </div>
            </div>

            {editingStat === stat.key ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg focus:ring-2 focus:ring-amber-500"
                  step="0.1"
                />
                <button
                  onClick={() => saveStat(stat.key)}
                  disabled={saving}
                  type="button"
                  aria-busy={saving}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-rose-600 disabled:opacity-50"
                >
                  {saving ? 'Desant...' : 'Desar'}
                </button>
                <button
                  onClick={() => setEditingStat(null)}
                  type="button"
                  className="px-4 py-2 bg-white/5 text-slate-300 rounded-lg font-medium hover:bg-white/10"
                >
                  Cancel·lar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(stat)}
                  type="button"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-slate-200 rounded-lg font-medium hover:bg-white/10"
                >
                  ✏️ Editar Valor Manual
                </button>
                {stat.isManual && (
                  <button
                    onClick={() => resetStat(stat.key)}
                    disabled={saving}
                    type="button"
                    aria-busy={saving}
                    className="px-4 py-2 bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 rounded-lg font-medium hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    🔄 Usar Valor Automàtic
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/30 p-4">
        <h3 className="mb-2 text-sm font-semibold text-cyan-200">ℹ️ Com funciona</h3>
        <ul className="space-y-1 text-sm text-cyan-300">
          <li>• Els <strong>valors automàtics</strong> es calculen des de les reserves completades</li>
          <li>• Pots establir <strong>valors manuals</strong> si vols mostrar números diferents</li>
          <li>• Els valors manuals es prioritzen sobre els calculats</li>
          <li>• Pots restablir a automàtic en qualsevol moment</li>
        </ul>
      </div>
    </div>
  );
}



