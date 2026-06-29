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

  it('retorna 400 si la reserva encara no esta completada', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'CONFIRMED' });

    const result = await createAdminPostEventReport({ bookingId: 'b1' });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('reserves completades');
    expect(mockPrisma.postEventReport.findUnique).not.toHaveBeenCalled();
  });

  it('retorna 400 si ja existeix informe', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });
    mockPrisma.postEventReport.findUnique.mockResolvedValue({ id: 'per-existing' });

    const result = await createAdminPostEventReport({ bookingId: 'b1' });
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('Ja existeix');
  });

  it('crea informe amb dades', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });

    const result = await createAdminPostEventReport({
      bookingId: 'b1',
      startTime: '22:00',
      endTime: '04:00',
      soundQuality: '5',
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
        soundQuality: 5,
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
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });

    await createAdminPostEventReport({ bookingId: 'b1', incidents: '  ' });

    expect(mockPrisma.postEventReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ hadIncidents: false }),
    });
  });

  it('status DRAFT per defecte', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });

    await createAdminPostEventReport({ bookingId: 'b1' });

    expect(mockPrisma.postEventReport.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'DRAFT', completedAt: null }),
    });
  });

  it('retorna 400 si status no es valid', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });

    const result = await createAdminPostEventReport({ bookingId: 'b1', status: 'PUBLISHED' });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('no valid');
    expect(mockPrisma.postEventReport.create).not.toHaveBeenCalled();
  });

  it('retorna 400 si les valoracions surten del rang 1-5', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', status: 'COMPLETED' });

    const result = await createAdminPostEventReport({ bookingId: 'b1', soundQuality: '8' });

    expect(result.status).toBe(400);
    expect(result.body.error).toContain('1 i 5');
    expect(mockPrisma.postEventReport.create).not.toHaveBeenCalled();
  });
});
