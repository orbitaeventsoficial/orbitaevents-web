import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { readCronRunStatuses } from '@/lib/services/cronRunStatusService';

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

  const crons = await readCronRunStatuses(CRON_PREFIXES);

  return NextResponse.json({ ok: true, crons });
}
