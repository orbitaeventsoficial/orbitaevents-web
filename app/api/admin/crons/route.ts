import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CRON_PREFIXES = [
  { id: 'commercial', label: 'Comercial diari', prefix: 'automation.commercial', frequency: 'Diari' },
  { id: 'fuel', label: 'Preu combustible', prefix: 'automation.fuel', frequency: 'Diari' },
  { id: 'invoiceSync', label: 'Sync factures', prefix: 'automation.invoiceSync', frequency: 'Diari' },
  { id: 'packPricing', label: 'Revisió preus packs', prefix: 'automation.packPricing', frequency: 'Diari' },
  { id: 'postEvent', label: 'Emails post-event', prefix: 'automation.postEvent', frequency: 'Diari' },
  { id: 'reviewsSync', label: 'Ressenyes Google', prefix: 'automation.reviewsSync', frequency: 'Diari' },
];

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  // Fetch all automation.* settings in one query
  const settings = await prisma.setting.findMany({
    where: { key: { startsWith: 'automation.' } },
  });

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  const crons = CRON_PREFIXES.map((cron) => {
    const lastRun = settingsMap[`${cron.prefix}.lastRun`] || null;
    const lastStatus = settingsMap[`${cron.prefix}.lastStatus`] || null;
    const lastSummaryRaw = settingsMap[`${cron.prefix}.lastSummary`] || null;
    const lastMessage = settingsMap[`${cron.prefix}.lastMessage`] || null;

    let lastSummary = null;
    if (lastSummaryRaw) {
      try { lastSummary = JSON.parse(lastSummaryRaw); } catch { lastSummary = lastSummaryRaw; }
    }

    // Calculate health: ok if ran in last 26 hours (daily crons with margin)
    let health: 'ok' | 'warning' | 'error' | 'unknown' = 'unknown';
    if (lastRun) {
      const hoursSinceRun = (Date.now() - new Date(lastRun).getTime()) / (1000 * 60 * 60);
      if (lastStatus === 'error') {
        health = 'error';
      } else if (hoursSinceRun <= 26) {
        health = 'ok';
      } else {
        health = 'warning';
      }
    }

    return {
      id: cron.id,
      label: cron.label,
      frequency: cron.frequency,
      lastRun,
      lastStatus,
      lastSummary,
      lastMessage,
      health,
    };
  });

  return NextResponse.json({ ok: true, crons });
}
