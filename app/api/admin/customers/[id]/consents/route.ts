import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { listCustomerConsentsAndRequests } from '@/lib/services/customerConsentService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const result = await listCustomerConsentsAndRequests(id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
