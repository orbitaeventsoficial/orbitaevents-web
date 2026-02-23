// app/admin/packs/[id]/page.tsx
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EditPackForm from './EditPackForm';
import { AdminPage } from '../../components/AdminPage';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';

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
  const [pack, inventoryItems] = await Promise.all([getPack(id), getInventoryItems()]);

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
    </AdminPage>
  );
}

