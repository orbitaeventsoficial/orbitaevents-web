/**
 * Public Booking API
 * Allows users to create booking reservations without payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { sendBookingConfirmation, sendBookingNotificationToAdmin } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

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

    // Check if date is already booked
    const existingAvailability = await prisma.availability.findUnique({
      where: { date: eventDate },
    });

    if (existingAvailability && existingAvailability.status === 'BOOKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'This date is already booked. Please choose another date.',
        },
        { status: 409 }
      );
    }

    if (existingAvailability && existingAvailability.status === 'BLOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'This date is not available. Please choose another date.',
        },
        { status: 409 }
      );
    }

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

    // Generate booking reference
    const year = new Date().getFullYear();
    const count = await prisma.booking.count({
      where: {
        reference: {
          startsWith: `OE-${year}-`,
        },
      },
    });
    const reference = `OE-${year}-${String(count + 1).padStart(3, '0')}`;

    // Create booking
    const booking = await prisma.booking.create({
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

    // Update availability calendar
    await prisma.availability.upsert({
      where: { date: eventDate },
      update: {
        status: 'BOOKED',
        bookingId: booking.id,
        note: `Reservado por ${body.clientName}`,
      },
      create: {
        date: eventDate,
        status: 'BOOKED',
        bookingId: booking.id,
        note: `Reservado por ${body.clientName}`,
      },
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
