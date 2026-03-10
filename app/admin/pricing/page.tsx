'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { formatCurrency, formatDate } from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';

// ═══════════════════════════════════════════════════════════════════════════
// TIPUS
// ═══════════════════════════════════════════════════════════════════════════

interface ExtraData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  priceType: string;
  isActive: boolean;
  linkedInventory: Array<{
    itemCode: string;
    itemName: string;
    itemValue: number;
    quantity: number;
  }>;
  salesCount: number;
  totalRevenue: number;
  recentSales: Array<{
    bookingRef: string;
    date: string;
    price: number;
    quantity: number;
  }>;
  editable: boolean;
}

interface PackData {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  originalPrice: number | null;
  extraHourPrice: number;
  djHours: number;
  soundWatts: number;
  isActive: boolean;
  isFeatured: boolean;
  includedInventory: Array<{
    itemCode: string;
    itemName: string;
    itemValue: number;
    quantity: number;
    isRequired: boolean;
  }>;
  totalInventoryValue: number;
  bookingsCount: number;
  totalRevenue: number;
  editable: boolean;
  editableNote: string;
}

interface InventoryData {
  id: string;
  code: string;
  name: string;
  category: string;
  value: number;
  status: string;
  condition: string;
  stats: {
    totalHours: number;
    totalEvents: number;
    avgHoursPerEvent: number;
  };
  recentUsage: Array<{
    bookingRef: string;
    date: string;
    status: string;
  }>;
  editable: boolean;
}

