/**
 * API ROUTE: Start Process
 * ========================
 * POST - Iniciar un procés per un client
 * Tipus: review_request, post_event, welcome, promo
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { startCustomerProcess } from '@/lib/services/customerProcessService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await startCustomerProcess(body ?? {});
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    log.error('Error iniciant procés:', error);
    return NextResponse.json({ error: 'Error iniciant procés' }, { status: 500 });
  }
}
