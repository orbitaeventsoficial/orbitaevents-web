'use client';

/**
 * Secció d'equipament assignat a una reserva.
 * Permet cercar, afegir, treure items i fer checkout/checkin.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  SOUND: '🔊 So',
  LIGHTING: '💡 Il·lum.',
  EFFECTS: '✨ Efectes',
  STRUCTURE: '🏗️ Estruct.',
  CABLING: '🔌 Cable',
  TECH: '💻 Tech',
  DECORATION_HP: '🎃 Deco HP',
  DECORATION_HW: '🎄 Deco HW',
  DECORATION_GEN: '🎨 Deco Gen',
  CONSUMABLE: '📦 Consum.',
};

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Nou' },
  { value: 'EXCELLENT', label: 'Excel·lent' },
  { value: 'GOOD', label: 'Bo' },
  { value: 'FAIR', label: 'Acceptable' },
  { value: 'POOR', label: 'Dolent' },
];

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

interface InventoryBundle {
  id: string;
  name: string;
  itemIds: string[];
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

      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory?${params}`);
      if (!res.ok) return;

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
  }, [bookingId]);

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
      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory`, {
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
    } catch {
      setMessage('Error assignant element');
      setSkippedDetails([]);
    }
  }, [bookingId, searchQuery, fetchData]);

  const handleAssignPack = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory`, {
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
    } catch {
      setMessage('Error afegint inventari del pack');
      setSkippedDetails([]);
    }
  }, [bookingId, fetchData, searchQuery]);

  const handleAssignBundle = useCallback(async () => {
    if (!selectedBundleId) {
      setMessage('Selecciona un lot.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory`, {
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
    } catch {
      setMessage('Error afegint lot');
      setSkippedDetails([]);
    }
  }, [selectedBundleId, bookingId, fetchData, searchQuery]);

  const handleRemove = useCallback(async (assignmentId: string) => {
    if (!confirm('Segur que vols treure aquest element?')) return;

    try {
      const res = await fetch(
        `/api/admin/bookings/${bookingId}/inventory?assignmentId=${assignmentId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        alert('Error eliminant assignació');
        return;
      }

      fetchData(searchQuery);
    } catch {
      alert('Error eliminant');
    }
  }, [bookingId, searchQuery, fetchData]);

  const handleToggleCheckout = useCallback(async (assignment: Assignment) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          checkedOut: !assignment.checkedOut,
        }),
      });

      if (!res.ok) return;
      fetchData(searchQuery);
    } catch {
      // Silently fail
    }
  }, [bookingId, searchQuery, fetchData]);

  const handleCheckin = useCallback(async (assignment: Assignment, conditionAfter: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          checkedIn: true,
          conditionAfter,
        }),
      });

      if (!res.ok) return;
      fetchData(searchQuery);
    } catch {
      // Silently fail
    }
  }, [bookingId, searchQuery, fetchData]);

  if (loading) {
    return (
      <section className="rounded-xl border border-white/10 bg-slate-950/60 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Equipament assignat</h2>
        <p className="text-sm text-slate-400">Carregant...</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/60 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-200">
          Equipament assignat
          {assigned.length > 0 && (
            <span className="text-sm font-normal text-slate-400 ml-2">
              ({assigned.length} elements)
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAssignPack}
            disabled={packTemplate.length === 0}
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
          >
            + Afegir inventari del pack
          </button>
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
          >
            {showSearch ? 'Tancar cerca' : '+ Afegir element'}
          </button>
        </div>
      </div>
      {message && (
        <p className="mb-3 text-xs text-slate-300">{message}</p>
      )}
      {skippedDetails.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="mb-2 text-xs font-semibold text-amber-200">Elements no afegits</p>
          <ul className="space-y-1">
            {skippedDetails.map((detail) => (
              <li key={`${detail.itemId}-${detail.reason}`} className="text-xs text-amber-100">
                <code className="mr-1 rounded bg-amber-950/40 px-1 py-0.5">{detail.itemCode}</code>
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
            className="rounded-lg border border-slate-600/50 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-100"
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
            className="rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/25 transition-colors"
          >
            + Afegir lot
          </button>
        </div>
      )}

      {/* Elements assignats */}
      {assigned.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">Encara no hi ha equipament assignat</p>
      ) : (
        <div className="space-y-2 mb-4">
          {assigned.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <code className="text-xs font-mono bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded shrink-0">
                  {a.item.code}
                </code>
                <div className="min-w-0">
                  <Link
                    href={`/admin/inventory/${a.item.id}`}
                    className="text-sm font-medium text-slate-200 hover:text-cyan-300 transition-colors truncate block"
                  >
                    {a.item.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {CATEGORY_LABELS[a.item.category] || a.item.category}
                    {a.item.watts ? ` · ${a.item.watts}W` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Checkout */}
                <button
                  type="button"
                  onClick={() => handleToggleCheckout(a)}
                  className={`rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                    a.checkedOut
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50'
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
                    className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="" disabled>Retorn...</option>
                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                )}

                {a.checkedIn && (
                  <span className="text-xs text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-lg">
                    Retornat
                  </span>
                )}

                {/* Eliminar */}
                <button
                  type="button"
                  onClick={() => handleRemove(a.id)}
                  className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-colors"
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
        <div className="border-t border-white/10 pt-4 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Cercar per nom o codi..."
            className="w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            autoFocus
          />

          {available.length === 0 ? (
            <p className="text-sm text-slate-400">No hi ha elements disponibles</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {available.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-xs font-mono bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">
                      {item.code}
                    </code>
                    <span className="text-sm text-slate-200 truncate">{item.name}</span>
                    <span className="text-xs text-slate-500">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssign(item.id)}
                    className="rounded-lg bg-cyan-500/20 border border-cyan-400/30 px-2 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-500/30 transition-colors shrink-0"
                  >
                    Afegir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
