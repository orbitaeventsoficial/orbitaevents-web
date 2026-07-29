import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────────
const {
  mockPrisma,
  mockGenerateContractPDF,
  mockSendEmail,
  mockUploadFile,
  mockRecordEmailSend,
  mockUpdateEmailSendResult,
  mockWrapLinksForTracking,
  mockGetAppBaseUrl,
} = vi.hoisted(() => ({
  mockPrisma: {
    proposal: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    setting: { findMany: vi.fn() },
    leadDocument: { create: vi.fn() },
    adminLog: { create: vi.fn() },
  },
  mockGenerateContractPDF: vi.fn(),
  mockSendEmail: vi.fn(),
  mockUploadFile: vi.fn(),
  mockRecordEmailSend: vi.fn(),
  mockUpdateEmailSendResult: vi.fn(),
  mockWrapLinksForTracking: vi.fn(),
  mockGetAppBaseUrl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/pdf-utils', () => ({
  generateContractPDF: mockGenerateContractPDF,
}));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/storage', () => ({ uploadFile: mockUploadFile }));
vi.mock('@/lib/site', () => ({ getAppBaseUrl: mockGetAppBaseUrl }));
vi.mock('@/lib/services/emailTrackingService', () => ({
  recordEmailSend: mockRecordEmailSend,
  updateEmailSendResult: mockUpdateEmailSendResult,
  wrapLinksForTracking: mockWrapLinksForTracking,
}));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { phone: '+34612345678', phoneDisplay: '612 345 678', email: 'info@orbitaevents.com' },
    web: { domain: 'orbitaevents.com' },
  },
}));
vi.mock('@/lib/services/travelCost', () => ({ INCLUDED_TRAVEL_KM: 100 }));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadContractSent: vi.fn(),
  recordLeadContractCancelled: vi.fn(),
  recordLeadContractSigned: vi.fn(),
}));

import {
  generateContractFromProposal,
  generateSignedContractPdf,
  sendContract,
  markContractSigned,
  cancelContract,
  getDefaultCancellationPolicy,
  getDefaultTermsAndConditions,
} from '@/lib/services/contractService';
import { recordLeadContractCancelled, recordLeadContractSent, recordLeadContractSigned } from '@/lib/services/leadActivityService';

// ── Helpers ─────────────────────────────────────────────────────────────
const COMPANY_SETTINGS = [
  { key: 'company.name', value: 'Òrbita Events' },
  { key: 'company.legalName', value: 'Carles Ros' },
  { key: 'company.nif', value: '12345678A' },
  { key: 'company.address', value: 'Carrer Test 1' },
  { key: 'company.city', value: 'Granollers' },
  { key: 'company.postalCode', value: '08400' },
  { key: 'company.iban', value: 'ES12 1234 5678 9012 3456 7890' },
];

function makeProposal(overrides = {}) {
  return {
    id: 'prop-1',
    reference: 'PROP-2026-0001',
    status: 'ACCEPTED',
    locale: 'ca',
    contractReference: null,
    contractStatus: null,
    contractPdfUrl: null,
    contractPdfKey: null,
    customerId: 'cust-1',
    bookingId: 'booking-1',
    depositAmount: null,
    depositDueDate: null,
    finalPaymentDue: null,
    cancellationPolicy: null,
    additionalClauses: null,
    leadId: 'lead-1',
    subtotal: 800,
    discount: 0,
    vatRate: 21,
    vatAmount: 168,
    total: 968,
    snapshot: {
      eventType: 'WEDDING',
      packName: 'Premium',
      packPrice: 800,
      djHours: 6,
      eventLocation: 'Masia Can Test',
      guestCount: 120,
    },
    customer: {
      id: 'cust-1',
      name: 'Joan Garcia',
      email: 'joan@example.com',
      phone: '+34699123456',
      dni: '12345678A',
    },
    booking: {
      eventDate: new Date('2026-09-15'),
      eventType: 'WEDDING',
      eventStartTime: '21:00',
      eventEndTime: '04:00',
      eventLocation: 'Masia Can Test',
      guestCount: 120,
      pack: {
        slug: 'premium',
        price: 800,
        djHours: 6,
        translations: [{ locale: 'ca', name: 'Premium' }],
      },
      extras: [],
    },
    ...overrides,
  };
}

const fakePdfDoc = { output: vi.fn(() => new ArrayBuffer(100)) };

