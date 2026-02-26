import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getPackPricingModelConfig, computePackPricingHealth } from '@/lib/services/packPricingHealth';
import { getRequestId } from '@/lib/request-context';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DIVERGENCE_THRESHOLD_PCT = 15;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

      if (Math.abs(health.divergencePct) >= DIVERGENCE_THRESHOLD_PCT) {
        // Comprovar si ja existeix una tasca oberta per aquest pack
        const existingTask = await prisma.task.findFirst({
          where: {
            title: { contains: `preu pack ${pack.slug || pack.id}` },
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
        });

        if (!existingTask) {
          await prisma.task.create({
            data: {
              title: `Revisar preu pack ${pack.slug || pack.id}`,
              description: `Desviació de ${health.divergencePct.toFixed(1)}% entre PVP (${health.publicPrice}€) i recomanat (${health.recommendedPrice}€). Reviseu si cal ajustar el preu.`,
              priority: Math.abs(health.divergencePct) >= 30 ? 'HIGH' : 'MEDIUM',
              status: 'OPEN',
              createdBy: 'system:pack-pricing-check',
            },
          });
          tasksCreated++;
        }
      }
    }

    await prisma.adminLog.create({
      data: {
        action: 'PACK_PRICING_CHECK',
        entity: 'pricing',
        entityId: 'pack-pricing-cron',
        details: { reviewed, tasksCreated, threshold: DIVERGENCE_THRESHOLD_PCT },
      },
    });

    return NextResponse.json({ ok: true, reviewed, tasksCreated });
  } catch (error) {
    log.error('pack-pricing-check cron failed', error, {
      context: { requestId, endpoint: 'cron/pack-pricing-check' },
    });
    return NextResponse.json({ ok: false, error: 'Pack pricing check failed' }, { status: 500 });
  }
}
