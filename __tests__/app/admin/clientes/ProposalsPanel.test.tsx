import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProposalsPanel from '@/app/admin/clientes/[id]/_components/panels/ProposalsPanel';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: vi.fn(),
}));

const HUB: CustomerHubDTO = {
  customer: {
    id: 'cust-1',
    name: 'Anna',
    status: 'NEGOTIATION',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  kpis: {},
  active: { source: 'SENT', proposalId: 'prop-1' },
  proposals: [
    {
      id: 'prop-1',
      reference: 'P-2026-001',
      customerId: 'cust-1',
      leadId: 'lead-1',
      bookingId: 'booking-1',
      status: 'SENT',
      total: 1200,
      createdAt: '2026-04-10T10:00:00.000Z',
      sentAt: '2026-04-11T10:00:00.000Z',
      pdfUrl: '/api/uploads/proposals/prop-1/P-2026-001.pdf',
      pdfKey: 'proposals/prop-1/P-2026-001.pdf',
      snapshot: {
        quoteSnapshot: { version: 1, reference: 'P-2026-001' },
        contractSnapshot: { version: 1, contractReference: 'CTR-2026-001' },
      },
      contractReference: 'CTR-2026-001',
      contractStatus: 'SENT',
      contractPdfUrl: null,
      contractSentAt: '2026-04-12T10:00:00.000Z',
      contractSignedAt: null,
    },
  ],
  bookings: [],
  tasks: [],
  messages: [],
  commSummary: {
    total: 0,
    channels: { EMAIL: 0, WHATSAPP: 0, INSTAGRAM: 0, FORM: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
    lastContactAt: null,
    lastContactChannel: null,
    lastContactDirection: null,
    pendingResponseFrom: 'NONE',
    daysSinceLastContact: null,
    responseGap: null,
  },
  timeline: [],
  discountCodes: [],
  leads: [],
  contacts: [],
  insights: {
    nextAction: { type: 'NONE', label: 'Cap', urgency: 'LOW' },
    commercialRisk: { level: 'NONE', label: 'Sense risc comercial actiu' },
    relationalHealth: 'GOOD',
    ltv: 0,
    recurrence: 0,
    completedEvents: 0,
    daysSinceLastContact: null,
    daysSinceLastEvent: null,
    daysUntilNextEvent: null,
    openTasksCount: 0,
    pendingPaymentTotal: 0,
  },
  reactivation: null,
};

describe('ProposalsPanel', () => {
  it('fa visibles les fotos documentals i dona CTA al document', () => {
    render(<ProposalsPanel data={HUB} />);

    expect(screen.getByText('Foto documental')).toBeInTheDocument();
    expect(screen.getByText('Pressupost congelat')).toBeInTheDocument();
    expect(screen.getByText('Contracte congelat')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /PDF enviat/ })).toHaveAttribute(
      'href',
      '/api/uploads/proposals/prop-1/P-2026-001.pdf',
    );
    expect(screen.getByRole('link', { name: /PDF enviat/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /PDF enviat/ })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'Obrir document →' })).toHaveAttribute(
      'href',
      '/admin/presupuestos?customerId=cust-1&proposalId=prop-1'
    );
  });

  it("mostra la ruta d'origen del document comercial", () => {
    render(<ProposalsPanel data={HUB} />);

    expect(screen.getByText('Origen')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Client origen' })).toHaveAttribute('href', '/admin/clientes/cust-1');
    expect(screen.getByRole('link', { name: 'Entrada origen' })).toHaveAttribute('href', '/admin/leads/lead-1');
    expect(screen.getByRole('link', { name: 'Reserva origen' })).toHaveAttribute('href', '/admin/bookings/booking-1');
  });

  it('fa accionable el PDF de contracte signat dins el hub', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              status: 'ACCEPTED',
              acceptedAt: '2026-04-13T10:00:00.000Z',
              contractStatus: 'SIGNED',
              contractSignedAt: '2026-04-14T10:00:00.000Z',
              contractPdfUrl: 'https://cdn.test/contracte-signat.pdf',
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Històric/ }));

    expect(screen.getByText('Contracte signat')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir PDF signat →' })).toHaveAttribute(
      'href',
      'https://cdn.test/contracte-signat.pdf',
    );
    expect(screen.getByRole('link', { name: 'Obrir PDF signat →' })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Obrir PDF signat →' })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('fa accionable el PDF de contracte enviat pendent de signatura dins el hub', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              status: 'ACCEPTED',
              acceptedAt: '2026-04-13T10:00:00.000Z',
              contractStatus: 'SENT',
              contractPdfUrl: 'https://cdn.test/contracte-pendent.pdf',
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Històric/ }));

    expect(screen.getByRole('link', { name: /PDF contracte/ })).toHaveAttribute(
      'href',
      'https://cdn.test/contracte-pendent.pdf',
    );
    expect(screen.getByRole('link', { name: /PDF contracte/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /PDF contracte/ })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('button', { name: '✍️ Marcar signat' })).toBeInTheDocument();
  });

  it('no mostra enviar contracte si el DRAFT encara no té referència', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              status: 'ACCEPTED',
              acceptedAt: '2026-04-13T10:00:00.000Z',
              contractStatus: 'DRAFT',
              contractReference: null,
              contractSentAt: null,
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Històric/ }));

    expect(screen.getByRole('button', { name: '📄 Generar contracte' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '📧 Enviar contracte' })).not.toBeInTheDocument();
  });

  it('mostra enviar contracte quan el DRAFT ja té referència', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              status: 'ACCEPTED',
              acceptedAt: '2026-04-13T10:00:00.000Z',
              contractStatus: 'DRAFT',
              contractReference: 'CTR-2026-001',
              contractSentAt: null,
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Històric/ }));

    expect(screen.getByRole('button', { name: '📧 Enviar contracte' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '📄 Generar contracte' })).not.toBeInTheDocument();
  });

  it('no deixa marcar acceptat un SENT sense PDF canònic i ofereix reparació', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              pdfUrl: null,
              pdfKey: null,
            },
          ],
        }}
      />,
    );

    expect(screen.queryByRole('button', { name: /Acceptat/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /PDF enviat/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '📄 Reparar PDF' })).toBeInTheDocument();
  });

  it('no deixa marcar acceptat un VIEWED sense PDF canònic i ofereix reparació', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              status: 'VIEWED',
              pdfUrl: null,
              pdfKey: null,
            },
          ],
        }}
      />,
    );

    expect(screen.queryByRole('button', { name: /Acceptat/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /PDF enviat/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '📄 Reparar PDF' })).toBeInTheDocument();
  });

  it('permet tancar un VIEWED amb PDF canònic igual que un enviat', () => {
    render(
      <ProposalsPanel
        data={{
          ...HUB,
          proposals: [
            {
              ...HUB.proposals[0],
              status: 'VIEWED',
              sentAt: '2026-04-11T10:00:00.000Z',
              pdfUrl: '/api/uploads/proposals/prop-1/P-2026-001.pdf',
              pdfKey: 'proposals/prop-1/P-2026-001.pdf',
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('link', { name: /PDF enviat/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '✅ Acceptat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⏰ Caducat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '❌ Rebutjat' })).toBeInTheDocument();
  });
});