const FROZEN_CONTRACT_SNAPSHOT = {
  version: 1,
  createdAt: '2026-05-01T10:00:00.000Z',
  contractDate: '2026-05-01T10:00:00.000Z',
  contractReference: 'CTR-2026-FROZEN',
  locale: 'ca',
  company: {
    name: 'Òrbita congelada',
    legalName: 'Legal congelat',
    nif: 'NIF-FROZEN',
    address: 'Adreça congelada',
    iban: 'IBAN-FROZEN',
    phone: '+34000000000',
    email: 'frozen@example.com',
  },
  client: {
    name: 'Client congelat',
    nif: 'DNI-FROZEN',
    email: 'client-frozen@example.com',
    phone: '+34999000000',
  },
  event: {
    type: 'CORPORATE',
    date: '2026-11-20T00:00:00.000Z',
    time: '19:00',
    endTime: '23:00',
    location: 'Sala congelada',
    guestCount: 88,
  },
  pack: {
    name: 'Pack congelat',
    price: 333,
    djHours: 2,
  },
  extras: [{ name: 'Extra congelat', price: 44, quantity: 1 }],
  serviceLines: [{ name: 'Servei congelat', price: 55, quantity: 1 }],
  totals: {
    subtotal: 432,
    discount: 10,
    vatRate: 21,
    vatAmount: 88.62,
    total: 510.62,
    depositAmount: 153.19,
    depositDueDate: '2026-10-20T00:00:00.000Z',
    finalPaymentDue: '2026-11-13T00:00:00.000Z',
  },
  terms: {
    cancellationPolicy: 'Política congelada',
    additionalClauses: 'Clàusules congelades',
  },
  trace: {
    proposalId: 'prop-1',
    proposalReference: 'PROP-2026-0001',
    customerId: 'cust-1',
    leadId: 'lead-1',
    bookingId: 'booking-1',
    total: 510.62,
    locale: 'ca',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findMany.mockResolvedValue(COMPANY_SETTINGS);
  mockPrisma.proposal.update.mockResolvedValue({});
  mockPrisma.leadDocument.create.mockResolvedValue({});
  mockPrisma.adminLog.create.mockResolvedValue({});
  mockGenerateContractPDF.mockResolvedValue(fakePdfDoc);
  mockSendEmail.mockResolvedValue({
    smtp: {
      accepted: ['joan@example.com'],
      rejected: [],
      response: '250 OK',
      messageId: 'smtp-contract-1',
    },
    imapSent: {
      attempted: true,
      ok: true,
      folder: 'Sent',
      uid: 12,
      error: null,
    },
  });
  mockUploadFile.mockImplementation(async (path: string) => ({
    path,
    publicUrl: `/api/uploads/${path}`,
  }));
  mockRecordEmailSend.mockResolvedValue({ id: 'email-send-contract-1', trackingToken: 'contract-token-1' });
  mockUpdateEmailSendResult.mockResolvedValue(undefined);
  mockWrapLinksForTracking.mockImplementation((html: string, token: string, baseUrl: string) => `${html}<a href="${baseUrl}/tracked/${token}"></a>`);
  mockGetAppBaseUrl.mockReturnValue('https://app.test');
});

