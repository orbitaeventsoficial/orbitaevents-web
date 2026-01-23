'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';

interface CoverageArea {
  city: string;
  province: string;
  enabled: boolean;
}

const PROVINCES = [
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

export default function CoveragePage() {
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Barcelona');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadAreas();
  }, []);

  async function loadAreas() {
    try {
      const res = await fetch('/api/admin/coverage');
      const data = await res.json();
      if (data.ok) {
        setAreas(data.areas);
      }
    } catch (error) {
      log.error('Error loading areas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addArea() {
    if (!newCity.trim()) return;

    setAdding(true);
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
        setAreas(data.areas);
        setNewCity('');
      }
    } catch (error) {
      log.error('Error adding area:', error);
    } finally {
      setAdding(false);
    }
  }

  async function removeArea(city: string) {
    if (!confirm(`Eliminar ${city}?`)) return;

    try {
      const res = await fetch('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', city }),
      });

      const data = await res.json();
      if (data.ok) {
        setAreas(data.areas);
      }
    } catch (error) {
      log.error('Error removing area:', error);
    }
  }

  async function toggleArea(city: string, enabled: boolean) {
    try {
      const res = await fetch('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', city, enabled }),
      });

      const data = await res.json();
      if (data.ok) {
        setAreas(data.areas);
      }
    } catch (error) {
      log.error('Error toggling area:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-live="polite">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeAreas = areas.filter(a => a.enabled).length;
  const provinces = Array.from(new Set(areas.map(a => a.province)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-700">
          🗺️ Àrees de Cobertura
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ciutats i províncies on opera Òrbita Events
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="text-sm text-blue-600 font-medium">Total Ciutats</div>
          <div className="text-3xl font-bold text-blue-700 mt-1">{areas.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="text-sm text-green-600 font-medium">Actives</div>
          <div className="text-3xl font-bold text-green-700 mt-1">{activeAreas}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="text-sm text-orange-600 font-medium">Províncies</div>
          <div className="text-3xl font-bold text-orange-700 mt-1">{provinces.length}</div>
        </div>
      </div>

      {/* Add Area Form */}
      <div className="bg-white border border-stone-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Afegir Ciutat</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Nom de la ciutat"
            aria-label="Nom de la ciutat"
            className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <select
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
            aria-label="Província"
            className="px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={addArea}
            disabled={adding || !newCity.trim()}
            type="button"
            aria-busy={adding}
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Afegint...' : '+ Afegir'}
          </button>
        </div>
      </div>

      {/* Areas by Province */}
      <div className="space-y-4">
        {provinces.map(province => (
          <div key={province} className="bg-white border border-stone-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-700 mb-3">{province}</h3>
            <div className="space-y-2">
              {areas
                .filter(a => a.province === province)
                .map(area => (
                  <div
                    key={area.city}
                    className="bg-stone-100 border border-stone-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    <span className={`font-medium ${area.enabled ? 'text-slate-700' : 'text-slate-400'}`}>
                      {area.city}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleArea(area.city, !area.enabled)}
                        type="button"
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          area.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {area.enabled ? '✓ Activa' : '✕ Desactivada'}
                      </button>
                      <button
                        onClick={() => removeArea(area.city)}
                        type="button"
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
