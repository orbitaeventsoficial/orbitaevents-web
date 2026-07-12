import { describe, expect, it } from 'vitest';
import {
  buildClientPortalContractPath,
  getClientPortalContractSignatureChecklist,
  getClientPortalContractSignatureState,
  getClientPortalContractSummary,
  type ClientPortalContractProposal,
} from '@/lib/clientPortalContract';

function proposal(overrides: Partial<ClientPortalContractProposal>): ClientPortalContractProposal {
  return {
    id: 'proposal-1',
    reference: 'PRE-2026-0001',
    pdfUrl: null,
    createdAt: new Date('2026-05-14T10:00:00Z'),
    contractReference: null,
    contractStatus: null,
    contractPdfUrl: null,
    contractSignedAt: null,
    contractSignatureBlob: null,
    ...overrides,
  };
}

describe('getClientPortalContractSummary', () => {
  it('retorna null si cap pressupost té contracte', () => {
    expect(getClientPortalContractSummary([proposal({})])).toBeNull();
  });

  it('tria el primer pressupost amb contracte i exposa el resum del portal', () => {
    const result = getClientPortalContractSummary([
      proposal({ id: 'without-contract' }),
      proposal({
        id: 'with-contract',
        reference: 'PRE-2026-0042',
        contractReference: 'CTR-2026-AB12',
        contractStatus: 'DRAFT',
        contractPdfUrl: 'https://cdn.test/contract.pdf',
      }),
    ]);

    expect(result).toEqual({
      proposalId: 'with-contract',
      proposalReference: 'PRE-2026-0042',
      contractReference: 'CTR-2026-AB12',
      status: 'DRAFT',
      pdfUrl: 'https://cdn.test/contract.pdf',
      signedAt: null,
      signatureBlob: null,
      awaitingInlineSignature: false,
      signatureState: 'NOT_READY',
      signatureChecklist: [
        { id: 'sent', complete: false },
        { id: 'pdf', complete: true },
        { id: 'unsigned', complete: true },
      ],
    });
  });

  it('marca la signatura inline com a pendent quan el contracte està enviat, té PDF i no està signat', () => {
    const result = getClientPortalContractSummary([
      proposal({
        contractReference: 'CTR-2026-SENT',
        contractStatus: 'SENT',
        contractPdfUrl: 'https://cdn.test/sent.pdf',
      }),
    ]);

    expect(result?.awaitingInlineSignature).toBe(true);
    expect(result?.signatureState).toBe('READY_TO_SIGN');
  });

  it('no marca la signatura com a preparada si el contracte enviat encara no té PDF', () => {
    const result = getClientPortalContractSummary([
      proposal({
        contractReference: 'CTR-2026-SENT',
        contractStatus: 'SENT',
      }),
    ]);

    expect(result?.awaitingInlineSignature).toBe(false);
    expect(result?.signatureState).toBe('NOT_READY');
    expect(result?.signatureChecklist).toEqual([
      { id: 'sent', complete: true },
      { id: 'pdf', complete: false },
      { id: 'unsigned', complete: true },
    ]);
  });

  it('no usa el PDF del pressupost com a fallback de contracte', () => {
    const result = getClientPortalContractSummary([
      proposal({
        pdfUrl: 'https://cdn.test/quote.pdf',
        contractReference: 'CTR-2026-FALLBACK',
        contractStatus: 'SIGNED',
        contractSignedAt: new Date('2026-05-14T11:00:00Z'),
      }),
    ]);

    expect(result?.pdfUrl).toBeNull();
    expect(result?.awaitingInlineSignature).toBe(false);
    expect(result?.signatureState).toBe('SIGNED');
  });

  it('exposa el blob de signatura manuscrita quan el contracte ja està signat', () => {
    const result = getClientPortalContractSummary([
      proposal({
        pdfUrl: 'https://cdn.test/quote.pdf',
        contractReference: 'CTR-2026-SIGNED',
        contractStatus: 'SIGNED',
        contractPdfUrl: 'https://cdn.test/signed-contract.pdf',
        contractSignedAt: new Date('2026-05-14T11:00:00Z'),
        contractSignatureBlob: 'data:image/png;base64,abc123',
      }),
    ]);

    expect(result?.signatureBlob).toBe('data:image/png;base64,abc123');
    expect(result?.signatureState).toBe('SIGNED');
  });
});

describe('getClientPortalContractSignatureState', () => {
  it('classifica els estats de signatura del portal', () => {
    expect(getClientPortalContractSignatureState({ status: 'DRAFT', signedAt: null })).toBe('NOT_READY');
    expect(getClientPortalContractSignatureState({ status: 'SENT', signedAt: null, hasPdf: true })).toBe('READY_TO_SIGN');
    expect(getClientPortalContractSignatureState({ status: 'SENT', signedAt: null, hasPdf: false })).toBe('NOT_READY');
    expect(getClientPortalContractSignatureState({ status: 'SIGNED', signedAt: null })).toBe('SIGNED');
    expect(getClientPortalContractSignatureState({ status: 'SENT', signedAt: new Date('2026-05-14T12:00:00Z') })).toBe('SIGNED');
    expect(getClientPortalContractSignatureState({ status: 'CANCELLED', signedAt: null })).toBe('CANCELLED');
  });
});

describe('getClientPortalContractSignatureChecklist', () => {
  it('exposa els prerequisits de signatura inline', () => {
    expect(getClientPortalContractSignatureChecklist({
      status: 'SENT',
      signedAt: null,
      pdfUrl: 'https://cdn.test/contract.pdf',
    })).toEqual([
      { id: 'sent', complete: true },
      { id: 'pdf', complete: true },
      { id: 'unsigned', complete: true },
    ]);
  });
});

describe('buildClientPortalContractPath', () => {
  it('construeix la ruta interna del contracte dins del portal', () => {
    expect(buildClientPortalContractPath('ca', 'token-123')).toBe('/ca/portal/token-123/contract');
  });
});
