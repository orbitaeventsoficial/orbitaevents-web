import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { getPackPricingModelConfig, computePackPricingHealth } from '@/lib/services/packPricingHealth';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DIVERGENCE_THRESHOLD_PCT = 15;

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

async function saveRunStatus(status: 'ok' | 'error', summary: unknown, message?: string) {
  const now = new Date().toISOString();
  const prefix = 'automation.packPricing';
  await Promise.all([
    prisma.setting.upsert({ where: { key: `${prefix}.lastRun` }, update: { value: now }, create: { key: `${prefix}.lastRun`, value: now, type: 'STRING', category: 'automation' } }),
    prisma.setting.upsert({ where: { key: `${prefix}.lastStatus` }, update: { value: status }, create: { key: `${prefix}.lastStatus`, value: status, type: 'STRING', category: 'automation' } }),
    prisma.setting.upsert({ where: { key: `${prefix}.lastSummary` }, update: { value: JSON.stringify(summary) }, create: { key: `${prefix}.lastSummary`, value: JSON.stringify(summary), type: 'JSON', category: 'automation' } }),
    ...(message ? [prisma.setting.upsert({ where: { key: `${prefix}.lastMessage` }, update: { value: message }, create: { key: `${prefix}.lastMessage`, value: message, type: 'STRING', category: 'automation' } })] : []),
  ]);
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

    await saveRunStatus('ok', { reviewed, tasksCreated });

    return NextResponse.json({ ok: true, reviewed, tasksCreated });
  } catch (error) {
    log.error('pack-pricing-check cron failed', error, {
      context: { requestId, endpoint: 'cron/pack-pricing-check' },
    });
    await saveRunStatus('error', {}, error instanceof Error ? error.message : 'Error desconegut').catch(() => {});
    return NextResponse.json({ ok: false, error: 'Pack pricing check failed' }, { status: 500 });
  }
}
