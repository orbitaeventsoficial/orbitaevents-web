// app/api/admin/bookings/[id]/status/route.ts
// API específica per canviar estat de reserva
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';

interface Params {
  params: { id: string };
}

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;
type BookingStatus = typeof VALID_STATUSES[number];

// PATCH - Canviar estat de reserva
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body as { status: BookingStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Estat invàlid' },
        { status: 400 }
      );
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Reserva no trobada' },
        { status: 404 }
      );
    }

    const oldStatus = existing.status;
    let statsUpdated = false;

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-INCREMENT STATS QUAN EVENT PASSA A COMPLETED
    // Usem transacció per evitar race conditions
    // ═══════════════════════════════════════════════════════════════════
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        // 1. Incrementar total_events amb raw SQL per evitar race condition
        await tx.$executeRaw`
          UPDATE settings
          SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)
          WHERE key = 'total_events'
        `;

        // 2. Incrementar total_people amb guestCount
        await tx.$executeRaw`
          UPDATE settings
          SET value = CAST(CAST(value AS INTEGER) + ${existing.guestCount} AS TEXT)
          WHERE key = 'total_people'
        `;

        // 3. Crear notificació en viu
        await tx.liveNotification.create({
          data: {
            type: existing.eventType,
            location: existing.eventLocation,
            isReal: true,
            bookingId: id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dies
          },
        });
      });

      statsUpdated = true;
    }

    // Si passa a CANCELLED, alliberar disponibilitat
    if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      await prisma.availability.updateMany({
        where: { bookingId: id },
        data: { status: 'AVAILABLE', bookingId: null },
      });
    }

    // Actualitzar estat
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    // Log
    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'booking',
        entityId: id,
        details: {
          statusChange: `${oldStatus} → ${status}`,
          statsUpdated,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      booking,
      previousStatus: oldStatus,
      newStatus: status,
      statsUpdated,
    });
  } catch (error) {
    log.error('Error canviant estat de reserva', error, { context: { bookingId: params.id } });
    return NextResponse.json(
      { error: 'Error canviant estat' },
      { status: 500 }
    );
  }
}
