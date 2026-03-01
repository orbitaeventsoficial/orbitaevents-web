// app/admin/packs/[id]/page.tsx
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditPackForm from './EditPackForm';
import { AdminPage } from '../../components/AdminPage';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';
import { BOOKING_STATUS_CONFIG, formatDateSimple, formatCurrency } from '@/lib/constants';

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
                href={`/admin/bookings/${b.id}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs">{b.reference}</span>
                  <span className="font-medium">{b.clientName}</span>
                  <span className="text-xs opacity-60">{formatDateSimple(b.eventDate, 'ca')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                    b.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-400' :
                    b.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {BOOKING_STATUS_CONFIG[b.status as keyof typeof BOOKING_STATUS_CONFIG]?.label || b.status}
                  </span>
                  <span className="text-xs font-medium">{formatCurrency(b.total || 0, 'ca')}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AdminPage>
  );
}

