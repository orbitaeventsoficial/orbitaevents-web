import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DocumentFlowSection from '@/app/admin/bookings/[id]/DocumentFlowSection';

const signedProposal = {
  id: 'proposal-1',
  reference: 'PRE-2026-001',
  status: 'ACCEPTED',
  pdfUrl: 'https://cdn.test/proposal.pdf',
  contractStatus: 'SIGNED',
  contractReference: 'CTR-2026-001',
  contractPdfUrl: 'https://cdn.test/contract.pdf',
  contractSignedAt: '2026-05-14T12:34:56.000Z',
  contractSignedBy: 'Maria Garcia',
  contractSignatureIp: '127.0.0.1',
  contractSignatureUa: 'Vitest UA',
  contractSignatureBlob: 'data:image/png;base64,abc123',
};

describe('DocumentFlowSection', () => {
  it('mostra la traça visible del contracte signat', () => {
    render(
      <DocumentFlowSection
        proposals={[signedProposal]}
        invoices={[]}
      />,
    );

    expect(screen.getByText('Contracte')).toBeInTheDocument();
    expect(screen.getByText('Signat per Maria Garcia')).toBeInTheDocument();
    expect(screen.getByText('2026-05-14 12:34 UTC')).toBeInTheDocument();
    expect(screen.getByText('IP 127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('UA Vitest UA')).toBeInTheDocument();
    expect(screen.getByAltText('Signatura manuscrita capturada')).toHaveAttribute('src', 'data:image/png;base64,abc123');
  });
});
