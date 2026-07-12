import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DocumentFlowSection from '@/app/admin/bookings/[id]/DocumentFlowSection';

const signedProposal = {
  id: 'proposal-1',
  reference: 'PRE-2026-001',
  status: 'ACCEPTED',
  href: '/admin/presupuestos/proposal-1',
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
        deliveryNotes={[]}
      />,
    );

    expect(screen.getByText('Contracte')).toBeInTheDocument();
    expect(screen.getByText('Signat per Maria Garcia')).toBeInTheDocument();
    expect(screen.getByText('2026-05-14 12:34 UTC')).toBeInTheDocument();
    expect(screen.getByText('IP 127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('UA Vitest UA')).toBeInTheDocument();
    expect(screen.getByAltText('Signatura manuscrita capturada')).toHaveAttribute('src', 'data:image/png;base64,abc123');
  });

  it('afegeix albarà al flux documental quan existeix', () => {
    render(
      <DocumentFlowSection
        proposals={[signedProposal]}
        invoices={[]}
        deliveryNotes={[{ id: 'dn-1', reference: 'ALB-2026-0001', status: 'SIGNED', pdfUrl: null }]}
      />,
    );

    expect(screen.getByText('Albarà')).toBeInTheDocument();
    expect(screen.getByText('ALB-2026-0001')).toBeInTheDocument();
  });

  it('manté acció de gestió quan el contracte encara no té PDF', () => {
    render(
      <DocumentFlowSection
        proposals={[{
          ...signedProposal,
          id: 'proposal-draft',
          reference: 'PRE-2026-002',
          href: '/admin/presupuestos/proposal-draft',
          pdfUrl: null,
          contractStatus: 'DRAFT',
          contractReference: null,
          contractPdfUrl: null,
          contractSignedAt: null,
          contractSignedBy: null,
          contractSignatureIp: null,
          contractSignatureUa: null,
          contractSignatureBlob: null,
        }]}
        invoices={[]}
        deliveryNotes={[]}
      />,
    );

    expect(screen.getByText('Esborrany')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gestionar' })).toHaveAttribute('href', '/admin/presupuestos/proposal-draft');
  });

  it('tracta VIEWED com a pressupost actiu dins el flux documental', () => {
    render(
      <DocumentFlowSection
        proposals={[
          {
            ...signedProposal,
            id: 'proposal-draft',
            reference: 'PRE-2026-DRAFT',
            status: 'DRAFT',
            href: '/admin/presupuestos/proposal-draft',
            pdfUrl: null,
            contractStatus: null,
            contractReference: null,
            contractPdfUrl: null,
            contractSignedAt: null,
            contractSignedBy: null,
            contractSignatureIp: null,
            contractSignatureUa: null,
            contractSignatureBlob: null,
          },
          {
            ...signedProposal,
            id: 'proposal-viewed',
            reference: 'PRE-2026-VIEWED',
            status: 'VIEWED',
            href: '/admin/presupuestos/proposal-viewed',
            pdfUrl: '/api/uploads/proposals/proposal-viewed/PRE-2026-VIEWED.pdf',
            contractStatus: null,
            contractReference: null,
            contractPdfUrl: null,
            contractSignedAt: null,
            contractSignedBy: null,
            contractSignatureIp: null,
            contractSignatureUa: null,
            contractSignatureBlob: null,
          },
        ]}
        invoices={[]}
        deliveryNotes={[]}
      />,
    );

    expect(screen.getByText('PRE-2026-VIEWED')).toBeInTheDocument();
    expect(screen.getByText('Vist')).toBeInTheDocument();
    expect(screen.queryByText('PRE-2026-DRAFT')).not.toBeInTheDocument();
  });
});
