'use client';

/**
 * Client component per la llista d'inventari amb filtres, cerca i vistes.
 */

interface BundleApiItem {
  id: string | number;
  name: string;
  itemIds: (string | number)[];
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminPage } from '../components/AdminPage';
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  CONDITION_LABELS,
  calculateLifeRemainingPercent,
} from '@/lib/inventory-utils';
import { DEFAULT_EXPECTED_LIFE_HOURS, INVENTORY_CATEGORY_OPTIONS, INVENTORY_STATUS_OPTIONS, formatNumber } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { useToast } from '../components/ToastProvider';
import type { InventoryBundle } from '@/lib/inventory-bundles-contract';

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  watts: number | null;
  value: number;
  status: string;
  condition: string;
  isConsumable: boolean;
  stockQuantity: number | null;
  minStock: number | null;
  imageUrl: string | null;
  purchasePrice: number | null;
  expectedLifeHours: number | null;
  totalHoursUsed: number;
  packItems: Array<{ id: string; pack: { id: string; slug: string } }>;
  _count: { bookingItems: number; usageHistory: number };
}

interface Stats {
  [category: string]: { count: number; totalValue: number };
}

type ViewMode = 'list' | 'grid';

export default function InventoryListClient() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [bundles, setBundles] = useState<InventoryBundle[]>([]);
  const [selectedBundleId, setSelectedBundleId] = useState('');
  const [bundleItemSearch, setBundleItemSearch] = useState('');
  const [bundleNameDraft, setBundleNameDraft] = useState('Equip 1');
  const [bundleMessage, setBundleMessage] = useState<string | null>(null);
  const [savingBundles, setSavingBundles] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('inventory-view') as ViewMode) || 'list';
    }
    return 'list';
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetchWithCsrf(`/api/admin/inventory?${params}`);
      if (!res.ok) {
        console.error('[Inventory] API error:', res.status);
        return;
      }

      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error('[Inventory] Error carregant inventari:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(search.trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadBundles = useCallback(async () => {
    try {
      const res = await fetchWithCsrf('/api/admin/inventory/bundles');
      if (!res.ok) return;
      const data = await res.json();
      const next = Array.isArray(data?.bundles)
        ? data.bundles.map((b: BundleApiItem) => ({
            id: String(b.id),
            name: String(b.name),
            itemIds: Array.isArray(b.itemIds) ? b.itemIds.map((id) => String(id)) : [],
          }))
        : [];
      setBundles(next);
      if (!selectedBundleId && next.length > 0) setSelectedBundleId(next[0].id);
    } catch {
      setBundleMessage('No s’han pogut carregar els lots.');
    }
  }, [selectedBundleId]);

  useEffect(() => {
    void loadBundles();
  }, [loadBundles]);

  const toggleView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('inventory-view', mode);
  }, []);

  const totalValue = useMemo(() =>
    items.reduce((sum, item) => sum + item.value, 0),
    [items]
  );

  const lowStockItems = useMemo(() =>
    items.filter((i) =>
      i.isConsumable &&
      i.stockQuantity != null &&
      i.minStock != null &&
      i.stockQuantity <= i.minStock
    ),
    [items]
  );

  const categories = INVENTORY_CATEGORY_OPTIONS.map((option) => option.value);
  const statuses = INVENTORY_STATUS_OPTIONS.map((option) => option.value);
  const selectedBundle = useMemo(
    () => bundles.find((b) => b.id === selectedBundleId) || null,
    [bundles, selectedBundleId]
  );
  const selectedBundleItems = useMemo(
    () => items.filter((item) => selectedBundle?.itemIds.includes(item.id)),
    [items, selectedBundle]
  );
  const candidateItems = useMemo(() => {
    const q = bundleItemSearch.trim().toLowerCase();
    return items
      .filter((item) => !selectedBundle?.itemIds.includes(item.id))
      .filter((item) =>
        !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [items, selectedBundle, bundleItemSearch]);

  const handleStatusChange = useCallback(async (itemId: string, newStatus: string) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        console.error('[Inventory] Error canviant estat:', res.status);
        toast.error('Error canviant l\'estat de l\'equip');
        return;
      }
      fetchData();
    } catch (error) {
      console.error('[Inventory] Error actualitzant item:', error);
      toast.error('Error actualitzant l\'equip');
    }
  }, [fetchData]);

  const saveBundles = useCallback(async (nextBundles: InventoryBundle[]) => {
    setBundles(nextBundles);
    setSavingBundles(true);
    try {
      const res = await fetchWithCsrf('/api/admin/inventory/bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundles: nextBundles }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setBundleMessage(data?.error || 'No s’han pogut desar els lots.');
        return;
      }
      setBundleMessage('Lots desats correctament.');
    } catch {
      setBundleMessage('No s’han pogut desar els lots.');
    } finally {
      setSavingBundles(false);
    }
  }, []);

  const createBundle = useCallback(() => {
    const name = bundleNameDraft.trim();
    if (!name) return;
    const id = `equip-${Date.now().toString(36)}`;
    const next = [...bundles, { id, name, itemIds: [] }];
    setSelectedBundleId(id);
    setBundleNameDraft('');
    void saveBundles(next);
  }, [bundleNameDraft, bundles, saveBundles]);

  const renameSelectedBundle = useCallback((name: string) => {
    if (!selectedBundle) return;
    const next = bundles.map((b) => (b.id === selectedBundle.id ? { ...b, name } : b));
    setBundles(next);
  }, [bundles, selectedBundle]);

  const persistRenameSelectedBundle = useCallback(() => {
    if (!selectedBundle) return;
    void saveBundles(bundles);
  }, [bundles, selectedBundle, saveBundles]);

  const deleteSelectedBundle = useCallback(() => {
    if (!selectedBundle) return;
    const next = bundles.filter((b) => b.id !== selectedBundle.id);
    setSelectedBundleId(next[0]?.id || '');
    void saveBundles(next);
  }, [bundles, selectedBundle, saveBundles]);

  const addItemToBundle = useCallback((itemId: string) => {
    if (!selectedBundle) return;
    const next = bundles.map((b) =>
      b.id === selectedBundle.id
        ? { ...b, itemIds: Array.from(new Set([...b.itemIds, itemId])) }
        : b
    );
    void saveBundles(next);
  }, [bundles, selectedBundle, saveBundles]);

  const removeItemFromBundle = useCallback((itemId: string) => {
    if (!selectedBundle) return;
    const next = bundles.map((b) =>
      b.id === selectedBundle.id
        ? { ...b, itemIds: b.itemIds.filter((id) => id !== itemId) }
        : b
    );
    void saveBundles(next);
  }, [bundles, selectedBundle, saveBundles]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 rounded-2xl animate-pulse" />
        <div className="h-32 rounded-2xl animate-pulse" />
        <div className="h-64 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <AdminPage
      title="Inventari"
      subtitle={`${items.length} elements · ${formatNumber(totalValue)}€ valor total`}
      actions={
        <div className="flex gap-2">
          <div className="flex rounded-xl border p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleView('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'bg-white/5 text-white/40 hover:bg-white/10/50'
              }`}
            >
              Llista
            </button>
            <button
              type="button"
              onClick={() => toggleView('grid')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'bg-white/5 text-white/40 hover:bg-white/10/50'
              }`}
            >
              Graella
            </button>
          </div>
          <Link
            href="/admin/inventory/new"
            className="ap-btn ap-btn--primary"
          >
            + Nou Element
          </Link>
        </div>
      }
    >

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Total Elements</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Disponibles</p>
          <p className="mt-2 text-3xl font-bold">
            {items.filter((i) => i.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">En ús</p>
          <p className="mt-2 text-3xl font-bold">
            {items.filter((i) => i.status === 'IN_USE').length}
          </p>
        </div>
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Valor Total</p>
          <p className="mt-2 text-3xl font-bold">
            {formatNumber(totalValue)}€
          </p>
        </div>
      </section>

      <section className="rounded-2xl border p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">Equips / Lots</p>
          {bundleMessage && <p className="text-xs">{bundleMessage}</p>}
          {savingBundles && <p className="text-xs">Desant...</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBundleId}
            onChange={(e) => setSelectedBundleId(e.target.value)}
            className="rounded-xl border px-3 py-2 text-xs"
          >
            {bundles.map((bundle) => (
              <option key={bundle.id} value={bundle.id}>
                {bundle.name} ({bundle.itemIds.length})
              </option>
            ))}
          </select>
          <input
            value={bundleNameDraft}
            onChange={(e) => setBundleNameDraft(e.target.value)}
            placeholder="Nou lot"
            className="rounded-xl border px-3 py-2 text-xs"
          />
          <button type="button" onClick={createBundle} className="rounded-xl border px-3 py-2 text-xs">
            + Crear lot
          </button>
        </div>
        {selectedBundle && (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <input
                value={selectedBundle.name}
                onChange={(e) => renameSelectedBundle(e.target.value)}
                onBlur={persistRenameSelectedBundle}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <button type="button" onClick={deleteSelectedBundle} className="rounded-xl border px-3 py-1.5 text-xs">
                Eliminar lot
              </button>
            </div>
            <div className="space-y-2">
              <input
                value={bundleItemSearch}
                onChange={(e) => setBundleItemSearch(e.target.value)}
                placeholder="Afegir element per nom o codi"
                className="w-full rounded-xl border px-3 py-2 text-xs"
              />
              <div className="max-h-24 overflow-auto space-y-1">
                {candidateItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItemToBundle(item.id)}
                    className="w-full text-left rounded-xl border px-3 py-2 text-xs"
                  >
                    + {item.code} · {item.name}
                  </button>
                ))}
              </div>
              <div className="max-h-24 overflow-auto space-y-1">
                {selectedBundleItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
                    <span>{item.code} · {item.name}</span>
                    <button type="button" onClick={() => removeItemFromBundle(item.id)} className="px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">Treure</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Alertes d'estoc baix */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border p-4">
          <p className="text-sm font-semibold mb-2">Alerta d&apos;estoc baix</p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <Link
                key={item.id}
                href={`/admin/inventory/${item.id}`}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
              >
                <code className="font-mono">{item.code}</code>
                <span>{item.name}</span>
                <span className="font-bold">{item.stockQuantity}/{item.minStock}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Cerca + Filtres */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cercar per nom o codi..."
          className="w-full rounded-xl border px-4 py-3 text-sm "
        />

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <span className="shrink-0 text-xs">Categoria</span>
            <select
              value={filterCategory ?? ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="w-full rounded-xl border px-2 py-1.5 text-xs "
            >
              <option value="">Totes</option>
              {categories.map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const count = stats[cat]?.count || 0;
                return (
                  <option key={cat} value={cat}>
                    {conf.icon} {conf.label} ({count})
                  </option>
                );
              })}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <span className="shrink-0 text-xs">Estat</span>
            <select
              value={filterStatus ?? ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full rounded-xl border px-2 py-1.5 text-xs "
            >
              <option value="">Tots</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {STATUS_CONFIG[st].label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => { setSearch(''); setFilterCategory(null); setFilterStatus(null); }}
            className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
          >
            Netejar filtres
          </button>
        </div>
      </div>

      {/* Vista Graella */}
      {viewMode === 'grid' ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const catConf = CATEGORY_CONFIG[item.category] || { label: item.category, icon: '📦' };
            const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
            const lifePercent = calculateLifeRemainingPercent(
              item.totalHoursUsed,
              item.expectedLifeHours
            );

            return (
              <Link
                key={item.id}
                href={`/admin/inventory/${item.id}`}
                className="group rounded-2xl border p-0 overflow-hidden transition-all"
              >
                {/* Foto */}
                <div className="aspect-video relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized={item.imageUrl.startsWith('data:') || item.imageUrl.includes('/api/uploads/')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {catConf.icon}
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConf.bg} ${statusConf.text} admin-card-glass`}>
                    {statusConf.label}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono px-2 py-0.5 rounded">
                      {item.code}
                    </code>
                    <span className="text-xs">{catConf.label}</span>
                  </div>
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>{formatNumber(item.value)}€</span>
                    <span>{item.totalHoursUsed}h</span>
                  </div>
                  {item.purchasePrice && (
                    <p className="text-[11px]">
                      Resten aprox. {Math.max(0, (item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS) - item.totalHoursUsed).toFixed(0)}h útils
                    </p>
                  )}
                  {/* Barra de vida */}
                  <div className="h-1.5 w-full rounded-full">
                    <div
                      className={`h-1.5 rounded-full ${
                        lifePercent > 50 ? 'bg-emerald-400' :
                        lifePercent > 20 ? 'bg-amber-400' : 'bg-rose-400'
                      }`}
                      style={{ width: `${lifePercent}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <>
        {/* Vista Llista — Targetes mòbil */}
        <section className="lg:hidden space-y-3">
          {items.map((item) => {
            const catConf = CATEGORY_CONFIG[item.category] || { label: item.category, icon: '📦' };
            const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;
            const condLabel = CONDITION_LABELS[item.condition] || item.condition;

            return (
              <article
                key={item.id}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-4 transition-colors"
              >
                {/* Fila superior: nom/codi + valor/estat */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/inventory/${item.id}`}
                      className="font-medium text-sm leading-tight transition-colors block truncate"
                    >
                      {item.name}
                    </Link>
                    <code className="text-[11px] font-mono mt-0.5 inline-block opacity-60">
                      {item.code}
                    </code>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-sm font-semibold">{formatNumber(item.value)}€</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConf.bg} ${statusConf.text}`}>
                      {statusConf.label}
                    </span>
                  </div>
                </div>

                {/* Fila inferior: categoria, condició, watts, accions */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="inline-flex items-center gap-1 text-xs opacity-70">
                      {catConf.icon} {catConf.label}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium">
                      {condLabel}
                    </span>
                    {item.watts ? (
                      <span className="text-[11px] opacity-60">{item.watts}W</span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`min-h-[44px] min-w-[44px] rounded-xl px-2 py-1 text-[11px] font-medium border-0 cursor-pointer ${statusConf.bg} ${statusConf.text}`}
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
                      ))}
                    </select>
                    <Link
                      href={`/admin/inventory/${item.id}`}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl px-3 text-xs font-medium transition-colors bg-white/5 hover:bg-white/10"
                    >
                      Fitxa
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* Vista Llista — Taula escriptori */}
        <section className="hidden lg:block rounded-2xl border p-0 admin-card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Inventari d'equipament">
              <thead className="border-b">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Codi</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Nom</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Categoria</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Watts</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Valor</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Hores</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Estat</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Accions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => {
                  const catConf = CATEGORY_CONFIG[item.category] || { label: item.category, icon: '📦' };
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono px-2 py-1 rounded">
                          {item.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="font-medium transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.description && (
                          <p className="text-xs truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {catConf.icon} {catConf.label}
                      </td>
                      <td className="px-4 py-3">
                        {item.watts ? `${item.watts}W` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(item.value)}€
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          <p>{item.totalHoursUsed > 0 ? `${item.totalHoursUsed}h` : '—'}</p>
                          {item.purchasePrice && (
                            <p className="">
                              ↓ {Math.max(0, (item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS) - item.totalHoursUsed).toFixed(0)}h restants
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusConf.bg} ${statusConf.text}`}
                        >
                          {statuses.map((st) => (
                            <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="inline-flex items-center rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors"
                        >
                          Fitxa
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        </>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border admin-card-glass p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4">No hi ha elements que coincideixin amb els filtres</p>
          {(search || filterCategory || filterStatus) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setFilterCategory(null); setFilterStatus(null); }}
              className="mt-2 text-sm hover:underline"
            >
              Netejar filtres
            </button>
          )}
        </div>
      )}
    </AdminPage>
  );
}
