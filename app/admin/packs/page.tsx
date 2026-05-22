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
import { OwnerControlStrip } from '../components/OwnerControlStrip';
import { PACK_SERVICE_OPTIONS, formatCurrencyExact } from '@/lib/constants';
import { calculateCostPerHour } from '@/lib/inventory-utils';
import { buildPackHref } from '@/lib/admin/packWorkspaceHref';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Packs | Òrbita Admin',
};

type PackFocus = 'alert' | 'critical-margin' | 'missing-capacity' | 'partial-cost' | 'without-inventory';

function renderPackInventoryPreview(pack: Awaited<ReturnType<typeof getPacks>>[number]) {
  if (pack.inventory.length === 0) {
    return <p className="text-xs text-white/40">Sense equip base assignat</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {pack.inventory.slice(0, 4).map((row) => (
          <span
            key={row.item.code}
            className="inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-100"
          >
            {row.item.name}
            {row.quantity > 1 ? ` ×${row.quantity}` : ''}
          </span>
        ))}
        {pack.inventory.length > 4 && (
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/70">
            +{pack.inventory.length - 4} més
          </span>
        )}
      </div>
      <p className="text-[11px] text-white/55">
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

  const packsNextStep = packs.length === 0
    ? {
        eyebrow: 'Següent pas · Iniciar',
        title: 'Configurar catàleg de packs',
        detail: 'Encara no hi ha packs a la BD. Executa el seed o crea el primer pack per obrir el catàleg comercial.',
        href: '/admin/packs/new',
        ctaLabel: 'Nou pack',
      }
    : !packsInSync
    ? {
        eyebrow: 'Següent pas · Sync',
        title: 'Sincronitzar BD amb el config',
        detail: `BD ${packs.length} ≠ config ${configPacks.length}. Executa el sync per alinear el catàleg productiu amb la font de veritat del repo.`,
        href: '/admin/packs',
        ctaLabel: 'Tornar a la taula',
        secondaryAction: { href: '/admin/pricing', label: 'Obrir pricing' },
      }
    : pricingAlertsCount > 0
    ? {
        eyebrow: 'Següent pas · Preu',
        title: 'Tancar divergències de preu',
        detail: `${pricingAlertsCount} ${pricingAlertsCount === 1 ? 'pack supera' : 'packs superen'} el llindar del ${pricingConfig.alertDivergencePct}% entre públic i recomanat. Ajusta o justifica la divergència.`,
        href: '/admin/packs?focus=alert',
        ctaLabel: 'Filtrar alertes',
        secondaryAction: { href: '/admin/pricing', label: 'Obrir pricing' },
      }
    : criticalMarginCount > 0
    ? {
        eyebrow: 'Següent pas · Marge',
        title: 'Revisar packs amb marge crític',
        detail: `${criticalMarginCount} ${criticalMarginCount === 1 ? 'pack està' : 'packs estan'} per sota del marge objectiu. Puja preu, baixa cost o retira del catàleg públic.`,
        href: '/admin/packs?focus=critical-margin',
        ctaLabel: 'Filtrar marge crític',
      }
    : withoutInventoryCount > 0
    ? {
        eyebrow: 'Següent pas · Equip',
        title: 'Assignar equip base a packs',
        detail: `${withoutInventoryCount} ${withoutInventoryCount === 1 ? 'pack no té' : 'packs no tenen'} equip base definit. Sense inventari assignat el cost real queda invisible.`,
        href: '/admin/packs?focus=without-inventory',
        ctaLabel: 'Filtrar sense equip',
      }
    : partialCostCount > 0 || missingCapacityCount > 0
    ? {
        eyebrow: 'Següent pas · Higiene',
        title: 'Completar dades de càlcul',
        detail: 'Queden packs amb càlcul parcial o sense rang de convidats clar. Petits arreglaments però necessaris per càlcul de preu net.',
        href: partialCostCount > 0 ? '/admin/packs?focus=partial-cost' : '/admin/packs?focus=missing-capacity',
        ctaLabel: 'Revisar focus',
      }
    : {
        eyebrow: 'Següent pas',
        title: 'Catàleg al dia',
        detail: 'Sense alertes visibles al catàleg. Aprofita per revisar extras, crear un pack nou o obrir el cockpit de preus.',
        href: '/admin/packs/new',
        ctaLabel: 'Nou pack',
        secondaryAction: { href: '/admin/packs/extras', label: 'Veure extres' },
      };

  return (
    <AdminPage
      title="Packs"
      subtitle={
        <>
          Gestiona els packs de serveis i els seus preus
          {activeFocusLabel && (
            <span className="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-100">
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
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-black transition-colors"
          >
            + Nou Pack
          </Link>
        </div>
      }
    >
      <OwnerControlStrip
        system={{
          eyebrow: 'Automàtic · Catàleg de packs',
          title: packs.length === 0 ? 'Sense packs' : `${packs.length} packs al catàleg`,
          tone: packsInSync && packs.length > 0 ? 'info' : 'warning',
          items: packsSystemItems,
          emptyText: 'Encara no hi ha packs configurats.',
        }}
        manual={{
          eyebrow: 'Manual · Salut del catàleg',
          title: packsManualItems.length === 0
            ? 'Cap alerta visible'
            : `${packsManualItems.length} senyals per revisar`,
          tone: (pricingAlertsCount > 0 || criticalMarginCount > 0)
            ? 'warning'
            : packsManualItems.length > 0
            ? 'info'
            : 'success',
          items: packsManualItems,
          emptyText: 'Cap pack requereix intervenció manual ara mateix.',
        }}
        nextStep={packsNextStep}
      />

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/packs"
          className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold"
        >
          Packs
        </Link>
        <Link
          href="/admin/packs/extras"
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 hover:bg-white/10"
        >
          Extres
        </Link>
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Total Packs</p>
          <p className="mt-2 text-3xl font-bold">{filteredPacks.length}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-medium uppercase">Actius</p>
          <p className="mt-2 text-3xl font-bold">
            {filteredPacks.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-medium uppercase">Destacats</p>
          <p className="mt-2 text-3xl font-bold">
            {filteredPacks.filter((p) => p.isFeatured).length}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-medium uppercase">Total Reserves</p>
          <p className="mt-2 text-3xl font-bold">
            {filteredPacks.reduce((sum, p) => sum + p._count.bookings, 0)}
          </p>
        </div>
        <div className={`rounded-2xl border p-4 ${pricingAlertsCount > 0 ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
          <p className={`text-xs font-medium uppercase ${pricingAlertsCount > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>Alertes de preu pack</p>
          <p className="mt-2 text-3xl font-bold">{pricingAlertsCount}</p>
        </div>
      </section>

      {packsByService.map((group) => (
        <section key={group.service} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{group.label}</h2>
            <span className="text-xs">{group.packs.length} packs</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {group.packs.map((pack) => {
              const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
              const health = pricingHealthByPack.get(pack.id);
              const divergence = health?.divergencePct ?? 0;
              const divergenceColor = health?.hasAlert
                ? 'text-rose-300 border-rose-400/35 bg-rose-950/20'
                : Math.abs(divergence) >= pricingConfig.alertDivergencePct * 0.5
                  ? 'text-orange-300 border-orange-400/35 bg-orange-950/20'
                  : 'text-emerald-300 border-emerald-400/35 bg-emerald-950/20';
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border admin-card-glass overflow-hidden ${
                    pack.isFeatured
                      ? 'ring-1 ring-amber-500/20 border-amber-500/30'
                      : 'border-white/10'
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
                        <div className="rounded-xl border p-2">
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
                        <div className="rounded-xl border p-2">
                          <p className="">Hora extra recomanada</p>
                          <p className="text-sm font-semibold">{formatCurrencyExact(health.recommendedExtraHourPrice)}</p>
                        </div>
                        <div className={`col-span-2 rounded-xl border p-2 ${divergenceColor}`}>
                          <p className="text-[11px]">Llindar alerta: {pricingConfig.alertDivergencePct}%</p>
                        </div>
                        <div className="col-span-2 rounded-xl border p-2 text-[11px]">
                          Equip tècnic: {health.specialistCount} especialista + {health.operatorCount} operari · {health.laborNetCostPerHourUsed.toFixed(2)}€/h net · {health.laborCostPerHourUsed.toFixed(2)}€/h brut (SS {(health.socialSecurityPct * 100).toFixed(1)}%)
                        </div>
                        <div className="col-span-2 rounded-xl border p-2 text-[11px]">
                          IRPF {(health.withholdingPct * 100).toFixed(1)}% → net estimat percebut: {health.laborNetAfterWithholdingPerHourUsed.toFixed(2)}€/h
                        </div>
                        <div className="col-span-2 rounded-xl border p-2 text-[11px]">
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
                        <span className={`font-semibold ${Math.round((pack._count.bookings / pack.leadsCount) * 100) >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {Math.round((pack._count.bookings / pack.leadsCount) * 100)}% conv.
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-white/80">Equip del pack</span>
                        <span className="text-white/55">{pack.inventory.length} elements</span>
                      </div>
                      {renderPackInventoryPreview(pack)}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link
                      href={buildPackHref(pack.id)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={buildPackHref(pack.id, 'content')}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
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
            <h2 className="text-lg font-semibold">Altres</h2>
            <span className="text-xs">{otherPacks.length} packs</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherPacks.map((pack) => {
              const translation = pack.translations.find((t) => t.locale === 'es') || pack.translations[0];
              const health = pricingHealthByPack.get(pack.id);
              const divergence = health?.divergencePct ?? 0;
              const divergenceColor = health?.hasAlert
                ? 'text-rose-300 border-rose-400/35 bg-rose-950/20'
                : Math.abs(divergence) >= pricingConfig.alertDivergencePct * 0.5
                  ? 'text-orange-300 border-orange-400/35 bg-orange-950/20'
                  : 'text-emerald-300 border-emerald-400/35 bg-emerald-950/20';
              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl border admin-card-glass overflow-hidden ${
                    pack.isFeatured
                      ? 'ring-1 ring-amber-500/20 border-amber-500/30'
                      : 'border-white/10'
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
                        <div className="rounded-xl border p-2">
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
                        <div className="rounded-xl border p-2">
                          <p className="">Hora extra recomanada</p>
                          <p className="text-sm font-semibold">{formatCurrencyExact(health.recommendedExtraHourPrice)}</p>
                        </div>
                        <div className={`col-span-2 rounded-xl border p-2 ${divergenceColor}`}>
                          <p className="text-[11px]">Llindar alerta: {pricingConfig.alertDivergencePct}%</p>
                        </div>
                        <div className="col-span-2 rounded-xl border p-2 text-[11px]">
                          Equip tècnic: {health.specialistCount} especialista + {health.operatorCount} operari · {health.laborNetCostPerHourUsed.toFixed(2)}€/h net · {health.laborCostPerHourUsed.toFixed(2)}€/h brut (SS {(health.socialSecurityPct * 100).toFixed(1)}%)
                        </div>
                        <div className="col-span-2 rounded-xl border p-2 text-[11px]">
                          IRPF {(health.withholdingPct * 100).toFixed(1)}% → net estimat percebut: {health.laborNetAfterWithholdingPerHourUsed.toFixed(2)}€/h
                        </div>
                        <div className="col-span-2 rounded-xl border p-2 text-[11px]">
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
                        <span className={`font-semibold ${Math.round((pack._count.bookings / pack.leadsCount) * 100) >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {Math.round((pack._count.bookings / pack.leadsCount) * 100)}% conv.
                        </span>
                      )}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-white/80">Equip del pack</span>
                        <span className="text-white/55">{pack.inventory.length} elements</span>
                      </div>
                      {renderPackInventoryPreview(pack)}
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link
                      href={buildPackHref(pack.id)}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={buildPackHref(pack.id, 'content')}
                      className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
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
    </AdminPage>
  );
}
