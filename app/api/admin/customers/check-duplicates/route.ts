/**
 * API ROUTE: Check Duplicates (real-time)
 * Comprova duplicats mentre l'admin escriu dades del client
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { checkCustomerDuplicates } from '@/lib/services/customerDuplicateCheckService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const result = await checkCustomerDuplicates(body ?? {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: true, duplicates: [] });
  }
}
