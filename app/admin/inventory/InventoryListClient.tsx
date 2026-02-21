'use client';

/**
 * Client component per la llista d'inventari amb filtres, cerca i vistes.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  CONDITION_LABELS,
  calculateLifeRemainingPercent,
} from '@/lib/inventory-utils';

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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('inventory-view') as ViewMode) || 'list';
    }
    return 'list';
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetch(`/api/admin/inventory?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || {});
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const categories = Object.keys(CATEGORY_CONFIG);
  const statuses = Object.keys(STATUS_CONFIG);

  const handleStatusChange = useCallback(async (itemId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch {
      // Silently fail
    }
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-800/60 rounded-2xl animate-pulse" />
        <div className="h-32 bg-slate-800/60 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-800/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Inventari</h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} elements · {totalValue.toLocaleString('ca-ES')}€ valor total
          </p>
        </div>
        <div className="flex gap-2">
          {/* Vista */}
          <div className="flex rounded-xl border border-slate-600/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleView('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-cyan-500/20 text-cyan-200'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
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
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50'
              }`}
            >
              Graella
            </button>
          </div>
          <Link
            href="/admin/inventory/new"
            className="inline-flex items-center rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
          >
            + Nou Element
          </Link>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-slate-400 uppercase">Total Elements</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-emerald-400 uppercase">Disponibles</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {items.filter((i) => i.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-blue-400 uppercase">En ús</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {items.filter((i) => i.status === 'IN_USE').length}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm p-4">
          <p className="text-xs font-medium text-amber-400 uppercase">Valor Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {totalValue.toLocaleString('ca-ES')}€
          </p>
        </div>
      </section>

      {/* Alertes d'estoc baix */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-sm font-semibold text-rose-300 mb-2">Alerta d&apos;estoc baix</p>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <Link
                key={item.id}
                href={`/admin/inventory/${item.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-500/30"
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
          className="w-full rounded-xl border border-slate-600/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
        />

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <span className="shrink-0 text-xs text-slate-400">Categoria</span>
            <select
              value={filterCategory ?? ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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

          <label className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3 py-2">
            <span className="shrink-0 text-xs text-slate-400">Estat</span>
            <select
              value={filterStatus ?? ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="w-full rounded-lg border border-slate-600/50 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
            className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
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
                className="group rounded-2xl border border-slate-700/50 bg-slate-800/60 overflow-hidden hover:border-slate-600 transition-all"
              >
                {/* Foto */}
                <div className="aspect-video bg-slate-900/60 relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      unoptimized={item.imageUrl.startsWith('data:')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">
                      {catConf.icon}
                    </div>
                  )}
                  <span className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConf.bg} ${statusConf.text} backdrop-blur-sm`}>
                    {statusConf.label}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                      {item.code}
                    </code>
                    <span className="text-xs text-slate-500">{catConf.label}</span>
                  </div>
                  <p className="font-medium text-slate-100 text-sm truncate">{item.name}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{item.value.toLocaleString('ca-ES')}€</span>
                    <span>{item.totalHoursUsed}h</span>
                  </div>
                  {item.purchasePrice && (
                    <p className="text-[11px] text-slate-500">
                      Resten aprox. {Math.max(0, (item.expectedLifeHours || 2000) - item.totalHoursUsed).toFixed(0)}h útils
                    </p>
                  )}
                  {/* Barra de vida */}
                  <div className="h-1.5 w-full rounded-full bg-slate-700">
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
        /* Vista Llista (taula) */
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Codi</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Nom</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Categoria</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Watts</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Valor</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Hores</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-slate-300">Estat</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">Accions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {items.map((item) => {
                  const catConf = CATEGORY_CONFIG[item.category] || { label: item.category, icon: '📦' };
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.AVAILABLE;

                  return (
                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-slate-700/50 text-slate-300 px-2 py-1 rounded">
                          {item.code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/inventory/${item.id}`}
                          className="font-medium text-slate-100 hover:text-cyan-300 transition-colors"
                        >
                          {item.name}
                        </Link>
                        {item.description && (
                          <p className="text-xs text-slate-400 truncate max-w-[200px]">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {catConf.icon} {catConf.label}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.watts ? `${item.watts}W` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.value.toLocaleString('ca-ES')}€
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="text-xs">
                          <p>{item.totalHoursUsed > 0 ? `${item.totalHoursUsed}h` : '—'}</p>
                          {item.purchasePrice && (
                            <p className="text-slate-500">
                              ↓ {Math.max(0, (item.expectedLifeHours || 2000) - item.totalHoursUsed).toFixed(0)}h restants
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
                          className="inline-flex items-center rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600/50 transition-colors"
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
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4 text-slate-300">No hi ha elements que coincideixin amb els filtres</p>
          {(search || filterCategory || filterStatus) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setFilterCategory(null); setFilterStatus(null); }}
              className="mt-2 text-sm text-cyan-300 hover:underline"
            >
              Netejar filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
