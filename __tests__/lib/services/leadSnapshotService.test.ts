import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockSendEmail } = vi.hoisted(() => ({
  mockPrisma: {
    lead: { findUnique: vi.fn() },
    leadDocument: { create: vi.fn() },
    leadActivity: { create: vi.fn() },
    leadNote: { create: vi.fn() },
  },
  mockSendEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: { business: { email: 'admin@orbita.com' } },
}));
vi.mock('@/lib/utils/sanitize', () => ({ escapeHtml: (s: string) => s }));
vi.mock('@/lib/constants', () => ({ formatDateTimeFull: () => '2026-03-18 12:00' }));

import {
  buildLeadTechnicalSnapshot,
  serializeLeadTechnicalSnapshot,
  renderLeadTechnicalSnapshotEmail,
  processLeadTechnicalSnapshot,
} from '@/lib/services/leadSnapshotService';

const BASE_LEAD = {
  id: 'lead-1',
  name: 'Joan Garcia',
  email: 'joan@example.com',
  phone: '+34612345678',
  eventType: 'Boda',
  eventDate: new Date('2026-09-15'),
  eventSchedule: '20:00-03:00',
  eventLocation: 'Girona',
  guestCount: 120,
  budget: '2000-3000',
  status: 'NEW',
  priority: 'HIGH',
  source: 'WEBSITE',
  assignedTo: null,
  preferredLocale: 'ca',
  customerId: 'cust-1',
  interestedPackId: 'pack-1',
  interestedExtras: ['karaoke'],
  utmSource: 'google',
  utmMedium: 'cpc',
  utmCampaign: 'summer',
  landingPage: '/bodas',
  createdAt: new Date('2026-03-01'),
  updatedAt: new Date('2026-03-15'),
  contactedAt: new Date('2026-03-02'),
  convertedAt: null,
};

const BASE_STATS = { notes: 3, tasks: 2, documents: 1, activities: 5 };

describe('buildLeadTechnicalSnapshot', () => {
  it('retorna estructura amb lead i stats', () => {
    const snap = buildLeadTechnicalSnapshot({
      lead: BASE_LEAD,
      stats: BASE_STATS,
    });

    expect(snap.lead.id).toBe('lead-1');
    expect(snap.lead.name).toBe('Joan Garcia');
    expect(snap.lead.email).toBe('joan@example.com');
    expect(snap.lead.status).toBe('NEW');
    expect(snap.lead.interestedExtras).toEqual(['karaoke']);
    expect(snap.stats.notes).toBe(3);
    expect(snap.stats.hasBooking).toBe(false);
    expect(snap.stats.postEvent).toBeNull();
  });

  it('inclou dades post-event si hi ha booking', () => {
    const snap = buildLeadTechnicalSnapshot({
      lead: BASE_LEAD,
      stats: BASE_STATS,
      booking: {
        postEventEmailSent: true,
        postEventEmailSentAt: new Date('2026-10-01'),
        reviewToken: 'tok-123',
        reviewSubmittedAt: null,
        postEventReport: { id: 'report-1' },
        clientSurvey: null,
        clientFeedback: { id: 'fb-1' },
      },
    });

    expect(snap.stats.hasBooking).toBe(true);
    expect(snap.stats.postEvent?.postEventEmailSent).toBe(true);
    expect(snap.stats.postEvent?.reviewToken).toBe('tok-123');
    expect(snap.stats.postEvent?.hasPostEventReport).toBe(true);
    expect(snap.stats.postEvent?.hasClientSurvey).toBe(false);
    expect(snap.stats.postEvent?.hasClientFeedback).toBe(true);
  });

  it('normalitza nulls amb ?? null', () => {
    const snap = buildLeadTechnicalSnapshot({
      lead: { ...BASE_LEAD, phone: undefined as unknown as null, assignedTo: undefined as unknown as null },
      stats: BASE_STATS,
    });

    expect(snap.lead.phone).toBeNull();
    expect(snap.lead.assignedTo).toBeNull();
  });

  it('interestedExtras buit si null', () => {
    const snap = buildLeadTechnicalSnapshot({
      lead: { ...BASE_LEAD, interestedExtras: null },
      stats: BASE_STATS,
    });
    expect(snap.lead.interestedExtras).toEqual([]);
  });
});

