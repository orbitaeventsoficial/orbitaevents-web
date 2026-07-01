// app/admin/packs/page.tsx
import { log } from '@/lib/logger';
// Pàgina de gestió de packs
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SyncButton from './SyncButton';
import PackPriceQuickEditor from './PackPriceQuickEditor';
import { getAllPacks } from '@/config/packs-config';
import { computePackPricingHealth, getPackPricingModelConfig, type PackPricingHealth } from '@/lib/services/packPricingHealth';
import { AdminPage } from '../components/AdminPage';
import { PACK_SERVICE_OPTIONS, formatCurrencyExact } from '@/lib/constants';
import { ORBITA_SERVICES } from '@/lib/constants/orbita-services';
import { calculateCostPerHour } from '@/lib/inventory-utils';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Packs | Òrbita Admin',
};

type PackFocus = 'alert' | 'critical-margin' | 'missing-capacity' | 'partial-cost' | 'without-inventory';

function renderPackInventoryPreview(pack: Awaited<ReturnType<typeof getPacks>>[number]) {
  if (pack.inventory.length === 0) {
    return <p className="text-xs text-[var(--t3)]">Sense equip base assignat</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {pack.inventory.slice(0, 4).map((row) => (
          <span
            key={row.item.code}
            className="inline-flex items-center rounded-full border admin-tone-border-cyan admin-tone-bg-cyan px-2 py-0.5 text-xs font-semibold admin-tone-text-cyan"
          >
            {row.item.name}
            {row.quantity > 1 ? ` ×${row.quantity}` : ''}
          </span>
        ))}
        {pack.inventory.length > 4 && (
          <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--raised)] px-2 py-0.5 text-xs font-semibold text-[var(--t2)]">
            +{pack.inventory.length - 4} més
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--t3)]">
        {pack.inventory.filter((row) => row.isRequired).length} obligatoris · {pack.inventory.reduce((sum, row) => sum + Math.max(1, row.quantity), 0)} unitats totals
      </p>
    </div>
  );
}

function resolvePackFocus(value?: string | string[]): PackFocus | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  switch (raw) {
    case 'alert':
    case 'critical-margin':
    case 'missing-capacity':
    case 'partial-cost':
    case 'without-inventory':
      return raw;
    default:
      return null;
  }
}

async function getPacks() {
  try {
    const [packs, leadsByPack] = await Promise.all([
      prisma.pack.findMany({
        orderBy: { order: 'asc' },
        include: {
          translations: true,
          inventory: {
            include: {
              item: {
                select: {
                  code: true,
                  name: true,
                  purchasePrice: true,
                  expectedLifeHours: true,
                },
              },
            },
          },
          _count: {
            select: { bookings: true },
          },
        },
      }),
      prisma.lead.groupBy({
        by: ['interestedPackId'],
        where: { interestedPackId: { not: null } },
        _count: true,
      }),
    ]);

    const leadsMap = new Map(leadsByPack.map((row) => [row.interestedPackId, row._count]));
    return packs.map((pack) => ({ ...pack, leadsCount: leadsMap.get(pack.id) || 0 }));
  } catch (error) {
    log.error('Error obtenint packs:', error);
    return [];
  }
}

