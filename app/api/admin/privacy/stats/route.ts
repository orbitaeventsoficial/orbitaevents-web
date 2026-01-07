/**
 * API ROUTE: Admin Privacy Stats
 * Estadístiques de privacitat per al dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrivacyStats } from '@/lib/services/privacyService';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = requireAuth(req);
  if (authError) return authError;
  try {
    const stats = await getPrivacyStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
