/**
 * API ROUTE: Admin Duplicates
 * Gestió de clients duplicats
 *
 * GET - Obtenir tots els possibles duplicats
 * POST - Fusionar clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import {
  findAllPotentialDuplicates,
  mergeCustomers,
  getDuplicateStats,
} from '@/lib/services/deduplicationService';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir tots els possibles duplicats
 * Query params:
 * - stats: boolean - només estadístiques
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getDuplicateStats();
      return NextResponse.json({ success: true, data: stats });
    }

    const result = await findAllPotentialDuplicates();

    return NextResponse.json({
      success: true,
      data: {
        groups: result.groups.map(g => ({
          primaryCustomer: {
            id: g.primaryCustomer.id,
            email: g.primaryCustomer.email,
            name: g.primaryCustomer.name,
            phone: g.primaryCustomer.phone,
            instagram: g.primaryCustomer.instagram,
            totalEvents: g.primaryCustomer.totalEvents,
            totalSpent: g.primaryCustomer.totalSpent,
            createdAt: g.primaryCustomer.createdAt,
          },
          duplicates: g.duplicates.map(d => ({
            customer: {
              id: d.customer.id,
              email: d.customer.email,
              name: d.customer.name,
              phone: d.customer.phone,
              instagram: d.customer.instagram,
              totalEvents: d.customer.totalEvents,
              totalSpent: d.customer.totalSpent,
              createdAt: d.customer.createdAt,
            },
            matchScore: d.matchScore,
            matchReasons: d.matchReasons,
          })),
          suggestedAction: g.suggestedAction,
        })),
        totalDuplicates: result.totalDuplicates,
      },
    });
  } catch (error: unknown) {
    log.error('Error fetching duplicates:', error);
    const message = error instanceof Error ? error.message : 'Error obtenint duplicats';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST - Fusionar clients
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primaryId, duplicateIds, fieldPreferences } = body;

    if (!primaryId || !duplicateIds?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Falten primaryId i duplicateIds',
        },
        { status: 400 }
      );
    }

    const result = await mergeCustomers(primaryId, duplicateIds, fieldPreferences);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Fusionats ${duplicateIds.length + 1} clients correctament`,
    });
  } catch (error: unknown) {
    log.error('Error merging customers:', error);
    const message = error instanceof Error ? error.message : 'Error fusionant clients';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
