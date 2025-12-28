/**
 * API ROUTE: Admin Privacy Requests
 * Gestió de sol·licituds ARCO per administradors
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeParseInt } from '@/lib/utils';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = safeParseInt(searchParams.get('limit'), 50, 1, 200);

    const where: Prisma.DataRequestWhereInput = {};

    if (status && status !== 'all') {
      where.status = status as Prisma.EnumDataRequestStatusFilter;
    }

    if (type && type !== 'all') {
      where.requestType = type as Prisma.EnumDataRequestTypeFilter;
    }

    const requests = await prisma.dataRequest.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { legalDeadline: 'asc' },
      ],
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconegut';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
