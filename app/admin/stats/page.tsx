'use client';

import { useEffect, useState } from 'react';
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
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      log.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stat: Stat) => {
    setEditingKey(stat.key);
    setEditValue(stat.fallback);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue(0);
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          fallback: editValue,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadStats();
        setEditingKey(null);
      } else {
        alert(data.error || 'Error actualizando estadística');
      }
    } catch (error) {
      log.error('Error actualizando estadística:', error);
      alert('Error actualizando estadística');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToCalculated = async (key: string) => {
    if (!confirm('¿Resetear al valor calculado automáticamente?')) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          resetToCalculated: true,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadStats();
      }
    } catch (error) {
      log.error('Error reseteando estadística:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          Estadísticas Públicas
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona los números que aparecen en la web pública
        </p>
      </header>

      {/* Info Alert */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Cómo funciona:</strong> Las estadísticas se calculan automáticamente desde las
          reservas completadas. Puedes establecer un valor manual (fallback) si quieres mostrar un
          número inicial más alto o redondear las cifras.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const isEditing = editingKey === stat.key;
          const displayValue = stat.isManual ? stat.fallback : stat.value;

          return (
            <div
              key={stat.key}
              className={`rounded-xl border bg-stone-50 shadow-sm overflow-hidden ${
                stat.isManual
                  ? 'border-orange-300 ring-2 ring-orange-100'
                  : 'border-stone-200'
              }`}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{stat.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-700">{stat.label}</h3>
                    <p className="text-xs text-slate-400 font-mono">{stat.key}</p>
                  </div>
                  {stat.isManual && (
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      Manual
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">{stat.description}</p>

                {/* Current Value */}
                <div className="rounded-lg bg-white border border-stone-200 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-500 uppercase">
                      Valor Actual
                    </span>
                    <span className="text-2xl font-bold text-slate-700">
                      {displayValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Calculated Value */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-blue-600 uppercase">
                      Valor Calculado
                    </span>
                    <span className="text-lg font-semibold text-blue-700">
                      {stat.calculated.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Edit Form */}
                {isEditing ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">
                      Valor Manual (Fallback)
                    </label>
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                      className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                      min="0"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(stat.key)}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-300 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(stat)}
                      className="flex-1 inline-flex items-center justify-center rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                    >
                      Editar
                    </button>
                    {stat.isManual && (
                      <button
                        onClick={() => handleResetToCalculated(stat.key)}
                        disabled={saving}
                        className="flex-1 inline-flex items-center justify-center rounded-md bg-stone-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-stone-300 disabled:opacity-50"
                        title="Usar valor calculado"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {stats.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
          <span className="text-4xl">📊</span>
          <p className="mt-4 text-slate-600">No hay estadísticas configuradas</p>
          <p className="text-sm text-slate-400">Ejecuta el seed para cargar las estadísticas iniciales</p>
        </div>
      )}
    </div>
  );
}
