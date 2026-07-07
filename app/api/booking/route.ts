/**
 * Public Booking API
 * Allows users to create booking reservations without payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { createPublicBooking, isDateUnavailableBookingError, type PublicBookingRequest } from '@/lib/services/publicBookingService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await checkRateLimit(request, {
      limit: 3,
      windowSeconds: 3600,
      prefix: 'booking',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body: PublicBookingRequest = await request.json();

    const requiredFields = [
      'clientName',
      'clientEmail',
      'clientPhone',
      'eventType',
      'eventDate',
      'eventLocation',
      'guestCount',
      'packId',
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = body[field as keyof PublicBookingRequest];
      if (typeof value === 'string') return value.trim().length === 0;
      return !value;
    });

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          errorCode: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          errorCode: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    const result = await createPublicBooking(body);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (isDateUnavailableBookingError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'This date is not available. Please choose another date.',
          errorCode: 'DATE_UNAVAILABLE',
        },
        { status: 409 }
      );
    }

    log.error('Error creating booking', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking. Please try again later.',
        errorCode: 'BOOKING_CREATE_FAILED',
      },
      { status: 500 }
    );
  }
}
