/**
 * Public Availability API
 * Returns available/blocked dates for the next 12 months
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';


// Cache for 15 minutes
export const revalidate = 900;
export const dynamic = 'force-dynamic';

interface AvailabilityResponse {
  success: boolean;
  data?: {
    dates: Array<{
      date: string; // ISO date string (YYYY-MM-DD)
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

/**
 * GET /api/availability
 * Query params:
 *   - from: Start date (ISO) - defaults to today
 *   - to: End date (ISO) - defaults to today + 12 months
 */
export async function GET(request: NextRequest): Promise<NextResponse<AvailabilityResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const defaultTo = new Date(today);
    defaultTo.setMonth(defaultTo.getMonth() + 12);

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const from = fromParam ? new Date(fromParam) : today;
    const to = toParam ? new Date(toParam) : defaultTo;

    // Validate dates
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

    // Limit to max 18 months
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

    // Fetch availability from database
    const availability = await prisma.availability.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      select: {
        date: true,
        status: true,
        note: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Convert to response format
    const dates = availability.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      status: item.status as 'AVAILABLE' | 'BOOKED' | 'BLOCKED',
      note: item.note || undefined,
    }));

    // Calculate summary
    const summary = {
      total: dates.length,
      available: dates.filter((d) => d.status === 'AVAILABLE').length,
      booked: dates.filter((d) => d.status === 'BOOKED').length,
      blocked: dates.filter((d) => d.status === 'BLOCKED').length,
    };

    log.info('Availability fetched', {
      from: from.toISOString(),
      to: to.toISOString(),
      total: summary.total,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          dates,
          summary,
        },
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
