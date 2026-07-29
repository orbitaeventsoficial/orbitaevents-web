import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrisma, mockEnsureFollowUp, mockGenerateQuotePDF, mockUploadFile, mockSendEmail, mockRecordEmailSend, mockUpdateEmailSendResult } = vi.hoisted(() => ({
  mockPrisma: {
    proposal: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    customerActivity: { create: vi.fn() },
    adminLog: { create: vi.fn() },
    leadActivity: { create: vi.fn() },
  },
  mockEnsureFollowUp: vi.fn(),
  mockGenerateQuotePDF: vi.fn(),
  mockUploadFile: vi.fn(),
  mockSendEmail: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/tasks/quoteFollowUp', () => ({
  ensureQuoteFollowUpTask: mockEnsureFollowUp,
}));
vi.mock('@/lib/services/quotePdfService', () => ({
  generateQuotePDF: mockGenerateQuotePDF,
}));
vi.mock('@/lib/storage', () => ({
  uploadFile: mockUploadFile,
}));
vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));
vi.mock('@/lib/site', () => ({
  getAppBaseUrl: () => 'https://orbita.test',
}));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: (html: string) => html,
}));
vi.mock('@/lib/services/quotes/quoteParsing', () => ({
  mapLeadEventType: (t: string) => t || 'OTHER',
  normalizeQuoteLocale: (l: string) => l || 'es',
  parseDateOrNull: (d: unknown) => d instanceof Date ? d : null,
}));
vi.mock('@/lib/logger', () => ({ log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { sendAdminProposal } from '@/lib/services/proposalDispatchService';

const MOCK_PROPOSAL = {
  id: 'prop-1',
  reference: 'OE-Q-2026-001',
  customerId: 'cust-1',
  leadId: 'lead-1',
  bookingId: null,
  status: 'DRAFT',
  currency: 'EUR',
  validityDays: 15,
  subtotal: 1239.67,
  discount: 0,
  vatRate: 21,
  vatAmount: 260.33,
  total: 1500,
  locale: 'ca',
  snapshot: {},
  sentAt: null,
  pdfUrl: null,
  pdfKey: null,
  customer: { id: 'cust-1', name: 'Maria', email: 'maria@test.com' },
  lead: { id: 'lead-1' },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.proposal.findUnique.mockResolvedValue(MOCK_PROPOSAL);
  mockPrisma.proposal.update.mockResolvedValue(MOCK_PROPOSAL);
  mockPrisma.lead.findFirst.mockResolvedValue(null);
  mockPrisma.lead.create.mockResolvedValue({ id: 'new-lead' });
  mockPrisma.customerActivity.create.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockEnsureFollowUp.mockResolvedValue({});
  mockGenerateQuotePDF.mockResolvedValue({
    output: vi.fn(() => new ArrayBuffer(16)),
  });
  mockUploadFile.mockResolvedValue({ path: 'proposals/prop-1/OE-Q-2026-001.pdf', publicUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf' });
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-1', trackingToken: 'tracking-1' });
  mockSendEmail.mockResolvedValue({
    ok: true,
    smtp: { accepted: ['maria@test.com'], rejected: [], response: '250 OK', messageId: '<smtp@test>' },
    imapSent: { attempted: true, ok: true, folder: 'Sent', uid: 10 },
    orbitaMessageId: '<orbita@test>',
  });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
});

describe('sendAdminProposal', () => {
  it('retorna 404 si no existeix', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue(null);
    const result = await sendAdminProposal('inexistent');
    expect(result.status).toBe(404);
  });

  it('repara sentAt absent en proposta enviada amb PDF sense reenviar email', async () => {
    const repairedSentAt = new Date('2026-07-10T10:42:56.508Z');
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      status: 'SENT',
      sentAt: null,
      updatedAt: repairedSentAt,
      pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
      pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
    });
    mockPrisma.proposal.update.mockResolvedValueOnce({
      ...MOCK_PROPOSAL,
      status: 'SENT',
      sentAt: repairedSentAt,
      updatedAt: repairedSentAt,
      pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
      pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
    });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true, repaired: true });
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' },
        data: { sentAt: repairedSentAt },
      })
    );
    expect(mockGenerateQuotePDF).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockRecordEmailSend).not.toHaveBeenCalled();
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).not.toHaveBeenCalled();
    expect(mockEnsureFollowUp).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_PROPOSAL_PDF_REPAIRED',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          source: 'admin_proposal_sent_at_repair',
          reason: 'sent_like_pdf_artifact_missing_sentAt',
          sentAt: repairedSentAt.toISOString(),
          repairBasis: 'proposal.updatedAt',
          pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
          pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
        }),
      }),
    });
  });

  it('no reenvia una proposta ja enviada amb PDF arxivat', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      status: 'SENT',
      sentAt: new Date('2026-07-09T10:00:00Z'),
      pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
      pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
    });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(409);
    expect(result.body.error).toContain('ja està enviat');
    expect(mockGenerateQuotePDF).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('no reenvia una proposta vista amb PDF arxivat', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      status: 'VIEWED',
      sentAt: new Date('2026-07-09T10:00:00Z'),
      pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
      pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
    });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(409);
    expect(result.body.error).toContain('ja està enviat');
    expect(mockGenerateQuotePDF).not.toHaveBeenCalled();
    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('repara una proposta enviada antiga sense PDF sense reenviar email', async () => {
    const sentAt = new Date('2026-07-09T10:00:00Z');
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      status: 'SENT',
      sentAt,
      pdfUrl: null,
      pdfKey: null,
    });
    mockPrisma.proposal.update.mockResolvedValueOnce({
      ...MOCK_PROPOSAL,
      status: 'SENT',
      sentAt,
      pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
      pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
    });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true, repaired: true });
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sentAt,
          pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
          pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
        }),
      })
    );
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockRecordEmailSend).not.toHaveBeenCalled();
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).not.toHaveBeenCalled();
    expect(mockEnsureFollowUp).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_PROPOSAL_PDF_REPAIRED',
        entity: 'proposal',
        entityId: 'prop-1',
      }),
    });
  });

  it('repara una proposta vista antiga sense PDF sense reenviar email', async () => {
    const sentAt = new Date('2026-07-09T10:00:00Z');
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      status: 'VIEWED',
      sentAt,
      pdfUrl: null,
      pdfKey: null,
    });
    mockPrisma.proposal.update.mockResolvedValueOnce({
      ...MOCK_PROPOSAL,
      status: 'VIEWED',
      sentAt,
      pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
      pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
    });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true, repaired: true });
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sentAt,
          pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
          pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
        }),
      })
    );
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockRecordEmailSend).not.toHaveBeenCalled();
    expect(mockPrisma.customerActivity.create).not.toHaveBeenCalled();
    expect(mockPrisma.leadActivity.create).not.toHaveBeenCalled();
    expect(mockEnsureFollowUp).not.toHaveBeenCalled();
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_PROPOSAL_PDF_REPAIRED',
        entity: 'proposal',
        entityId: 'prop-1',
      }),
    });
  });

  it('no marca res com enviat si l upload del PDF no retorna artefacte vàlid', async () => {
    mockUploadFile.mockResolvedValueOnce({ path: '', publicUrl: '' });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(500);
    expect(result.body.error).toContain('No s’ha pogut arxivar el PDF');
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
    expect(mockEnsureFollowUp).not.toHaveBeenCalled();
  });

  it('rebutja enviar una proposta que no és DRAFT ni reparació SENT', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      status: 'ACCEPTED',
    });

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(409);
    expect(mockGenerateQuotePDF).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
  });

  it('envia pressupost i retorna 200', async () => {
    const result = await sendAdminProposal('prop-1');
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockGenerateQuotePDF).toHaveBeenCalled();
    expect(mockUploadFile).toHaveBeenCalledWith(
      'proposals/prop-1/OE-Q-2026-001.pdf',
      expect.any(Buffer),
    );
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'maria@test.com',
      orbita: expect.objectContaining({ kind: 'proposal', id: 'prop-1', origin: 'admin-proposal-send' }),
      attachments: expect.arrayContaining([
        expect.objectContaining({ filename: 'pressupost-OE-Q-2026-001.pdf', contentType: 'application/pdf' }),
      ]),
    }));
    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'proposal-send',
      leadId: 'lead-1',
      customerId: 'cust-1',
      orbitaKind: 'proposal',
      orbitaId: 'prop-1',
      orbitaOrigin: 'admin-proposal-send',
      htmlBody: expect.stringContaining('/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf'),
    }));
  });

  it('actualitza status a SENT', async () => {
    await sendAdminProposal('prop-1');
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SENT',
          sentAt: expect.any(Date),
          pdfUrl: '/api/uploads/proposals/prop-1/OE-Q-2026-001.pdf',
          pdfKey: 'proposals/prop-1/OE-Q-2026-001.pdf',
        }),
      })
    );
  });

  it('congela quoteSnapshot documental abans de marcar com enviat', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      snapshot: {
        packId: 'pack-premium',
        packName: 'Premium',
        basePrice: 1000,
        durationHours: 6,
        features: ['DJ', 'So'],
        conditions: ['Reserva amb senyal'],
        whyChooseUs: 'Equip propi',
        eventType: 'BIRTHDAY',
        event: {
          date: '2026-08-15',
          schedule: '18:00-02:00',
          location: 'Barcelona',
          guests: 80,
        },
        extras: {
          preset: [{ id: 'fum', name: 'Fum baix', description: 'Efecte', price: 120 }],
          custom: [{ id: 'custom-1', name: 'Hora extra', price: 90 }],
        },
        pricing: {
          extrasPrice: 210,
          travelKm: 60,
          travelCharge: 45,
          discountReason: 'Promo',
        },
        brand: {
          brandName: 'Orbita',
          brandWebsite: 'orbita.test',
        },
        contractSnapshot: { version: 1, reference: 'CTR-1' },
      },
    });

    await sendAdminProposal('prop-1');

    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          snapshot: expect.objectContaining({
            contractSnapshot: { version: 1, reference: 'CTR-1' },
            quoteSnapshot: expect.objectContaining({
              version: 1,
              source: 'admin_proposal_send',
              documentType: 'PROPOSAL',
              proposalId: 'prop-1',
              reference: 'OE-Q-2026-001',
              locale: 'ca',
              currency: 'EUR',
              validityDays: 15,
              customer: expect.objectContaining({
                customerId: 'cust-1',
                name: 'Maria',
                email: 'maria@test.com',
              }),
              event: expect.objectContaining({
                eventType: 'BIRTHDAY',
                date: '2026-08-15',
                location: 'Barcelona',
                guests: 80,
              }),
              pack: expect.objectContaining({
                packId: 'pack-premium',
                name: 'Premium',
                features: ['DJ', 'So'],
              }),
              extras: expect.objectContaining({
                preset: [expect.objectContaining({ name: 'Fum baix', price: 120 })],
                custom: [expect.objectContaining({ name: 'Hora extra', price: 90 })],
                total: 210,
              }),
              pricing: expect.objectContaining({
                subtotal: 1239.67,
                discount: 0,
                vatRate: 21,
                vatAmount: 260.33,
                total: 1500,
                travelCharge: 45,
              }),
              trace: expect.objectContaining({
                frozenFrom: 'Proposal.snapshot+Proposal.fields',
                safety: 'QUOTE_SNAPSHOT_V1',
                leadId: 'lead-1',
              }),
            }),
          }),
        }),
      })
    );
  });

  it('crea customerActivity', async () => {
    await sendAdminProposal('prop-1');
    expect(mockPrisma.customerActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: 'cust-1',
        action: 'PROPOSAL_SENT',
      }),
    });
  });

  it('registra traça adminLog del pressupost enviat', async () => {
    await sendAdminProposal('prop-1');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_PROPOSAL_SENT',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          documentType: 'PROPOSAL',
          source: 'admin_proposal_send',
          reference: 'OE-Q-2026-001',
          customerId: 'cust-1',
          leadId: 'lead-1',
          to: 'maria@test.com',
          emailOrbitaKind: 'proposal',
          emailOrbitaId: 'prop-1',
        }),
      }),
    });
  });

  it('no bloqueja l enviament si falla adminLog', async () => {
    mockPrisma.adminLog.create.mockRejectedValueOnce(new Error('audit down'));

    const result = await sendAdminProposal('prop-1');

    expect(result.status).toBe(200);
    expect(mockEnsureFollowUp).toHaveBeenCalled();
  });

  it('crea follow-up task', async () => {
    await sendAdminProposal('prop-1');
    expect(mockEnsureFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: 'prop-1',
        customerId: 'cust-1',
      })
    );
  });

  it('reutilitza lead existent si no té leadId', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      leadId: null,
    });
    mockPrisma.lead.findFirst.mockResolvedValue({ id: 'existing-lead' });

    await sendAdminProposal('prop-1');

    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'existing-lead',
        }),
      })
    );
    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
  });

  it('crea lead nou si no té leadId i no en troba', async () => {
    mockPrisma.proposal.findUnique.mockResolvedValue({
      ...MOCK_PROPOSAL,
      leadId: null,
    });

    await sendAdminProposal('prop-1');

    expect(mockPrisma.lead.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-1',
          status: 'QUOTE_SENT',
          source: 'OTHER',
        }),
      })
    );
  });
});
