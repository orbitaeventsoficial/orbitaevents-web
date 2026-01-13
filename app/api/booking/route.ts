/**
 * Public Booking API
 * Allows users to create booking reservations without payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { sendBookingConfirmation, sendBookingNotificationToAdmin } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

interface BookingRequest {
  // Client info
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  preferredLocale?: string;

  // Event info
  eventType: string;
  eventDate: string; // ISO date
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation: string;
  eventVenue?: string;
  guestCount: number;

  // Service selection
  packId: string;
  extraIds?: string[]; // Array of extra IDs
  extraHours?: number;

  // Additional info
  notes?: string;
}

class BookingError extends Error {
  code: 'DATE_UNAVAILABLE' | 'REFERENCE_CONFLICT';

  constructor(code: BookingError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `OE-${year}-${stamp}${random}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * POST /api/booking
 * Creates a new booking reservation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, {
      limit: 3,
      windowSeconds: 3600,
      prefix: 'booking',
    });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body
    const body: BookingRequest = await request.json();

    // Validate required fields
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

    const missingFields = requiredFields.filter((field) => !body[field as keyof BookingRequest]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.clientEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate event date
    const eventDate = new Date(body.eventDate);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid event date',
        },
        { status: 400 }
      );
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate < today) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event date cannot be in the past',
        },
        { status: 400 }
      );
    }

    // Availability is validated inside the transaction to avoid race conditions

    // Fetch pack details for pricing
    const pack = await prisma.pack.findUnique({
      where: { id: body.packId },
      include: { translations: true },
    });

    if (!pack) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pack selected',
        },
        { status: 400 }
      );
    }

    // Fetch extras if provided
    let extras: any[] = [];
    if (body.extraIds && body.extraIds.length > 0) {
      extras = await prisma.extra.findMany({
        where: { id: { in: body.extraIds } },
        include: { translations: true },
      });

      if (extras.length !== body.extraIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'One or more extras are invalid.',
          },
          { status: 400 }
        );
      }
    }

    // Calculate pricing
    let subtotal = pack.price;

    // Add extras cost
    extras.forEach((extra) => {
      subtotal += extra.price;
    });

    // Add extra hours cost (if applicable)
    if (body.extraHours && pack.extraHourPrice) {
      subtotal += pack.extraHourPrice * body.extraHours;
    }

    const discount = 0;
    const vatRate = 21;
    const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
    const total = subtotal - discount + vatAmount;

    const booking = await prisma.$transaction(async (tx) => {
      const availability = await tx.availability.findUnique({
        where: { date: eventDate },
      });

      if (availability && availability.status !== 'AVAILABLE') {
        throw new BookingError('DATE_UNAVAILABLE', 'Date is not available');
      }

      if (availability) {
        const updated = await tx.availability.updateMany({
          where: { date: eventDate, status: 'AVAILABLE' },
          data: { status: 'BOOKED', note: `Reservado por ${body.clientName}` },
        });

        if (updated.count === 0) {
          throw new BookingError('DATE_UNAVAILABLE', 'Date is not available');
        }
      } else {
        try {
          await tx.availability.create({
            data: {
              date: eventDate,
              status: 'BOOKED',
              note: `Reservado por ${body.clientName}`,
            },
          });
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw new BookingError('DATE_UNAVAILABLE', 'Date is not available');
          }
          throw error;
        }
      }

      let bookingRecord;
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const reference = generateBookingReference();
        try {
          bookingRecord = await tx.booking.create({
            data: {
              reference,
              clientName: body.clientName,
              clientEmail: body.clientEmail,
              clientPhone: body.clientPhone,
              preferredLocale: body.preferredLocale || 'es',
              eventType: body.eventType as any,
              eventDate,
              eventStartTime: body.eventStartTime,
              eventEndTime: body.eventEndTime,
              eventLocation: body.eventLocation,
              eventVenue: body.eventVenue,
              guestCount: body.guestCount,
              packId: body.packId,
              extraHours: body.extraHours || 0,
              subtotal,
              discount,
              vatRate,
              vatAmount,
              total,
              depositAmount: 0,
              remainingAmount: total,
              status: 'PENDING',
              notes: body.notes,
              extras: {
                create: extras.map((extra) => ({
                  extraId: extra.id,
                  quantity: 1,
                  price: extra.price,
                })),
              },
            },
            include: {
              pack: { include: { translations: true } },
              extras: { include: { extra: { include: { translations: true } } } },
            },
          });
          break;
        } catch (error) {
          if (!isUniqueConstraintError(error)) {
            throw error;
          }
        }
      }

      if (!bookingRecord) {
        throw new BookingError(
          'REFERENCE_CONFLICT',
          'Could not generate a unique booking reference'
        );
      }

      await tx.availability.updateMany({
        where: { date: eventDate },
        data: { bookingId: bookingRecord.id },
      });

      return bookingRecord;
    });

    // Send confirmation emails
    try {
      await sendBookingConfirmation(booking);
      await sendBookingNotificationToAdmin(booking);
    } catch (emailError) {
      log.error('Failed to send booking confirmation emails', {
        error: emailError,
        bookingId: booking.id,
      });
      // Don't fail the request if emails fail
    }

    log.info('Booking created successfully', {
      bookingId: booking.id,
      reference: booking.reference,
      eventDate: body.eventDate,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          bookingId: booking.id,
          reference: booking.reference,
          eventDate: booking.eventDate,
          total: booking.total,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingError) {
      if (error.code === 'DATE_UNAVAILABLE') {
        return NextResponse.json(
          {
            success: false,
            error: 'This date is not available. Please choose another date.',
          },
          { status: 409 }
        );
      }
    }

    log.error('Error creating booking', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking. Please try again later.',
      },
      { status: 500 }
    );
  }
}
