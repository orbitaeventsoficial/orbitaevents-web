'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminPage } from '../components/AdminPage';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { formatCurrency, formatDate, formatNumber, INVENTORY_CATEGORY_OPTIONS } from '@/lib/constants';
import { ADMIN_PRICING_TABS, type PricingTab } from '@/lib/constants/admin';
import { fetchWithCsrf } from '@/lib/csrf';
import { getInventoryCategoryAdminTone, getInventoryCategoryDisplay, getInventoryStatusDisplay } from '@/lib/inventory-utils';
import { SERVICE_HOURLY_RATES, MARGIN_TONES, EQUIPMENT_AMORTIZATION, getMarginColor, type ServicePricingKey } from '@/lib/constants/pricing-intelligence';

interface ExtraData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  priceType: string;
  isActive: boolean;
  costPerUnit: number | null;
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

type PricingFocus = 'alert' | 'zero-price';

function resolvePricingTab(value?: string | null): PricingTab {
  switch (value) {
    case 'tarifes':
    case 'extras':
    case 'packs':
    case 'inventory':
      return value;
    default:
      return 'overview';
  }
}

function resolvePricingFocus(value?: string | null): PricingFocus | null {
  switch (value) {
    case 'alert':
    case 'zero-price':
      return value;
    default:
      return null;
  }
}

function isFocusSupportedForTab(focus: PricingFocus | null, tab: PricingTab) {
  if (!focus) return false;
  if (focus === 'zero-price') return tab === 'extras';
  if (focus === 'alert') return tab === 'packs';
  return false;
}