// ─────────────────────────────────────────────────────────────────────────
// generateContractFromProposal
// ─────────────────────────────────────────────────────────────────────────
describe('generateContractFromProposal', () => {
  it('genera contracte amb referència CTR-YYYY-XXXX', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    const result = await generateContractFromProposal('prop-1');

    expect(result.contractReference).toMatch(/^CTR-\d{4}-[A-Z0-9]{4}$/);
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('error si proposta no és ACCEPTED', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ status: 'DRAFT' })
    );

    await expect(generateContractFromProposal('prop-1')).rejects.toThrow('acceptada');
  });

  it('actualitza proposta amb contractReference i DRAFT', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    await generateContractFromProposal('prop-1');

    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          contractStatus: 'DRAFT',
          contractReference: expect.stringMatching(/^CTR-/),
        }),
      })
    );
  });

  it('registra traça adminLog quan genera el contracte', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    await generateContractFromProposal('prop-1');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_CONTRACT_GENERATED',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          documentType: 'CONTRACT',
          source: 'admin_contract_generate',
          contractStatus: 'DRAFT',
          proposalId: 'prop-1',
          proposalReference: expect.any(String),
          reference: expect.stringMatching(/^CTR-/),
        }),
      }),
    });
  });

  it('no bloqueja el PDF si falla la traça adminLog', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());
    mockPrisma.adminLog.create.mockRejectedValueOnce(new Error('audit down'));

    const result = await generateContractFromProposal('prop-1');

    expect(result.contractReference).toMatch(/^CTR-/);
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
  });

  it('calcula deposit com 30% del total si no està definit', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    await generateContractFromProposal('prop-1');

    const updateCall = mockPrisma.proposal.update.mock.calls[0][0];
    expect(updateCall.data.depositAmount).toBeCloseTo(968 * 0.3, 0);
  });

  it('usa deposit existent si ja està definit', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ depositAmount: 500 })
    );

    await generateContractFromProposal('prop-1');

    const updateCall = mockPrisma.proposal.update.mock.calls[0][0];
    expect(updateCall.data.depositAmount).toBe(500);
  });

  it('usa contractReference existent si ja n\'hi ha', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-2026-CUSTOM' })
    );

    const result = await generateContractFromProposal('prop-1');
    expect(result.contractReference).toBe('CTR-2026-CUSTOM');
  });

  it('genera PDF amb dades correctes', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    await generateContractFromProposal('prop-1');

    expect(mockGenerateContractPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        clientName: 'Joan Garcia',
        clientEmail: 'joan@example.com',
        packName: 'Premium',
        total: 968,
        eventType: 'WEDDING',
        companyName: 'Òrbita Events',
      }),
      'ca'
    );
  });

  it('desa contractSnapshot v1 quan genera el contracte', async () => {
    const proposal = makeProposal();
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      ...proposal,
      booking: {
        ...proposal.booking,
        serviceLines: [
          { label: 'Bingo Musical', revenueAmount: 240, quantity: 1 },
          { label: 'Cost intern', revenueAmount: 0, quantity: 1 },
        ],
      },
    });

    await generateContractFromProposal('prop-1');

    const updateCall = mockPrisma.proposal.update.mock.calls[0][0];
    expect(updateCall.data.snapshot.contractSnapshot).toMatchObject({
      version: 1,
      contractReference: expect.stringMatching(/^CTR-/),
      pack: { name: 'Premium', price: 800, djHours: 6 },
      totals: { total: 968, vatAmount: 168 },
      trace: { proposalId: 'prop-1', proposalReference: 'PROP-2026-0001' },
    });
    expect(updateCall.data.snapshot.contractSnapshot.serviceLines).toEqual([
      { name: 'Bingo Musical', price: 240, quantity: 1 },
    ]);
  });

  it('renderitza des del contractSnapshot existent encara que el booking viu canviï', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal({
      contractReference: 'CTR-2026-LIVE',
      snapshot: { contractSnapshot: FROZEN_CONTRACT_SNAPSHOT },
      booking: {
        ...makeProposal().booking,
        eventLocation: 'Ubicacio viva',
        pack: {
          slug: 'live',
          price: 999,
          djHours: 9,
          translations: [{ locale: 'ca', name: 'Pack viu' }],
        },
      },
    }));

    const result = await generateContractFromProposal('prop-1');

    expect(result.contractReference).toBe('CTR-2026-FROZEN');
    expect(mockGenerateContractPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        contractReference: 'CTR-2026-FROZEN',
        companyName: 'Òrbita congelada',
        clientName: 'Client congelat',
        eventLocation: 'Sala congelada',
        packName: 'Pack congelat',
        total: 510.62,
      }),
      'ca'
    );
  });

  it('passa la signatura digital al PDF si la proposta ja està signada', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal({
      contractSignedBy: 'Maria Garcia',
      contractSignedAt: new Date('2026-05-15T10:00:00Z'),
      contractSignatureBlob: 'data:image/png;base64,abc123',
      contractSignatureIp: '127.0.0.1',
    }));

    await generateContractFromProposal('prop-1');

    expect(mockGenerateContractPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        signedBy: 'Maria Garcia',
        signedAt: new Date('2026-05-15T10:00:00Z'),
        signatureBlob: 'data:image/png;base64,abc123',
        signatureIp: '127.0.0.1',
      }),
      'ca'
    );
  });

  it('inclou política cancel·lació per defecte en català', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    await generateContractFromProposal('prop-1');

    const updateCall = mockPrisma.proposal.update.mock.calls[0][0];
    expect(updateCall.data.cancellationPolicy).toContain('Cancel·lació');
    expect(updateCall.data.cancellationPolicy).toContain('60 dies');
  });

  it('usa política personalitzada si existeix a proposta', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ cancellationPolicy: 'Política custom' })
    );

    await generateContractFromProposal('prop-1');

    const updateCall = mockPrisma.proposal.update.mock.calls[0][0];
    expect(updateCall.data.cancellationPolicy).toBe('Política custom');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// sendContract