interface StatsData {
  totalExtras: number;
  totalPacks: number;
  totalInventory: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: { _sum: { total: number | null } };
  topExtras: Array<{ slug: string; name: string; totalSales: number; revenue: number }>;
  topPacks: Array<{ slug: string; name: string; totalBookings: number; revenue: number }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const CATEGORY_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  SOUND: { label: 'So', icon: '🔊', color: 'bg-blue-500/20' },
  LIGHTING: { label: 'Il·luminació', icon: '💡', color: 'bg-yellow-500/20' },
  EFFECTS: { label: 'Efectes', icon: '✨', color: 'bg-purple-500/20' },
  STRUCTURE: { label: 'Estructura', icon: '🏗️', color: 'bg-white/5' },
  CABLING: { label: 'Cablejat', icon: '🔌', color: 'bg-green-500/20' },
  TECH: { label: 'Tècnic', icon: '💻', color: 'bg-indigo-500/20' },
  DECORATION_HP: { label: 'Deco HP', icon: '🎃', color: 'bg-orange-500/20' },
  DECORATION_HW: { label: 'Deco HW', icon: '🎃', color: 'bg-orange-500/20' },
  DECORATION_GEN: { label: 'Deco General', icon: '🎨', color: 'bg-pink-500/20' },
  CONSUMABLE: { label: 'Consumible', icon: '📦', color: 'bg-red-500/20' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'Disponible', color: 'bg-emerald-500/20 text-emerald-300' },
  IN_USE: { label: 'En ús', color: 'bg-blue-500/20 text-blue-300' },
  MAINTENANCE: { label: 'Manteniment', color: 'bg-yellow-500/20 text-yellow-300' },
  BROKEN: { label: 'Avariat', color: 'bg-rose-500/20 text-rose-300' },
  RETIRED: { label: 'Retirat', color: 'bg-white/5 text-white/40' },
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function PricingAdminPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'extras' | 'packs' | 'inventory'>('overview');
  const [extras, setExtras] = useState<ExtraData[]>([]);
  const [packs, setPacks] = useState<PackData[]>([]);
  const [inventory, setInventory] = useState<InventoryData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [editingExtra, setEditingExtra] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetchWithCsrf('/api/admin/pricing?locale=ca');
      const data = await res.json();
      if (data.ok) {
        setExtras(data.data.extras);
        setPacks(data.data.packs);
        setInventory(data.data.inventory);
        setStats(data.data.stats);
      } else {
        setMessage({ type: 'error', text: data.error || 'Error carregant dades' });
      }
    } catch (error) {
      log.error('Error carregant pricing:', error);
      setMessage({ type: 'error', text: 'Error carregant dades' });
    }
    setLoading(false);
  }

  async function savePrice(extraId: string) {
    setSaving(true);
    try {
      const res = await fetchWithCsrf('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraId, price: editPrice }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: 'success', text: data.message });
        setEditingExtra(null);
        loadData();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      log.error('Error:', error);
      setMessage({ type: 'error', text: 'Error guardant preu' });
    }
    setSaving(false);
  }

  // Filtrar inventari
  const searchLower = searchTerm.trim().toLowerCase();
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchLower) ||
        item.code.toLowerCase().includes(searchLower);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchLower, categoryFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"></div>
          <p className="font-medium">Carregant dades...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPage
      title="Preus"
      subtitle="Edita preus dels extras · Consulta packs i inventari"
    >

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: 'Resum', icon: '📊' },
          { key: 'extras', label: 'Extras', icon: '✨', badge: extras.length },
          { key: 'packs', label: 'Packs', icon: '📦', badge: packs.length },
          { key: 'inventory', label: 'Inventari', icon: '🔧', badge: inventory.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            type="button"
            aria-pressed={activeTab === tab.key}
            className={`
              px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2
              ${activeTab === tab.key
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }
            `}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.badge && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Missatge */}
      {message && (
        <div
          className={`
            p-4 rounded-xl flex items-center justify-between
            ${message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }
          `}
          role={message.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          <span className="flex items-center gap-2">
            {message.type === 'success' ? '✅' : '❌'}
            {message.text}
          </span>
          <button
            onClick={() => setMessage(null)}
            type="button"
            aria-label="Tancar missatge"
            className="text-xl font-bold hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="💰" label="Ingressos totals" value={formatCurrency(stats.totalRevenue._sum.total || 0)} sublabel={`${stats.completedBookings} esdeveniments completats`} color="emerald" />
            <StatCard icon="📦" label="Total packs" value={stats.totalPacks.toString()} sublabel={`${stats.totalBookings} reserves totals`} color="cyan" />
            <StatCard icon="✨" label="Total Extras" value={stats.totalExtras.toString()} sublabel="disponibles" color="purple" />
            <StatCard icon="🔧" label="Inventari" value={stats.totalInventory.toString()} sublabel="ítems registrats" color="amber" />
          </div>

          {/* Top Performers */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border admin-card-glass p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                Extras Més Venuts
              </h3>
              <div className="space-y-3">
                {stats.topExtras.map((extra, i) => (
                  <div key={extra.slug} className="flex items-center justify-between p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-zinc-400' : i === 2 ? 'bg-amber-600' : 'bg-white/15'}`}>
                        {i + 1}
                      </span>
                      <span className="font-medium">{extra.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{extra.totalSales} vendes</div>
                      <div className="text-sm">{formatCurrency(extra.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border admin-card-glass p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Packs Més Populars
              </h3>
              <div className="space-y-3">
                {stats.topPacks.map((pack, i) => (
                  <div key={pack.slug} className="flex items-center justify-between p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-zinc-400' : i === 2 ? 'bg-amber-600' : 'bg-white/15'}`}>
                        {i + 1}
                      </span>
                      <span className="font-medium">{pack.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{pack.totalBookings} reserves</div>
                      <div className="text-sm">{formatCurrency(pack.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Llegenda */}
          <div className="rounded-2xl border admin-card-glass p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Com funciona aquesta pàgina
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl p-4 border">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <span className="w-3 h-3 rounded-full"></span>
                  Extras (EDITABLES)
                </div>
                <p className="">
                  Pots canviar els preus dels extras directament. Els canvis s'apliquen a noves reserves.
                </p>
              </div>
              <div className="rounded-xl p-4 border">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <span className="w-3 h-3 rounded-full"></span>
                  Packs (NOMÉS LECTURA)
                </div>
                <p className="">
                  Els packs es gestionen a /admin/packs. Aquí només veus estadístiques.
                </p>
              </div>
              <div className="rounded-xl p-4 border">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <span className="w-3 h-3 rounded-full"></span>
                  Inventari (ESTADÍSTIQUES)
                </div>
                <p className="">
                  Veus hores d'ús i historial. L'inventari es gestiona a /admin/inventory.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: EXTRAS */}
      {activeTab === 'extras' && (
        <div className="space-y-4">
          <div className="border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold">Pots editar els preus!</p>
              <p className="text-sm">Fes clic al preu per modificar-lo. Els canvis s'apliquen a noves reserves.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {extras.map(extra => (
              <div
                key={extra.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${editingExtra === extra.id ? 'border-cyan-500 shadow-lg shadow-cyan-500/10' : 'border-white/10 bg-white/[0.03] admin-card-glass'}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{extra.name}</h3>
                        {!extra.isActive && (
                          <span className="px-2 py-0.5 text-xs rounded-full">Inactiu</span>
                        )}
                        <span className="px-2 py-0.5 text-xs rounded-full">{extra.priceType}</span>
                      </div>
                      {extra.description && (
                        <p className="text-sm mb-4">{extra.description}</p>
                      )}
                      {extra.linkedInventory.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {extra.linkedInventory.map(item => (
                            <span key={item.itemCode} className="px-3 py-1 text-sm rounded-xl flex items-center gap-1 border">
                              🔧 {item.itemName}
                              {item.quantity > 1 && <span className="">×{item.quantity}</span>}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="">Vendes:</span>
                          <span className="font-semibold ml-1">{extra.salesCount}</span>
                        </div>
                        <div>
                          <span className="">Ingressos:</span>
                          <span className="font-semibold ml-1">{formatCurrency(extra.totalRevenue)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {editingExtra === extra.id ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editPrice}
                              onChange={e => setEditPrice(Number(e.target.value))}
                              className="w-28 px-3 py-2 border-2 rounded-xl text-right text-xl font-bold focus:outline-none"
                              /* eslint-disable-next-line jsx-a11y/no-autofocus */
                              autoFocus
                            />
                            <span className="text-xl">€</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setEditingExtra(null)} className="px-3 py-1.5 text-sm rounded-xl transition-colors">Cancel·lar</button>
                            <button type="button" onClick={() => savePrice(extra.id)} disabled={saving} className="px-4 py-1.5 text-sm text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                              {saving ? '...' : '✓ Desar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { setEditingExtra(extra.id); setEditPrice(extra.price); }} className="group">
                          <div className="text-3xl font-bold transition-colors">{formatCurrency(extra.price)}</div>
                          <div className="text-xs mt-1">Clic per editar ✏️</div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {extra.recentSales.length > 0 && (
                  <div className="px-6 py-3 border-t">
                    <p className="text-xs mb-2">Últimes vendes:</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {extra.recentSales.map((sale, i) => (
                        <span key={i} className="px-2 py-1 rounded text-xs whitespace-nowrap border">
                          {sale.bookingRef} · {formatDate(sale.date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: PACKS */}
      {activeTab === 'packs' && (
        <div className="space-y-4">
          <div className="border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-semibold">Només lectura</p>
              <p className="text-sm">
                Per editar packs, ves a{' '}
                <Link href="/admin/packs" className="hover:underline font-medium">
                  /admin/packs
                </Link>
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {packs.map(pack => (
              <div key={pack.id} className="rounded-2xl border admin-card-glass overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{pack.name}</h3>
                        {pack.isFeatured && (
                          <span className="px-2 py-0.5 text-xs rounded-full font-medium">⭐ Destacat</span>
                        )}
                        {!pack.isActive && (
                          <span className="px-2 py-0.5 text-xs rounded-full">Inactiu</span>
                        )}
                      </div>
                      {pack.tagline && (
                        <p className="text-sm mb-4">{pack.tagline}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold">{pack.djHours}h</div>
                          <div className="text-xs">DJ inclòs</div>
                        </div>
                        <div className="rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold">{pack.soundWatts}W</div>
                          <div className="text-xs">Potència</div>
                        </div>
                        <div className="rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold">{formatCurrency(pack.extraHourPrice)}</div>
                          <div className="text-xs">Hora extra</div>
                        </div>
                        <div className="rounded-xl p-3 text-center">
                          <div className="text-2xl font-bold">{formatCurrency(pack.totalInventoryValue)}</div>
                          <div className="text-xs">Valor equip</div>
                        </div>
                      </div>
                      {pack.includedInventory.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pack.includedInventory.slice(0, 6).map(item => (
                            <span key={item.itemCode} className="px-2 py-1 text-xs rounded-xl border">
                              {item.itemName}
                            </span>
                          ))}
                          {pack.includedInventory.length > 6 && (
                            <span className="px-2 py-1 text-xs rounded-xl">
                              +{pack.includedInventory.length - 6} més
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{formatCurrency(pack.price)}</div>
                      {pack.originalPrice && pack.originalPrice > pack.price && (
                        <div className="text-sm line-through">{formatCurrency(pack.originalPrice)}</div>
                      )}
                      <div className="text-xs mt-2">🔒 No editable aquí</div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 border-t flex items-center justify-between">
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="">Reserves:</span>
                      <span className="font-semibold ml-1">{pack.bookingsCount}</span>
                    </div>
                    <div>
                      <span className="">Ingressos:</span>
                      <span className="font-semibold ml-1">{formatCurrency(pack.totalRevenue)}</span>
                    </div>
                  </div>
                  <Link href="/admin/packs" className="text-sm font-medium">
                    Editar →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-semibold">Estadístiques d'ús</p>
              <p className="text-sm">
                Veus hores d'ús i historial. Per editar l'inventari, ves a{' '}
                <Link href="/admin/inventory" className="hover:underline font-medium">
                  /admin/inventory
                </Link>
              </p>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Cerca per nom o codi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            >
              <option value="all">Totes les categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                <option key={key} value={key}>{icon} {label}</option>
              ))}
            </select>
          </div>

          {/* Llista */}
          <div className="grid gap-3">
            {filteredInventory.map(item => {
              const categoryInfo = CATEGORY_LABELS[item.category] || { label: item.category, icon: '📦', color: 'bg-white/5' };
              const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: 'bg-white/5 text-white/40' };

              return (
                <div key={item.id} className="rounded-2xl border admin-card-glass p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${categoryInfo.color} rounded-xl flex items-center justify-center text-2xl`}>
                        {categoryInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <code className="text-xs px-2 py-0.5 rounded">{item.code}</code>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.color}`}>{statusInfo.label}</span>
                          <span className="text-sm">Valor: {formatCurrency(item.value)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xl font-bold">{item.stats.totalEvents}</div>
                        <div className="text-xs">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{item.stats.totalHours.toFixed(1)}h</div>
                        <div className="text-xs">Hores ús</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{item.stats.avgHoursPerEvent.toFixed(1)}h</div>
                        <div className="text-xs">Mitjana/event</div>
                      </div>
                    </div>
                  </div>

                  {item.recentUsage.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs mb-2">Últims esdeveniments:</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {item.recentUsage.map((usage, i) => (
                          <span key={i} className="px-2 py-1 rounded text-xs whitespace-nowrap border">
                            {usage.bookingRef} · {formatDate(usage.date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredInventory.length === 0 && (
              <div className="text-center py-12">
                No s\'han trobat resultats
              </div>
            )}
          </div>
        </div>
      )}
    </AdminPage>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS AUXILIARS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sublabel: string;
  color: 'emerald' | 'cyan' | 'purple' | 'amber';
}) {
  const styles = {
    emerald: 'border-emerald-500/20 from-emerald-500/10 to-emerald-600/5 text-emerald-400',
    cyan: 'border-cyan-500/20 from-cyan-500/10 to-blue-600/5 text-cyan-400',
    purple: 'border-purple-500/20 from-purple-500/10 to-purple-600/5 text-purple-400',
    amber: 'border-amber-500/20 from-amber-500/10 to-amber-600/5 text-amber-400',
  };

  const style = styles[color];

  return (
    <div className={`rounded-2xl border bg-gradient-to-br admin-card-glass p-4 sm:p-5 ${style}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className={`text-xs font-medium uppercase ${style.split(' ').pop()}`}>{label}</div>
      <div className="text-xs mt-1">{sublabel}</div>
    </div>
  );
}


