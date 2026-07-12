import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TimelinePanel from '@/app/admin/clientes/[id]/_components/TimelinePanel';
import type { CustomerInsightsDTO } from '@/lib/customer-hub/dto';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const insights: CustomerInsightsDTO = {
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
};

describe('TimelinePanel', () => {
  it("mostra els enllaços d'origen dels events documentals", () => {
    render(
      <TimelinePanel
        customerId="cust-1"
        customerName="Anna"
        insights={insights}
        timeline={[
          {
            id: 'proposal:prop-1:sent',
            type: 'PROPOSAL_SENT',
            at: '2026-04-11T10:00:00.000Z',
            title: 'Pressupost enviat (P-2026-001)',
            link: { label: 'Obrir pressupost', href: '/admin/presupuestos?proposalId=prop-1' },
            originLinks: [
              { label: 'Client origen', href: '/admin/clientes/cust-1' },
              { label: 'Entrada origen', href: '/admin/leads/lead-1' },
              { label: 'Reserva origen', href: '/admin/bookings/booking-1' },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('Origen')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Client origen' })).toHaveAttribute('href', '/admin/clientes/cust-1');
    expect(screen.getByRole('link', { name: 'Entrada origen' })).toHaveAttribute('href', '/admin/leads/lead-1');
    expect(screen.getByRole('link', { name: 'Reserva origen' })).toHaveAttribute('href', '/admin/bookings/booking-1');
  });

  it('destaca les traces documentals de dossier dins la timeline', () => {
    render(
      <TimelinePanel
        customerId="cust-1"
        customerName="Anna"
        insights={insights}
        timeline={[
          {
            id: 'al:dossier-1',
            type: 'ACTIVITY',
            at: '2026-04-11T10:00:00.000Z',
            title: 'Dossier enviat',
            meta: {
              source: 'adminLog',
              entityType: 'dossier',
              documentType: 'DOSSIER',
              dossierId: 'dos-1',
              preview: 'a anna@test.com · dossier_email_send',
            },
            link: { label: 'Obrir dossiers', href: '/admin/dossiers' },
          },
        ]}
      />,
    );

    expect(screen.getByText('Document dossier')).toBeInTheDocument();
    expect(screen.getByText('Dossier enviat')).toBeInTheDocument();
    expect(screen.getByText('a anna@test.com · dossier_email_send')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Obrir dossiers/ })).toHaveAttribute('href', '/admin/dossiers');
    expect(screen.getByRole('link', { name: /Obrir dossiers/ })).not.toHaveAttribute('target');
  });

  it('obre els documents externs de timeline en pestanya nova segura', () => {
    render(
      <TimelinePanel
        customerId="cust-1"
        customerName="Anna"
        insights={insights}
        timeline={[
          {
            id: 'booking:booking-1:invoice:invoice-1:document',
            type: 'ACTIVITY',
            at: '2026-04-11T10:00:00.000Z',
            title: 'Factura disponible (FAC-2026-001)',
            meta: {
              documentType: 'INVOICE',
              pdfUrl: 'https://cdn.test/factura.pdf',
            },
            link: { label: 'Obrir PDF factura', href: 'https://cdn.test/factura.pdf' },
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /Obrir PDF factura/ });
    expect(link).toHaveAttribute('href', 'https://cdn.test/factura.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('obre previews API de documents en pestanya nova segura', () => {
    render(
      <TimelinePanel
        customerId="cust-1"
        customerName="Anna"
        insights={insights}
        timeline={[
          {
            id: 'al:dossier-1',
            type: 'ACTIVITY',
            at: '2026-04-11T10:00:00.000Z',
            title: 'Dossier enviat',
            meta: {
              documentType: 'DOSSIER',
              dossierId: 'dos-1',
            },
            link: { label: 'Obrir preview dossier', href: '/api/admin/dossiers/dos-1/preview' },
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: /Obrir preview dossier/ });
    expect(link).toHaveAttribute('href', '/api/admin/dossiers/dos-1/preview');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('permet aillar documents de comunicacions generiques', () => {
    render(
      <TimelinePanel
        customerId="cust-1"
        customerName="Anna"
        insights={insights}
        timeline={[
          {
            id: 'al:dossier-1',
            type: 'ACTIVITY',
            at: '2026-04-11T10:00:00.000Z',
            title: 'Dossier enviat',
            meta: {
              entityType: 'dossier',
              documentType: 'DOSSIER',
              dossierId: 'dos-1',
            },
          },
          {
            id: 'msg:1',
            type: 'MESSAGE_SENT',
            at: '2026-04-11T09:00:00.000Z',
            title: 'Email enviat',
            meta: {
              channel: 'EMAIL',
              direction: 'OUTBOUND',
            },
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Documents/ }));
    expect(screen.getByText('Dossier enviat')).toBeInTheDocument();
    expect(screen.queryByText('Email enviat')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Comunicacions/ }));
    expect(screen.getByText('Email enviat')).toBeInTheDocument();
    expect(screen.queryByText('Dossier enviat')).not.toBeInTheDocument();
  });
});
