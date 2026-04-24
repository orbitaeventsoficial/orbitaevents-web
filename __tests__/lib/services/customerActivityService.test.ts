import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    customer: { findUnique: vi.fn() },
    customerActivity: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

import {
  deriveCustomerHubActivitySummary,
  EMAIL_ACTIVITY_ACTIONS,
  listCustomerActivities,
  recordCustomerEmailSent,
  recordCustomerPostEventEmailSent,
  recordCustomerProposalSent,
  recordCustomerQuoteSent,
  readCustomerActivityLog,
  readRecentEmailActivitySummary,
  createCustomerActivityNote,
} from '@/lib/services/customerActivityService';

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
  mockPrisma.customerActivity.findMany.mockResolvedValue([]);
  mockPrisma.customerActivity.count.mockResolvedValue(0);
  mockPrisma.customerActivity.create.mockResolvedValue({ id: 'act-1' });
});

describe('listCustomerActivities', () => {
  it('retorna llista d\'activitats', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValue([
      { id: 'act-1', action: 'NOTE_ADDED' },
      { id: 'act-2', action: 'STATUS_CHANGED' },
    ]);

    const result = await listCustomerActivities('cust-1');

    expect(result.ok).toBe(true);
    expect(result.activities).toHaveLength(2);
  });

  it('limita a 120 activitats', async () => {
    await listCustomerActivities('cust-1');

    expect(mockPrisma.customerActivity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 120 })
    );
  });
});

describe('readCustomerActivityLog', () => {
  it('llegeix l’historial del client amb ordre descendent i límit configurable', async () => {
    await readCustomerActivityLog('cust-1', 40);

    expect(mockPrisma.customerActivity.findMany).toHaveBeenCalledWith({
      where: { customerId: 'cust-1' },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });
  });
});

describe('recordCustomerEmailSent', () => {
  it('crea EMAIL_SENT amb semàntica shared', async () => {
    await recordCustomerEmailSent({
      customerId: 'cust-1',
      to: 'client@test.com',
      subject: 'Seguiment',
      source: 'admin_emails_send',
    });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'EMAIL_SENT',
        details: {
          to: 'client@test.com',
          subject: 'Seguiment',
          source: 'admin_emails_send',
        },
      },
    });
  });
});

describe('recordCustomerQuoteSent', () => {
  it('crea QUOTE_SENT amb lead opcional i metadades comercials', async () => {
    await recordCustomerQuoteSent({
      customerId: 'cust-1',
      leadId: 'lead-1',
      quoteNumber: 'ORB-2026-100',
      total: 1815,
      to: 'client@test.com',
      source: 'email_quote_route',
    });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'QUOTE_SENT',
        details: {
          leadId: 'lead-1',
          quoteNumber: 'ORB-2026-100',
          total: 1815,
          to: 'client@test.com',
          source: 'email_quote_route',
        },
      },
    });
  });
});

describe('recordCustomerProposalSent', () => {
  it('crea PROPOSAL_SENT amb referència i total', async () => {
    await recordCustomerProposalSent({
      customerId: 'cust-1',
      proposalId: 'prop-1',
      reference: 'OE-Q-2026-001',
      total: 1500,
    });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'PROPOSAL_SENT',
        details: {
          proposalId: 'prop-1',
          reference: 'OE-Q-2026-001',
          total: 1500,
        },
      },
    });
  });
});

describe('recordCustomerPostEventEmailSent', () => {
  it('crea POST_EVENT_EMAIL_SENT amb booking i referència', async () => {
    await recordCustomerPostEventEmailSent({
      customerId: 'cust-1',
      bookingId: 'book-1',
      bookingRef: 'REF-001',
    });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: {
        customerId: 'cust-1',
        action: 'POST_EVENT_EMAIL_SENT',
        details: {
          bookingId: 'book-1',
          bookingRef: 'REF-001',
        },
      },
    });
  });
});

