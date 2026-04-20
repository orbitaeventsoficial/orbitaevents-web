import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockResolveCustomerHubCustomerId,
  mockFetchCustomerHubCustomerBase,
  mockFetchCustomerHubLeads,
  mockFetchCustomerHubCollections,
  mockBuildTimeline,
  mockLoadCommTimeline,
} = vi.hoisted(() => ({
  mockResolveCustomerHubCustomerId: vi.fn(),
  mockFetchCustomerHubCustomerBase: vi.fn(),
  mockFetchCustomerHubLeads: vi.fn(),
  mockFetchCustomerHubCollections: vi.fn(),
  mockBuildTimeline: vi.fn(),
  mockLoadCommTimeline: vi.fn(),
}));

vi.mock('@/lib/customer-hub/data', () => ({
  resolveCustomerHubCustomerId: mockResolveCustomerHubCustomerId,
  fetchCustomerHubCustomerBase: mockFetchCustomerHubCustomerBase,
  fetchCustomerHubLeads: mockFetchCustomerHubLeads,
  fetchCustomerHubCollections: mockFetchCustomerHubCollections,
}));

vi.mock('@/lib/customer-hub/timeline', () => ({
  buildTimeline: mockBuildTimeline,
}));

vi.mock('@/lib/services/commTimelineService', () => ({
  loadCommTimeline: mockLoadCommTimeline,
}));

import { fetchCustomerHub } from '@/lib/customer-hub/fetchCustomerHub';

beforeEach(() => {
  vi.clearAllMocks();

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

  mockBuildTimeline.mockReturnValue([]);
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
      adminLogs: [],
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
      adminLogs: [],
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
      adminLogs: [],
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
      adminLogs: [],
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
