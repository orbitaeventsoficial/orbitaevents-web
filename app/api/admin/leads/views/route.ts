// app/api/admin/leads/views/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrf } from '@/lib/csrf';
import { requireAuth, verifyBasicAuth, verifyBearerAuth } from '@/lib/auth';
import { log } from '@/lib/logger';
import {
  createLeadSavedView,
  getLeadSavedViews,
  getLeadViewsKey,
  saveLeadSavedViews,
} from '@/lib/services/leadSavedViewsService';

export const dynamic = 'force-dynamic';

function getUserKey(req: NextRequest): string {
  const bearer = verifyBearerAuth(req);
  const auth = bearer.authenticated ? bearer : verifyBasicAuth(req);
  return getLeadViewsKey(auth.user || null);
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const userKey = getUserKey(req);
    let views = await getLeadSavedViews(userKey);
    if (views.length === 0 && userKey !== getLeadViewsKey()) {
      views = await getLeadSavedViews(getLeadViewsKey());
    }
    return NextResponse.json({ ok: true, views });
  } catch (error) {
    log.error('Error obtenint vistes leads', error);
    return NextResponse.json({ error: 'Error obtenint vistes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const next = createLeadSavedView({ name: body?.name, query: body?.query });
    if (!next) {
      return NextResponse.json({ error: 'Nom i query requerits' }, { status: 400 });
    }

    const userKey = getUserKey(req);
    const views = await getLeadSavedViews(userKey);
    await saveLeadSavedViews(userKey, [next, ...views]);
    return NextResponse.json({ ok: true, view: next });
  } catch (error) {
    log.error('Error guardant vista leads', error);
    return NextResponse.json({ error: 'Error guardant vista' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requerit' }, { status: 400 });
    }
    const userKey = getUserKey(req);
    const views = await getLeadSavedViews(userKey);
    const filtered = views.filter((view) => view.id !== id);
    await saveLeadSavedViews(userKey, filtered);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error esborrant vista leads', error);
    return NextResponse.json({ error: 'Error esborrant vista' }, { status: 500 });
  }
}