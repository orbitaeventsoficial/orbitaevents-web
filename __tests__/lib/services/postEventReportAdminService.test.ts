import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findUnique: vi.fn() },
    postEventReport: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import { createAdminPostEventReport } from '@/lib/services/postEventReportAdminService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findUnique.mockResolvedValue(null);
  mockPrisma.postEventReport.findUnique.mockResolvedValue(null);
  mockPrisma.postEventReport.create.mockResolvedValue({ id: 'per-1' });
});

describe('createAdminPostEventReport', () => {
  it('retorna 400 sense bookingId', async () => {
    const result = await createAdminPostEventReport({});
    expect(result.status).toBe(400);
  });

  it('retorna 404 si reserva no existeix', async () => {
    const result = await createAdminPostEventReport({ bookingId: 'inexistent' });
    expect(result.status).toBe(404);
  });

  it('retorna 400 si ja existeix informe', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1' });
    mockPrisma.postEventReport.findUnique.mockResolvedValue({ id: 'per-existing' });

    const result = await createAdminPostEventReport({ bookingId: 'b1' });
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Ja existeix');
  });

  it('crea informe amb dades', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1' });

    const result = await createAdminPostEventReport({
      bookingId: 'b1',
      startTime: '22:00',
      endTime: '04:00',
      soundQuality: '8',
      danceFloorLevel: '4',
      musicStyles: 'Reggaeton, Pop',
      incidents: 'Cap incidència',
      eventSummary: 'Molt bé',
      notes: 'Repetir format',
      status: 'COMPLETED',
    });

    expect(result.status).toBe(200);
    expect(mockPrisma.postEventReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: 'b1',
        actualStartTime: '22:00',
        actualEndTime: '04:00',
        soundQuality: 8,
        maxDancefloor: 80,
        mainStyle: 'Reggaeton, Pop',
        hadIncidents: true,
        incidentDescription: 'Cap incidència',
        status: 'COMPLETED',
        completedAt: expect.any(Date),
      }),
    });
  });

  it('hadIncidents false si incidents buit', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1' });

    await createAdminPostEventReport({ bookingId: 'b1', incidents: '  ' });

    expect(mockPrisma.postEventReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ hadIncidents: false }),
    });
  });

  it('status DRAFT per defecte', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1' });

    await createAdminPostEventReport({ bookingId: 'b1' });

    expect(mockPrisma.postEventReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'DRAFT', completedAt: null }),
    });
  });
});
