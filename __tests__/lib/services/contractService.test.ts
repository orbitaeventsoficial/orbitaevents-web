import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────────
const { mockPrisma, mockGenerateContractPDF, mockSendEmail } = vi.hoisted(() => ({
  mockPrisma: {
    proposal: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    setting: { findMany: vi.fn() },
    leadActivity: { create: vi.fn() },
    leadDocument: { create: vi.fn() },
  },
  mockGenerateContractPDF: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/pdf-utils', () => ({
  generateContractPDF: mockGenerateContractPDF,
}));
vi.mock('@/lib/email', () => ({ sendEmail: mockSendEmail }));
vi.mock('@/lib/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/app/config/site-config', () => ({
  SITE_CONFIG: {
    business: { phone: '+34612345678', phoneDisplay: '612 345 678', email: 'info@orbitaevents.com' },
    web: { domain: 'orbitaevents.com' },
  },
}));
vi.mock('@/lib/services/travelCost', () => ({ INCLUDED_TRAVEL_KM: 100 }));

import {
  generateContractFromProposal,
  sendContract,
  markContractSigned,
  cancelContract,
} from '@/lib/services/contractService';

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
    status: 'ACCEPTED',
    locale: 'ca',
    contractReference: null,
    contractStatus: null,
    contractPdfUrl: null,
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

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.setting.findMany.mockResolvedValue(COMPANY_SETTINGS);
  mockPrisma.proposal.update.mockResolvedValue({});
  mockPrisma.leadActivity.create.mockResolvedValue({});
  mockPrisma.leadDocument.create.mockResolvedValue({});
  mockGenerateContractPDF.mockResolvedValue(fakePdfDoc);
  mockSendEmail.mockResolvedValue(undefined);
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

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joan@example.com',
        subject: expect.stringContaining('CTR-2026-AB12'),
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: 'contracte-CTR-2026-AB12.pdf',
            contentType: 'application/pdf',
          }),
        ]),
      })
    );
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
  });

  it('crea leadActivity i leadDocument si hi ha leadId', async () => {
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

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'lead-1',
          type: 'DOCUMENT',
          title: 'Contracte enviat',
        }),
      })
    );
    expect(mockPrisma.leadDocument.create).toHaveBeenCalled();
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

    expect(mockPrisma.leadActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          leadId: 'lead-1',
          type: 'SYSTEM',
          title: 'Contracte cancel·lat',
        }),
      })
    );
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

    expect(mockPrisma.leadActivity.create).not.toHaveBeenCalled();
  });
});
