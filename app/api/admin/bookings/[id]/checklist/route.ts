import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import {
  getBookingChecklist,
  saveBookingChecklist,
} from '@/lib/services/bookingChecklistService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const items = await getBookingChecklist(params.id);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    log.error('checklist GET failed', error);
    return NextResponse.json({ ok: true, items: await getBookingChecklist(params.id) });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    if (!Array.isArray(body?.items)) {
      return NextResponse.json({ ok: false, error: 'items must be an array' }, { status: 400 });
    }

    await saveBookingChecklist(params.id, body.items);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('checklist PUT failed', error);
    return NextResponse.json({ ok: false, error: 'Error desant checklist' }, { status: 500 });
  }
}