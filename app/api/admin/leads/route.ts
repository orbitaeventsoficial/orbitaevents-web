/**
 * API ROUTE: Admin Leads
 * GET - Obtenir leads per al pipeline kanban
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { getPipelineLeads } from '@/lib/services/leads/pipeline';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Math.min(limitParam, 500);

    const leads = await getPipelineLeads(limit);
    const response = successResponse({ leads });
    response.headers.set('x-api-deprecated', 'true');
    response.headers.set('x-api-replacement', '/api/admin/leads-new?pipeline=true');
    return response;
  } catch (error) {
    log.error('Error obtenint leads pipeline:', error);
    return ApiErrors.internal('Error obtenint leads');
  }
}
