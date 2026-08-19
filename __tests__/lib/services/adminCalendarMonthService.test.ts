import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadPendingFollowUps } from '@/lib/services/responseTrackingService';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    booking: { findMany: vi.fn() },
    availability: { findMany: vi.fn() },
    task: { findMany: vi.fn() },
    socialPost: { findMany: vi.fn() },
    lead: { findMany: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/responseTrackingService', () => ({
  loadPendingFollowUps: vi.fn().mockResolvedValue({ total: 0, urgent: 0, items: [] }),
  deriveLeadResponseState: vi.fn(),
}));

import { getAdminCalendarMonth } from '@/lib/services/adminCalendarMonthService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([]);
  mockPrisma.availability.findMany.mockResolvedValue([]);
  mockPrisma.task.findMany.mockResolvedValue([]);
  mockPrisma.socialPost.findMany.mockResolvedValue([]);
  mockPrisma.lead.findMany.mockResolvedValue([]);
});

describe('getAdminCalendarMonth', () => {
  it('retorna 400 sense from o to', async () => {
    expect((await getAdminCalendarMonth(null, null)).status).toBe(400);
    expect((await getAdminCalendarMonth('2026-03-01', null)).status).toBe(400);
    expect((await getAdminCalendarMonth(null, '2026-03-31')).status).toBe(400);
  });

  it('retorna dies del rang', async () => {
    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-03');

    expect(result.status).toBe(200);
    const days = result.body.days!;
    expect(days['2026-03-01']).toBeDefined();
    expect(days['2026-03-02']).toBeDefined();
    expect(days['2026-03-03']).toBeDefined();
  });

  it('associa reserves al dia correcte', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b1',
        leadId: 'l1',
        customerId: 'c1',
        eventDate: new Date('2026-03-15T12:00:00Z'),
        clientName: 'Test Client',
        eventLocation: 'Barcelona',
        eventVenue: null,
        status: 'CONFIRMED',
        eventType: 'WEDDING',
        total: 2000,
        eventStartTime: '20:00',
        eventEndTime: '04:00',
        pack: { slug: 'premium', translations: [{ locale: 'ca', name: 'Premium' }] },
      },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    const day15 = result.body.days!['2026-03-15'];
    expect(day15.reservas).toHaveLength(1);
    expect(day15.reservas[0].clientName).toBe('Test Client');
    expect(day15.reservas[0].packName).toBe('Premium');
  });

  it('associa bloqueigs al dia correcte', async () => {
    mockPrisma.availability.findMany.mockResolvedValue([
      { id: 'av1', date: new Date('2026-03-20T12:00:00Z'), note: 'Festiu' },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    const day20 = result.body.days!['2026-03-20'];
    expect(day20.bloqueos).toHaveLength(1);
    expect(day20.bloqueos[0].notas).toBe('Festiu');
  });

  it('usa fallback slug si no hi ha traducció', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b2',
        leadId: null,
        customerId: null,
        eventDate: new Date('2026-03-10T12:00:00Z'),
        clientName: 'Client',
        eventLocation: null,
        eventVenue: null,
        status: 'PENDING',
        eventType: 'OTHER',
        total: 500,
        eventStartTime: null,
        eventEndTime: null,
        pack: { slug: 'basic', translations: [] },
      },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    expect(result.body.days!['2026-03-10'].reservas[0].packName).toBe('basic');
  });

  it('no filtra cap estat: un lead LOST segueix sortint al seu dia', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l-lost',
        customerId: null,
        name: 'Isaac Salas García',
        eventDate: new Date('2026-03-22T12:00:00Z'),
        eventType: 'PARTY',
        status: 'LOST',
        eventStartTime: null,
        eventEndTime: null,
        eventLocation: null,
      },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    const where = mockPrisma.lead.findMany.mock.calls[0][0].where;
    expect(where.status).toBeUndefined();

    const day22 = result.body.days!['2026-03-22'];
    expect(day22.leads).toHaveLength(1);
    expect(day22.leads[0].active).toBe(false);
    expect(day22.bolos).toHaveLength(1);
    expect(day22.bolos[0].title).toBe('Isaac Salas García');
    expect(day22.bolos[0].kind).toBe('LEAD');
  });

  it('no filtra cap estat: una reserva CANCELLED segueix sortint', async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b-cancel',
        leadId: null,
        customerId: null,
        eventDate: new Date('2026-03-18T12:00:00Z'),
        clientName: 'Client cancel·lat',
        eventLocation: 'Vic',
        eventVenue: null,
        status: 'CANCELLED',
        eventType: 'OTHER',
        total: 100,
        eventStartTime: null,
        eventEndTime: null,
        pack: { slug: 'basic', translations: [] },
      },
    ]);

    const result = await getAdminCalendarMonth('2026-03-01', '2026-03-31');

    expect(mockPrisma.booking.findMany.mock.calls[0][0].where.status).toBeUndefined();

    const day18 = result.body.days!['2026-03-18'];
    expect(day18.reservas[0].active).toBe(false);
    expect(day18.bolos[0].kind).toBe('BOOKING');
    expect(day18.bolos[0].active).toBe(false);
  });

  it('aplana leads i reserves en una sola llista, la feina viva primer', async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      {
        id: 'l-viu',
        customerId: null,
        name: 'Marta nogue',
        eventDate: new Date('2026-03-22T12:00:00Z'),
        eventType: 'PARTY',
        status: 'NEW',
        eventStartTime: '21:00',
        eventEndTime: null,
        eventLocation: null,
      },
      {
        id: 'l-perdut',
        customerId: null,
        name: 'Isaac Salas García',
        eventDate: new Date('2026-03-22T12:00:00Z'),
        eventType: 'PARTY',
        status: 'LOST',
        eventStartTime: '18:00',
        eventEndTime: null,
        eventLocation: null,
      },
    ]);
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        id: 'b-viu',
        leadId: null,
        customerId: null,
        eventDate: new Date('2026-03-22T12:00:00Z'),
        clientName: 'Reserva ferma',
        eventLocation: 'Vic',
        eventVenue: null,
        status: 'CONFIRMED',
        eventType: 'WEDDING',
        total: 900,
        eventStartTime: '19:00',
        eventEndTime: null,
        pack: { slug: 'basic', translations: [] },
      },
    ]);

    const bolos = (await getAdminCalendarMonth('2026-03-01', '2026-03-31')).body.days!['2026-03-22'].bolos;

    expect(bolos.map((bolo) => bolo.title)).toEqual([
      'Reserva ferma',
      'Marta nogue',
      'Isaac Salas García',
    ]);
    expect(bolos.map((bolo) => bolo.active)).toEqual([true, true, false]);
    expect(bolos.map((bolo) => bolo.id)).toEqual(['booking:b-viu', 'lead:l-viu', 'lead:l-perdut']);
  });

  it('propaga customerId als follow-ups del dia', async () => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const from = fromDate.toISOString().slice(0, 10);
    const to = toDate.toISOString().slice(0, 10);

    vi.mocked(loadPendingFollowUps).mockResolvedValueOnce({
      generatedAt: '2026-03-15T08:00:00.000Z',
      total: 1,
      urgent: 1,
      normal: 0,
      low: 0,
      items: [
        {
          leadId: 'l1',
          customerId: 'c1',
          name: 'Maria',
          email: 'maria@test.com',
          phone: null,
          eventType: 'WEDDING',
          status: 'CONTACTED',
          preferredLocale: 'ca',
          contactedAt: new Date('2026-03-10T10:00:00Z'),
          lastOutboundAt: new Date('2026-03-12T10:00:00Z'),
          daysSinceOutbound: 3,
          outboundCount: 1,
          hasInboundAfterOutbound: false,
          urgency: 'URGENT',
          suggestedAction: 'Trucar',
        },
      ],
    });

    const result = await getAdminCalendarMonth(from, to);
    const followUp = result.body.days?.[todayKey]?.followUps?.[0];

    expect(followUp?.leadId).toBe('l1');
    expect(followUp?.customerId).toBe('c1');
  });
});
