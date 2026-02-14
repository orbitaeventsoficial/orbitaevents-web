import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import {
  DEFAULT_QUOTE_TEMPLATE,
  getQuoteTemplateSettings,
  normalizeQuoteTemplate,
  upsertQuoteTemplateSettings,
} from '@/lib/services/quoteTemplateService';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'read');
  if (permissionError) return permissionError;

  try {
    const template = await getQuoteTemplateSettings();
    return NextResponse.json({ ok: true, template, defaults: DEFAULT_QUOTE_TEMPLATE });
  } catch (error) {
    log.error('Error loading quote template settings', error);
    return NextResponse.json(
      { ok: false, error: 'No se pudo cargar la plantilla de presupuesto' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;

  try {
    const body = await req.json().catch(() => ({}));
    const payload = normalizeQuoteTemplate(body?.template);
    const saved = await upsertQuoteTemplateSettings(payload);

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'setting',
        entityId: 'quotes.template',
        details: { key: 'quotes.template' },
      },
    });

    return NextResponse.json({ ok: true, template: saved });
  } catch (error) {
    log.error('Error updating quote template settings', error);
    return NextResponse.json(
      { ok: false, error: 'No se pudo actualizar la plantilla de presupuesto' },
      { status: 500 }
    );
  }
}
