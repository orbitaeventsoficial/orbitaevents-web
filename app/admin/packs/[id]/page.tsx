// app/admin/packs/[id]/page.tsx
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditPackForm from './EditPackForm';
import { AdminPage } from '../../components/AdminPage';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { formatDateSimple, formatCurrency, getBookingStatusLabel } from '@/lib/constants';
import { buildBookingHref } from '@/lib/admin/bookingWorkspaceHref';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Editar Pack | Òrbita Admin',
};

async function getPack(id: string) {
  try {
    const pack = await prisma.pack.findUnique({
      where: { id },
      include: {
        translations: true,
        inventory: {
          include: {
            item: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                imageUrl: true,
                category: true,
                status: true,
                purchasePrice: true,
                expectedLifeHours: true,
              },
            },
          },
        },
      },
    });

    return pack;
  } catch (error) {
    log.error('Error obtenint pack:', error);
    return null;
  }
}

async function getPackBookings(packId: string) {
  try {
    return await prisma.booking.findMany({
      where: { packId },
      orderBy: { eventDate: 'desc' },
      take: 20,
      select: {
        id: true,
        reference: true,
        clientName: true,
        eventDate: true,
        status: true,
        total: true,
      },
    });
  } catch (error) {
    log.error('Error obtenint reserves del pack:', error);
    return [];
  }
}

async function getInventoryItems() {
  try {
    return await prisma.inventoryItem.findMany({
      orderBy: [{ status: 'asc' }, { category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        imageUrl: true,
        category: true,
        status: true,
        purchasePrice: true,
        expectedLifeHours: true,
      },
    });
  } catch (error) {
    log.error('Error obtenint inventari per editor de packs:', error);
    return [];
  }
}

export default async function EditPackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pack, inventoryItems, packBookings] = await Promise.all([getPack(id), getInventoryItems(), getPackBookings(id)]);

  if (!pack) {
    notFound();
  }

  const pricingConfig = await getPackPricingModelConfig();
  const pricingHealth = computePackPricingHealth(pack, pricingConfig);

  return (
    <AdminPage
      title="Editar Pack"
      subtitle={`Modifica els detalls del pack ${pack.slug}`}
      back={{ href: '/admin/packs', label: 'Packs' }}
    >
      <EditPackForm
        pack={pack}
        inventoryItems={inventoryItems}
        pricingHint={{
          recommendedPrice: pricingHealth.recommendedPrice,
          recommendedExtraHourPrice: pricingHealth.recommendedExtraHourPrice,
          alertThreshold: pricingConfig.alertDivergencePct,
        }}
        pricingModel={{
          marginTargetPct: pricingConfig.marginTargetPct,
          specialistCostPerHour: pricingConfig.specialistCostPerHour,
          operatorCostPerHour: pricingConfig.operatorCostPerHour,
          supportOperatorMinGuests: pricingConfig.supportOperatorMinGuests,
          supportOperatorMinDjHours: pricingConfig.supportOperatorMinDjHours,
          supportOperatorMinWatts: pricingConfig.supportOperatorMinWatts,
          fixedPackCost: pricingConfig.fixedPackCost,
        }}
      />

      {/* Reserves que usen aquest pack */}
      {packBookings.length > 0 && (
        <section className="mt-6 rounded-xl border p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Reserves amb aquest pack ({packBookings.length})
          </h2>
          <div className="space-y-2">
            {packBookings.map((b) => (
              <Link
                key={b.id}
                href={buildBookingHref(b.id)}
                className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors hover:bg-[var(--raised)]"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">{b.reference}</span>
                  <span className="font-medium">{b.clientName}</span>
                  <span className="text-xs opacity-60">{formatDateSimple(b.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    b.status === 'COMPLETED' ? 'admin-tone-bg-success admin-tone-text-success' :
                    b.status === 'CONFIRMED' ? 'admin-tone-bg-info admin-tone-text-info' :
                    b.status === 'CANCELLED' ? 'admin-tone-bg-danger admin-tone-text-danger' :
                    'admin-tone-bg-warning admin-tone-text-warning'
                  }`}>
                    {getBookingStatusLabel(b.status)}
                  </span>
                  <span className="text-xs font-medium">{formatCurrency(b.total || 0)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AdminPage>
  );
}

