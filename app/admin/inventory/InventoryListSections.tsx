import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_EXPECTED_LIFE_HOURS, formatNumber } from '@/lib/constants';
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  calculateLifeRemainingPercent,
  getInventoryCategoryDisplay,
  getInventoryConditionLabel,
  getInventoryStatusDisplay,
} from '@/lib/inventory-utils';
import { ADMIN_INVENTORY_HELP, helpAttrs } from '../components/adminHelpContent';
import { buildInventoryHref } from '@/lib/admin/inventoryWorkspaceHref';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';
import type {
  InventoryBundlesSectionProps,
  InventoryItem,
  Stats,
  ViewMode,
} from './inventory-list.types';

export function InventoryToolbar({
  viewMode,
  toggleView,
}: {
  viewMode: ViewMode;
  toggleView: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Vista d'inventari"
      className="flex rounded-xl border p-0 overflow-hidden"
      {...helpAttrs(ADMIN_INVENTORY_HELP.viewToggle)}
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'list'}
        onClick={() => toggleView('list')}
        className={`px-3 py-2 text-xs font-medium transition-colors ${
          viewMode === 'list'
            ? 'admin-tone-bg-info admin-tone-text-info'
            : 'bg-white/5 text-white/40 hover:bg-white/10'
        }`}
      >
        Llista
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={viewMode === 'grid'}
        onClick={() => toggleView('grid')}
        className={`px-3 py-2 text-xs font-medium transition-colors ${
          viewMode === 'grid'
            ? 'admin-tone-bg-info admin-tone-text-info'
            : 'bg-white/5 text-white/40 hover:bg-white/10'
        }`}
      >
        Graella
      </button>
    </div>
  );
}

export function InventorySummarySection({
  displayedItems,
  totalValue,
}: {
  displayedItems: InventoryItem[];
  totalValue: number;
}) {
  const available = displayedItems.filter((item) => item.status === 'AVAILABLE').length;
  const inUse = displayedItems.filter((item) => item.status === 'IN_USE').length;

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      {...helpAttrs(ADMIN_INVENTORY_HELP.summary)}
    >
      <InventoryKpiCard label="Total Elements" value={String(displayedItems.length)} />
      <InventoryKpiCard label="Disponibles" value={String(available)} />
      <InventoryKpiCard label="En ús" value={String(inUse)} />
      <InventoryKpiCard label="Valor Total" value={`${formatNumber(totalValue)}€`} />
    </section>
  );
}

function InventoryKpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border admin-card-glass p-4">
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function InventoryPackLinks({ item, compact = false }: { item: InventoryItem; compact?: boolean }) {
  if (item.packItems.length === 0) {
    return <span className="text-xs text-white/40">Sense pack</span>;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-2'}`}>
      {item.packItems.slice(0, 4).map((packItem) => (
        <Link
          key={packItem.id}
          href={buildPackHref(packItem.pack.id, 'content')}
          className="inline-flex max-w-full items-center rounded-full border admin-tone-border-info admin-tone-bg-info px-2 py-0.5 text-xs font-semibold admin-tone-text-info transition-colors hover:admin-tone-bg-info"
        >
          <span className="truncate">{packItem.pack.slug}</span>
        </Link>
      ))}
      {item.packItems.length > 4 && (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-white/70">
          +{item.packItems.length - 4}
        </span>
      )}
    </div>
  );
}

