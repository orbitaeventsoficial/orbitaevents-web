import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CommsPanel from '@/app/admin/clientes/[id]/_components/panels/CommsPanel';
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
    phone: '+34 600 11 22 33',
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
    total: 1,
    channels: { EMAIL: 0, WHATSAPP: 1, CALL: 0, NOTE: 0, SYSTEM: 0 },
    lastContactAt: '2026-04-17T09:00:00.000Z',
    lastContactChannel: 'WHATSAPP',
    lastContactDirection: 'INBOUND',
    pendingResponseFrom: 'TEAM',
    daysSinceLastContact: 1,
    responseGap: 1,
  },
  followUpSummary: {
    total: 1,
    urgent: 1,
    normal: 0,
    low: 0,
    topItem: {
      leadId: 'lead-1',
      name: 'Anna',
      phone: '+34 600 11 22 33',
      urgency: 'URGENT',
      daysSinceOutbound: 6,
      suggestedAction: 'Trucar o enviar WhatsApp',
    },
  },
  timeline: [],
  discountCodes: [],
  leads: [],
  insights: {
    nextAction: {
      type: 'FOLLOW_UP',
      label: 'Respondre al client',
      urgency: 'HIGH',
      context: 'Últim toc entrant per WhatsApp',
    },
    commercialRisk: {
      level: 'HIGH',
      label: 'Risc comercial alt',
      context: '1 seguiment urgent sense resposta',
    },
    relationalHealth: 'GOOD',
    ltv: 1200,
    recurrence: 1,
    completedEvents: 1,
    daysSinceLastContact: 1,
    daysSinceLastEvent: null,
    daysUntilNextEvent: null,
    openTasksCount: 0,
    pendingPaymentTotal: 0,
  },
};

describe('CommsPanel', () => {
  it('mostra la CTA canònica de conversa al panell de comunicacions', () => {
    render(<CommsPanel data={HUB} />);

    const cta = screen.getAllByRole('link', { name: 'Respondre per WhatsApp' })[0];
    expect(cta).toHaveAttribute('href');
    expect(cta.getAttribute('href')).toContain('https://wa.me/34600112233?text=');
  });

  it('neteja labels interns al llistat recent de comunicacions', () => {
    render(<CommsPanel data={{
      ...HUB,
      messages: [{
        id: 'msg-1',
        channel: 'NOTE',
        subject: 'NOTE_ADDED',
        bodyPreview: 'Nota interna de seguiment',
        createdAt: '2026-04-17T10:00:00.000Z',
      }],
    }} />);

    expect(screen.getByText('Nota afegida')).toBeInTheDocument();
    expect(screen.getByText('Nota')).toBeInTheDocument();
  });
});
