'use client';

/**
 * Secció d'equipament assignat a una reserva.
 * Permet cercar, afegir, treure items i fer checkout/checkin.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmDialog, { useConfirmDialog } from '../../components/ConfirmDialog';
import { fetchWithCsrf } from '@/lib/csrf';
import type { InventoryBundle } from '@/lib/inventory-bundles-contract';
import { INVENTORY_CONDITION_OPTIONS } from '@/lib/constants';
import { getInventoryCategoryDisplay } from '@/lib/inventory-utils';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  condition: string;
  watts: number | null;
  value: number;
}

interface Assignment {
  id: string;
  bookingId: string;
  itemId: string;
  quantity: number;
  checkedOut: boolean;
  checkedIn: boolean;
  conditionBefore: string | null;
  conditionAfter: string | null;
  notes: string | null;
  item: InventoryItem;
}

interface PackTemplateItem {
  itemId: string;
  quantity: number;
  isRequired: boolean;
  item: InventoryItem;
}


interface SkippedDetail {
  reason: 'NOT_FOUND' | 'ALREADY_ASSIGNED' | 'OVERLAP' | string;
  itemId: string;
  itemCode: string;
  itemName: string;
}

export default function BookingInventorySection({ bookingId }: { bookingId: string }) {
  const [assigned, setAssigned] = useState<Assignment[]>([]);
  const [available, setAvailable] = useState<InventoryItem[]>([]);
  const [packTemplate, setPackTemplate] = useState<PackTemplateItem[]>([]);
  const [bundles, setBundles] = useState<InventoryBundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [skippedDetails, setSkippedDetails] = useState<SkippedDetail[]>([]);
  const { confirm, dialogProps } = useConfirmDialog();

  const reasonLabel = (reason: string) => {
    if (reason === 'OVERLAP') return 'Ocupat en una altra reserva activa';
    if (reason === 'ALREADY_ASSIGNED') return 'Ja assignat en aquesta reserva';
    if (reason === 'NOT_FOUND') return 'No trobat';
    return reason;
  };

  const fetchData = useCallback(async (query?: string) => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);

      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/inventory?${params}`);
      if (!res.ok) throw new Error('Error carregant inventari');

      const data = await res.json();
      setAssigned(data.assigned || []);
      setAvailable(data.available || []);
      setPackTemplate(data.packTemplate?.items || []);
      setBundles(data.bundles || []);
      if (!selectedBundleId && Array.isArray(data.bundles) && data.bundles.length > 0) {
        setSelectedBundleId(data.bundles[0].id);
      }
    } catch {
      setMessage('No s\'ha pogut carregar l\'inventari de la reserva.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, selectedBundleId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData(searchQuery);
    }, 220);
    return () => clearTimeout(timer);
  }, [fetchData, searchQuery]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setSearchQuery(value.trim());
  }, []);

  const handleAssign = useCallback(async (itemId: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage(data?.error || 'Error assignant');
        setSkippedDetails([]);
        return;
      }

      setMessage('Element afegit correctament.');
      setSkippedDetails([]);
      fetchData(searchQuery);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error assignant element');
      setSkippedDetails([]);
    }
  }, [bookingId, searchQuery, fetchData]);

  const handleAssignPack = useCallback(async () => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pack' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || 'Error afegint l\'inventari del pack');
        setSkippedDetails([]);
        return;
      }

      const created = Number(data.created || 0);
      const skipped = Array.isArray(data.skipped) ? data.skipped.length : 0;
      const details = Array.isArray(data.skippedDetails) ? data.skippedDetails : [];
      setSkippedDetails(details);
      setMessage(`Pack afegit: ${created} element(s) assignat(s)${skipped > 0 ? ` · ${skipped} no disponibles` : ''}.`);
      fetchData(searchQuery);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error afegint inventari del pack');
      setSkippedDetails([]);
    }
  }, [bookingId, fetchData, searchQuery]);

  const handleAssignBundle = useCallback(async () => {
    if (!selectedBundleId) {
      setMessage('Selecciona un lot.');
      return;
    }
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'bundle', bundleId: selectedBundleId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || 'Error afegint lot');
        setSkippedDetails([]);
        return;
      }
      const created = Number(data.created || 0);
      const skipped = Array.isArray(data.skipped) ? data.skipped.length : 0;
      const details = Array.isArray(data.skippedDetails) ? data.skippedDetails : [];
      setSkippedDetails(details);
      setMessage(`Lot afegit: ${created} element(s) assignat(s)${skipped > 0 ? ` · ${skipped} no disponibles` : ''}.`);
      fetchData(searchQuery);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error afegint lot');
      setSkippedDetails([]);
    }
  }, [selectedBundleId, bookingId, fetchData, searchQuery]);

  const handleRemove = useCallback(async (assignmentId: string) => {
    const ok = await confirm({ title: 'Treure element', message: 'Segur que vols treure aquest element de la reserva?', confirmLabel: 'Treure', variant: 'warning' });
    if (!ok) return;

    try {
      const res = await fetchWithCsrf(
        `/api/admin/bookings/${bookingId}/inventory?assignmentId=${assignmentId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        setMessage('Error eliminant assignació');
        return;
      }

      fetchData(searchQuery);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error eliminant');
    }
  }, [bookingId, searchQuery, fetchData, confirm]);

  const handleToggleCheckout = useCallback(async (assignment: Assignment) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          checkedOut: !assignment.checkedOut,
        }),
      });

      if (!res.ok) { setMessage('Error marcant sortida'); return; }
      fetchData(searchQuery);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error marcant sortida');
    }
  }, [bookingId, searchQuery, fetchData]);

  const handleCheckin = useCallback(async (assignment: Assignment, conditionAfter: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          checkedIn: true,
          conditionAfter,
        }),
      });

      if (!res.ok) { setMessage('Error marcant retorn'); return; }
      fetchData(searchQuery);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error marcant retorn');
    }
  }, [bookingId, searchQuery, fetchData]);

  if (loading) {
    return (
      <section className="ap-card rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Equipament assignat</h2>
        <p className="text-sm">Carregant...</p>
      </section>
    );
  }

  return (
    <section className="ap-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Equipament assignat
          {assigned.length > 0 && (
            <span className="text-sm font-normal ml-2">
              ({assigned.length} elements)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAssignPack}
            disabled={packTemplate.length === 0}
            className="rounded-xl border px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors"
          >
            + Afegir inventari del pack
          </button>
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {showSearch ? 'Tancar cerca' : '+ Afegir element'}
          </button>
        </div>
      </div>
      {message && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs" role="alert">
          <span className="flex-1">{message}</span>
          <button type="button" onClick={() => setMessage(null)} className="" aria-label="Tancar missatge">✕</button>
        </div>
      )}
      {skippedDetails.length > 0 && (
        <div className="mb-3 rounded-xl border p-3">
          <p className="mb-2 text-xs font-semibold">Elements no afegits</p>
          <ul className="space-y-1">
            {skippedDetails.map((detail) => (
              <li key={`${detail.itemId}-${detail.reason}`} className="text-xs">
                <code className="mr-1 rounded px-1 py-0.5">{detail.itemCode}</code>
                {detail.itemName} · {reasonLabel(detail.reason)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {bundles.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            value={selectedBundleId}
            onChange={(e) => setSelectedBundleId(e.target.value)}
            className="rounded-xl border px-3 py-1.5 text-xs"
            aria-label="Seleccionar lot d'equipament"
          >
            {bundles.map((bundle) => (
              <option key={bundle.id} value={bundle.id}>
                {bundle.name} ({bundle.itemIds.length})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssignBundle}
            className="rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors"
          >
            + Afegir lot
          </button>
        </div>
      )}

      {/* Elements assignats */}
      {assigned.length === 0 ? (
        <p className="text-sm mb-4">Encara no hi ha equipament assignat</p>
      ) : (
        <div className="space-y-2 mb-4">
          {assigned.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-3 rounded-xl ap-card"
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-xs font-mono px-2 py-0.5 rounded shrink-0">
                  {a.item.code}
                </code>
                <div className="min-w-0">
                  <Link
                    href={`/admin/inventory/${a.item.id}`}
                    className="text-sm font-medium transition-colors truncate block"
                  >
                    {a.item.name}
                  </Link>
                  <p className="text-xs">
                    {getInventoryCategoryDisplay(a.item.category).label}
                    {a.item.watts ? ` · ${a.item.watts}W` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Checkout */}
                <button
                  type="button"
                  onClick={() => handleToggleCheckout(a)}
                  className={`rounded-xl px-2 py-1 text-xs font-medium transition-all ${
                    a.checkedOut
                      ? 'ap-badge ap-badge--success'
                      : 'admin-tone-idle'
                  }`}
                >
                  {a.checkedOut ? 'Sortida fet' : 'Marcar sortida'}
                </button>

                {/* Checkin */}
                {a.checkedOut && !a.checkedIn && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleCheckin(a, e.target.value);
                    }}
                    defaultValue=""
                    className="rounded-xl border px-2 py-1 text-xs"
                    aria-label="Condició de retorn"
                  >
                    <option value="" disabled>Retorn...</option>
                    {INVENTORY_CONDITION_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                )}

                {a.checkedIn && (
                  <span className="text-xs px-2 py-1 rounded-xl">
                    Retornat
                  </span>
                )}

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => handleRemove(a.id)}
                  className="rounded-xl px-2 py-1 text-xs transition-colors"
                >
                  Treure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cerca d'equip disponible */}
      {showSearch && (
        <div className="border-t admin-tone-border-neutral pt-4 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cercar per nom o codi..."
            className="w-full rounded-xl border px-3 py-2.5 text-sm "
            autoFocus
          />

          {available.length === 0 ? (
            <p className="text-sm">No hi ha elements disponibles</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {available.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl transition-colors hover:admin-tone-bg-neutral"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-xs font-mono px-1.5 py-0.5 rounded">
                      {item.code}
                    </code>
                    <span className="text-sm truncate">{item.name}</span>
                    <span className="text-xs">
                      {getInventoryCategoryDisplay(item.category).label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssign(item.id)}
                    className="rounded-xl border px-2 py-1 text-xs font-medium transition-colors shrink-0"
                  >
                    Afegir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </section>
  );
}