describe('createCustomerActivityNote', () => {
  it('crea nota i retorna 201', async () => {
    const result = await createCustomerActivityNote('cust-1', { note: 'Nota test' });

    expect(result.status).toBe(201);
    expect(result.body.ok).toBe(true);
  });

  it('retorna 404 si client no existeix', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null);

    const result = await createCustomerActivityNote('inexistent', { note: 'Test' });

    expect(result.status).toBe(404);
  });

  it('usa NOTE_ADDED com acció per defecte', async () => {
    await createCustomerActivityNote('cust-1', { note: 'Test' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'NOTE_ADDED',
      }),
    });
  });

  it('usa acció personalitzada si es proporciona', async () => {
    await createCustomerActivityNote('cust-1', { action: 'CALL', note: 'Trucada' });

    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'CALL',
      }),
    });
  });
});

describe('readRecentEmailActivitySummary', () => {
  it('carrega feed recent i comptadors d’email/testimonis des d’un contracte shared', async () => {
    mockPrisma.customerActivity.findMany.mockResolvedValue([
      {
        id: 'act-email-1',
        action: 'POST_EVENT_EMAIL_SENT',
        createdAt: new Date('2026-04-23T10:00:00Z'),
        customer: { name: 'Maria', email: 'maria@example.com' },
      },
    ]);
    mockPrisma.customerActivity.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    const result = await readRecentEmailActivitySummary({
      recentSince: new Date('2026-04-16T00:00:00Z'),
      recentLimit: 15,
      emailsSince: new Date('2026-04-23T00:00:00Z'),
      testimonialsSince: new Date('2026-04-16T00:00:00Z'),
    });

    expect(mockPrisma.customerActivity.findMany).toHaveBeenCalledWith({
      where: {
        action: { in: [...EMAIL_ACTIVITY_ACTIONS] },
        createdAt: { gte: new Date('2026-04-16T00:00:00Z') },
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
    expect(mockPrisma.customerActivity.count).toHaveBeenNthCalledWith(1, {
      where: {
        action: { in: ['POST_EVENT_EMAIL_SENT', 'LEAD_EMAIL_SENT'] },
        createdAt: { gte: new Date('2026-04-23T00:00:00Z') },
      },
    });
    expect(mockPrisma.customerActivity.count).toHaveBeenNthCalledWith(2, {
      where: {
        action: { in: ['TESTIMONIAL_SUBMITTED'] },
        createdAt: { gte: new Date('2026-04-16T00:00:00Z') },
      },
    });
    expect(result).toEqual({
      recentActivity: [
        {
          id: 'act-email-1',
          action: 'POST_EVENT_EMAIL_SENT',
          createdAt: new Date('2026-04-23T10:00:00Z'),
          customer: { name: 'Maria', email: 'maria@example.com' },
        },
      ],
      recentEmailActions: 3,
      recentTestimonials: 2,
    });
  });
});

describe('deriveCustomerHubActivitySummary', () => {
  it('deriva notes del hub i estat manual des de l’activityLog del client', () => {
    const result = deriveCustomerHubActivitySummary([
      {
        id: 'act-1',
        customerId: 'cust-1',
        action: 'HUB_STATUS_SET',
        details: { status: 'POSTEVENT', note: 'Tancat manualment' },
        createdAt: new Date('2026-04-24T10:00:00Z'),
      },
      {
        id: 'act-2',
        customerId: 'cust-1',
        action: 'NOTE_ADDED',
        details: { note: 'Recordar seguiment' },
        createdAt: new Date('2026-04-24T09:00:00Z'),
      },
    ] as never);

    expect(result.manualStatus).toBe('POSTEVENT');
    expect(result.customerNotes).toEqual([
      expect.objectContaining({
        id: 'ca-act-1',
        channel: 'NOTE',
        subject: 'HUB_STATUS_SET',
      }),
      expect.objectContaining({
        id: 'ca-act-2',
        channel: 'NOTE',
        subject: 'NOTE_ADDED',
      }),
    ]);
  });
});
