import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LeadsPanel from '@/app/admin/clientes/[id]/_components/panels/LeadsPanel';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const HUB: CustomerHubDTO = {
  customer: {
    id: 'cust-1',
    name: 'Anna',
    status: 'NEGOTIATION',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  kpis: {},
  active: { source: 'NONE' },
  proposals: [],
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
  leads: [
    {
      id: 'lead-1',
      name: 'Lead fred',
      email: 'fred@example.com',
      phone: null,
      eventType: 'BODA',
      status: 'QUOTE_SENT',
      priority: 'LOW',
      createdAt: '2026-04-10T10:00:00.000Z',
      commercialBlocker: {
        label: 'Pressupost pendent',
        context: 'Cal desencallar si la proposta s\'ha revisat',
        tone: 'WARNING',
      },
    },
    {
      id: 'lead-2',
      name: 'Lead calenta',
      email: 'calenta@example.com',
      phone: '+34 600 112 233',
      eventType: 'BODA',
      status: 'NEW',
      priority: 'HIGH',
      createdAt: '2026-04-11T10:00:00.000Z',
      commercialBlocker: {
        label: 'Seguiment urgent',
        context: '6d sense resposta',
        tone: 'DANGER',
      },
    },
  ],
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
};

describe('LeadsPanel', () => {
  it('mostra una lead prioritària, badges de prioritat, bloqueig i CTA operativa', () => {
    render(<LeadsPanel data={HUB} />);

    expect(screen.getByText('Lead prioritària')).toBeInTheDocument();
    expect(screen.getAllByText('Lead calenta')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Alta').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Seguiment urgent').length).toBeGreaterThan(0);
    expect(screen.getByText('Pressupost pendent')).toBeInTheDocument();
    expect(screen.getAllByText('Desencallar per WhatsApp').length).toBeGreaterThan(0);
    expect(screen.getByText('Enviar recordatori')).toBeInTheDocument();
  });
});
