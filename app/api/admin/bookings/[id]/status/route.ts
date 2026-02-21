// app/api/admin/bookings/[id]/status/route.ts
// API específica per canviar estat de reserva
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { log } from '@/lib/logger';
import { requireAuth, requirePermission } from '@/lib/auth';
import { syncBookingToGoogleCalendar } from '@/lib/services/googleCalendarSyncService';
import { calculateEventDuration } from '@/lib/inventory-utils';

interface Params {
  params: { id: string };
}

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;
type BookingStatus = typeof VALID_STATUSES[number];

// PATCH - Canviar estat de reserva
export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireAuth(req);
  if (authError) return authError;
  const permissionError = requirePermission(req, 'mutate');
  if (permissionError) return permissionError;
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

    // ═══════════════════════════════════════════════════════════════════
    // AUTOMATISMES D'INVENTARI PER CANVI D'ESTAT
    // ═══════════════════════════════════════════════════════════════════

    // CONFIRMED: auto-assignar items del pack i marcar IN_USE
    if (status === 'CONFIRMED' && oldStatus !== 'CONFIRMED') {
      const bookingWithPack = await prisma.booking.findUnique({
        where: { id },
        include: {
          pack: { include: { inventory: { include: { item: true } } } },
          inventory: true,
        },
      });

      if (bookingWithPack?.pack?.inventory) {
        const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING'] as const;
        for (const packItem of bookingWithPack.pack.inventory) {
          const alreadyAssigned = bookingWithPack.inventory.some(
            (bi) => bi.itemId === packItem.itemId
          );
          if (!alreadyAssigned) {
            const overlapping = await prisma.bookingInventory.count({
              where: {
                itemId: packItem.itemId,
                bookingId: { not: id },
                booking: { status: { in: ACTIVE_BOOKING_STATUSES as any } },
              },
            });
            if (overlapping > 0) continue;

            await prisma.bookingInventory.create({
              data: {
                bookingId: id,
                itemId: packItem.itemId,
                quantity: packItem.quantity,
                conditionBefore: packItem.item.condition,
              },
            });
            await prisma.inventoryItem.update({
              where: { id: packItem.itemId },
              data: { status: 'IN_USE' },
            });
          }
        }
      }
    }

    // COMPLETED: registrar hores d'ús i tornar items a AVAILABLE
    if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
      const bookingInv = await prisma.bookingInventory.findMany({
        where: { bookingId: id },
        include: { item: true },
      });

      const eventDuration = calculateEventDuration(
        existing.eventStartTime,
        existing.eventEndTime
      );

      for (const bi of bookingInv) {
        if (eventDuration > 0) {
          await prisma.inventoryUsage.create({
            data: {
              itemId: bi.itemId,
              bookingId: id,
              hoursUsed: eventDuration,
              notes: `Bolo ${existing.reference}`,
            },
          });
        }

        const otherActive = await prisma.bookingInventory.count({
          where: {
            itemId: bi.itemId,
            bookingId: { not: id },
            booking: { status: { in: ['CONFIRMED', 'PREPARING'] } },
          },
        });

        if (otherActive === 0) {
          await prisma.inventoryItem.update({
            where: { id: bi.itemId },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    }

    // Si passa a CANCELLED, alliberar disponibilitat + inventari
    if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      await prisma.availability.updateMany({
        where: { bookingId: id },
        data: { status: 'AVAILABLE', bookingId: null },
      });

      const bookingInv = await prisma.bookingInventory.findMany({
        where: { bookingId: id },
      });

      for (const bi of bookingInv) {
        const otherActive = await prisma.bookingInventory.count({
          where: {
            itemId: bi.itemId,
            bookingId: { not: id },
            booking: { status: { in: ['CONFIRMED', 'PREPARING'] } },
          },
        });

        if (otherActive === 0) {
          await prisma.inventoryItem.update({
            where: { id: bi.itemId },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    }

    // Actualitzar estat
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    const calendarSync = await syncBookingToGoogleCalendar(id);

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
      calendarSync,
    });
  } catch (error) {
    log.error('Error canviant estat de reserva', error, { context: { bookingId: params.id } });
    return NextResponse.json(
      { error: 'Error canviant estat' },
      { status: 500 }
    );
  }
}
