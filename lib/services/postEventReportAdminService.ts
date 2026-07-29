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

const REPORT_STATUSES = new Set(['DRAFT', 'COMPLETED']);

function parseRating(value: string | number | null | undefined, field: string) {
  if (value === null || value === undefined || value === '') return { ok: true as const, value: null };
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false as const, error: `${field} ha de ser un valor entre 1 i 5` };
  }
  return { ok: true as const, value: rating };
}

export async function createAdminPostEventReport(input: PostEventReportInput) {
  if (!input.bookingId) {
    return { status: 400, body: { ok: false, error: 'bookingId es requerido' } };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    select: {
      id: true,
      reference: true,
      status: true,
      customerId: true,
      lead: { select: { customerId: true } },
    },
  });
  if (!booking) {
    return { status: 404, body: { ok: false, error: 'Reserva no trobada' } };
  }
  if (booking.status !== 'COMPLETED') {
    return { status: 400, body: { ok: false, error: 'Només es pot crear informe post-event per reserves completades' } };
  }

  const existingReport = await prisma.postEventReport.findUnique({
    where: { bookingId: input.bookingId },
  });
  if (existingReport) {
    return { status: 400, body: { ok: false, error: 'Ja existeix un informe per aquesta reserva' } };
  }

  const status = input.status || 'DRAFT';
  if (!REPORT_STATUSES.has(status)) {
    return { status: 400, body: { ok: false, error: 'Estat d\'informe no valid' } };
  }

  const soundQuality = parseRating(input.soundQuality, 'Qualitat del so');
  if (!soundQuality.ok) {
    return { status: 400, body: { ok: false, error: soundQuality.error } };
  }
  const danceFloorLevel = parseRating(input.danceFloorLevel, 'Nivell de pista');
  if (!danceFloorLevel.ok) {
    return { status: 400, body: { ok: false, error: danceFloorLevel.error } };
  }

  const reportData = {
    bookingId: input.bookingId,
    actualStartTime: input.startTime || null,
    actualEndTime: input.endTime || null,
    soundQuality: soundQuality.value,
    maxDancefloor: danceFloorLevel.value !== null ? danceFloorLevel.value * 20 : null,
    mainStyle: input.musicStyles || null,
    incidentDescription: input.incidents || null,
    hadIncidents: !!input.incidents && input.incidents.trim() !== '',
    lessonsLearned: input.eventSummary || null,
    whatToImprove: input.notes || null,
    status,
    completedAt: status === 'COMPLETED' ? new Date() : null,
    genresWorked: [],
    genresFailed: [],
    lightingUsed: [],
    effectsUsed: [],
    gamesPlayed: [],
  };

  const report = await prisma.postEventReport.create({ data: reportData });

  return { status: 200, body: { ok: true, report } };
}
