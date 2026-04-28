import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import TasksNotesPanel from '@/app/admin/clientes/[id]/_components/panels/TasksNotesPanel';
import type { CustomerHubDTO } from '@/lib/customer-hub/dto';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
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
  active: { source: 'NONE' },
  proposals: [],
  bookings: [],
  tasks: [
    {
      id: 'task-1',
      title: 'Trucar per tancar',
      dueDate: '2026-04-20T10:00:00.000Z',
      done: false,
      priority: 'HIGH',
      leadId: 'lead-1',
    },
  ],
  messages: [],
  commSummary: {
    total: 0,
    channels: { EMAIL: 0, WHATSAPP: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
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
    openTasksCount: 1,
    pendingPaymentTotal: 0,
  },
  reactivation: null,
};

describe('TasksNotesPanel', () => {
  it('manté el context del Customer Hub quan la tasca està vinculada a una lead', () => {
    render(<TasksNotesPanel data={HUB} />);

    expect(screen.getByRole('link', { name: 'Obrir Customer Hub' })).toHaveAttribute(
      'href',
      '/admin/clientes/cust-1?tab=tasks'
    );
  });
});
