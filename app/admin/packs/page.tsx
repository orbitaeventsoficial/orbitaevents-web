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
import { PACK_SERVICE_OPTIONS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Packs | Òrbita Admin',
};

async function getPacks() {
  try {
    const packs = await prisma.pack.findMany({
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
    });

    return packs;
  } catch (error) {
    log.error('Error obtenint packs:', error);
    return [];
  }
}

export default async function PacksPage() {
  const packs = await getPacks();
  const pricingConfig = await getPackPricingModelConfig();
  const configPacks = getAllPacks();
  const packsInSync = packs.length === configPacks.length;
  const packsByService = PACK_SERVICE_OPTIONS.map(({ value, label }) => ({
    service: value,
    label,
    packs: packs.filter((pack) => pack.service === value),
  })).filter((group) => group.packs.length > 0);
  const otherPacks = packs.filter((pack) => !pack.service || !PACK_SERVICE_OPTIONS.some(({ value }) => value === pack.service));
  const pricingHealthByPack = new Map<string, PackPricingHealth>(
    packs.map((pack) => [pack.id, computePackPricingHealth(pack, pricingConfig)])
  );
  const pricingAlertsCount = Array.from(pricingHealthByPack.values()).filter((row) => row.hasAlert).length;

  return (
    <AdminPage
      title="Packs"
      subtitle={
        <>
          Gestiona els packs de serveis i els seus preus
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

      {/* Stats Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border admin-card-glass p-4">
          <p className="text-xs font-medium uppercase">Total Packs</p>
          <p className="mt-2 text-3xl font-bold">{packs.length}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-medium uppercase">Actius</p>
          <p className="mt-2 text-3xl font-bold">
            {packs.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-medium uppercase">Destacats</p>
          <p className="mt-2 text-3xl font-bold">
            {packs.filter((p) => p.isFeatured).length}
          </p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs font-medium uppercase">Total Reserves</p>
          <p className="mt-2 text-3xl font-bold">
            {packs.reduce((sum, p) => sum + p._count.bookings, 0)}
          </p>
        </div>
        <div className={`rounded-2xl border p-4 ${pricingAlertsCount > 0 ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
          <p className={`text-xs font-medium uppercase ${pricingAlertsCount > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>Alertes de preu pack</p>
          <p className="mt-2 text-3xl font-bold">{pricingAlertsCount}</p>
        </div>
      </section>

      {/* Packs per categoria */}
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
              const extraHourDivergence = health?.extraHourDivergencePct ?? 0;
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
                          <p className="text-sm font-semibold">{health.recommendedPrice.toFixed(2)}€</p>
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
                          <p className="text-sm font-semibold">{health.recommendedExtraHourPrice.toFixed(2)}€</p>
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
                      <span>{pack._count.bookings} reserves</span>
                      <span>{pack.inventory.length} elements inventari</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link
                      href={`/admin/packs/${pack.id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/admin/packs/${pack.id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      📦 Inventari
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
              const extraHourDivergence = health?.extraHourDivergencePct ?? 0;
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
                          <p className="text-sm font-semibold">{health.recommendedPrice.toFixed(2)}€</p>
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
                          <p className="text-sm font-semibold">{health.recommendedExtraHourPrice.toFixed(2)}€</p>
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
                      <span>{pack._count.bookings} reserves</span>
                      <span>{pack.inventory.length} elements inventari</span>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t flex gap-2">
                    <Link
                      href={`/admin/packs/${pack.id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/admin/packs/${pack.id}`}
                    className="flex-1 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      📦 Inventari
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {packs.length === 0 && (
        <div className="rounded-2xl border admin-card-glass p-12 text-center">
          <span className="text-4xl">📦</span>
          <p className="mt-4">No hi ha packs configurats</p>
          <p className="text-sm">Executa el seed per carregar dades inicials</p>
        </div>
      )}
    </AdminPage>
  );
}
