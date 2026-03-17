import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getRequestId } from '@/lib/request-context';
import { saveAdminInventoryBundles, listAdminInventoryBundles } from '@/lib/services/inventoryBundles';
import { verifyCsrf } from '@/lib/csrf';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  return NextResponse.json(await listAdminInventoryBundles());
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;
  getRequestId(req);

  const body = await req.json().catch(() => null);
  const result = await saveAdminInventoryBundles(body);
  return NextResponse.json(result.body, { status: result.status });
}
