import { NextRequest, NextResponse } from 'next/server';
import { getManagedImageCollection, getManagedImageOverride } from '@/lib/services/imageManagerService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const keys = request.nextUrl.searchParams.getAll('key').filter(Boolean);
  if (keys.length === 0) {
    return NextResponse.json({ ok: false, error: 'Cal almenys una key' }, { status: 400 });
  }

  const entries = await Promise.all(keys.map(async (key) => ({
    key,
    item: await getManagedImageOverride(key),
    items: await getManagedImageCollection(key),
  })));

  return NextResponse.json({
    ok: true,
    data: Object.fromEntries(entries.map((entry) => [entry.key, {
      item: entry.item,
      items: entry.items,
    }])),
  });
}