export default async function PacksPage({
  searchParams,
}: {
  searchParams?: { focus?: string | string[] };
}) {
  const packs = await getPacks();
  const pricingConfig = await getPackPricingModelConfig();
  const activeFocus = resolvePackFocus(searchParams?.focus);
  const configPacks = getAllPacks();
  const packsInSync = packs.length === configPacks.length;
  const pricingHealthByPack = new Map<string, PackPricingHealth>(
    packs.map((pack) => [pack.id, computePackPricingHealth(pack, pricingConfig)])
  );
  const packSignalsById = new Map(
    packs.map((pack) => {
      const health = pricingHealthByPack.get(pack.id);
      const hasPartialCost = pack.inventory.some((row) => !row.item.purchasePrice || !row.item.expectedLifeHours);
      const withoutInventory = pack.inventory.length === 0;
      const missingCapacity = !pack.maxGuests || pack.maxGuests <= 0;
      const laborCostPerHour = health?.laborCostPerHourUsed ?? 0;
      const inventoryCostPerHour = pack.inventory.reduce((sum, row) => {
        const itemPerHour = calculateCostPerHour(row.item.purchasePrice, row.item.expectedLifeHours);
        return sum + (itemPerHour * Math.max(1, row.quantity));
      }, 0);
      const publicPrice = health?.publicPrice ?? 0;
      const directCost =
        (inventoryCostPerHour * Math.max(1, pack.djHours)) +
        (laborCostPerHour * Math.max(1, pack.djHours)) +
        pricingConfig.fixedPackCost;
      const marginPct = publicPrice > 0 ? (publicPrice - directCost) / publicPrice : 0;
      const criticalMargin = marginPct < (pricingConfig.marginTargetPct - 0.08);

      return [
        pack.id,
        {
          hasAlert: Boolean(health?.hasAlert),
          criticalMargin,
          hasPartialCost,
          withoutInventory,
          missingCapacity,
        },
      ] as const;
    })
  );
  const filteredPacks = activeFocus
    ? packs.filter((pack) => {
        const signals = packSignalsById.get(pack.id);
        if (!signals) return false;

        switch (activeFocus) {
          case 'alert':
            return signals.hasAlert;
          case 'critical-margin':
            return signals.criticalMargin;
          case 'missing-capacity':
            return signals.missingCapacity;
          case 'partial-cost':
            return signals.hasPartialCost;
          case 'without-inventory':
            return signals.withoutInventory;
          default:
            return true;
        }
      })
    : packs;
  const packsByService = PACK_SERVICE_OPTIONS.map(({ value, label }) => ({
    service: value,
    label,
    packs: filteredPacks.filter((pack) => pack.service === value),
  })).filter((group) => group.packs.length > 0);
  const otherPacks = filteredPacks.filter((pack) => !pack.service || !PACK_SERVICE_OPTIONS.some(({ value }) => value === pack.service));
  const pricingAlertsCount = Array.from(pricingHealthByPack.values()).filter((row) => row.hasAlert).length;
  const activeFocusLabel = activeFocus
    ? {
        alert: 'Packs amb preu desalineat',
        'critical-margin': 'Packs en zona crítica de marge',
        'missing-capacity': 'Packs sense rang clar de convidats',
        'partial-cost': 'Packs amb càlcul parcial',
        'without-inventory': 'Packs sense equip base',
      }[activeFocus]
    : null;

  const activePacks = packs.filter((p) => p.isActive).length;
  const featuredPacks = packs.filter((p) => p.isFeatured).length;
  const totalBookings = packs.reduce((sum, p) => sum + p._count.bookings, 0);
  const totalLeads = packs.reduce((sum, p) => sum + p.leadsCount, 0);
  const signalsList = Array.from(packSignalsById.values());
  const criticalMarginCount = signalsList.filter((s) => s.criticalMargin).length;
  const missingCapacityCount = signalsList.filter((s) => s.missingCapacity).length;
  const withoutInventoryCount = signalsList.filter((s) => s.withoutInventory).length;
  const partialCostCount = signalsList.filter((s) => s.hasPartialCost).length;
  const conversionRate = totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100) : null;

  const packsSystemItems: string[] = [];
  if (packs.length > 0) {
    packsSystemItems.push(
      `${packs.length} packs · ${activePacks} actius${featuredPacks > 0 ? ` · ${featuredPacks} destacats` : ''}`
    );
  }
  if (totalBookings > 0 || totalLeads > 0) {
    packsSystemItems.push(
      `${totalBookings} reserves · ${totalLeads} consultes${conversionRate !== null ? ` · ${conversionRate}% conv.` : ''}`
    );
  }
  if (!packsInSync) {
    packsSystemItems.push(`BD ${packs.length} ≠ config ${configPacks.length} — sync pendent`);
  }
  if (activeFocusLabel) {
    packsSystemItems.push(`Focus actiu: ${activeFocusLabel} · ${filteredPacks.length} pack(s)`);
  }

  const packsManualItems: string[] = [];
  if (pricingAlertsCount > 0) {
    packsManualItems.push(`${pricingAlertsCount} packs amb preu desalineat (divergència ≥${pricingConfig.alertDivergencePct}%)`);
  }
  if (criticalMarginCount > 0) {
    packsManualItems.push(`${criticalMarginCount} packs en zona crítica de marge`);
  }
  if (withoutInventoryCount > 0) {
    packsManualItems.push(`${withoutInventoryCount} packs sense equip base assignat`);
  }
  if (partialCostCount > 0) {
    packsManualItems.push(`${partialCostCount} packs amb càlcul parcial (falta preu o vida útil a items)`);
  }
  if (missingCapacityCount > 0) {
    packsManualItems.push(`${missingCapacityCount} packs sense rang clar de convidats`);
  }


  return (
    <AdminPage
      title="Packs"
      subtitle={
        <>
          Gestiona els packs de serveis i els seus preus
          {activeFocusLabel && (
            <span className="mt-2 inline-flex items-center gap-2 rounded-md border admin-tone-border-warning admin-tone-bg-warning px-3 py-1 text-sm admin-tone-text-warning">
              Focus de salut: {activeFocusLabel} · {filteredPacks.length} pack{filteredPacks.length === 1 ? '' : 's'}
              <Link href="/admin/packs" className="font-semibold underline underline-offset-2">
                veure tots
              </Link>
            </span>
          )}
          {!packsInSync && (
            <span className="mt-2 inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm border">
              ℹ️ Packs en BD: {packs.length} · Packs al config (seed): {configPacks.length}
            </span>
          )}
        </>
      }
      actions={
        <div className="flex gap-2">
          <SyncButton />
          <Link
            href="/admin/packs/new"
            className="ap-btn ap-btn--primary"
          >
            + Nou Pack
          </Link>
        </div>
      }
    >
      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/packs"
          className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
        >
          Packs
        </Link>
        <Link
          href="/admin/packs/extras"
          className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--raised)] px-4 py-2 text-sm font-medium text-[var(--t2)] hover:bg-[var(--raised)]"
        >
          Extres
        </Link>
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Total Packs</p>
          <p className="mt-2 text-3xl font-bold">{filteredPacks.length}</p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs font-medium uppercase">Actius</p>
          <p className="mt-2 text-3xl font-bold">
            {filteredPacks.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs font-medium uppercase">Destacats</p>
          <p className="mt-2 text-3xl font-bold">
            {filteredPacks.filter((p) => p.isFeatured).length}
          </p>
        </div>
        <div className="ap-card p-4">
          <p className="text-xs font-medium uppercase">Total Reserves</p>
          <p className="mt-2 text-3xl font-bold">
            {filteredPacks.reduce((sum, p) => sum + p._count.bookings, 0)}
          </p>
        </div>
        <div className={`ap-card p-4 ${pricingAlertsCount > 0 ? 'admin-tone-border-danger admin-tone-bg-danger' : 'admin-tone-border-success admin-tone-bg-success'}`}>
          <p className={`text-xs font-medium uppercase ${pricingAlertsCount > 0 ? 'admin-tone-text-danger' : 'admin-tone-text-success'}`}>Alertes de preu pack</p>
          <p className="mt-2 text-3xl font-bold">{pricingAlertsCount}</p>
        </div>
      </section>

      {packsByService.map((group) => (
        <section key={group.service} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">{group.label}</h2>
            <span className="text-xs">{group.packs.length} packs</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {group.packs.map((pack) => {
              const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
              const health = pricingHealthByPack.get(pack.id);
              const divergence = health?.divergencePct ?? 0;
              const divergenceColor = health?.hasAlert
                ? 'admin-tone-text-danger admin-tone-border-danger admin-tone-bg-danger'
                : Math.abs(divergence) >= pricingConfig.alertDivergencePct * 0.5
                  ? 'admin-tone-text-warning admin-tone-border-warning admin-tone-bg-warning'
                  : 'admin-tone-text-success admin-tone-border-success admin-tone-bg-success';
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border admin-card-glass overflow-hidden ${
                    pack.isFeatured
                      ? 'ring-1 admin-tone-border-warning'
                      : 'border-[var(--line)]'
                  }`}
                >
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {translation?.name || pack.slug}
                        </h3>
                        <p className="text-xs mt-1">
                          {pack.slug}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {pack.isFeatured && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            ⭐ Destacat
                          </span>
                        )}
                        {!pack.isActive && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            Inactiu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold">{pack.price}€</span>
                        {pack.originalPrice && (
                          <span className="ml-2 text-sm line-through">
                            {pack.originalPrice}€
                          </span>
                        )}
                      </div>
                      <span className="text-sm">
                        +{pack.extraHourPrice}€/hora extra
                      </span>
                    </div>
                    {health && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="ap-card p-2">
                          <p className="">Pack recomanat</p>
                          <p className="text-sm font-semibold">{formatCurrencyExact(health.recommendedPrice)}</p>
                        </div>
                        <PackPriceQuickEditor
                          packId={pack.id}
                          initialPrice={health.publicPrice}
                          initialExtraHourPrice={health.publicExtraHourPrice}
                          recommendedPrice={health.recommendedPrice}
                          recommendedExtraHourPrice={health.recommendedExtraHourPrice}
                          alertThreshold={pricingConfig.alertDivergencePct}
                        />
                        <div className="ap-card p-2">
                          <p className="">Hora extra recomanada</p>
                          <p className="text-sm font-semibold">{formatCurrencyExact(health.recommendedExtraHourPrice)}</p>
                        </div>
                        <div className={`ap-card col-span-2 p-2 ${divergenceColor}`}>
                          <p className="text-xs">Llindar alerta: {pricingConfig.alertDivergencePct}%</p>
                        </div>
                        <div className="ap-card col-span-2 p-2 text-xs">
                          Equip tècnic: {health.specialistCount} especialista + {health.operatorCount} operari · {health.laborNetCostPerHourUsed.toFixed(2)}€/h net · {health.laborCostPerHourUsed.toFixed(2)}€/h brut (SS {(health.socialSecurityPct * 100).toFixed(1)}%)
                        </div>
                        <div className="ap-card col-span-2 p-2 text-xs">
                          IRPF {(health.withholdingPct * 100).toFixed(1)}% → net estimat percebut: {health.laborNetAfterWithholdingPerHourUsed.toFixed(2)}€/h
                        </div>
                        <div className="ap-card col-span-2 p-2 text-xs">
                          Operari extra sempre disponible: {health.recommendedOperatorExtraHourPrice.toFixed(2)}€/h (recomanat)
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span>🎵</span>
                        <span>{pack.djHours}h DJ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🔊</span>
                        <span>{pack.soundWatts}W</span>
                      </div>
                      {pack.includesFog && (
                        <div className="flex items-center gap-2">
                          <span>🌫️</span>
                          <span>Fum inclòs</span>
                        </div>
                      )}
                      {pack.includesMic && (
                        <div className="flex items-center gap-2">
                          <span>🎤</span>
                          <span>Micro inclòs</span>
                        </div>
                      )}
                    </div>

                    {(pack.minGuests || pack.maxGuests) && (
                      <div className="text-sm">
                        👥 {pack.minGuests || '?'} - {pack.maxGuests || '∞'} convidats
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <span>{pack._count.bookings} reserves · {pack.leadsCount} consultes</span>
                      {pack.leadsCount > 0 && (
                        <span className={`font-semibold ${Math.round((pack._count.bookings / pack.leadsCount) * 100) >= 30 ? 'admin-tone-text-success' : 'admin-tone-text-warning'}`}>
                          {Math.round((pack._count.bookings / pack.leadsCount) * 100)}% conv.
                        </span>
                      )}
                    </div>
                    <div className="ap-card p-3 text-xs">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--t2)]">Equip del pack</span>
                        <span className="text-[var(--t3)]">{pack.inventory.length} elements</span>
                      </div>
                      {renderPackInventoryPreview(pack)}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link
                      href={buildPackHref(pack.id)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-[var(--line)] bg-[var(--raised)] hover:bg-[var(--raised)] transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={buildPackHref(pack.id, 'content')}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-[var(--line)] bg-[var(--raised)] hover:bg-[var(--raised)] transition-colors"
                    >
                      📦 Equip
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {otherPacks.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="ap-h2">Altres</h2>
            <span className="text-xs">{otherPacks.length} packs</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherPacks.map((pack) => {
              const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
              const health = pricingHealthByPack.get(pack.id);
              const divergence = health?.divergencePct ?? 0;
              const divergenceColor = health?.hasAlert
                ? 'admin-tone-text-danger admin-tone-border-danger admin-tone-bg-danger'
                : Math.abs(divergence) >= pricingConfig.alertDivergencePct * 0.5
                  ? 'admin-tone-text-warning admin-tone-border-warning admin-tone-bg-warning'
                  : 'admin-tone-text-success admin-tone-border-success admin-tone-bg-success';
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border admin-card-glass overflow-hidden ${
                    pack.isFeatured
                      ? 'ring-1 admin-tone-border-warning'
                      : 'border-[var(--line)]'
                  }`}
                >
                  <div className="p-4 border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {translation?.name || pack.slug}
                        </h3>
                        <p className="text-xs mt-1">
                          {pack.slug}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {pack.isFeatured && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            ⭐ Destacat
                          </span>
                        )}
                        {!pack.isActive && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                            Inactiu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-2xl font-bold">{pack.price}€</span>
                        {pack.originalPrice && (
                          <span className="ml-2 text-sm line-through">
                            {pack.originalPrice}€
                          </span>
                        )}
                      </div>
                      <span className="text-sm">
                        +{pack.extraHourPrice}€/hora extra
                      </span>
                    </div>
                    {health && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="ap-card p-2">
                          <p className="">Pack recomanat</p>
                          <p className="text-sm font-semibold">{formatCurrencyExact(health.recommendedPrice)}</p>
                        </div>
                        <PackPriceQuickEditor
                          packId={pack.id}
                          initialPrice={health.publicPrice}
                          initialExtraHourPrice={health.publicExtraHourPrice}
                          recommendedPrice={health.recommendedPrice}
                          recommendedExtraHourPrice={health.recommendedExtraHourPrice}
                          alertThreshold={pricingConfig.alertDivergencePct}
                        />
                        <div className="ap-card p-2">
                          <p className="">Hora extra recomanada</p>
                          <p className="text-sm font-semibold">{formatCurrencyExact(health.recommendedExtraHourPrice)}</p>
                        </div>
                        <div className={`ap-card col-span-2 p-2 ${divergenceColor}`}>
                          <p className="text-xs">Llindar alerta: {pricingConfig.alertDivergencePct}%</p>
                        </div>
                        <div className="ap-card col-span-2 p-2 text-xs">
                          Equip tècnic: {health.specialistCount} especialista + {health.operatorCount} operari · {health.laborNetCostPerHourUsed.toFixed(2)}€/h net · {health.laborCostPerHourUsed.toFixed(2)}€/h brut (SS {(health.socialSecurityPct * 100).toFixed(1)}%)
                        </div>
                        <div className="ap-card col-span-2 p-2 text-xs">
                          IRPF {(health.withholdingPct * 100).toFixed(1)}% → net estimat percebut: {health.laborNetAfterWithholdingPerHourUsed.toFixed(2)}€/h
                        </div>
                        <div className="ap-card col-span-2 p-2 text-xs">
                          Operari extra sempre disponible: {health.recommendedOperatorExtraHourPrice.toFixed(2)}€/h (recomanat)
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span>🎵</span>
                        <span>{pack.djHours}h DJ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🔊</span>
                        <span>{pack.soundWatts}W</span>
                      </div>
                      {pack.includesFog && (
                        <div className="flex items-center gap-2">
                          <span>🌫️</span>
                          <span>Fum inclòs</span>
                        </div>
                      )}
                      {pack.includesMic && (
                        <div className="flex items-center gap-2">
                          <span>🎤</span>
                          <span>Micro inclòs</span>
                        </div>
                      )}
                    </div>

                    {(pack.minGuests || pack.maxGuests) && (
                      <div className="text-sm">
                        👥 {pack.minGuests || '?'} - {pack.maxGuests || '∞'} convidats
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <span>{pack._count.bookings} reserves · {pack.leadsCount} consultes</span>
                      {pack.leadsCount > 0 && (
                        <span className={`font-semibold ${Math.round((pack._count.bookings / pack.leadsCount) * 100) >= 30 ? 'admin-tone-text-success' : 'admin-tone-text-warning'}`}>
                          {Math.round((pack._count.bookings / pack.leadsCount) * 100)}% conv.
                        </span>
                      )}
                    </div>
                    <div className="ap-card p-3 text-xs">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--t2)]">Equip del pack</span>
                        <span className="text-[var(--t3)]">{pack.inventory.length} elements</span>
                      </div>
                      {renderPackInventoryPreview(pack)}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link
                      href={buildPackHref(pack.id)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-[var(--line)] bg-[var(--raised)] hover:bg-[var(--raised)] transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={buildPackHref(pack.id, 'content')}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-[var(--line)] bg-[var(--raised)] hover:bg-[var(--raised)] transition-colors"
                    >
                      📦 Equip
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {filteredPacks.length === 0 && (
        <div className="rounded-2xl border admin-card-glass p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4">{activeFocusLabel ? 'No hi ha packs dins d’aquest focus' : 'No hi ha packs configurats'}</p>
          <p className="text-sm">{activeFocusLabel ? 'Canvia el focus o torna a la vista completa.' : 'Executa el seed per carregar dades inicials'}</p>
        </div>
      )}

      <section className="mt-8 rounded-2xl border admin-card-glass p-5">
        <h2 className="ap-h2">Serveis solts d&apos;Òrbita</h2>
        <p className="mt-1 text-sm admin-tone-text-neutral">
          Serveis propis que s&apos;afegeixen a una reserva fora de pack (p. ex. DJ extra, tècnic de so).
          Es gestionen com a dades al codi; els productes de col·laboradors van al seu catàleg.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ORBITA_SERVICES.map((service) => (
            <div key={service.id} className="rounded-xl border admin-tone-border-neutral p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{service.label}</span>
                <span className="font-bold admin-tone-text-warning">
                  {formatCurrencyExact(service.defaultPrice)}{service.unit === 'hour' ? '/h' : ''}
                </span>
              </div>
              {service.optional && <span className="mt-2 inline-block ap-badge">Opcional</span>}
            </div>
          ))}
        </div>
      </section>
    </AdminPage>
  );
}
