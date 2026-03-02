'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';
import { AdminPage } from '../components/AdminPage';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';

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
  const { confirm, dialogProps } = useConfirmDialog();

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
    const ok = await confirm({ title: 'Eliminar ciutat', message: `Segur que vols eliminar ${city}?`, confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;

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
        <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeAreas = areas.filter(a => a.enabled).length;
  const provinces = Array.from(new Set(areas.map(a => a.province)));

  return (
    <AdminPage
      title="Cobertura"
      subtitle="Ciutats i províncies on opera Òrbita Events"
    >

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <div className="text-xs font-medium uppercase">Total Ciutats</div>
          <div className="text-3xl font-bold mt-2">{areas.length}</div>
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <div className="text-xs font-medium uppercase">Actives</div>
          <div className="text-3xl font-bold mt-2">{activeAreas}</div>
        </div>
        <div className="rounded-2xl border backdrop-blur-sm p-4">
          <div className="text-xs font-medium uppercase">Províncies</div>
          <div className="text-3xl font-bold mt-2">{provinces.length}</div>
        </div>
      </div>

      {/* Add Area Form */}
      <div className="rounded-2xl border backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Afegir Ciutat</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Nom de la ciutat"
            aria-label="Nom de la ciutat"
            className="flex-1 px-4 py-2 rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
          />
          <select
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
            aria-label="Província"
            className="px-4 py-2 rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
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
            className="px-6 py-2 rounded-xl text-white font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? 'Afegint...' : '+ Afegir'}
          </button>
        </div>
      </div>

      {/* Areas by Province */}
      <div className="space-y-4">
        {provinces.map(province => (
          <div key={province} className="rounded-2xl border backdrop-blur-sm p-6">
            <h3 className="font-semibold mb-3">{province}</h3>
            <div className="space-y-2">
              {areas
                .filter(a => a.province === province)
                .map(area => (
                  <div
                    key={area.city}
                    className="border rounded-xl p-3 flex items-center justify-between"
                  >
                    <span className={`font-medium ${area.enabled ? 'text-white/90' : 'text-white/30'}`}>
                      {area.city}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleArea(area.city, !area.enabled)}
                        type="button"
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          area.enabled
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {area.enabled ? '✓ Activa' : '✕ Desactivada'}
                      </button>
                      <button
                        onClick={() => removeArea(area.city)}
                        type="button"
                        className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
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
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}