export default function PricingAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PricingTab>(() => resolvePricingTab(searchParams?.get('tab')));
  const shouldReduceMotion = useReducedMotion();
  const [extras, setExtras] = useState<ExtraData[]>([]);
  const [packs, setPacks] = useState<PackData[]>([]);
  const [inventory, setInventory] = useState<InventoryData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [editingExtra, setEditingExtra] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<Record<string, Record<string, number>>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const focusParam = resolvePricingFocus(searchParams?.get('focus'));
  const activeFocus = isFocusSupportedForTab(focusParam, activeTab) ? focusParam : null;

  useEffect(() => {
    setActiveTab(resolvePricingTab(searchParams?.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  function updateUrl(tab: PricingTab, focus?: PricingFocus | null) {
    const next = new URLSearchParams(searchParams?.toString() ?? '');
    next.set('tab', tab);
    if (focus && isFocusSupportedForTab(focus, tab)) {
      next.set('focus', focus);
    } else {
      next.delete('focus');
    }
    router.replace(`/admin/pricing?${next.toString()}`, { scroll: false });
  }

  async function loadData() {
    setLoading(true);
    setMessage(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetchWithCsrf('/api/admin/pricing?locale=ca', { signal: controller.signal });
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage({ type: 'error', text: 'La connexió ha trigat massa. Reintenta.' });
      } else {
        log.error('Error carregant pricing:', error);
        setMessage({ type: 'error', text: 'Error carregant dades' });
      }
    } finally {
      clearTimeout(tid);
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
      setMessage({ type: 'error', text: 'Error desant preu' });
    }
    setSaving(false);
  }

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

  const filteredExtras = useMemo(() => {
    if (activeFocus !== 'zero-price') return extras;
    return extras.filter((extra) => extra.priceType !== 'ON_REQUEST' && Number(extra.price || 0) <= 0);
  }, [extras, activeFocus]);

  const filteredPacks = useMemo(() => {
    if (activeFocus !== 'alert') return packs;
    return packs.filter((pack) => pack.editableNote?.toLowerCase().includes('alerta'));
  }, [packs, activeFocus]);

  const activeFocusLabel = activeFocus
    ? {
        'zero-price': 'Extres a preu 0',
        alert: 'Packs amb alerta de preu',
      }[activeFocus]
    : null;
  const zeroPriceExtras = extras.filter((extra) => extra.priceType !== 'ON_REQUEST' && Number(extra.price || 0) <= 0).length;
  const packAlerts = packs.filter((pack) => pack.editableNote?.toLowerCase().includes('alerta')).length;
  const inventoryWithUsage = inventory.filter((item) => item.stats.totalEvents > 0).length;
  const nextStepTitle = !stats
    ? 'Recuperar la lectura de preus abans d’actuar'
    : activeFocus === 'zero-price'
      ? 'Regularitzar els extres a preu 0'
      : activeFocus === 'alert'
        ? 'Revisar els packs amb alerta abans de tocar res més'
        : zeroPriceExtras > 0
          ? 'Atacar primer els extres sense preu'
          : packAlerts > 0
            ? 'Revisar els packs marcats amb alerta'
            : 'Mantenir el catàleg de preus sota control';
  const nextStepDetail = !stats
    ? 'Sense dades de pricing carregades no toca prendre decisions sobre marge, cost o PVP.'
    : activeFocus === 'zero-price'
      ? 'Aquest focus ja t’aïlla els extres que encara no tenen preu útil per vendre.'
      : activeFocus === 'alert'
        ? 'Aquest focus ja t’aïlla els packs que demanen revisió abans de confiar en la seva lectura econòmica.'
        : zeroPriceExtras > 0
          ? 'El retorn més alt ara no és repassar-ho tot, sinó tancar els extres que continuen sense preu vàlid.'
          : packAlerts > 0
            ? 'Amb els extres estables, el següent coll és revisar els packs que arrosseguen alerta de preu.'
            : 'Amb el catàleg estable, el següent pas útil és revisar marge, ús i salut econòmica amb criteri.';

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

  if (!stats && message?.type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="admin-tone-text-warning text-lg font-medium">{message.text}</p>
        <button type="button" onClick={loadData} className="ap-btn ap-btn--primary">Reintentar</button>
      </div>
    );
  }

  return (
    <AdminPage
      title="Preus"
      subtitle="Revisa preus, marges i costos dels extres, packs i inventari per saber què renta i què no."
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què veu el sistema al catàleg de preus',
          tone: stats ? 'info' : 'warning',
          items: [
            stats
              ? `${stats.totalExtras} extres, ${stats.totalPacks} packs i ${stats.totalInventory} ítems d’inventari en lectura econòmica.`
              : 'Sense stats carregades del catàleg de pricing.',
            stats
              ? `${formatCurrency(stats.totalRevenue._sum.total || 0)} d’ingressos i ${stats.completedBookings} esdeveniments completats al resum.`
              : 'Sense resum d’ingressos disponible ara mateix.',
            inventoryWithUsage > 0
              ? `${inventoryWithUsage} ítems d’inventari tenen ús registrat a la vista actual.`
              : 'Cap ítem d’inventari mostra ús registrat a primer nivell.',
          ],
          emptyText: 'Sense dades no hi ha lectura automàtica del catàleg.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal intervenir',
          tone: zeroPriceExtras > 0 || packAlerts > 0 || Boolean(message?.type === 'error') ? 'warning' : 'success',
          items: [
            zeroPriceExtras > 0
              ? `${zeroPriceExtras} extres continuen amb preu 0 i demanen revisió.`
              : 'No hi ha extres a preu 0 al primer nivell.',
            packAlerts > 0
              ? `${packAlerts} packs arrosseguen alerta de preu a la seva nota editable.`
              : 'No hi ha packs marcats amb alerta a primer nivell.',
            activeFocusLabel
              ? `Hi ha focus de salut actiu sobre ${activeFocusLabel}.`
              : `Sense focus actiu: estàs governant la pestanya ${ADMIN_PRICING_TABS.find((tab) => tab.key === activeTab)?.label || activeTab}.`,
          ],
          emptyText: 'No hi ha coll manual evident a primer nivell.',
        }}
        nextStep={{
          eyebrow: 'Següent pas',
          title: nextStepTitle,
          detail: nextStepDetail,
          href:
            activeFocus === 'zero-price'
              ? '/admin/pricing?tab=extras&focus=zero-price'
              : activeFocus === 'alert'
                ? '/admin/pricing?tab=packs&focus=alert'
                : '/admin/pricing',
          ctaLabel: activeFocus ? 'Mantenir aquest focus' : 'Revisar pricing',
          secondaryAction:
            activeTab !== 'overview'
              ? { href: '/admin/pricing?tab=overview', label: 'Tornar al resum' }
              : undefined,
        }}
      />

      <div className="flex gap-2 flex-wrap">
        {ADMIN_PRICING_TABS.map(tabDef => {
          const badgeCounts: Record<string, number> = { extras: extras.length, packs: packs.length, inventory: inventory.length };
          const tab = { ...tabDef, badge: badgeCounts[tabDef.key] };
          return (
          <button
            key={tab.key}
            onClick={() => updateUrl(tab.key as PricingTab, focusParam)}
            type="button"
            aria-pressed={activeTab === tab.key}
            className={`
              px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2
              ${activeTab === tab.key
                ? 'ap-btn ap-btn--primary'
                : 'ap-btn ap-btn--secondary admin-tone-text-neutral'
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
          );
        })}
      </div>

      {activeFocusLabel && (
        <div className="rounded-2xl border admin-tone-border-warning admin-tone-bg-warning px-4 py-3 text-sm admin-tone-text-warning">
          Focus de salut: {activeFocusLabel}
          {' · '}
          <button
            type="button"
            onClick={() => updateUrl(activeTab, null)}
            className="font-semibold underline underline-offset-2"
          >
            veure tot
          </button>
        </div>
      )}

      {message && (
        <div
          className={`
            p-4 rounded-xl flex items-center justify-between
            ${message.type === 'success'
              ? 'ap-card admin-tone-border-success admin-tone-bg-success admin-tone-text-success'
              : 'ap-card admin-tone-border-danger admin-tone-bg-danger admin-tone-text-danger'
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

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
        >
      {activeTab === 'overview' && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="💰" label="Ingressos totals" value={formatCurrency(stats.totalRevenue._sum.total || 0)} sublabel={`${stats.completedBookings} esdeveniments completats`} color="emerald" />
            <StatCard icon="📦" label="Total packs" value={stats.totalPacks.toString()} sublabel={`${stats.totalBookings} reserves totals`} color="cyan" />
            <StatCard icon="✨" label="Total Extras" value={stats.totalExtras.toString()} sublabel="disponibles" color="purple" />
            <StatCard icon="🔧" label="Inventari" value={stats.totalInventory.toString()} sublabel="ítems registrats" color="amber" />
          </div>

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
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${i === 0 ? 'admin-tone-bg-warning' : i === 1 ? 'admin-tone-bg-neutral' : i === 2 ? 'admin-tone-bg-warning' : 'admin-tone-bg-neutral'}`}>
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
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${i === 0 ? 'admin-tone-bg-warning' : i === 1 ? 'admin-tone-bg-neutral' : i === 2 ? 'admin-tone-bg-warning' : 'admin-tone-bg-neutral'}`}>
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

      {activeTab === 'tarifes' && (
        <div className="space-y-6">
          {/* Tarifes per servei */}
          <div className="rounded-xl border border-white/10 p-6 admin-card-glass">
            <h3 className="text-lg font-bold mb-1">Tarifes per servei (€/h facturable)</h3>
            <p className="text-sm opacity-50 mb-5">Mercat DJ professional Barcelona. Hores facturables = inici → fi del bolo.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th scope="col" className="text-left py-2 opacity-60 font-medium">Servei</th>
                  <th scope="col" className="text-right py-2 opacity-60 font-medium">Mínim</th>
                  <th scope="col" className="text-right py-2 opacity-60 font-medium">Recomanat</th>
                  <th scope="col" className="text-right py-2 opacity-60 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(SERVICE_HOURLY_RATES) as [ServicePricingKey, { min: number; recommended: number; premium: number }][]).map(([key, rates]) => {
                  const cfg = pricingConfig[key] ?? {};
                  const recEur = cfg.recommended ?? rates.recommended;
                  const tone = getMarginColor(recEur >= rates.recommended ? 50 : recEur >= rates.min ? 25 : 10);
                  const labels: Record<string, string> = {
                    dj: 'DJ',
                    sonorizacion: 'Sonorització',
                    dj_sonorizacion: 'DJ + sonorització',
                    boda_dj: 'Boda · DJ festa',
                    boda_sonorizacion: 'Boda · sonorització cerimònia',
                    boda_completa: 'Boda completa',
                    fiesta_privada: 'Festa privada', boda: 'Boda', empresa: 'Empresa / corporatiu',
                    animacion_infantil: 'Animació infantil', extra_hora: 'Hora addicional',
                  };
                  return (
                    <tr key={key} className="border-b border-white/5 adm-row-hover">
                      <td className="py-3 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: tone.hex }} />
                        {labels[key] ?? key}
                      </td>
                      {(['min', 'recommended', 'premium'] as const).map((field) => (
                        <td key={field} className="py-3 text-right">
                          <span className="font-mono font-semibold">
                            {cfg[field] ?? (rates as Record<string, number>)[field]}€/h
                          </span>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs opacity-40 mt-4">Per editar les tarifes, modifica <code>lib/constants/pricing-intelligence.ts</code> → <code>SERVICE_HOURLY_RATES</code>. Aviat: editable des d'aquí.</p>
          </div>

          {/* Gradient de marge */}
          <div className="rounded-xl border border-white/10 p-6 admin-card-glass">
            <h3 className="text-lg font-bold mb-1">Escala de marge</h3>
            <p className="text-sm opacity-50 mb-5">A pitjor marge, color més brillant i cridaner.</p>
            <div className="flex gap-2 flex-wrap">
              {MARGIN_TONES.map((t) => (
                <div key={t.tone.kind} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold border border-white/10"
                  style={{ borderLeftColor: t.tone.hex, borderLeftWidth: 3, color: t.tone.hex }}>
                  {t.tone.name}
                  {t.min > -Infinity && <span className="opacity-50 font-normal">≥{t.min}%</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Cost amortització equip */}
          <div className="rounded-xl border border-white/10 p-6 admin-card-glass">
            <h3 className="text-lg font-bold mb-1">Cost real d'amortització per hora</h3>
            <p className="text-sm opacity-50 mb-5">Fallback per categoria. S'usa si l'ítem d'inventari no té dades de compra.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th scope="col" className="text-left py-2 opacity-60 font-medium">Categoria</th>
                  <th scope="col" className="text-right py-2 opacity-60 font-medium">Cost compra</th>
                  <th scope="col" className="text-right py-2 opacity-60 font-medium">Vida útil (h)</th>
                  <th scope="col" className="text-right py-2 opacity-60 font-medium">Cost €/h</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(EQUIPMENT_AMORTIZATION) as [string, { value: number; lifeHours: number }][]).map(([cat, data]) => (
                  <tr key={cat} className="border-b border-white/5 adm-row-hover">
                    <td className="py-3 font-mono text-xs opacity-70">{cat}</td>
                    <td className="py-3 text-right">{formatCurrency(data.value)}</td>
                    <td className="py-3 text-right">{formatNumber(data.lifeHours)}h</td>
                    <td className="py-3 text-right font-semibold text-[var(--oe-gold)]">
                      {formatNumber(data.value / data.lifeHours, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€/h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            {filteredExtras.map(extra => (
              <div
                key={extra.id}
                className={`rounded-2xl border-2 overflow-hidden transition-all ${editingExtra === extra.id ? 'admin-tone-border-info admin-tone-bg-info' : 'admin-tone-border-neutral admin-tone-bg-neutral admin-card-glass'}`}
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
                      <div className="flex gap-6 text-sm flex-wrap">
                        <div>
                          <span className="">Vendes:</span>
                          <span className="font-semibold ml-1">{extra.salesCount}</span>
                        </div>
                        <div>
                          <span className="">Ingressos:</span>
                          <span className="font-semibold ml-1">{formatCurrency(extra.totalRevenue)}</span>
                        </div>
                        {extra.costPerUnit != null && extra.price > 0 && (
                          <>
                            <div>
                              <span className="">Cost:</span>
                              <span className="font-semibold ml-1">{formatCurrency(extra.costPerUnit)}</span>
                            </div>
                            <div>
                              <span className="">Marge:</span>
                              <span className={`font-semibold ml-1 ${((extra.price - extra.costPerUnit) / extra.price) < 0.35 ? 'admin-tone-text-danger' : 'admin-tone-text-success'}`}>
                                {formatCurrency(extra.price - extra.costPerUnit)} ({Math.round(((extra.price - extra.costPerUnit) / extra.price) * 100)}%)
                              </span>
                            </div>
                          </>
                        )}
                        {extra.costPerUnit == null && extra.price > 0 && (
                          <div>
                            <span className="admin-tone-text-warning text-xs">⚠ Sense cost definit</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {editingExtra === extra.id ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={editPrice}
                              onChange={e => setEditPrice(Number(e.target.value))}
                              className="w-28 px-3 py-2 border-2 rounded-xl text-right text-xl font-bold focus:outline-none"
                              autoFocus
                            />
                            <span className="text-xl">€</span>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setEditingExtra(null)} className="px-3 py-1.5 text-sm rounded-xl transition-colors">Cancel·lar</button>
                            <button type="button" onClick={() => savePrice(extra.id)} disabled={saving} className="ap-btn ap-btn--primary">
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
                        <span key={i} className="px-2 py-1 rounded text-xs whitespace-nowrap overflow-hidden text-ellipsis border">
                          {sale.bookingRef} · {formatDate(sale.date)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredExtras.length === 0 && (
              <div className="rounded-2xl border admin-card-glass p-8 text-center text-sm">
                No hi ha extres dins d'aquest focus.
              </div>
            )}
          </div>
        </div>
      )}

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
            {filteredPacks.map(pack => (
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

            {filteredPacks.length === 0 && (
              <div className="rounded-2xl border admin-card-glass p-8 text-center text-sm">
                No hi ha packs dins d'aquest focus.
              </div>
            )}
          </div>
        </div>
      )}

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

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Cerca per nom o codi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border "
            />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border "
            >
              <option value="all">Totes les categories</option>
              {INVENTORY_CATEGORY_OPTIONS.map(({ value, label, icon }) => (
                <option key={value} value={value}>{icon} {label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3">
            {filteredInventory.map(item => {
              const categoryDisplay = getInventoryCategoryDisplay(item.category);
              const categoryTone = getInventoryCategoryAdminTone(item.category);
              const statusDisplay = getInventoryStatusDisplay(item.status);

              return (
                <div key={item.id} className="rounded-2xl border admin-card-glass p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${categoryTone} rounded-xl flex items-center justify-center text-2xl`}>
                        {categoryDisplay.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.name}</h3>
                          <code className="text-xs px-2 py-0.5 rounded">{item.code}</code>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusDisplay.bg} ${statusDisplay.text}`}>{statusDisplay.label}</span>
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
                          <span key={i} className="px-2 py-1 rounded text-xs whitespace-nowrap overflow-hidden text-ellipsis border">
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
                No s'han trobat resultats
              </div>
            )}
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </AdminPage>
  );
}

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
    emerald: 'ap-card admin-tone-border-success admin-tone-bg-success admin-tone-text-success',
    cyan: 'ap-card admin-tone-border-info admin-tone-bg-info admin-tone-text-info',
    purple: 'ap-card admin-tone-border-neutral admin-tone-bg-neutral admin-tone-text-neutral',
    amber: 'ap-card admin-tone-border-warning admin-tone-bg-warning admin-tone-text-warning',
  };

  const style = styles[color];

  return (
    <div className={`admin-card-glass p-4 sm:p-5 ${style}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className={`text-xs font-medium uppercase ${style.split(' ').pop()}`}>{label}</div>
      <div className="text-xs mt-1">{sublabel}</div>
    </div>
  );
}
