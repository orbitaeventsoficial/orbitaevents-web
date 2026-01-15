import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/admin-auth';
import { AdminLog } from '@/lib/admin-log';

export async function POST(req: NextRequest) {
  await requireAuth(req);

  try {
    const body = await req.json();
    const {
      bookingId,
      eventSummary,
      setupTime,
      startTime,
      endTime,
      soundQuality,
      danceFloorLevel,
      musicStyles,
      incidents,
      notes,
      status,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'bookingId es requerido' }, { status: 400 });
    }

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ ok: false, error: 'Reserva no trobada' }, { status: 404 });
    }

    // Check if report already exists for this booking
    const existingReport = await prisma.postEventReport.findUnique({
      where: { bookingId },
    });

    if (existingReport) {
      return NextResponse.json({ ok: false, error: 'Ja existeix un informe per aquesta reserva' }, { status: 400 });
    }

    // Create the report - map form fields to schema fields
    const report = await prisma.postEventReport.create({
      data: {
        bookingId,
        actualStartTime: startTime || null,
        actualEndTime: endTime || null,
        soundQuality: soundQuality ? parseInt(soundQuality) : null,
        maxDancefloor: danceFloorLevel ? parseInt(danceFloorLevel) * 20 : null, // Convert 1-5 to percentage
        mainStyle: musicStyles || null,
        incidentDescription: incidents || null,
        hadIncidents: !!incidents && incidents.trim() !== '',
        lessonsLearned: eventSummary || null,
        whatToImprove: notes || null,
        status: status || 'DRAFT',
        completedAt: status === 'COMPLETED' ? new Date() : null,
        genresWorked: [],
        genresFailed: [],
        lightingUsed: [],
        effectsUsed: [],
        gamesPlayed: [],
      },
    });

    // Log the action
    await AdminLog({
      action: 'CREATE',
      section: 'post-event-reports',
      details: `Created post-event report for booking ${bookingId}`,
      metadata: { reportId: report.id, status: report.status },
    });

    return NextResponse.json({ ok: true, report });
  } catch (error) {
    console.error('Error creating post-event report:', error);
    return NextResponse.json(
      { ok: false, error: 'Error creant informe' },
      { status: 500 }
    );
  }
}
