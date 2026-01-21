'use client';

import { useState, useEffect } from 'react';

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
      console.error('Error loading stats:', error);
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
      console.error('Error saving stat:', error);
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
      console.error('Error resetting stat:', error);
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
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          📊 Estadístiques Públiques
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona les estadístiques que es mostren al lloc web
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Valors Automàtics</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{stats.length - manualStats}</div>
          <div className="text-xs text-blue-600 mt-1">Calculats des de la BD</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="text-sm text-orange-600 font-medium">Valors Manuals</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{manualStats}</div>
          <div className="text-xs text-orange-600 mt-1">Configurats manualment</div>
        </div>
      </div>

      {/* Stats List */}
      <div className="space-y-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`border rounded-xl p-6 ${
              stat.isManual
                ? 'bg-orange-50 border-orange-200'
                : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-700">{stat.label}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{stat.description}</p>
                </div>
              </div>
              {stat.isManual && (
                <span className="px-2 py-1 bg-orange-200 text-orange-700 text-xs rounded font-medium">
                  Manual
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Valor Actual</div>
                <div className="text-2xl font-bold text-slate-700">{stat.value}</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Valor Calculat</div>
                <div className="text-2xl font-bold text-blue-600">{stat.calculated}</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Valor Manual</div>
                <div className="text-2xl font-bold text-orange-600">
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
                  className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  step="0.1"
                />
                <button
                  onClick={() => saveStat(stat.key)}
                  disabled={saving}
                  type="button"
                  aria-busy={saving}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-rose-600 disabled:opacity-50"
                >
                  {saving ? 'Guardant...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setEditingStat(null)}
                  type="button"
                  className="px-4 py-2 bg-stone-100 text-slate-600 rounded-lg font-medium hover:bg-stone-200"
                >
                  Cancel·lar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(stat)}
                  type="button"
                  className="flex-1 px-4 py-2 bg-stone-100 border border-stone-200 text-slate-700 rounded-lg font-medium hover:bg-stone-200"
                >
                  ✏️ Editar Valor Manual
                </button>
                {stat.isManual && (
                  <button
                    onClick={() => resetStat(stat.key)}
                    disabled={saving}
                    type="button"
                    aria-busy={saving}
                    className="px-4 py-2 bg-blue-100 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-200 disabled:opacity-50"
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
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Com funciona</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Els <strong>valors automàtics</strong> es calculen des de les reserv es completades</li>
          <li>• Pots establir <strong>valors manuals</strong> si vols mostrar números diferents</li>
          <li>• Els valors manuals es prioritzen sobre els calculats</li>
          <li>• Pots resetar a automàtic en qualsevol moment</li>
        </ul>
      </div>
    </div>
  );
}