// ─────────────────────────────────────────────────────────────────────────
describe('sendContract', () => {
  it('envia email amb contracte PDF adjunt', async () => {
    // First call: sendContract reads proposal
    mockPrisma.proposal.findUniqueOrThrow
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }))
      // Second call: renderContractPDF reads proposal again
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }));

    await sendContract('prop-1');

    expect(mockRecordEmailSend).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'contract',
      to: 'joan@example.com',
      subject: expect.stringContaining('CTR-2026-AB12'),
      leadId: 'lead-1',
      customerId: 'cust-1',
      locale: 'ca',
      htmlBody: expect.stringContaining("T'enviem el contracte"),
      orbitaKind: 'lead',
      orbitaId: 'lead-1',
      orbitaOrigin: 'admin-contract-send',
    }));
    expect(mockUploadFile).toHaveBeenCalledWith(
      'contracts/prop-1/CTR-2026-AB12.pdf',
      expect.any(Buffer),
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joan@example.com',
        subject: expect.stringContaining('CTR-2026-AB12'),
        html: expect.stringContaining('/api/tracking/open/contract-token-1'),
        orbita: { kind: 'lead', id: 'lead-1', origin: 'admin-contract-send' },
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: 'contracte-CTR-2026-AB12.pdf',
            contentType: 'application/pdf',
          }),
        ]),
      })
    );
    expect(mockUpdateEmailSendResult).toHaveBeenCalledWith('email-send-contract-1', expect.objectContaining({
      smtpAccepted: ['joan@example.com'],
      smtpRejected: [],
      smtpMessageId: 'smtp-contract-1',
      imapAppendOk: true,
      imapSentFolder: 'Sent',
      imapSentUid: 12,
    }));
  });

  it('error si no hi ha contracte generat', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: null, contractStatus: null })
    );

    await expect(sendContract('prop-1')).rejects.toThrow('generar');
  });

  it('error si contracte ja signat', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-2026-TEST', contractStatus: 'SIGNED' })
    );

    await expect(sendContract('prop-1')).rejects.toThrow('signat');
  });

  it('actualitza contractStatus a SENT', async () => {
    mockPrisma.proposal.findUniqueOrThrow
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }))
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }));

    await sendContract('prop-1');

    // Second update call (first is from renderContractPDF's generate path — but sendContract calls update separately)
    const updateCalls = mockPrisma.proposal.update.mock.calls;
    const sentUpdate = updateCalls.find(
      (c: Array<{ data: { contractStatus?: string } }>) => c[0].data.contractStatus === 'SENT'
    );
    expect(sentUpdate).toBeDefined();
    expect(sentUpdate?.[0].data).toEqual(expect.objectContaining({
      contractStatus: 'SENT',
      contractPdfUrl: '/api/uploads/contracts/prop-1/CTR-2026-AB12.pdf',
      contractPdfKey: 'contracts/prop-1/CTR-2026-AB12.pdf',
    }));
  });

  it('registra leadActivity shared i crea leadDocument si hi ha leadId', async () => {
    mockPrisma.proposal.findUniqueOrThrow
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
        leadId: 'lead-1',
      }))
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
        leadId: 'lead-1',
      }));

    await sendContract('prop-1');

    expect(recordLeadContractSent).toHaveBeenCalledWith({
      leadId: 'lead-1',
      contractReference: 'CTR-2026-AB12',
      to: 'joan@example.com',
    });
    expect(mockPrisma.leadDocument.create).toHaveBeenCalled();
    expect(mockPrisma.leadDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fileUrl: '/api/uploads/contracts/prop-1/CTR-2026-AB12.pdf',
      }),
    });
  });

  it('registra traça adminLog quan envia contracte', async () => {
    mockPrisma.proposal.findUniqueOrThrow
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }))
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }));

    await sendContract('prop-1');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_CONTRACT_SENT',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          documentType: 'CONTRACT',
          source: 'admin_contract_send',
          reference: 'CTR-2026-AB12',
          to: 'joan@example.com',
          emailSendId: 'email-send-contract-1',
          emailSnapshot: 'EmailSend.htmlBody',
          contractPdfUrl: '/api/uploads/contracts/prop-1/CTR-2026-AB12.pdf',
          contractPdfKey: 'contracts/prop-1/CTR-2026-AB12.pdf',
        }),
      }),
    });
  });

  it('no envia ni marca SENT si no pot crear el snapshot EmailSend', async () => {
    mockPrisma.proposal.findUniqueOrThrow
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }))
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
      }));
    mockRecordEmailSend.mockRejectedValueOnce(new Error('Tracking down'));

    await expect(sendContract('prop-1')).rejects.toThrow('Tracking down');

    expect(mockUploadFile).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockPrisma.proposal.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contractStatus: 'SENT' }),
      }),
    );
    expect(mockPrisma.adminLog.create).not.toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'DOCUMENT_CONTRACT_SENT' }),
    });
  });

  it('subject en castellà per locale es', async () => {
    mockPrisma.proposal.findUniqueOrThrow
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
        locale: 'es',
      }))
      .mockResolvedValueOnce(makeProposal({
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
        locale: 'es',
      }));

    await sendContract('prop-1');

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Contrato'),
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// markContractSigned
// ─────────────────────────────────────────────────────────────────────────
describe('markContractSigned', () => {
  it('marca contracte com SIGNED', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-2026-TEST', contractStatus: 'SENT' })
    );

    await markContractSigned('prop-1', 'Joan Garcia');

    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          contractStatus: 'SIGNED',
          contractSignedBy: 'Joan Garcia',
          contractSignedAt: expect.any(Date),
        }),
      })
    );
  });

  it('registra leadActivity shared quan es marca signat manualment', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-2026-TEST', contractStatus: 'SENT', leadId: 'lead-1' })
    );

    await markContractSigned('prop-1', 'Joan Garcia');

    expect(recordLeadContractSigned).toHaveBeenCalledWith({
      leadId: 'lead-1',
      contractReference: 'CTR-2026-TEST',
      signedBy: 'Joan Garcia',
      source: 'admin',
    });
  });

  it('registra traça adminLog quan es marca signat manualment', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-2026-TEST', contractStatus: 'SENT', leadId: 'lead-1' })
    );

    await markContractSigned('prop-1', 'Joan Garcia');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_CONTRACT_SIGNED',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          reference: 'CTR-2026-TEST',
          signedBy: 'Joan Garcia',
          source: 'admin_contract_sign',
        }),
      }),
    });
  });

  it('error si no hi ha contracte', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: null })
    );

    await expect(markContractSigned('prop-1', 'Joan')).rejects.toThrow('contracte');
  });

  it('error si ja signat', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-TEST', contractStatus: 'SIGNED' })
    );

    await expect(markContractSigned('prop-1', 'Joan')).rejects.toThrow('signat');
  });

  it('error si contracte cancel·lat', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(
      makeProposal({ contractReference: 'CTR-TEST', contractStatus: 'CANCELLED' })
    );

    await expect(markContractSigned('prop-1', 'Joan')).rejects.toThrow('cancel·lat');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// generateSignedContractPdf
// ─────────────────────────────────────────────────────────────────────────
describe('generateSignedContractPdf', () => {
  it('regenera el PDF signat, el puja a storage i actualitza la proposta', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal({
      contractReference: 'CTR-2026-AB12',
      contractStatus: 'SIGNED',
      contractSignedBy: 'Maria Garcia',
      contractSignedAt: new Date('2026-05-15T10:00:00Z'),
      contractSignatureBlob: 'data:image/png;base64,abc123',
    }));

    const result = await generateSignedContractPdf('prop-1');

    expect(mockUploadFile).toHaveBeenCalledWith(
      'contracts/prop-1/CTR-2026-AB12-signed.pdf',
      expect.any(Buffer),
    );
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'prop-1' },
      data: expect.objectContaining({
        contractPdfUrl: '/api/uploads/contracts/prop-1/CTR-2026-AB12-signed.pdf',
        contractPdfKey: 'contracts/prop-1/CTR-2026-AB12-signed.pdf',
        snapshot: expect.objectContaining({ contractSnapshot: expect.objectContaining({ version: 1 }) }),
      }),
    });
    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_CONTRACT_SIGNED_PDF_GENERATED',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          reference: 'CTR-2026-AB12',
          contractPdfKey: 'contracts/prop-1/CTR-2026-AB12-signed.pdf',
        }),
      }),
    });
    expect(result).toEqual({
      contractPdfUrl: '/api/uploads/contracts/prop-1/CTR-2026-AB12-signed.pdf',
      contractPdfKey: 'contracts/prop-1/CTR-2026-AB12-signed.pdf',
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// cancelContract
// ─────────────────────────────────────────────────────────────────────────
describe('cancelContract', () => {
  it('cancel·la contracte DRAFT correctament', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      contractStatus: 'DRAFT',
      contractReference: 'CTR-2026-TEST',
      leadId: 'lead-1',
    });

    const result = await cancelContract('prop-1');

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { contractStatus: 'CANCELLED' },
      })
    );
  });

  it('crea leadActivity quan es cancel·la', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      contractStatus: 'SENT',
      contractReference: 'CTR-2026-TEST',
      leadId: 'lead-1',
    });

    await cancelContract('prop-1');

    expect(recordLeadContractCancelled).toHaveBeenCalledWith({
      leadId: 'lead-1',
      contractReference: 'CTR-2026-TEST',
    });
  });

  it('registra traça adminLog quan es cancel·la', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      id: 'prop-1',
      reference: 'PROP-2026-0001',
      customerId: 'cust-1',
      leadId: 'lead-1',
      bookingId: 'booking-1',
      total: 968,
      locale: 'ca',
      contractStatus: 'SENT',
      contractReference: 'CTR-2026-TEST',
    });

    await cancelContract('prop-1');

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'DOCUMENT_CONTRACT_CANCELLED',
        entity: 'proposal',
        entityId: 'prop-1',
        details: expect.objectContaining({
          reference: 'CTR-2026-TEST',
          proposalReference: 'PROP-2026-0001',
          source: 'admin_contract_cancel',
        }),
      }),
    });
  });

  it('retorna 400 si no hi ha contracte', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      contractStatus: null,
      contractReference: null,
      leadId: null,
    });

    const result = await cancelContract('prop-1');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('contracte');
  });

  it('retorna 400 si contracte ja signat', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      contractStatus: 'SIGNED',
      contractReference: 'CTR-TEST',
      leadId: null,
    });

    const result = await cancelContract('prop-1');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('signat');
  });

  it('retorna 400 si ja cancel·lat', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      contractStatus: 'CANCELLED',
      contractReference: 'CTR-TEST',
      leadId: null,
    });

    const result = await cancelContract('prop-1');
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('cancel·lat');
  });

  it('no crea leadActivity si no hi ha leadId', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue({
      contractStatus: 'DRAFT',
      contractReference: 'CTR-TEST',
      leadId: null,
    });

    await cancelContract('prop-1');

    expect(recordLeadContractCancelled).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getDefaultCancellationPolicy
// ─────────────────────────────────────────────────────────────────────────
describe('getDefaultCancellationPolicy', () => {
  it('retorna política en català per defecte', () => {
    const policy = getDefaultCancellationPolicy();
    expect(policy).toContain('Cancel·lació amb més de 60 dies');
    expect(policy).toContain('Cancel·lació entre 30 i 60 dies');
    expect(policy).toContain('Cancel·lació amb menys de 30 dies');
    expect(policy).toContain('Cancel·lació per part del prestador');
    expect(policy).toContain('Canvi de data');
  });

  it('retorna política en castellà', () => {
    const policy = getDefaultCancellationPolicy('es');
    expect(policy).toContain('Cancelación con más de 60 días');
    expect(policy).toContain('Cancelación entre 30 y 60 días');
    expect(policy).toContain('señal no es reembolsable');
    expect(policy).toContain('Cambio de fecha');
  });

  it('retorna política en anglès', () => {
    const policy = getDefaultCancellationPolicy('en');
    expect(policy).toContain('Cancellation more than 60 days');
    expect(policy).toContain('deposit is non-refundable');
    expect(policy).toContain('Date change');
  });

  it('conté 5 clàusules numerades', () => {
    for (const locale of ['ca', 'es', 'en'] as const) {
      const policy = getDefaultCancellationPolicy(locale);
      expect(policy).toContain('1.');
      expect(policy).toContain('2.');
      expect(policy).toContain('3.');
      expect(policy).toContain('4.');
      expect(policy).toContain('5.');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// getDefaultTermsAndConditions
// ─────────────────────────────────────────────────────────────────────────
describe('getDefaultTermsAndConditions', () => {
  it('retorna termes en català per defecte', () => {
    const terms = getDefaultTermsAndConditions();
    expect(terms).toContain('Reserva:');
    expect(terms).toContain('Pagament final:');
    expect(terms).toContain('Desplaçament:');
    expect(terms).toContain('Hores extres:');
    expect(terms).toContain('Equip tècnic:');
    expect(terms).toContain('Responsabilitat per danys:');
    expect(terms).toContain('Alimentació:');
    expect(terms).toContain('Soroll:');
  });

  it('retorna termes en castellà', () => {
    const terms = getDefaultTermsAndConditions('es');
    expect(terms).toContain('Reserva:');
    expect(terms).toContain('Pago final:');
    expect(terms).toContain('Desplazamiento:');
    expect(terms).toContain('Horas extras:');
    expect(terms).toContain('Equipo técnico:');
  });

  it('retorna termes en anglès', () => {
    const terms = getDefaultTermsAndConditions('en');
    expect(terms).toContain('Booking:');
    expect(terms).toContain('Final payment:');
    expect(terms).toContain('Travel:');
    expect(terms).toContain('Extra hours:');
    expect(terms).toContain('Technical equipment:');
  });

  // ── Noves clàusules ──────────────────────────────────────────────────

  describe('clàusula Reserva de data (48h)', () => {
    it('inclou reserva 48h en català', () => {
      const terms = getDefaultTermsAndConditions('ca');
      expect(terms).toContain('Reserva de data:');
      expect(terms).toContain('48 hores');
      expect(terms).toContain('30% d\'aval');
      expect(terms).toContain('la data quedarà lliure');
    });

    it('inclou reserva 48h en castellà', () => {
      const terms = getDefaultTermsAndConditions('es');
      expect(terms).toContain('Reserva de fecha:');
      expect(terms).toContain('48 horas');
      expect(terms).toContain('30% de señal');
      expect(terms).toContain('la fecha quedará libre');
    });

    it('inclou reserva 48h en anglès', () => {
      const terms = getDefaultTermsAndConditions('en');
      expect(terms).toContain('Date reservation:');
      expect(terms).toContain('48 hours');
      expect(terms).toContain('30% deposit');
      expect(terms).toContain('date will become available');
    });
  });

  describe('clàusula Propietat intel·lectual', () => {
    it('inclou propietat intel·lectual en català', () => {
      const terms = getDefaultTermsAndConditions('ca');
      expect(terms).toContain('Propietat intel·lectual:');
      expect(terms).toContain('fotografies i vídeos');
      expect(terms).toContain('fins promocionals');
      expect(terms).toContain('indicació expressa en contrari');
    });

    it('inclou propietat intel·lectual en castellà', () => {
      const terms = getDefaultTermsAndConditions('es');
      expect(terms).toContain('Propiedad intelectual:');
      expect(terms).toContain('fotografías y vídeos');
      expect(terms).toContain('fines promocionales');
      expect(terms).toContain('indicación expresa en contrario');
    });

    it('inclou propietat intel·lectual en anglès', () => {
      const terms = getDefaultTermsAndConditions('en');
      expect(terms).toContain('Intellectual property:');
      expect(terms).toContain('Photographs and videos');
      expect(terms).toContain('promotional purposes');
      expect(terms).toContain('expressly indicated otherwise');
    });
  });

  it('conté 10 clàusules en cada idioma', () => {
    for (const locale of ['ca', 'es', 'en'] as const) {
      const terms = getDefaultTermsAndConditions(locale);
      // Each clause is separated by newline
      const clauses = terms.split('\n').filter(Boolean);
      expect(clauses).toHaveLength(10);
    }
  });

  it('inclou distància de desplaçament correcta (50 km)', () => {
    // INCLUDED_TRAVEL_KM is mocked to 100, so 100/2 = 50
    const terms = getDefaultTermsAndConditions('ca');
    expect(terms).toContain('50 km');
  });

  it('les clàusules noves passen al PDF via additionalClauses', async () => {
    mockPrisma.proposal.findUniqueOrThrow.mockResolvedValue(makeProposal());

    await generateContractFromProposal('prop-1');

    const updateCall = mockPrisma.proposal.update.mock.calls[0][0];
    expect(updateCall.data.additionalClauses).toContain('Reserva de data:');
    expect(updateCall.data.additionalClauses).toContain('Propietat intel·lectual:');
    expect(updateCall.data.additionalClauses).toContain('48 hores');
  });
});
