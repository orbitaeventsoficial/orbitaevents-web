import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { refreshFuelReferenceNow } from '@/lib/services/fuelReferenceService';
import { getRequestId } from '@/lib/request-context';
import { timingSafeEqual } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function isAuthorized(request: NextRequest, requestId: string): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    log.error('CRON_SECRET no configurat per fuel-daily', undefined, {
      context: { requestId, endpoint: 'cron/fuel-daily:isAuthorized' },
    });
    return false;
  }
  if (!authHeader) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

async function saveRunStatus(status: 'ok' | 'error', summary: unknown, message?: string) {
  const now = new Date().toISOString();
  await prisma.setting.upsert({
    where: { key: 'automation.fuel.lastRun' },
    update: { value: now, type: 'STRING', category: 'finance' },
    create: { key: 'automation.fuel.lastRun', value: now, type: 'STRING', category: 'finance' },
  });
  await prisma.setting.upsert({
    where: { key: 'automation.fuel.lastStatus' },
    update: { value: status, type: 'STRING', category: 'finance' },
    create: { key: 'automation.fuel.lastStatus', value: status, type: 'STRING', category: 'finance' },
  });
  await prisma.setting.upsert({
    where: { key: 'automation.fuel.lastSummary' },
    update: { value: JSON.stringify(summary), type: 'JSON', category: 'finance' },
    create: { key: 'automation.fuel.lastSummary', value: JSON.stringify(summary), type: 'JSON', category: 'finance' },
  });
  if (message) {
    await prisma.setting.upsert({
      where: { key: 'automation.fuel.lastMessage' },
      update: { value: message, type: 'STRING', category: 'finance' },
      create: { key: 'automation.fuel.lastMessage', value: message, type: 'STRING', category: 'finance' },
    });
  }
}

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  if (!isAuthorized(request, requestId)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const refreshed = await refreshFuelReferenceNow();
    const summary = {
      generatedAt: new Date().toISOString(),
      costPerKm: refreshed.costPerKm,
      pricePerLiter: refreshed.pricePerLiter,
      sourceDate: refreshed.sourceDate,
    };

    await prisma.adminLog.create({
      data: {
        action: 'AUTOMATION_FUEL_REFRESH',
        entity: 'automation',
        entityId: 'fuel-daily',
        details: JSON.parse(JSON.stringify(summary)),
      },
    });

    await saveRunStatus('ok', summary);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    log.error('fuel-daily cron failed', error, {
      context: { requestId, endpoint: 'cron/fuel-daily:GET' },
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    await saveRunStatus('error', {}, message);
    return NextResponse.json({ ok: false, error: 'Cron fuel-daily failed' }, { status: 500 });
  }
}

