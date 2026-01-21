'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

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
  SOUND: { label: 'So', icon: '🔊', color: 'bg-blue-500' },
  LIGHTING: { label: 'Il·luminació', icon: '💡', color: 'bg-yellow-500' },
  EFFECTS: { label: 'Efectes', icon: '✨', color: 'bg-purple-500' },
  STRUCTURE: { label: 'Estructura', icon: '🏗️', color: 'bg-gray-500' },
  CABLING: { label: 'Cablejat', icon: '🔌', color: 'bg-green-500' },
  TECH: { label: 'Tècnic', icon: '💻', color: 'bg-indigo-500' },
  DECORATION_HP: { label: 'Deco HP', icon: '🎃', color: 'bg-orange-500' },
  DECORATION_HW: { label: 'Deco HW', icon: '🎃', color: 'bg-orange-400' },
  DECORATION_GEN: { label: 'Deco General', icon: '🎨', color: 'bg-pink-500' },
  CONSUMABLE: { label: 'Consumible', icon: '📦', color: 'bg-red-500' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'Disponible', color: 'bg-green-100 text-green-700' },
  IN_USE: { label: 'En ús', color: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { label: 'Manteniment', color: 'bg-yellow-100 text-yellow-700' },
  BROKEN: { label: 'Avariat', color: 'bg-red-100 text-red-700' },
  RETIRED: { label: 'Retirat', color: 'bg-gray-100 text-gray-700' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

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
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      if (data.ok) {
        setExtras(data.data.extras);
        setPacks(data.data.packs);
        setInventory(data.data.inventory);
        setStats(data.data.stats);
      }
    } catch (error) {
      log.error('Error:', error);
      setMessage({ type: 'error', text: 'Error carregant dades' });
    }
    setLoading(false);
  }

  async function savePrice(extraId: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/pricing', {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Carregant dades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
                <span className="text-3xl">💰</span>
                Gestió de Preus i Equipament
              </h1>
              <p className="text-slate-500 mt-1">
                Edita preus dels extras • Consulta packs i inventari
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-stone-100 hover:bg-stone-100 rounded-lg text-slate-700 font-medium transition-colors"
            >
              ← Tornar
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6">
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
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-stone-200'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge && (
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${activeTab === tab.key ? 'bg-white/20' : 'bg-stone-100'}
                  `}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Missatge */}
      {message && (
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div
            className={`
              p-4 rounded-xl flex items-center justify-between
              ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
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
        </div>
      )}

      {/* Contingut */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon="💰"
                label="Ingressos Totals"
                value={formatCurrency(stats.totalRevenue._sum.total || 0)}
                sublabel={`${stats.completedBookings} events completats`}
                color="green"
              />
              <StatCard
                icon="📦"
                label="Total Packs"
                value={stats.totalPacks.toString()}
                sublabel={`${stats.totalBookings} reserves totals`}
                color="blue"
              />
              <StatCard
                icon="✨"
                label="Total Extras"
                value={stats.totalExtras.toString()}
                sublabel="disponibles"
                color="purple"
              />
              <StatCard
                icon="🔧"
                label="Inventari"
                value={stats.totalInventory.toString()}
                sublabel="ítems registrats"
                color="orange"
              />
            </div>

            {/* Top Performers */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Extras */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  Extras Més Venuts
                </h3>
                <div className="space-y-3">
                  {stats.topExtras.map((extra, i) => (
                    <div
                      key={extra.slug}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-700
                          ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-stone-200'}
                        `}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-700">{extra.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-700">{extra.totalSales} vendes</div>
                        <div className="text-sm text-slate-500">{formatCurrency(extra.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Packs */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Packs Més Populars
                </h3>
                <div className="space-y-3">
                  {stats.topPacks.map((pack, i) => (
                    <div
                      key={pack.slug}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-700
                          ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-600' : 'bg-stone-200'}
                        `}>
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-700">{pack.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-700">{pack.totalBookings} reserves</div>
                        <div className="text-sm text-slate-500">{formatCurrency(pack.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Llegenda */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
              <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Com funciona aquesta pàgina
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Extras (EDITABLES)
                  </div>
                  <p className="text-amber-800">
                    Pots canviar els preus dels extras directament. Els canvis s'apliquen a noves reserves.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
                    <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
                    Packs (NOMÉS LECTURA)
                  </div>
                  <p className="text-amber-800">
                    Els packs es gestionen a /admin/packs. Aquí només veus estadístiques.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Inventari (ESTADÍSTIQUES)
                  </div>
                  <p className="text-amber-800">
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
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">Pots editar els preus!</p>
                <p className="text-sm text-green-700">Fes clic al preu per modificar-lo. Els canvis s'apliquen a noves reserves.</p>
              </div>
            </div>

            <div className="grid gap-4">
              {extras.map(extra => (
                <div
                  key={extra.id}
                  className={`
                    bg-white rounded-2xl border-2 overflow-hidden transition-all
                    ${editingExtra === extra.id ? 'border-orange-500 shadow-lg' : 'border-stone-200 hover:border-stone-200'}
                  `}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-700">{extra.name}</h3>
                          {!extra.isActive && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                              Inactiu
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-stone-100 text-slate-600 text-xs rounded-full">
                            {extra.priceType}
                          </span>
                        </div>
                        {extra.description && (
                          <p className="text-slate-500 text-sm mb-4">{extra.description}</p>
                        )}

                        {/* Equipament vinculat */}
                        {extra.linkedInventory.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {extra.linkedInventory.map(item => (
                              <span
                                key={item.itemCode}
                                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-center gap-1"
                              >
                                🔧 {item.itemName}
                                {item.quantity > 1 && <span className="text-blue-500">×{item.quantity}</span>}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-slate-500">Vendes:</span>
                            <span className="font-semibold text-slate-700 ml-1">{extra.salesCount}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Ingressos:</span>
                            <span className="font-semibold text-green-600 ml-1">{formatCurrency(extra.totalRevenue)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Preu (editable) */}
                      <div className="text-right">
                        {editingExtra === extra.id ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={e => setEditPrice(Number(e.target.value))}
                                className="w-28 px-3 py-2 border-2 border-orange-500 rounded-lg text-right text-xl font-bold focus:outline-none"
                                /* eslint-disable-next-line jsx-a11y/no-autofocus */
                              autoFocus
                              />
                              <span className="text-slate-500 text-xl">€</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingExtra(null)}
                                className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-100 rounded-lg transition-colors"
                              >
                                Cancel·lar
                              </button>
                              <button
                                onClick={() => savePrice(extra.id)}
                                disabled={saving}
                                className="px-4 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                              >
                                {saving ? '...' : '✓ Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingExtra(extra.id);
                              setEditPrice(extra.price);
                            }}
                            className="group"
                          >
                            <div className="text-3xl font-bold text-slate-700 group-hover:text-orange-500 transition-colors">
                              {formatCurrency(extra.price)}
                            </div>
                            <div className="text-xs text-slate-400 group-hover:text-orange-400 mt-1">
                              Clic per editar ✏️
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent sales */}
                  {extra.recentSales.length > 0 && (
                    <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-2">Últimes vendes:</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {extra.recentSales.map((sale, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white rounded text-xs text-slate-600 whitespace-nowrap border border-stone-200"
                          >
                            {sale.bookingRef} • {formatDate(sale.date)}
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
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="font-semibold text-slate-700">Només lectura</p>
                <p className="text-sm text-slate-600">
                  Per editar packs, ves a{' '}
                  <Link href="/admin/packs" className="text-orange-500 hover:underline font-medium">
                    /admin/packs
                  </Link>
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {packs.map(pack => (
                <div
                  key={pack.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-700">{pack.name}</h3>
                          {pack.isFeatured && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              ⭐ Destacat
                            </span>
                          )}
                          {!pack.isActive && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                              Inactiu
                            </span>
                          )}
                        </div>
                        {pack.tagline && (
                          <p className="text-slate-500 text-sm mb-4">{pack.tagline}</p>
                        )}

                        {/* Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-slate-700">{pack.djHours}h</div>
                            <div className="text-xs text-slate-500">DJ inclòs</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-slate-700">{pack.soundWatts}W</div>
                            <div className="text-xs text-slate-500">Potència</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-slate-700">{formatCurrency(pack.extraHourPrice)}</div>
                            <div className="text-xs text-slate-500">Hora extra</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(pack.totalInventoryValue)}</div>
                            <div className="text-xs text-slate-500">Valor equip</div>
                          </div>
                        </div>

                        {/* Equipament inclòs */}
                        {pack.includedInventory.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {pack.includedInventory.slice(0, 6).map(item => (
                              <span
                                key={item.itemCode}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg"
                              >
                                {item.itemName}
                              </span>
                            ))}
                            {pack.includedInventory.length > 6 && (
                              <span className="px-2 py-1 bg-stone-100 text-slate-500 text-xs rounded-lg">
                                +{pack.includedInventory.length - 6} més
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Preu (no editable) */}
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-700">
                          {formatCurrency(pack.price)}
                        </div>
                        {pack.originalPrice && pack.originalPrice > pack.price && (
                          <div className="text-sm text-slate-400 line-through">
                            {formatCurrency(pack.originalPrice)}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-2">🔒 No editable aquí</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-slate-500">Reserves:</span>
                        <span className="font-semibold text-slate-700 ml-1">{pack.bookingsCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ingressos:</span>
                        <span className="font-semibold text-green-600 ml-1">{formatCurrency(pack.totalRevenue)}</span>
                      </div>
                    </div>
                    <Link
                      href="/admin/packs"
                      className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                    >
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold text-blue-800">Estadístiques d'ús</p>
                <p className="text-sm text-blue-700">
                  Veus hores d'ús i historial. Per editar l'inventari, ves a{' '}
                  <Link href="/admin/inventory" className="text-orange-500 hover:underline font-medium">
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
                className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:border-orange-500"
              >
                <option value="all">Totes les categories</option>
                {Object.entries(CATEGORY_LABELS).map(([key, { label, icon }]) => (
                  <option key={key} value={key}>
                    {icon} {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Llista */}
            <div className="grid gap-3">
              {filteredInventory.map(item => {
                const categoryInfo = CATEGORY_LABELS[item.category] || { label: item.category, icon: '📦', color: 'bg-slate-500' };
                const statusInfo = STATUS_LABELS[item.status] || { label: item.status, color: 'bg-stone-100 text-slate-700' };

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${categoryInfo.color} rounded-xl flex items-center justify-center text-2xl text-slate-700`}>
                          {categoryInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-700">{item.name}</h3>
                            <code className="text-xs bg-stone-100 px-2 py-0.5 rounded text-slate-500">
                              {item.code}
                            </code>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-sm text-slate-500">
                              Valor: {formatCurrency(item.value)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats d'ús */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-slate-700">{item.stats.totalEvents}</div>
                          <div className="text-xs text-slate-500">Events</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">{item.stats.totalHours.toFixed(1)}h</div>
                          <div className="text-xs text-slate-500">Hores ús</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">{item.stats.avgHoursPerEvent.toFixed(1)}h</div>
                          <div className="text-xs text-slate-500">Mitjana/event</div>
                        </div>
                      </div>
                    </div>

                    {/* Últims events */}
                    {item.recentUsage.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 mb-2">Últims events:</p>
                        <div className="flex gap-2 overflow-x-auto">
                          {item.recentUsage.map((usage, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-slate-50 rounded text-xs text-slate-600 whitespace-nowrap border border-stone-200"
                            >
                              {usage.bookingRef} • {formatDate(usage.date)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredInventory.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No s'han trobat resultats
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
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
  color: 'green' | 'blue' | 'purple' | 'orange';
}) {
  const colors = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    purple: 'from-purple-500 to-violet-600',
    orange: 'from-orange-500 to-red-500',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
      <div className="text-xs opacity-75 mt-1">{sublabel}</div>
    </div>
  );
}
