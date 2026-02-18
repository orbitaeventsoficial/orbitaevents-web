/**
 * API ROUTE: Admin Leads
 * GET - Obtenir leads per al pipeline kanban
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { successResponse, ApiErrors } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);
    const limit = Math.min(limitParam, 500);

    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        eventType: true,
        eventDate: true,
        status: true,
        priority: true,
        customerId: true,
        budget: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            reference: true,
          },
        },
      },
    });

    return successResponse({ leads });
  } catch (error) {
    log.error('Error obtenint leads pipeline:', error);
    return ApiErrors.internal('Error obtenint leads');
  }
}