describe('serializeLeadTechnicalSnapshot', () => {
  it('retorna JSON vàlid', () => {
    const json = serializeLeadTechnicalSnapshot({ lead: BASE_LEAD, stats: BASE_STATS });
    const parsed = JSON.parse(json);
    expect(parsed.lead.id).toBe('lead-1');
    expect(parsed.stats.notes).toBe(3);
  });
});

describe('renderLeadTechnicalSnapshotEmail', () => {
  it('inclou nom i email del lead', () => {
    const html = renderLeadTechnicalSnapshotEmail({
      leadName: 'Joan Garcia',
      leadEmail: 'joan@example.com',
      snapshotJson: '{"test":true}',
      escapeHtml: (s) => s,
    });

    expect(html).toContain('Joan Garcia');
    expect(html).toContain('joan@example.com');
    expect(html).toContain('{"test":true}');
    expect(html).toContain('Snapshot');
  });
});

describe('processLeadTechnicalSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.leadDocument.create.mockResolvedValue({ id: 'doc-1' });
    mockPrisma.leadActivity.create.mockResolvedValue({});
    mockPrisma.leadNote.create.mockResolvedValue({});
    mockSendEmail.mockResolvedValue(undefined);
  });

  const DB_LEAD = {
    ...BASE_LEAD,
    _count: { notes: 3, universalTasks: 2, documents: 1, activities: 5 },
    booking: null,
  };

  it('retorna 404 si lead no trobat', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    const result = await processLeadTechnicalSnapshot({
      leadId: 'missing',
      action: 'save_document',
    });

    expect(result.status).toBe(404);
    expect(result.body.error).toContain('no trobat');
  });

  it('desa document JSON amb save_document', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(DB_LEAD);

    const result = await processLeadTechnicalSnapshot({
      leadId: 'lead-1',
      action: 'save_document',
    });

    expect(result.status).toBe(200);
    expect(result.body.documentId).toBe('doc-1');
    expect(mockPrisma.leadDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'OTHER',
        source: 'AUTO',
        mimeType: 'application/json',
      }),
    });
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: 'lead-1',
        type: 'DOCUMENT',
        title: expect.stringContaining('tècnica'),
      }),
    });
  });

  it('envia email amb send_email', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(DB_LEAD);

    const result = await processLeadTechnicalSnapshot({
      leadId: 'lead-1',
      action: 'send_email',
      recipient: 'admin@test.com',
    });

    expect(result.status).toBe(200);
    expect(result.body.recipient).toBe('admin@test.com');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@test.com',
        subject: expect.stringContaining('Joan Garcia'),
      }),
    );
    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'EMAIL',
        metadata: expect.objectContaining({
          recipient: 'admin@test.com',
          kind: 'technical_snapshot',
        }),
      }),
    });
    expect(mockPrisma.leadNote.create).toHaveBeenCalledOnce();
  });

  it('usa SITE_CONFIG email si no hi ha recipient', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue(DB_LEAD);

    const result = await processLeadTechnicalSnapshot({
      leadId: 'lead-1',
      action: 'send_email',
    });

    expect(result.body.recipient).toBe('admin@orbita.com');
  });

  it('inclou booking data al snapshot si existeix', async () => {
    mockPrisma.lead.findUnique.mockResolvedValue({
      ...DB_LEAD,
      booking: {
        postEventEmailSent: true,
        postEventEmailSentAt: new Date(),
        reviewToken: 'tok-abc',
        reviewSubmittedAt: null,
        postEventReport: null,
        clientSurvey: null,
        clientFeedback: null,
      },
    });

    const result = await processLeadTechnicalSnapshot({
      leadId: 'lead-1',
      action: 'save_document',
    });

    expect(result.status).toBe(200);
    // El document desa el snapshot que inclou booking data
    const createCall = mockPrisma.leadDocument.create.mock.calls[0][0];
    const decodedUrl = decodeURIComponent(createCall.data.fileUrl.replace('data:application/json;charset=utf-8,', ''));
    const parsed = JSON.parse(decodedUrl);
    expect(parsed.stats.hasBooking).toBe(true);
    expect(parsed.stats.postEvent.postEventEmailSent).toBe(true);
  });
});
