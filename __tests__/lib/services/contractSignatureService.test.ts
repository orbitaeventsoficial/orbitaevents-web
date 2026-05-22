import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGenerateSignedContractPdf, mockRecordLeadContractSigned } = vi.hoisted(() => ({
  mockPrisma: {
    clientPortalAccess: {
      findUnique: vi.fn(),
    },
    proposal: {
      update: vi.fn(),
    },
  },
  mockGenerateSignedContractPdf: vi.fn(),
  mockRecordLeadContractSigned: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/services/contractService', () => ({
  generateSignedContractPdf: mockGenerateSignedContractPdf,
}));
vi.mock('@/lib/services/leadActivityService', () => ({
  recordLeadContractSigned: mockRecordLeadContractSigned,
}));

import { signContractOnline } from '@/lib/services/contractSignatureService';

const RAW_TOKEN = 'token-amb-longitud-suficient';

function portalAccess(overrides: Record<string, unknown> = {}) {
  return {
    revokedAt: null,
    expiresAt: new Date('2026-12-31T00:00:00Z'),
    booking: {
      proposals: [
        {
          id: 'proposal-1',
          leadId: 'lead-1',
          contractReference: 'CTR-2026-AB12',
          contractStatus: 'SENT',
          contractSignedAt: null,
          contractPdfUrl: 'https://cdn.test/contract.pdf',
          pdfUrl: null,
        },
      ],
    },
    ...overrides,
  };
}

describe('signContractOnline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess());
    mockPrisma.proposal.update.mockResolvedValue({});
    mockGenerateSignedContractPdf.mockResolvedValue({
      contractPdfUrl: '/api/uploads/contracts/proposal-1/CTR-2026-TEST-signed.pdf',
      contractPdfKey: 'contracts/proposal-1/CTR-2026-TEST-signed.pdf',
    });
    mockRecordLeadContractSigned.mockResolvedValue({});
  });

  it('rebutja tokens massa curts', async () => {
    const result = await signContractOnline({
      rawToken: 'curt',
      signedBy: 'Maria',
      ip: '127.0.0.1',
      userAgent: 'Vitest',
    });

    expect(result).toEqual({ ok: false, reason: 'INVALID_TOKEN' });
    expect(mockPrisma.clientPortalAccess.findUnique).not.toHaveBeenCalled();
  });

  it('rebutja accessos inexistents, revocats o caducats', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(null);
    await expect(signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null }))
      .resolves.toEqual({ ok: false, reason: 'INVALID_TOKEN' });

    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({ revokedAt: new Date() }));
    await expect(signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null }))
      .resolves.toEqual({ ok: false, reason: 'INVALID_TOKEN' });

    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({ expiresAt: new Date('2020-01-01T00:00:00Z') }));
    await expect(signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null }))
      .resolves.toEqual({ ok: false, reason: 'INVALID_TOKEN' });

    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({ expiresAt: null }));
    await expect(signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null }))
      .resolves.toEqual({ ok: false, reason: 'INVALID_TOKEN' });
  });

  it('rebutja si no hi ha contracte signable', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({ booking: { proposals: [] } }));

    const result = await signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null });

    expect(result).toEqual({ ok: false, reason: 'NOT_SIGNABLE' });
  });

  it('rebutja contractes ja signats', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({
      booking: { proposals: [{ id: 'proposal-1', contractStatus: 'SIGNED', contractSignedAt: new Date(), contractPdfUrl: 'https://cdn.test/contract.pdf', pdfUrl: null }] },
    }));

    const result = await signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null });

    expect(result).toEqual({ ok: false, reason: 'ALREADY_SIGNED' });
  });

  it('rebutja contractes que encara no estan enviats', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({
      booking: { proposals: [{ id: 'proposal-1', contractStatus: 'DRAFT', contractSignedAt: null, contractPdfUrl: 'https://cdn.test/contract.pdf', pdfUrl: null }] },
    }));

    const result = await signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null });

    expect(result).toEqual({ ok: false, reason: 'NOT_SIGNABLE' });
  });

  it('rebutja contractes enviats sense PDF material', async () => {
    mockPrisma.clientPortalAccess.findUnique.mockResolvedValue(portalAccess({
      booking: { proposals: [{ id: 'proposal-1', contractStatus: 'SENT', contractSignedAt: null, contractPdfUrl: null, pdfUrl: null }] },
    }));

    const result = await signContractOnline({ rawToken: RAW_TOKEN, signedBy: 'Maria', ip: null, userAgent: null });

    expect(result).toEqual({ ok: false, reason: 'NOT_SIGNABLE' });
    expect(mockPrisma.proposal.update).not.toHaveBeenCalled();
    expect(mockGenerateSignedContractPdf).not.toHaveBeenCalled();
    expect(mockRecordLeadContractSigned).not.toHaveBeenCalled();
  });

  it('marca el contracte com a signat i desa metadata de signatura', async () => {
    const result = await signContractOnline({
      rawToken: RAW_TOKEN,
      signedBy: 'Maria Garcia',
      ip: '127.0.0.1',
      userAgent: 'Vitest UA',
    });

    expect(result).toEqual({ ok: true, proposalId: 'proposal-1' });
    expect(mockPrisma.clientPortalAccess.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: expect.any(String) },
      }),
    );
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith({
      where: { id: 'proposal-1' },
      data: {
        contractStatus: 'SIGNED',
        contractSignedAt: expect.any(Date),
        contractSignedBy: 'Maria Garcia',
        contractSignatureIp: '127.0.0.1',
        contractSignatureUa: 'Vitest UA',
        contractSignatureBlob: null,
      },
    });
    expect(mockGenerateSignedContractPdf).toHaveBeenCalledWith('proposal-1');
    expect(mockRecordLeadContractSigned).toHaveBeenCalledWith({
      leadId: 'lead-1',
      contractReference: 'CTR-2026-AB12',
      signedBy: 'Maria Garcia',
      source: 'portal',
    });
  });

  it('desa el blob de signatura manuscrita quan arriba del portal', async () => {
    const result = await signContractOnline({
      rawToken: RAW_TOKEN,
      signedBy: 'Maria Garcia',
      ip: '127.0.0.1',
      userAgent: 'Vitest UA',
      signatureBlob: 'data:image/png;base64,abc123',
    });

    expect(result).toEqual({ ok: true, proposalId: 'proposal-1' });
    expect(mockPrisma.proposal.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        contractSignatureBlob: 'data:image/png;base64,abc123',
      }),
    }));
  });
});
