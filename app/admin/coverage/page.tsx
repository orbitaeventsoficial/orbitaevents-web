'use client';

import { useState, useEffect } from 'react';
import { log } from '@/lib/logger';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import { COVERAGE_PROVINCES, type CoverageArea } from '@/lib/coverage';
import {
  getCoverageAreaMutationKey,
  isCoverageAreaMutationPending,
  readCoverageApiError,
  type CoverageAreaMutationKey,
} from './coverage-utils';



export default function CoveragePage() {
  const [areas, setAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [newCity, setNewCity] = useState('');
  const [newProvince, setNewProvince] = useState('Barcelona');
  const [adding, setAdding] = useState(false);
  const [pendingAreaMutation, setPendingAreaMutation] = useState<CoverageAreaMutationKey | null>(null);
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
      if (!res.ok || !data?.ok) {
        setFetchError(readCoverageApiError(data, 'Error carregant cobertura.'));
        return;
      }
      setAreas(Array.isArray(data.areas) ? data.areas : []);
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
    setMutationError(null);
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
      if (!res.ok || !data?.ok) {
        setMutationError(readCoverageApiError(data, 'No s\'ha pogut afegir la ciutat.'));
        return;
      }
      setAreas(Array.isArray(data.areas) ? data.areas : []);
      setNewCity('');
    } catch (error) {
      setMutationError('No s\'ha pogut afegir la ciutat.');
      log.error('Error adding area:', error);
    } finally {
      setAdding(false);
    }
  }

  async function removeArea(city: string) {
    if (pendingAreaMutation) return;
    const ok = await confirm({ title: 'Eliminar ciutat', message: `Segur que vols eliminar ${city}?`, confirmLabel: 'Eliminar', variant: 'danger' });
    if (!ok) return;

    const mutationKey = getCoverageAreaMutationKey('remove', city);
    setPendingAreaMutation(mutationKey);
    setMutationError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', city }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMutationError(readCoverageApiError(data, 'No s\'ha pogut eliminar la ciutat.'));
        return;
      }
      setAreas(Array.isArray(data.areas) ? data.areas : []);
    } catch (error) {
      setMutationError('No s\'ha pogut eliminar la ciutat.');
      log.error('Error removing area:', error);
    } finally {
      setPendingAreaMutation(current => (current === mutationKey ? null : current));
    }
  }

  async function toggleArea(city: string, enabled: boolean) {
    if (pendingAreaMutation) return;
    const mutationKey = getCoverageAreaMutationKey('toggle', city);
    setPendingAreaMutation(mutationKey);
    setMutationError(null);
    try {
      const res = await fetchWithCsrf('/api/admin/coverage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', city, enabled }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMutationError(readCoverageApiError(data, 'No s\'ha pogut actualitzar la ciutat.'));
        return;
      }
      setAreas(Array.isArray(data.areas) ? data.areas : []);
    } catch (error) {
      setMutationError('No s\'ha pogut actualitzar la ciutat.');
      log.error('Error toggling area:', error);
    } finally {
      setPendingAreaMutation(current => (current === mutationKey ? null : current));
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

  return (
    <AdminPage
      title="Cobertura"
      subtitle="Ciutats i províncies on opera Òrbita Events"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="ap-card p-4">
          <div className="text-xs font-medium uppercase">Total Ciutats</div>
          <div className="text-3xl font-bold mt-2">{areas.length}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-xs font-medium uppercase">Actives</div>
          <div className="text-3xl font-bold mt-2">{activeAreas}</div>
        </div>
        <div className="ap-card p-4">
          <div className="text-xs font-medium uppercase">Províncies</div>
          <div className="text-3xl font-bold mt-2">{provinces.length}</div>
        </div>
      </div>

      {/* Add Area Form */}
      <div className="ap-card p-6">
        <h2 className="ap-h2 mb-4">Afegir Ciutat</h2>
        {mutationError && (
          <div role="alert" className="mb-4 rounded-[var(--o-r-md)] border admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger p-3 text-sm">
            {mutationError}
          </div>
        )}
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
            disabled={adding || pendingAreaMutation !== null || !newCity.trim()}
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
          <div key={province} className="ap-card p-6">
            <h3 className="font-semibold mb-3">{province}</h3>
            <div className="space-y-2">
              {areas
                .filter(a => a.province === province)
                .map(area => {
                  const isToggling = isCoverageAreaMutationPending(pendingAreaMutation, 'toggle', area.city);
                  const isRemoving = isCoverageAreaMutationPending(pendingAreaMutation, 'remove', area.city);
                  const isAreaActionsDisabled = pendingAreaMutation !== null;

                  return (
                    <div
                      key={area.city}
                      className="ap-card p-3 flex items-center justify-between"
                      aria-busy={isToggling || isRemoving}
                    >
                      <span className={`font-medium ${area.enabled ? 'text-[var(--t)]' : 'text-[var(--t3)]'}`}>
                        {area.city}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleArea(area.city, !area.enabled)}
                          type="button"
                          disabled={isAreaActionsDisabled}
                          aria-busy={isToggling}
                          className={`ap-btn ap-btn--xs `}
                        >
                          {isToggling ? 'Actualitzant...' : area.enabled ? '✓ Activa' : '✕ Desactivada'}
                        </button>
                        <button
                          onClick={() => removeArea(area.city)}
                          type="button"
                          disabled={isAreaActionsDisabled}
                          aria-busy={isRemoving}
                          className="ap-btn ap-btn--xs"
                        >
                          {isRemoving ? 'Eliminant...' : 'Eliminar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}



