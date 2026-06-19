'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { fetchWithCsrf } from '@/lib/csrf';
import { COVERAGE_PROVINCES, type CoverageArea } from '@/lib/coverage';



export default function CoveragePage() {
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Barcelona');
  const [adding, setAdding] = useState(false);
  const { confirm, dialogProps } = useConfirmDialog();

  useEffect(() => {
    loadAreas();
  }, []);

  async function loadAreas() {
    setFetchError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetchWithCsrf('/api/admin/coverage', { signal: controller.signal });
      const data = await res.json();
      if (data.ok) {
        setAreas(data.areas);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setFetchError('La connexió ha trigat massa. Reintenta.');
      } else {
        setFetchError('Error carregant cobertura.');
        log.error('Error loading areas:', error);
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }

  async function addArea() {
    if (!newCity.trim()) return;

    setAdding(true);
    try {
      const res = await fetchWithCsrf('/api/admin/coverage', {
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
      const res = await fetchWithCsrf('/api/admin/coverage', {
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
      const res = await fetchWithCsrf('/api/admin/coverage', {
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

  if (fetchError) {
    return (
      <AdminPage title="Cobertura" subtitle="Ciutats i províncies on opera Òrbita Events">
        <AdminEmptyState
          icon="⚠️"
          title={fetchError}
          action={
            <button type="button" onClick={() => { setLoading(true); loadAreas(); }} className="ap-btn ap-btn--primary">
              Reintentar
            </button>
          }
        />
      </AdminPage>
    );
  }

  const activeAreas = areas.filter(a => a.enabled).length;
  const provinces = Array.from(new Set(areas.map(a => a.province)));
  const inactiveAreas = areas.length - activeAreas;
  const emptyProvinces = COVERAGE_PROVINCES.filter((province) => !areas.some((area) => area.province === province));
  const topProvince = provinces
    .map((province) => ({
      province,
      count: areas.filter((area) => area.province === province).length,
      active: areas.filter((area) => area.province === province && area.enabled).length,
    }))
    .sort((a, b) => b.count - a.count)[0];
  const systemItems = [
    `${areas.length} ciutats governades dins de ${provinces.length} províncies`,
    `${activeAreas} actives i ${inactiveAreas} desactivades al mapa comercial`,
    topProvince ? `${topProvince.province} concentra ${topProvince.count} ciutats (${topProvince.active} actives)` : '',
    emptyProvinces.length > 0 ? `${emptyProvinces.length} províncies del catàleg base encara no tenen cap ciutat` : '',
  ].filter(Boolean);
  const manualItems = [
    newCity.trim() ? `Hi ha una ciutat en preparació: ${newCity.trim()}` : '',
    inactiveAreas > 0 ? `${inactiveAreas} ${inactiveAreas === 1 ? 'ciutat desactivada' : 'ciutats desactivades'} demanen criteri manual` : '',
    emptyProvinces.length > 0 ? `Províncies sense cobertura: ${emptyProvinces.slice(0, 2).join(', ')}${emptyProvinces.length > 2 ? '...' : ''}` : '',
    adding ? 'S\'està desant una nova ciutat ara mateix' : '',
  ].filter(Boolean);
  const nextStep =
    newCity.trim()
      ? {
          title: 'Tancar l’alta abans de seguir ampliant mapa',
          detail: `Ja tens ${newCity.trim()} en preparació. El següent pas és validar província i donar-la d'alta abans de tocar estats o revisar la resta de cobertura.`,
          href: '/admin/coverage',
          ctaLabel: 'Acabar aquesta alta',
        }
      : inactiveAreas > 0
        ? {
            title: 'Revisar la cobertura desactivada abans d’ampliar',
            detail: `Hi ha ${inactiveAreas} ciutats desactivades. El millor següent pas és confirmar si són baixes reals o cobertura latent abans d'afegir nous punts al mapa.`,
            href: '/admin/coverage',
            ctaLabel: 'Revisar ciutats',
          }
        : emptyProvinces.length > 0
          ? {
              title: 'Omplir províncies sense cap punt de cobertura',
              detail: `Encara tens ${emptyProvinces.length} províncies del catàleg base sense cap ciutat. El retorn ara és ampliar cobertura mínima abans de polir detall fi.`,
              href: '/admin/coverage',
              ctaLabel: 'Ampliar cobertura',
            }
          : {
              title: 'Mantenir cobertura neta, no afegir soroll',
              detail: 'El mapa de cobertura no mostra un buit crític immediat. El següent pas és mantenir-lo coherent i actuar només quan hi ha canvi comercial real.',
              href: '/admin',
              ctaLabel: 'Tornar al panell',
            };

  return (
    <AdminPage
      title="Cobertura"
      subtitle="Ciutats i províncies on opera Òrbita Events"
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què governa el mapa',
          tone: inactiveAreas > 0 || emptyProvinces.length > 0 ? 'warning' : 'info',
          items: systemItems,
          emptyText: 'Sense senyals de cobertura rellevants ara mateix.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal intervenir',
          tone: manualItems.length > 0 ? 'warning' : 'success',
          items: manualItems,
          emptyText: 'Cap tensió manual visible a la cobertura ara mateix.',
        }}
        nextStep={{
          eyebrow: 'Següent pas',
          ...nextStep,
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <div className="text-xs font-medium uppercase">Total Ciutats</div>
          <div className="text-3xl font-bold mt-2">{areas.length}</div>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <div className="text-xs font-medium uppercase">Actives</div>
          <div className="text-3xl font-bold mt-2">{activeAreas}</div>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <div className="text-xs font-medium uppercase">Províncies</div>
          <div className="text-3xl font-bold mt-2">{provinces.length}</div>
        </div>
      </div>

      {/* Add Area Form */}
      <div className="rounded-2xl border admin-card-glass p-6">
        <h2 className="text-lg font-semibold mb-4">Afegir Ciutat</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="Nom de la ciutat"
            aria-label="Nom de la ciutat"
            className="flex-1 px-4 py-2 rounded-xl border "
          />
          <select
            value={newProvince}
            onChange={(e) => setNewProvince(e.target.value)}
            aria-label="Província"
            className="px-4 py-2 rounded-xl border "
          >
            {COVERAGE_PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={addArea}
            disabled={adding || !newCity.trim()}
            type="button"
            aria-busy={adding}
            className="ap-btn ap-btn--primary"
          >
            {adding ? 'Afegint...' : '+ Afegir'}
          </button>
        </div>
      </div>

      {/* Areas by Province */}
      <div className="space-y-4">
        {provinces.map(province => (
          <div key={province} className="rounded-2xl border admin-card-glass p-6">
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
                            ? 'admin-tone-soft-success'
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