export function InventoryBundlesSection(props: InventoryBundlesSectionProps) {
  const {
    bundles,
    selectedBundleId,
    bundleNameDraft,
    bundleItemSearch,
    selectedBundle,
    selectedBundleItems,
    candidateItems,
    bundleMessage,
    savingBundles,
    setSelectedBundleId,
    setBundleNameDraft,
    setBundleItemSearch,
    createBundle,
    renameSelectedBundle,
    persistRenameSelectedBundle,
    deleteSelectedBundle,
    addItemToBundle,
    removeItemFromBundle,
  } = props;

  return (
    <section
      className="rounded-2xl border p-4 space-y-3"
      {...helpAttrs(ADMIN_INVENTORY_HELP.bundles)}
    >
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
          aria-label="Seleccionar lot actiu"
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
          aria-label="Nom del nou lot"
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
              aria-label="Nom del lot"
              className="w-full rounded-xl border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={deleteSelectedBundle}
              className="rounded-xl border px-3 py-1.5 text-xs"
            >
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
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs"
                >
                  <span>{item.code} · {item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeItemFromBundle(item.id)}
                    className="px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Treure
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function InventoryLowStockAlert({ lowStockItems }: { lowStockItems: InventoryItem[] }) {
  if (lowStockItems.length === 0) return null;

  return (
    <div className="rounded-2xl border p-4" {...helpAttrs(ADMIN_INVENTORY_HELP.lowStock)}>
      <p className="text-sm font-semibold mb-2">Alerta d&apos;estoc baix</p>
      <div className="flex flex-wrap gap-2">
        {lowStockItems.map((item) => (
          <Link
            key={item.id}
            href={buildInventoryHref(item.id)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
          >
            <code className="font-mono">{item.code}</code>
            <span>{item.name}</span>
            <span className="font-bold">
              {item.stockQuantity}/{item.minStock}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function InventoryHealthFocus({ activeHealthLabel }: { activeHealthLabel: string | null }) {
  if (!activeHealthLabel) return null;

  return (
    <div className="rounded-2xl border admin-tone-border-info admin-tone-bg-info p-4 admin-card-glass">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide admin-tone-text-info">
            Focus de salut
          </p>
          <p className="mt-1 text-sm text-white/80">{activeHealthLabel}</p>
        </div>
        <Link href="/admin/inventory" className="ap-btn ap-btn--secondary text-sm">
          Veure tot l’inventari
        </Link>
      </div>
    </div>
  );
}
export function InventoryFiltersSection({
  search,
  setSearch,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  categories,
  statuses,
  stats,
  resetFilters,
}: {
  search: string;
  setSearch: (value: string) => void;
  filterCategory: string | null;
  setFilterCategory: (value: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (value: string | null) => void;
  categories: string[];
  statuses: string[];
  stats: Stats;
  resetFilters: () => void;
}) {
  return (
    <div className="space-y-3" {...helpAttrs(ADMIN_INVENTORY_HELP.filters)}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cercar per nom o codi..."
        aria-label="Cercar ítems d'inventari"
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
          onClick={resetFilters}
          className="rounded-xl border px-3 py-2 text-xs font-medium transition-colors"
          {...helpAttrs(ADMIN_INVENTORY_HELP.resetFilters)}
        >
          Netejar filtres
        </button>
      </div>
    </div>
  );
}

export function InventoryGridSection({ displayedItems }: { displayedItems: InventoryItem[] }) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      {...helpAttrs(ADMIN_INVENTORY_HELP.grid)}
    >
      {displayedItems.map((item) => {
        const catConf = getInventoryCategoryDisplay(item.category);
        const statusConf = getInventoryStatusDisplay(item.status);
        const lifePercent = calculateLifeRemainingPercent(item.totalHoursUsed, item.expectedLifeHours);

        return (
          <Link
            key={item.id}
            href={buildInventoryHref(item.id)}
            className="group rounded-2xl border p-0 overflow-hidden transition-all"
          >
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
                <div className="w-full h-full flex items-center justify-center text-4xl">{catConf.icon}</div>
              )}
              <span className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text} admin-card-glass`}>
                {statusConf.label}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono px-2 py-0.5 rounded">{item.code}</code>
                <span className="text-xs">{catConf.label}</span>
              </div>
              <p className="font-medium text-sm truncate">{item.name}</p>
              <div className="flex items-center justify-between text-xs">
                <span>{formatNumber(item.value)}€</span>
                <span>{item.totalHoursUsed}h</span>
              </div>
              <InventoryPackLinks item={item} />
              {item.purchasePrice && (
                <p className="text-xs">
                  Resten aprox. {Math.max(0, (item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS) - item.totalHoursUsed).toFixed(0)}h útils
                </p>
              )}
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className={`h-1.5 rounded-full ${lifePercent > 40 ? 'admin-tone-bg-success' : lifePercent > 20 ? 'admin-tone-bg-warning' : lifePercent > 5 ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger'}`}
                  style={{ width: `${Math.max(lifePercent, 3)}%` }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function InventoryMobileListSection({
  displayedItems,
  statuses,
  handleStatusChange,
}: {
  displayedItems: InventoryItem[];
  statuses: string[];
  handleStatusChange: (itemId: string, status: string) => void;
}) {
  return (
    <section className="lg:hidden space-y-3" {...helpAttrs(ADMIN_INVENTORY_HELP.mobileList)}>
      {displayedItems.map((item) => {
        const catConf = getInventoryCategoryDisplay(item.category);
        const statusConf = getInventoryStatusDisplay(item.status);
        const condLabel = getInventoryConditionLabel(item.condition);

        return (
          <article key={item.id} className="ap-card block rounded-2xl p-4 transition-colors hover:admin-tone-bg-neutral">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link href={buildInventoryHref(item.id)} className="font-medium text-sm leading-tight transition-colors block truncate">
                  {item.name}
                </Link>
                <code className="text-xs font-mono mt-0.5 inline-block opacity-60">{item.code}</code>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-semibold">{formatNumber(item.value)}€</p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                  {statusConf.label}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs opacity-70">{catConf.icon} {catConf.label}</span>
                <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium">{condLabel}</span>
                {item.watts ? <span className="text-xs opacity-60">{item.watts}W</span> : null}
              </div>
              <div className="mt-2"><InventoryPackLinks item={item} compact /></div>
              <div className="flex items-center gap-1 shrink-0">
                <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} aria-label={`Estat de ${item.name}`} className={`min-h-[44px] min-w-[44px] rounded-xl px-2 py-1 text-xs font-medium border-0 cursor-pointer ${statusConf.bg} ${statusConf.text}`}>
                  {statuses.map((st) => (
                    <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
                  ))}
                </select>
                <Link href={buildInventoryHref(item.id)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl px-3 text-xs font-medium transition-colors bg-white/5 hover:bg-white/10">
                  Fitxa
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function InventoryDesktopTableSection({
  displayedItems,
  statuses,
  handleStatusChange,
}: {
  displayedItems: InventoryItem[];
  statuses: string[];
  handleStatusChange: (itemId: string, status: string) => void;
}) {
  return (
    <section className="hidden lg:block rounded-2xl border p-0 admin-card-glass overflow-hidden" {...helpAttrs(ADMIN_INVENTORY_HELP.desktopTable)}>
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
          <tbody className="divide-y admin-tone-border-subtle">
            {displayedItems.map((item) => {
              const catConf = getInventoryCategoryDisplay(item.category);
              const statusConf = getInventoryStatusDisplay(item.status);
              const tableLifePct = calculateLifeRemainingPercent(item.totalHoursUsed, item.expectedLifeHours);

              return (
                <tr key={item.id} className="transition-colors adm-row-hover">
                  <td className="px-4 py-3"><code className="text-xs font-mono px-2 py-1 rounded">{item.code}</code></td>
                  <td className="px-4 py-3">
                    <Link href={buildInventoryHref(item.id)} className="font-medium transition-colors">{item.name}</Link>
                    {item.description && <p className="text-xs truncate max-w-[200px]">{item.description}</p>}
                    <InventoryPackLinks item={item} compact />
                  </td>
                  <td className="px-4 py-3 text-xs">{catConf.icon} {catConf.label}</td>
                  <td className="px-4 py-3">{item.watts ? `${item.watts}W` : '—'}</td>
                  <td className="px-4 py-3">{formatNumber(item.value)}€</td>
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-1">
                      <p>{item.totalHoursUsed > 0 ? `${item.totalHoursUsed}h` : '—'}</p>
                      {item.purchasePrice && <p>↓ {Math.max(0, (item.expectedLifeHours || DEFAULT_EXPECTED_LIFE_HOURS) - item.totalHoursUsed).toFixed(0)}h restants</p>}
                      <div className="h-1 w-full rounded-full bg-white/10 max-w-[80px]">
                        <div className={`h-1 rounded-full ${tableLifePct > 40 ? 'admin-tone-bg-success' : tableLifePct > 20 ? 'admin-tone-bg-warning' : tableLifePct > 5 ? 'admin-tone-bg-warning' : 'admin-tone-bg-danger'}`} style={{ width: `${Math.max(tableLifePct, 5)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={item.status} onChange={(e) => handleStatusChange(item.id, e.target.value)} aria-label={`Estat de ${item.name}`} className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusConf.bg} ${statusConf.text}`}>
                      {statuses.map((st) => (<option key={st} value={st}>{STATUS_CONFIG[st].label}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={buildInventoryHref(item.id)} className="inline-flex items-center rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors">Fitxa</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function InventoryEmptyState({ hasFilters, resetFilters }: { hasFilters: boolean; resetFilters: () => void }) {
  return (
    <div className="rounded-2xl border admin-card-glass p-12 text-center">
      <span className="text-4xl">📦</span>
      <p className="mt-4">No hi ha elements que coincideixin amb els filtres</p>
      {hasFilters && (
        <button type="button" onClick={resetFilters} className="mt-2 text-sm hover:underline" {...helpAttrs(ADMIN_INVENTORY_HELP.resetFilters)}>
          Netejar filtres
        </button>
      )}
    </div>
  );
}

