/**
 * Public Availability API
 * Returns available/blocked dates for the next 12 months
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { listAvailabilityRange } from '@/lib/services/publicAvailabilityService';

export const revalidate = 900;
export const dynamic = 'force-dynamic';

interface AvailabilityResponse {
  success: boolean;
  data?: {
    dates: Array<{
      date: string;
      status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
      note?: string;
    }>;
    summary: {
      total: number;
      available: number;
      booked: number;
      blocked: number;
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<AvailabilityResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const defaultTo = new Date(today);
    defaultTo.setMonth(defaultTo.getMonth() + 12);

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const from = fromParam ? new Date(fromParam) : today;
    const to = toParam ? new Date(toParam) : defaultTo;

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use ISO format (YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    if (from > to) {
      return NextResponse.json(
        {
          success: false,
          error: 'Start date must be before or equal to end date',
        },
        { status: 400 }
      );
    }

    const maxMonths = 18;
    const maxTo = new Date(from);
    maxTo.setMonth(maxTo.getMonth() + maxMonths);

    if (to > maxTo) {
      return NextResponse.json(
        {
          success: false,
          error: `Date range too large. Maximum ${maxMonths} months allowed`,
        },
        { status: 400 }
      );
    }

    const result = await listAvailabilityRange(from, to);

    log.info('Availability fetched', {
      from: from.toISOString(),
      to: to.toISOString(),
      total: result.summary.total,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    log.error('Error fetching availability', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch availability',
      },
      { status: 500 }
    );
  }
}
