import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const SETTING_PREFIX = 'booking.checklist.';

/** Default checklist items for a booking */
const DEFAULT_ITEMS = [
  { id: 'confirm-client', label: 'Confirmar data i hora amb el client', checked: false },
  { id: 'prepare-playlist', label: 'Preparar playlist / escaleta', checked: false },
  { id: 'check-equipment', label: 'Revisar equipament necessari', checked: false },
  { id: 'load-vehicle', label: 'Carregar vehicle', checked: false },
  { id: 'confirm-address', label: 'Confirmar adreça i accés al lloc', checked: false },
  { id: 'verify-payment', label: 'Verificar estat de pagament', checked: false },
  { id: 'check-contracts', label: 'Contracte / pressupost signat', checked: false },
];

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: `${SETTING_PREFIX}${params.id}` },
    });

    if (setting?.value) {
      const items: ChecklistItem[] = JSON.parse(setting.value);
      return NextResponse.json({ ok: true, items });
    }

    return NextResponse.json({ ok: true, items: DEFAULT_ITEMS });
  } catch (error) {
    log.error('checklist GET failed', error);
    return NextResponse.json({ ok: true, items: DEFAULT_ITEMS });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const items: ChecklistItem[] = body.items;

    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, error: 'items must be an array' }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key: `${SETTING_PREFIX}${params.id}` },
      create: { key: `${SETTING_PREFIX}${params.id}`, value: JSON.stringify(items), category: 'checklist' },
      update: { value: JSON.stringify(items) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('checklist PUT failed', error);
    return NextResponse.json({ ok: false, error: 'Error desant checklist' }, { status: 500 });
  }
}
