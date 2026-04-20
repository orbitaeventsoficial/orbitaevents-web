import { prisma } from '@/lib/prisma';
import { OPEN_TASK_STATUSES, TASK_SOURCE } from '@/lib/constants';
import { computePackPricingHealth, getPackPricingModelConfig } from '@/lib/services/packPricingHealth';

const DIVERGENCE_THRESHOLD_PCT = 15;

type PackPricingCheckResult = {
  reviewed: number;
  tasksCreated: number;
};

export async function runPackPricingCheck(): Promise<PackPricingCheckResult> {
  const [config, packs] = await Promise.all([
    getPackPricingModelConfig(),
    prisma.pack.findMany({
      where: { isActive: true },
      include: {
        inventory: {
          select: {
            quantity: true,
            item: {
              select: {
                purchasePrice: true,
                expectedLifeHours: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let tasksCreated = 0;
  const reviewed = packs.length;

  for (const pack of packs) {
    const health = computePackPricingHealth(pack, config);

    if (Math.abs(health.divergencePct) < DIVERGENCE_THRESHOLD_PCT) {
      continue;
    }

    const taskTitle = `Revisar preu pack ${pack.slug || pack.id}`;
    const existingTask = await prisma.task.findFirst({
      where: {
        title: { contains: `preu pack ${pack.slug || pack.id}` },
        status: { in: [...OPEN_TASK_STATUSES] },
      },
    });

    if (existingTask) {
      continue;
    }

    await prisma.task.create({
      data: {
        title: taskTitle,
        description: `Desviació de ${health.divergencePct.toFixed(1)}% entre PVP (${health.publicPrice}€) i recomanat (${health.recommendedPrice}€). Reviseu si cal ajustar el preu.`,
        priority: Math.abs(health.divergencePct) >= 30 ? 'HIGH' : 'MEDIUM',
        status: 'OPEN',
        createdBy: 'system:pack-pricing-check',
        source: TASK_SOURCE.PACK_PRICING,
      },
    });
    tasksCreated++;
  }

  await prisma.adminLog.create({
    data: {
      action: 'PACK_PRICING_CHECK',
      entity: 'pricing',
      entityId: 'pack-pricing-cron',
      details: { reviewed, tasksCreated, threshold: DIVERGENCE_THRESHOLD_PCT },
    },
  });

  return { reviewed, tasksCreated };
}
