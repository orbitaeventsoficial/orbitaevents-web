/**
 * API ROUTE: Admin Events (Prisma)
 * =================================
 * GET - Obtenir events completats/passats
 * PATCH - Actualitzar estat post-event
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { safeParseInt } from '@/lib/utils';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET - Obtenir events passats/completats
 */
export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'COMPLETED';
    const daysAgo = safeParseInt(searchParams.get('days'), 30, 1, 365);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const bookings = await prisma.booking.findMany({
      where: {
        status: status as any,
        eventDate: {
          gte: cutoffDate,
          lte: new Date(),
        },
      },
      select: {
        id: true,
        eventDate: true,
        status: true,
        clientName: true,
        clientEmail: true,
        eventType: true,
        postEventEmailSentAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { eventDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: bookings,
      stats: {
        total: bookings.length,
        pending: bookings.filter(b => !b.postEventEmailSentAt).length,
        sent: bookings.filter(b => b.postEventEmailSentAt).length,
      },
    });
  } catch (error) {
    log.error('Error obtenint events:', error);
    return NextResponse.json({ error: 'Error obtenint events' }, { status: 500 });
  }
}

/**
 * PATCH - Actualitzar booking (marcar post-event enviat)
 */
export async function PATCH(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { bookingId, post_event_sent_at } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId és obligatori' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (post_event_sent_at) {
      updateData.postEventEmailSentAt = new Date(post_event_sent_at);
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    log.error('Error actualitzant booking:', error);
    return NextResponse.json({ error: 'Error actualitzant booking' }, { status: 500 });
  }
}
