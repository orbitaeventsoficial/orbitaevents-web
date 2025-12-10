// app/api/admin/bookings/[id]/route.ts
// API per gestionar reserva individual
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

// Schema de validació per PATCH
const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'DEPOSIT_PAID', 'COMPLETED', 'CANCELLED']).optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  guestCount: z.number().optional(),
  totalPrice: z.number().optional(),
  depositAmount: z.number().optional(),
  depositPaid: z.boolean().optional(),
  depositPaidAt: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
}).strict();

// GET - Detall d'una reserva
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        pack: { include: { translations: true, inventory: { include: { item: true } } } },
        extras: { include: { extra: { include: { translations: true } } } },
        inventory: { include: { item: true } },
        lead: true,
        postEventReport: true,
        clientSurvey: true,
        clientFeedback: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Reserva no trobada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      booking,
    });
  } catch (error) {
    console.error('Error obtenint reserva:', error);
    return NextResponse.json(
      { error: 'Error obtenint reserva' },
      { status: 500 }
    );
  }
}

// PATCH - Actualitzar reserva
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const rawBody = await req.json();
    const { id } = params;

    // Validar amb Zod
    const parseResult = updateBookingSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dades invàlides', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const body: Record<string, unknown> = { ...parseResult.data };

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Reserva no trobada' },
        { status: 404 }
      );
    }

    // Processar dates
    if (body.eventDate && typeof body.eventDate === 'string') {
      body.eventDate = new Date(body.eventDate);
    }
    if (body.depositPaidAt && typeof body.depositPaidAt === 'string') {
      body.depositPaidAt = new Date(body.depositPaidAt);
    }

    const oldStatus = existing.status;
    const newStatus = body.status as string | undefined;

    // ═══════════════════════════════════════════════════════════════════
    // AUTO-INCREMENT STATS QUAN EVENT PASSA A COMPLETED
    // ═══════════════════════════════════════════════════════════════════
    if (newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED') {
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

      console.log(`✅ Event COMPLETED: Stats actualitzats (+1 event, +${existing.guestCount} persones)`);
    }

    // Si passa a CANCELLED, alliberar disponibilitat
    if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
      await prisma.availability.updateMany({
        where: { bookingId: id },
        data: { status: 'AVAILABLE', bookingId: null },
      });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: body,
    });

    await prisma.adminLog.create({
      data: {
        action: 'UPDATE',
        entity: 'booking',
        entityId: id,
        details: {
          changes: Object.keys(body),
          statusChange: newStatus !== oldStatus ? `${oldStatus} → ${newStatus}` : undefined,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      booking,
      statsUpdated: newStatus === 'COMPLETED' && oldStatus !== 'COMPLETED',
    });
  } catch (error) {
    console.error('Error actualitzant reserva:', error);
    return NextResponse.json(
      { error: 'Error actualitzant reserva' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar reserva (només PENDING/CANCELLED)
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = params;

    const existing = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Reserva no trobada' },
        { status: 404 }
      );
    }

    // Només permetre eliminar si està PENDING o CANCELLED
    if (!['PENDING', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Només es poden eliminar reserves pendents o cancel·lades' },
        { status: 400 }
      );
    }

    // Alliberar disponibilitat
    await prisma.availability.updateMany({
      where: { bookingId: id },
      data: { status: 'AVAILABLE', bookingId: null },
    });

    // Eliminar extras de la reserva
    await prisma.bookingExtra.deleteMany({
      where: { bookingId: id },
    });

    // Eliminar reserva
    await prisma.booking.delete({
      where: { id },
    });

    await prisma.adminLog.create({
      data: {
        action: 'DELETE',
        entity: 'booking',
        entityId: id,
        details: { reference: existing.reference },
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error('Error eliminant reserva:', error);
    return NextResponse.json(
      { error: 'Error eliminant reserva' },
      { status: 500 }
    );
  }
}
