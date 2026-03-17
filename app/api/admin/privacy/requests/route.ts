/**
 * API ROUTE: Admin Privacy Requests
 * Gestió de sol·licituds ARCO per administradors
 */

import { NextRequest, NextResponse } from 'next/server';
import { safeParseInt } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';
import { listAdminPrivacyRequests } from '@/lib/services/privacyRequestListService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const result = await listAdminPrivacyRequests(
      searchParams.get('status'),
      searchParams.get('type'),
      safeParseInt(searchParams.get('limit'), 50, 1, 200)
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
