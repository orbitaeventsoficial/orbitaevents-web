// app/api/admin/bookings/[id]/status/route.ts
// API específica per canviar estat de reserva
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    // ═══════════════════════════════════════════════════════════════════
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      // 1. Incrementar total_events
      const eventsSetting = await prisma.setting.findUnique({
        where: { key: 'total_events' },
      });

      if (eventsSetting) {
        await prisma.setting.update({
          where: { key: 'total_events' },
          data: { value: String(parseInt(eventsSetting.value) + 1) },
        });
      }

      // 2. Incrementar total_people amb guestCount
      const peopleSetting = await prisma.setting.findUnique({
        where: { key: 'total_people' },
      });

      if (peopleSetting) {
        await prisma.setting.update({
          where: { key: 'total_people' },
          data: { value: String(parseInt(peopleSetting.value) + existing.guestCount) },
        });
      }

      // 3. Crear notificació en viu
      await prisma.liveNotification.create({
        data: {
          type: existing.eventType,
          location: existing.eventLocation,
          isReal: true,
          bookingId: id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dies
        },
      });

      statsUpdated = true;
      console.log(`✅ Event COMPLETED: Stats actualitzats (+1 event, +${existing.guestCount} persones)`);
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
    console.error('Error canviant estat:', error);
    return NextResponse.json(
      { error: 'Error canviant estat' },
      { status: 500 }
    );
  }
}
