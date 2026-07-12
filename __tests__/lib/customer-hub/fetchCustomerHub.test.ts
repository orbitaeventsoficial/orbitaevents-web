import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockResolveCustomerHubCustomerId,
  mockFetchCustomerHubCustomerBase,
  mockFetchCustomerHubLeads,
  mockFetchCustomerHubCollections,
  mockBuildCustomerBusinessTimelineEvents,
  mockBuildCustomerActivityTimelineEvents,
  mockLoadCommTimeline,
  mockFetchCanonicalEventsForCustomer,
  mockPrisma,
} = vi.hoisted(() => ({
  mockResolveCustomerHubCustomerId: vi.fn(),
  mockFetchCustomerHubCustomerBase: vi.fn(),
  mockFetchCustomerHubLeads: vi.fn(),
  mockFetchCustomerHubCollections: vi.fn(),
  mockBuildCustomerBusinessTimelineEvents: vi.fn(),
  mockBuildCustomerActivityTimelineEvents: vi.fn(),
  mockLoadCommTimeline: vi.fn(),
  mockFetchCanonicalEventsForCustomer: vi.fn(),
  mockPrisma: { customerContact: { findMany: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

vi.mock('@/lib/customer-hub/data', () => ({
  resolveCustomerHubCustomerId: mockResolveCustomerHubCustomerId,
  fetchCustomerHubCustomerBase: mockFetchCustomerHubCustomerBase,
  fetchCustomerHubLeads: mockFetchCustomerHubLeads,
  fetchCustomerHubCollections: mockFetchCustomerHubCollections,
}));

vi.mock('@/lib/customer-hub/timeline', () => ({
  buildCustomerBusinessTimelineEvents: mockBuildCustomerBusinessTimelineEvents,
  buildCustomerActivityTimelineEvents: mockBuildCustomerActivityTimelineEvents,
}));

vi.mock('@/lib/services/commTimelineService', () => ({
  loadCommTimeline: mockLoadCommTimeline,
}));

vi.mock('@/lib/services/timelineQueryService', () => ({
  fetchCanonicalEventsForCustomer: mockFetchCanonicalEventsForCustomer,
}));

import { fetchCustomerHub } from '@/lib/customer-hub/fetchCustomerHub';

beforeEach(() => {
  vi.clearAllMocks();

  mockPrisma.customerContact.findMany.mockResolvedValue([]);
  mockResolveCustomerHubCustomerId.mockResolvedValue('cust-1');
  mockFetchCustomerHubCustomerBase.mockResolvedValue({
    id: 'cust-1',
    customerNumber: 1001,
    name: 'Client Test',
    email: 'client@test.com',
    phone: '+34600000000',
    createdAt: new Date('2026-04-01T10:00:00Z'),
    tags: ['VIP'],
    lifecycleStage: 'RETURNING',
    healthScore: 88,
    preferences: null,
    birthday: null,
    lastContactedAt: null,
    referredBy: null,
    referrals: [],
  });

  mockFetchCustomerHubLeads.mockResolvedValue([
    {
      id: 'lead-1',
      name: 'Lead Test',
      email: 'lead@test.com',
      eventType: 'WEDDING',
      eventDate: null,
      status: 'CONTACTED',
      priority: 'HIGH',
      createdAt: new Date('2026-04-02T09:00:00Z'),
      contactedAt: new Date('2026-04-05T09:00:00Z'),
      activities: [],
      universalTasks: [
        {
          id: 'task-lead-1',
          title: 'Trucar client',
          dueDate: new Date('2026-04-03T12:00:00Z'),
          status: 'OPEN',
          priority: 'URGENT',
          leadId: 'lead-1',
        },
      ],
      booking: null,
    },
  ]);

  mockBuildCustomerBusinessTimelineEvents.mockReturnValue([]);
  mockBuildCustomerActivityTimelineEvents.mockReturnValue([]);
  mockFetchCanonicalEventsForCustomer.mockResolvedValue([]);
  mockLoadCommTimeline.mockResolvedValue({
    entries: [],
    total: 3,
    channels: {
      EMAIL: 1,
      WHATSAPP: 1,
      CALL: 0,
      NOTE: 1,
      SYSTEM: 0,
    },
    lastContactAt: '2026-04-02T09:00:00.000Z',
    lastContactChannel: 'EMAIL',
    lastContactDirection: 'OUTBOUND',
    pendingResponseFrom: 'CLIENT',
    daysSinceLastContact: 2,
    responseGap: 5,
  });
});

describe('fetchCustomerHub', () => {
  it('usa universalTasks del lead quan no hi ha customerTasks', async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.tasks).toEqual([
      expect.objectContaining({
        id: 'task-lead-1',
        title: 'Trucar client',
        leadId: 'lead-1',
        done: false,
        priority: 'HIGH',
      }),
    ]);
  });

  it('prioritza customerTasks quan ja existeixen al client', async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [],
      customerTasks: [
        {
          id: 'task-customer-1',
          title: 'Enviar proposta',
          dueDate: new Date('2026-04-04T10:00:00Z'),
          status: 'DONE',
          priority: 'MEDIUM',
          leadId: 'lead-1',
        },
      ],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.tasks).toEqual([
      expect.objectContaining({
        id: 'task-customer-1',
        title: 'Enviar proposta',
        leadId: 'lead-1',
        done: true,
        priority: 'MEDIUM',
      }),
    ]);
  });

  it('carrega resum de comunicacions canòniques per al customer hub', async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(mockLoadCommTimeline).toHaveBeenCalledWith('lead-1', 'cust-1');
    expect(result.commSummary).toEqual({
      total: 3,
      channels: {
        EMAIL: 1,
        WHATSAPP: 1,
        CALL: 0,
        NOTE: 1,
        SYSTEM: 0,
      },
      lastContactAt: '2026-04-02T09:00:00.000Z',
      lastContactChannel: 'EMAIL',
      lastContactDirection: 'OUTBOUND',
      pendingResponseFrom: 'CLIENT',
      daysSinceLastContact: 2,
      responseGap: 5,
    });
  });

  it('propaga distanceKm des de bookings i reserva vinculada del lead', async () => {
    mockFetchCustomerHubLeads.mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Lead Test',
        email: 'lead@test.com',
        eventType: 'WEDDING',
        eventDate: null,
        status: 'WON',
        priority: 'HIGH',
        createdAt: new Date('2026-04-02T09:00:00Z'),
        contactedAt: new Date('2026-04-05T09:00:00Z'),
        activities: [],
        universalTasks: [],
        booking: {
          id: 'booking-lead-1',
          reference: 'ORB-LEAD-1',
          status: 'CONFIRMED',
          total: 1250,
          depositAmount: 300,
          remainingAmount: 950,
          cashAmount: 500,
          discountCode: null,
          eventType: 'WEDDING',
          eventDate: new Date('2026-06-20T18:00:00Z'),
          eventStartTime: '18:00',
          eventEndTime: '02:00',
          eventLocation: 'Girona',
          eventVenue: 'Masia Can Riera',
          distanceKm: 86.4,
          guestCount: 120,
          depositPaid: true,
          remainingPaid: false,
        },
      },
    ]);
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [
        {
          id: 'booking-row-1',
          reference: 'ORB-ROW-1',
          eventDate: new Date('2026-06-20T18:00:00Z'),
          eventStartTime: '18:00',
          eventEndTime: '02:00',
          status: 'CONFIRMED',
          eventLocation: 'Girona',
          eventVenue: 'Masia Can Riera',
          distanceKm: 86.4,
          depositAmount: 300,
          remainingAmount: 950,
          total: 1250,
          cashAmount: 500,
          eventType: 'WEDDING',
          guestCount: 120,
          depositPaid: true,
          remainingPaid: false,
          discountCode: null,
          pack: null,
        },
      ],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.bookings[0]).toMatchObject({
      id: 'booking-row-1',
      distanceKm: 86.4,
    });
    expect(result.leads[0].booking).toMatchObject({
      id: 'booking-lead-1',
      distanceKm: 86.4,
      cashAmount: 500,
    });
  });

  it('calcula totalPaid amb cashAmount encara que els flags estiguin pendents', async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [
        {
          id: 'booking-cash-1',
          reference: 'ORB-CASH-1',
          eventDate: new Date('2026-06-20T18:00:00Z'),
          eventStartTime: '18:00',
          eventEndTime: '02:00',
          status: 'CONFIRMED',
          eventLocation: 'Girona',
          eventVenue: null,
          distanceKm: null,
          depositAmount: 300,
          remainingAmount: 700,
          total: 1000,
          cashAmount: 1000,
          eventType: 'WEDDING',
          guestCount: 120,
          depositPaid: false,
          remainingPaid: false,
          discountCode: null,
          pack: null,
        },
      ],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.kpis.totalPaid).toBe(1000);
    expect(result.bookings[0]).toMatchObject({
      id: 'booking-cash-1',
      cashAmount: 1000,
    });
  });

  it('propaga report i enquesta post-event cap al customer hub', async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [
        {
          id: 'booking-post-1',
          reference: 'OE-2026-010',
          eventDate: new Date('2026-06-20T18:00:00Z'),
          eventStartTime: '18:00',
          eventEndTime: '02:00',
          status: 'COMPLETED',
          eventLocation: 'Girona',
          eventVenue: null,
          distanceKm: null,
          depositAmount: 300,
          remainingAmount: 700,
          total: 1000,
          cashAmount: 1000,
          eventType: 'WEDDING',
          guestCount: 120,
          depositPaid: true,
          remainingPaid: true,
          discountCode: null,
          pack: null,
          invoices: [
            {
              id: 'inv-1',
              reference: 'FAC-2026-0001',
              status: 'PAID',
              total: 1000,
              pdfUrl: 'https://cdn.test/fac-1.pdf',
              holdedInvoiceUrl: null,
              createdAt: new Date('2026-06-21T09:00:00Z'),
            },
          ],
          deliveryNotes: [
            {
              id: 'alb-1',
              reference: 'ALB-2026-0001',
              status: 'SIGNED',
              pdfUrl: 'https://cdn.test/alb-1.pdf',
              deliveredAt: new Date('2026-06-20T22:00:00Z'),
              signedAt: new Date('2026-06-21T00:30:00Z'),
              createdAt: new Date('2026-06-20T21:45:00Z'),
            },
          ],
          postEventReport: {
            id: 'report-1',
            status: 'COMPLETED',
            completedAt: new Date('2026-06-21T10:00:00Z'),
            createdAt: new Date('2026-06-21T09:55:00Z'),
            soundQuality: 5,
            maxDancefloor: 80,
            hadIncidents: false,
          },
          clientSurvey: {
            id: 'survey-1',
            submittedAt: new Date('2026-06-21T11:00:00Z'),
            overallRating: 5,
            npsScore: 10,
            testimonialPermission: 'YES_ANONYMOUS',
            createdTestimonialId: null,
          },
        },
      ],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.bookings[0]).toMatchObject({
      id: 'booking-post-1',
      postEventReport: {
        id: 'report-1',
        status: 'COMPLETED',
        completedAt: '2026-06-21T10:00:00.000Z',
      },
      clientSurvey: {
        id: 'survey-1',
        submittedAt: '2026-06-21T11:00:00.000Z',
        npsScore: 10,
      },
      invoices: [
        expect.objectContaining({
          id: 'inv-1',
          reference: 'FAC-2026-0001',
          status: 'PAID',
          total: 1000,
          pdfUrl: 'https://cdn.test/fac-1.pdf',
          createdAt: '2026-06-21T09:00:00.000Z',
        }),
      ],
      deliveryNotes: [
        expect.objectContaining({
          id: 'alb-1',
          reference: 'ALB-2026-0001',
          status: 'SIGNED',
          pdfUrl: 'https://cdn.test/alb-1.pdf',
          signedAt: '2026-06-21T00:30:00.000Z',
        }),
      ],
    });
    expect(mockBuildCustomerBusinessTimelineEvents).toHaveBeenCalledWith(expect.objectContaining({
      bookings: [
        expect.objectContaining({
          id: 'booking-post-1',
          postEventReport: expect.objectContaining({ id: 'report-1' }),
          clientSurvey: expect.objectContaining({ id: 'survey-1' }),
          invoices: [
            expect.objectContaining({
              id: 'inv-1',
              status: 'PAID',
              pdfUrl: 'https://cdn.test/fac-1.pdf',
            }),
          ],
          deliveryNotes: [
            expect.objectContaining({
              id: 'alb-1',
              status: 'SIGNED',
              pdfUrl: 'https://cdn.test/alb-1.pdf',
            }),
          ],
        }),
      ],
    }));
  });

  it('carrega també la timeline canònica del customer abans de construir la cronologia', async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    await fetchCustomerHub('cust-1');

    expect(mockFetchCanonicalEventsForCustomer).toHaveBeenCalledWith('cust-1', 250);
    expect(mockBuildCustomerActivityTimelineEvents).toHaveBeenCalledWith(expect.objectContaining({
      canonicalEvents: [],
    }));
  });

  it("propaga l'origen lead/booking/customer de les propostes", async () => {
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [
        {
          id: 'prop-1',
          reference: 'P-2026-001',
          customerId: 'cust-1',
          leadId: 'lead-1',
          bookingId: 'booking-1',
          status: 'SENT',
          total: 900,
          createdAt: new Date('2026-04-10T10:00:00Z'),
          sentAt: new Date('2026-04-11T10:00:00Z'),
          acceptedAt: null,
          snapshot: {},
          contractReference: null,
          contractStatus: null,
          contractPdfUrl: null,
          contractSentAt: null,
          contractSignedAt: null,
        },
      ],
      bookingsRows: [],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.proposals[0]).toMatchObject({
      id: 'prop-1',
      customerId: 'cust-1',
      leadId: 'lead-1',
      bookingId: 'booking-1',
    });
    expect(mockBuildCustomerBusinessTimelineEvents).toHaveBeenCalledWith(expect.objectContaining({
      proposals: [
        expect.objectContaining({
          id: 'prop-1',
          customerId: 'cust-1',
          leadId: 'lead-1',
          bookingId: 'booking-1',
        }),
      ],
    }));
  });

  it('deriva follow-up canònic pendent des dels leads del customer hub', async () => {
    mockFetchCustomerHubLeads.mockResolvedValue([
      {
        id: 'lead-1',
        name: 'Lead Test',
        email: 'lead@test.com',
        eventType: 'WEDDING',
        eventDate: null,
        status: 'CONTACTED',
        priority: 'HIGH',
        createdAt: new Date('2026-04-02T09:00:00Z'),
        contactedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        activities: [
          {
            id: 'act-1',
            type: 'EMAIL',
            title: 'Seguiment enviat',
            description: 'Seguiment comercial',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            createdBy: 'Admin',
            metadata: { direction: 'outbound' },
          },
        ],
        universalTasks: [],
        booking: null,
      },
    ]);
    mockFetchCustomerHubCollections.mockResolvedValue({
      proposals: [],
      bookingsRows: [],
      customerTasks: [],
      activityLog: [],
      customerDiscountCodes: [],
    });

    const result = await fetchCustomerHub('cust-1');

    expect(result.followUpSummary).toMatchObject({
      total: 1,
      urgent: 1,
      topItem: {
        leadId: 'lead-1',
        urgency: 'URGENT',
      },
    });
  });
});
