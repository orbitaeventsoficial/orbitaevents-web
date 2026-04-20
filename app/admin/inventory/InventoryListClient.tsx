'use client';

/**
 * Client component per la llista d'inventari amb filtres, cerca i vistes.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AdminPage } from '../components/AdminPage';
import { ADMIN_INVENTORY_HELP, helpAttrs } from '../components/adminHelpContent';
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import {
  DEFAULT_EXPECTED_LIFE_HOURS,
  INVENTORY_CATEGORY_OPTIONS,
  INVENTORY_STATUS_OPTIONS,
  formatNumber,
} from '@/lib/constants';
import { fetchWithCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';
import { useToast } from '../components/ToastProvider';
import type { InventoryBundle } from '@/lib/inventory-bundles-contract';
import type { BundleApiItem, InventoryItem, Stats, ViewMode } from './inventory-list.types';
import {
  InventoryBundlesSection,
  InventoryDesktopTableSection,
  InventoryEmptyState,
  InventoryFiltersSection,
  InventoryGridSection,
  InventoryHealthFocus,
  InventoryLowStockAlert,
  InventoryMobileListSection,
  InventorySummarySection,
  InventoryToolbar,
} from './InventoryListSections';

export default function InventoryListClient() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';
  const initialCategory = searchParams?.get('category') || null;
  const initialStatus = searchParams?.get('status') || null;
  const healthFilter = searchParams?.get('health') || '';
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterCategory, setFilterCategory] = useState<string | null>(initialCategory);
  const [filterStatus, setFilterStatus] = useState<string | null>(initialStatus);
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

  const resetFilters = useCallback(() => {
    setSearch('');
    setSearchQuery('');
    setFilterCategory(null);
    setFilterStatus(null);
    router.replace('/admin/inventory');
  }, [router]);

  const fetchData = useCallback(async () => {
    setFetchError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterCategory) params.set('category', filterCategory);
      if (filterStatus) params.set('status', filterStatus);

      const res = await fetchWithCsrf(`/api/admin/inventory?${params}`, { signal: controller.signal });
      if (!res.ok) {
        setFetchError(`Error del servidor (${res.status})`);
        return;
      }

      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats || {});
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setFetchError('La connexió ha trigat massa. Reintenta.');
      } else {
        setFetchError('Error carregant inventari.');
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }, [searchQuery, filterCategory, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData, toast]);

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
      setBundleMessage('No s\'han pogut carregar els lots.');
    }
  }, [selectedBundleId]);

  useEffect(() => {
    void loadBundles();
  }, [loadBundles]);

  const toggleView = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('inventory-view', mode);
  }, []);

  const lowStockItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.isConsumable &&
          i.stockQuantity != null &&
          i.minStock != null &&
          i.stockQuantity <= i.minStock
      ),
    [items]
  );

  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      switch (healthFilter) {
        case 'blocked':
          return item.status === 'BROKEN' || item.status === 'MAINTENANCE';
        case 'low-stock':
          return item.isConsumable && item.stockQuantity != null && item.minStock != null && item.stockQuantity <= item.minStock;
        case 'missing-cost':
          return item.purchasePrice == null || item.expectedLifeHours == null;
        case 'zero-value':
          return item.value === 0;
        case 'end-of-life': {
          const life = item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS;
          return life > 0 && item.totalHoursUsed / life >= 0.95;
        }
        case 'aging': {
          const lifeA = item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS;
          const ratioA = lifeA > 0 ? item.totalHoursUsed / lifeA : 0;
          return ratioA >= 0.8 && ratioA < 0.95;
        }
        case 'unused':
          return item.purchasePrice != null && item.purchasePrice > 0 && item.packItems.length === 0 && item._count.bookingItems === 0;
        default:
          return true;
      }
    });
  }, [healthFilter, items]);

  const activeHealthLabel = useMemo(() => {
    switch (healthFilter) {
      case 'blocked':
        return 'Mostrant només equip avariat o en manteniment';
      case 'low-stock':
        return 'Mostrant només consumibles o ítems amb stock al mínim';
      case 'missing-cost':
        return 'Mostrant només equips sense dades completes de cost o vida útil';
      case 'zero-value':
        return 'Mostrant només equips valorats a 0';
      case 'end-of-life':
        return 'Mostrant equips que han superat el 95% de la vida útil';
      case 'aging':
        return 'Mostrant equips entre el 80% i el 95% de la vida útil';
      case 'unused':
        return 'Mostrant equips amb valor econòmic sense cap ús a packs ni reserves';
      default:
        return null;
    }
  }, [healthFilter]);

  const totalValue = useMemo(
    () => displayedItems.reduce((sum, item) => sum + item.value, 0),
    [displayedItems]
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
      .filter((item) => !q || item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q))
      .slice(0, 20);
  }, [items, selectedBundle, bundleItemSearch]);

  const selectedBundleCoverage = selectedBundle?.itemIds.length || 0;
  const hasActiveFilters = Boolean(search || filterCategory || filterStatus || healthFilter);
  const nextStepTitle = fetchError
    ? 'Recuperar la lectura d’inventari abans d’actuar'
    : lowStockItems.length > 0
      ? 'Atacar primer el stock crític'
      : healthFilter === 'missing-cost'
        ? 'Omplir cost i vida útil dels equips incomplets'
        : healthFilter === 'end-of-life' || healthFilter === 'aging'
          ? 'Revisar els equips més tensats abans d’ampliar catàleg'
          : selectedBundleCoverage === 0
            ? 'Definir un lot útil abans de seguir afinant'
            : 'Mantenir inventari, lots i salut sota control';
  const nextStepDetail = fetchError
    ? 'Sense lectura estable no toca canviar lots, estat ni decisions de manteniment.'
    : lowStockItems.length > 0
      ? 'Ja tens detectats els consumibles o ítems que han arribat al mínim i són el coll més immediat.'
      : healthFilter === 'missing-cost'
        ? 'Aquest focus ja t’aïlla els equips que no permeten llegir bé amortització ni valor real.'
        : healthFilter === 'end-of-life' || healthFilter === 'aging'
          ? 'La lectura de salut ja t’està separant els equips que demanen revisió abans de seguir explotant-los.'
          : selectedBundleCoverage === 0
            ? 'Sense un lot mínim definit costa reutilitzar configuracions i veure cobertura real d’equip.'
            : 'Amb stock i salut estables, el pas útil és polir lots, cerca i vista segons el bloc que governes.';
  const nextStepHref = fetchError
    ? '/admin/inventory'
    : lowStockItems.length > 0
      ? '/admin/inventory?health=low-stock'
      : healthFilter === 'missing-cost'
        ? '/admin/inventory?health=missing-cost'
        : healthFilter === 'end-of-life' || healthFilter === 'aging'
          ? `/admin/inventory?health=${healthFilter}`
          : '/admin/inventory';
  const nextStepLabel = fetchError
    ? 'Recarregar inventari'
    : lowStockItems.length > 0
      ? 'Obrir stock crític'
      : healthFilter
        ? 'Mantenir aquest focus'
        : 'Revisar inventari';

  const handleStatusChange = useCallback(
    async (itemId: string, newStatus: string) => {
      try {
        const res = await fetchWithCsrf(`/api/admin/inventory/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) {
          log.error('[Inventory] Error canviant estat', { status: res.status });
          toast.error("Error canviant l'estat de l'equip");
          return;
        }
        fetchData();
      } catch (error) {
        log.error('[Inventory] Error actualitzant item', error);
        toast.error("Error actualitzant l'equip");
      }
    },
    [fetchData, toast]
  );

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
        setBundleMessage(data?.error || 'No s\'han pogut desar els lots.');
        return;
      }
      setBundleMessage('Lots desats correctament.');
    } catch {
      setBundleMessage('No s\'han pogut desar els lots.');
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

  const renameSelectedBundle = useCallback(
    (name: string) => {
      if (!selectedBundle) return;
      const next = bundles.map((b) => (b.id === selectedBundle.id ? { ...b, name } : b));
      setBundles(next);
    },
    [bundles, selectedBundle]
  );

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

  const addItemToBundle = useCallback(
    (itemId: string) => {
      if (!selectedBundle) return;
      const next = bundles.map((b) =>
        b.id === selectedBundle.id
          ? { ...b, itemIds: Array.from(new Set([...b.itemIds, itemId])) }
          : b
      );
      void saveBundles(next);
    },
    [bundles, selectedBundle, saveBundles]
  );

  const removeItemFromBundle = useCallback(
    (itemId: string) => {
      if (!selectedBundle) return;
      const next = bundles.map((b) =>
        b.id === selectedBundle.id
          ? { ...b, itemIds: b.itemIds.filter((id) => id !== itemId) }
          : b
      );
      void saveBundles(next);
    },
    [bundles, selectedBundle, saveBundles]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 rounded-2xl animate-pulse" />
        <div className="h-32 rounded-2xl animate-pulse" />
        <div className="h-64 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-amber-400 text-lg font-medium">{fetchError}</p>
        <button type="button" onClick={() => { setLoading(true); fetchData(); }} className="ap-btn ap-btn--primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <AdminPage
      title="Inventari"
      subtitle={`${displayedItems.length} elements · ${formatNumber(totalValue)}€ invertits — equips, estat i amortització`}
      actions={
        <div className="flex gap-2">
          <InventoryToolbar viewMode={viewMode} toggleView={toggleView} />
          <Link href="/admin/inventory/new" className="ap-btn ap-btn--primary" {...helpAttrs(ADMIN_INVENTORY_HELP.newItem)}>
            + Nou Element
          </Link>
        </div>
      }
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic',
          title: 'Què veu el sistema a l’inventari',
          tone: displayedItems.length > 0 ? 'info' : 'warning',
          items: [
            `${displayedItems.length} equips visibles i ${formatNumber(totalValue)}€ de valor dins la lectura actual.`,
            lowStockItems.length > 0
              ? `${lowStockItems.length} ítems marquen stock crític o al mínim.`
              : 'No hi ha stock crític detectat al primer nivell.',
            selectedBundleCoverage > 0
              ? `El lot seleccionat cobreix ${selectedBundleCoverage} equips.`
              : 'Cap lot seleccionat amb cobertura útil ara mateix.',
          ],
          emptyText: 'Sense lectura d’inventari no hi ha resum automàtic del canal.',
        }}
        manual={{
          eyebrow: 'Manual',
          title: 'On et cal intervenir',
          tone: hasActiveFilters || savingBundles || bundleMessage ? 'warning' : 'success',
          items: [
            activeHealthLabel
              ? activeHealthLabel
              : 'No hi ha focus de salut actiu en aquesta sessió.',
            hasActiveFilters
              ? 'Hi ha filtres o cerca actius sobre la lectura actual.'
              : 'Sense filtres manuals: veus l’inventari complet.',
            savingBundles
              ? 'Hi ha canvis de lots desant-se ara mateix.'
              : bundleMessage
                ? bundleMessage
                : 'Els lots no mostren incidències a primer nivell.',
          ],
          emptyText: 'No hi ha coll manual evident a primer nivell.',
        }}
        nextStep={{
          title: nextStepTitle,
          detail: nextStepDetail,
          href: nextStepHref,
          ctaLabel: nextStepLabel,
          secondaryAction:
            hasActiveFilters
              ? { href: '/admin/inventory', label: 'Veure tot l’inventari' }
              : selectedBundleCoverage > 0
                ? { href: '/admin/inventory/new', label: 'Afegir equip nou' }
                : undefined,
        }}
      />
      <InventorySummarySection displayedItems={displayedItems} totalValue={totalValue} />
      <InventoryBundlesSection
        bundles={bundles}
        selectedBundleId={selectedBundleId}
        bundleNameDraft={bundleNameDraft}
        bundleItemSearch={bundleItemSearch}
        selectedBundle={selectedBundle}
        selectedBundleItems={selectedBundleItems}
        candidateItems={candidateItems}
        bundleMessage={bundleMessage}
        savingBundles={savingBundles}
        setSelectedBundleId={setSelectedBundleId}
        setBundleNameDraft={setBundleNameDraft}
        setBundleItemSearch={setBundleItemSearch}
        createBundle={createBundle}
        renameSelectedBundle={renameSelectedBundle}
        persistRenameSelectedBundle={persistRenameSelectedBundle}
        deleteSelectedBundle={deleteSelectedBundle}
        addItemToBundle={addItemToBundle}
        removeItemFromBundle={removeItemFromBundle}
      />
      <InventoryLowStockAlert lowStockItems={lowStockItems} />
      <InventoryHealthFocus activeHealthLabel={activeHealthLabel} />
      <InventoryFiltersSection
        search={search}
        setSearch={setSearch}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        categories={categories}
        statuses={statuses}
        stats={stats}
        resetFilters={resetFilters}
      />
      {viewMode === 'grid' ? (
        <InventoryGridSection displayedItems={displayedItems} />
      ) : (
        <>
          <InventoryMobileListSection displayedItems={displayedItems} statuses={statuses} handleStatusChange={handleStatusChange} />
          <InventoryDesktopTableSection displayedItems={displayedItems} statuses={statuses} handleStatusChange={handleStatusChange} />
        </>
      )}
      {displayedItems.length === 0 && (
        <InventoryEmptyState
          hasFilters={Boolean(search || filterCategory || filterStatus || healthFilter)}
          resetFilters={resetFilters}
        />
      )}
    </AdminPage>
  );
}
