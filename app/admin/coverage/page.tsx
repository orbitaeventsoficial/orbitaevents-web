'use client';

import { useEffect, useState } from 'react';
import { log } from '@/lib/logger';

interface CoverageArea {
  city: string;
  province: string;
  enabled: boolean;
}

export default function CoveragePage() {
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Barcelona');

  const provinces = [
    'Barcelona',
    'Girona',
    'Tarragona',
    'Lleida',
    'Madrid',
    'Valencia',
    'Alicante',
    'Murcia',
    'Castellón',
  ];

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const res = await fetch('/api/admin/coverage');
      const data = await res.json();
      if (data.ok) {
        setAreas(data.areas);
      }
    } catch (error) {
      log.error('Error cargando áreas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCity.trim()) {
      alert('Introduce un nombre de ciudad');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          city: newCity.trim(),
          province: newProvince,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadAreas();
        setNewCity('');
        setNewProvince('Barcelona');
        setShowAddForm(false);
      } else {
        alert(data.error || 'Error añadiendo área');
      }
    } catch (error) {
      log.error('Error añadiendo área:', error);
      alert('Error añadiendo área');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (city: string) => {
    if (!confirm(`¿Eliminar ${city} de las áreas de cobertura?`)) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          city,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadAreas();
      } else {
        alert(data.error || 'Error eliminando área');
      }
    } catch (error) {
      log.error('Error eliminando área:', error);
      alert('Error eliminando área');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (city: string, currentEnabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          city,
          enabled: !currentEnabled,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        await loadAreas();
      } else {
        alert(data.error || 'Error actualizando área');
      }
    } catch (error) {
      log.error('Error actualizando área:', error);
      alert('Error actualizando área');
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

  const enabledCount = areas.filter((a) => a.enabled).length;
  const provinceGroups = areas.reduce((acc, area) => {
    if (!acc[area.province]) acc[area.province] = [];
    acc[area.province].push(area);
    return acc;
  }, {} as Record<string, CoverageArea[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
            Áreas de Cobertura
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona las ciudades y provincias donde operas
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm"
        >
          + Añadir Ciudad
        </button>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Áreas</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{areas.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-green-600 uppercase">Activas</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{enabledCount}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-xs font-medium text-blue-600 uppercase">Provincias</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">
            {Object.keys(provinceGroups).length}
          </p>
        </div>
      </section>

      {/* Add Form */}
      {showAddForm && (
        <section className="rounded-xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Añadir Nueva Ciudad</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                  required
                  placeholder="Barcelona"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Provincia
                </label>
                <select
                  value={newProvince}
                  onChange={(e) => setNewProvince(e.target.value)}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-slate-700 focus:border-orange-500 focus:outline-none"
                >
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-2.5 text-sm font-medium text-white hover:from-orange-600 hover:to-rose-600 shadow-sm disabled:opacity-50"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCity('');
                  setNewProvince('Barcelona');
                }}
                className="inline-flex items-center rounded-md bg-stone-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Areas by Province */}
      <section className="space-y-4">
        {Object.keys(provinceGroups).length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-12 text-center">
            <span className="text-4xl">🗺️</span>
            <p className="mt-4 text-slate-600">No hay áreas de cobertura configuradas</p>
            <p className="text-sm text-slate-400">Añade la primera ciudad para comenzar</p>
          </div>
        ) : (
          Object.entries(provinceGroups).map(([province, provinceAreas]) => (
            <div
              key={province}
              className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 border-b border-stone-200 px-4 py-3">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                  <span>📍</span>
                  {province}
                  <span className="text-sm font-normal text-slate-500">
                    ({provinceAreas.length} ciudades)
                  </span>
                </h2>
              </div>
              <div className="p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {provinceAreas.map((area) => (
                    <div
                      key={area.city}
                      className={`rounded-lg border p-3 flex items-center justify-between ${
                        area.enabled
                          ? 'bg-white border-stone-200'
                          : 'bg-stone-100 border-stone-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{area.enabled ? '✓' : '○'}</span>
                        <span className={`font-medium ${area.enabled ? 'text-slate-700' : 'text-slate-500'}`}>
                          {area.city}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggle(area.city, area.enabled)}
                          disabled={saving}
                          className={`p-1.5 rounded-md text-xs ${
                            area.enabled
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-stone-200 text-slate-600 hover:bg-stone-300'
                          } disabled:opacity-50`}
                          title={area.enabled ? 'Desactivar' : 'Activar'}
                        >
                          {area.enabled ? '👁️' : '🚫'}
                        </button>
                        <button
                          onClick={() => handleRemove(area.city)}
                          disabled={saving}
                          className="p-1.5 rounded-md text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
