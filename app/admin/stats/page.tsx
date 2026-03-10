'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';
import { AdminPage } from '../components/AdminPage';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';

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
  const { confirm, dialogProps } = useConfirmDialog();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await fetchWithCsrf('/api/admin/stats');
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
      const res = await fetchWithCsrf('/api/admin/stats', {
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
    const ok = await confirm({ title: 'Resetar estadística', message: 'Resetar al valor calculat automàticament?', confirmLabel: 'Resetar', variant: 'warning' });
    if (!ok) return;

    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/stats', {
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
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  const manualStats = stats.filter(s => s.isManual).length;

  return (
    <AdminPage
      title="Estadístiques"
      subtitle="Gestiona les estadístiques que es mostren al lloc web"
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Valors automàtics</div>
          <div className="mt-1 text-3xl font-bold">{stats.length - manualStats}</div>
          <div className="mt-1 text-xs">Calculats des de la BD</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium">Valors manuals</div>
          <div className="mt-1 text-3xl font-bold">{manualStats}</div>
          <div className="mt-1 text-xs">Configurats manualment</div>
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
                : 'bg-black/60 border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{stat.icon}</span>
                <div>
                  <h3 className="font-semibold">{stat.label}</h3>
                  <p className="text-sm mt-0.5">{stat.description}</p>
                </div>
              </div>
              {stat.isManual && (
                <span className="px-2 py-1 text-xs rounded font-medium">
                  Manual
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs mb-1">Valor Actual</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs mb-1">Valor Calculat</div>
                <div className="text-2xl font-bold">{stat.calculated}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <div className="text-xs mb-1">Valor Manual</div>
                <div className="text-2xl font-bold">
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
                  className="flex-1 px-4 py-2 border border-white/10 rounded-xl focus:ring-2"
                  step="0.1"
                />
                <button
                  onClick={() => saveStat(stat.key)}
                  disabled={saving}
                  type="button"
                  aria-busy={saving}
                  className="px-6 py-2 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {saving ? 'Desant...' : 'Desar'}
                </button>
                <button
                  onClick={() => setEditingStat(null)}
                  type="button"
                  className="px-4 py-2 bg-white/5 rounded-xl font-medium hover:bg-white/10"
                >
                  Cancel·lar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(stat)}
                  type="button"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10"
                >
                  ✏️ Editar Valor Manual
                </button>
                {stat.isManual && (
                  <button
                    onClick={() => resetStat(stat.key)}
                    disabled={saving}
                    type="button"
                    aria-busy={saving}
                    className="px-4 py-2 border rounded-xl font-medium disabled:opacity-50"
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
      <div className="rounded-xl border p-4">
        <h3 className="mb-2 text-sm font-semibold">ℹ️ Com funciona</h3>
        <ul className="space-y-1 text-sm">
          <li>• Els <strong>valors automàtics</strong> es calculen des de les reserves completades</li>
          <li>• Pots establir <strong>valors manuals</strong> si vols mostrar números diferents</li>
          <li>• Els valors manuals es prioritzen sobre els calculats</li>
          <li>• Pots restablir a automàtic en qualsevol moment</li>
        </ul>
      </div>
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}

