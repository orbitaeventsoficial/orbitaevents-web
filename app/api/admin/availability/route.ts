import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { blockAvailabilityDay, listBlockedAvailability, unblockAvailabilityDay } from '@/lib/services/availabilityAdminService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const result = await listBlockedAvailability(
    req.nextUrl.searchParams.get('from'),
    req.nextUrl.searchParams.get('to')
  );
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const result = await blockAvailabilityDay(body?.date, body?.note);
  return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;

  const csrfError = await verifyCsrf(req);
  if (csrfError) return csrfError;

  const result = await unblockAvailabilityDay(
    req.nextUrl.searchParams.get('id'),
    req.nextUrl.searchParams.get('date')
  );
  return NextResponse.json(result.body, { status: result.status });
}
