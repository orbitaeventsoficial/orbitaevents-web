import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { log } from '@/lib/logger';
import { getEffectivePricingConfig, upsertPricingConfig } from '@/lib/services/pricingConfigService';

const PricingConfigSchema = z.object({
  targetMarginPct: z.number().min(0).max(100).optional(),
  ourHourlyRateByService: z.record(z.object({
    min: z.number().min(0),
    recommended: z.number().min(0),
    premium: z.number().min(0),
  })).optional(),
  depositPctRecommended: z.number().min(0).max(100).optional(),
  alertThresholds: z.object({
    priceDeviationAlertPct: z.number().min(0).optional(),
    priceDeviationCriticalPct: z.number().min(0).optional(),
    lowMarginPct: z.number().min(0).optional(),
    criticalMarginPct: z.number().min(0).optional(),
  }).optional(),
  equipmentAmortization: z.record(z.object({
    value: z.number().min(0),
    lifeHours: z.number().min(1),
  })).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const config = await getEffectivePricingConfig(null);
    return NextResponse.json(config);
  } catch (error) {
    log.error('[pricingConfig GET]', error);
    return NextResponse.json({ error: 'Error llegint configuració' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const body = await req.json();
    const parsed = PricingConfigSchema.parse(body);
    const config = await upsertPricingConfig(parsed);
    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dades invàlides', details: error.errors }, { status: 400 });
    }
    log.error('[pricingConfig PUT]', error);
    return NextResponse.json({ error: 'Error desant configuració' }, { status: 500 });
  }
}
