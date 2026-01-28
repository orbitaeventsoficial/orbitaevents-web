// app/api/admin/leads/views/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, unauthorizedResponse, verifyBasicAuth, verifyBearerAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

type SavedView = {
  id: string;
  name: string;
  query: string;
  createdAt: string;
};

const KEY = 'leads.views';

function getUserKey(req: NextRequest): string {
  const bearer = verifyBearerAuth(req);
  const auth = bearer.authenticated ? bearer : verifyBasicAuth(req);
  return auth.user ? `${KEY}.${auth.user}` : KEY;
}

async function getViews(key: string): Promise<SavedView[]> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting?.value) return [];
  try {
    const parsed = JSON.parse(setting.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveViews(key: string, views: SavedView[]) {
  const value = JSON.stringify(views.slice(0, 50));
  await prisma.setting.upsert({
    where: { key },
    update: { value, type: 'JSON', category: 'config' },
    create: { key, value, type: 'JSON', category: 'config' },
  });
}

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const userKey = getUserKey(req);
    let views = await getViews(userKey);
    if (views.length === 0 && userKey !== KEY) {
      views = await getViews(KEY);
    }
    return NextResponse.json({ ok: true, views });
  } catch (error) {
    log.error('Error obtenint vistes leads', error);
    return NextResponse.json({ error: 'Error obtenint vistes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const bearer = verifyBearerAuth(req);
  const auth = bearer.authenticated ? bearer : verifyBasicAuth(req);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const body = await req.json();
    const name = String(body?.name || '').trim().slice(0, 80);
    const query = String(body?.query || '').trim();
    if (!name || !query) {
      return NextResponse.json({ error: 'Nom i query requerits' }, { status: 400 });
    }
    const userKey = getUserKey(req);
    const views = await getViews(userKey);
    const next: SavedView = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      query,
      createdAt: new Date().toISOString(),
    };
    await saveViews(userKey, [next, ...views]);
    return NextResponse.json({ ok: true, view: next });
  } catch (error) {
    log.error('Error guardant vista leads', error);
    return NextResponse.json({ error: 'Error guardant vista' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const bearer = verifyBearerAuth(req);
  const auth = bearer.authenticated ? bearer : verifyBasicAuth(req);
  if (!auth.authenticated) return unauthorizedResponse(auth.error);
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID requerit' }, { status: 400 });
    }
    const userKey = getUserKey(req);
    const views = await getViews(userKey);
    const filtered = views.filter((view) => view.id !== id);
    await saveViews(userKey, filtered);
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('Error esborrant vista leads', error);
    return NextResponse.json({ error: 'Error esborrant vista' }, { status: 500 });
  }
}
