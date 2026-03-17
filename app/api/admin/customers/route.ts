/**
 * API ROUTE: Admin Customers
 * ==========================
 * GET - Obtenir tots els clients
 * POST - Crear nou client
 */

import { NextRequest } from 'next/server';
import { log } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { verifyCsrf } from '@/lib/csrf';
import { createCustomerFromInput } from '@/lib/services/customerCreationService';
import { listAdminCustomers } from '@/lib/services/customerListService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listAdminCustomers({
      includeStats: searchParams.get('stats') === 'true',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '25', 10),
      q: (searchParams.get('q') || '').trim(),
    });

    return successResponse(result);
  } catch (error) {
    log.error('Error obtenint clients:', error);
    return ApiErrors.internal('Error obtenint clients');
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const csrfError = verifyCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const result = await createCustomerFromInput(body);

    if (result.status >= 400) {
      if (result.status === 400) return ApiErrors.badRequest(String(result.body.error || 'Error creant client'));
      if (result.status === 409) return ApiErrors.conflict(String(result.body.error || 'Conflicte creant client'));
      return ApiErrors.internal(String(result.body.error || 'Error creant client'));
    }

    return successResponse(result.body, result.message || 'Client creat correctament', result.status);
  } catch (error) {
    log.error('Error creant client:', error);
    return ApiErrors.internal('Error creant client');
  }
}
