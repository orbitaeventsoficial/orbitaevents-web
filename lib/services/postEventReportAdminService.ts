import { prisma } from '@/lib/prisma';

type PostEventReportInput = {
  bookingId?: string;
  eventSummary?: string | null;
  setupTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  soundQuality?: string | number | null;
  danceFloorLevel?: string | number | null;
  musicStyles?: string | null;
  incidents?: string | null;
  notes?: string | null;
  status?: string | null;
};

export async function createAdminPostEventReport(input: PostEventReportInput) {
  if (!input.bookingId) {
    return { status: 400, body: { ok: false, error: 'bookingId es requerido' } };
  }

  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
  if (!booking) {
    return { status: 404, body: { ok: false, error: 'Reserva no trobada' } };
  }

  const existingReport = await prisma.postEventReport.findUnique({
    where: { bookingId: input.bookingId },
  });
  if (existingReport) {
    return { status: 400, body: { ok: false, error: 'Ja existeix un informe per aquesta reserva' } };
  }

  const report = await prisma.postEventReport.create({
    data: {
      bookingId: input.bookingId,
      actualStartTime: input.startTime || null,
      actualEndTime: input.endTime || null,
      soundQuality: input.soundQuality ? parseInt(String(input.soundQuality), 10) : null,
      maxDancefloor: input.danceFloorLevel ? parseInt(String(input.danceFloorLevel), 10) * 20 : null,
      mainStyle: input.musicStyles || null,
      incidentDescription: input.incidents || null,
      hadIncidents: !!input.incidents && input.incidents.trim() !== '',
      lessonsLearned: input.eventSummary || null,
      whatToImprove: input.notes || null,
      status: input.status || 'DRAFT',
      completedAt: input.status === 'COMPLETED' ? new Date() : null,
      genresWorked: [],
      genresFailed: [],
      lightingUsed: [],
      effectsUsed: [],
      gamesPlayed: [],
    },
  });

  return { status: 200, body: { ok: true, report } };
}
