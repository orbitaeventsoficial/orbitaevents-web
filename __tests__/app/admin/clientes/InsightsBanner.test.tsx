import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import InsightsBanner from '@/app/admin/clientes/[id]/_components/InsightsBanner';
import type { CustomerCommSummaryDTO, CustomerInsightsDTO } from '@/lib/customer-hub/dto';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const BASE_INSIGHTS: CustomerInsightsDTO = {
  nextAction: {
    type: 'FOLLOW_UP',
    label: 'Respondre al client',
    urgency: 'HIGH',
    context: 'Últim toc entrant per WhatsApp',
  },
  commercialRisk: {
    level: 'MEDIUM',
    label: 'Risc comercial actiu',
    context: '1 seguiment pendent',
  },
  relationalHealth: 'GOOD',
  ltv: 2400,
  recurrence: 2,
  completedEvents: 2,
  daysSinceLastContact: 1,
  daysSinceLastEvent: 30,
  daysUntilNextEvent: 14,
  openTasksCount: 1,
  pendingPaymentTotal: 0,
};

const BASE_COMM_SUMMARY: CustomerCommSummaryDTO = {
  total: 1,
  channels: { EMAIL: 0, WHATSAPP: 1, INSTAGRAM: 0, FORM: 0, CALL: 0, NOTE: 0, SYSTEM: 0 },
  lastContactAt: '2026-04-17T09:00:00.000Z',
  lastContactChannel: 'WHATSAPP',
  lastContactDirection: 'INBOUND',
  pendingResponseFrom: 'TEAM',
  daysSinceLastContact: 1,
  responseGap: 1,
};

describe('InsightsBanner', () => {
  it('resol la CTA des del resum canònic de comunicació i obre WhatsApp quan toca', () => {
    render(
      <InsightsBanner
        insights={BASE_INSIGHTS}
        customerId="cust-1"
        customerName="Anna"
        customerPhone="+34 600 11 22 33"
        commSummary={BASE_COMM_SUMMARY}
      />
    );

    const cta = screen.getByRole('link', { name: 'Respondre per WhatsApp' });
    expect(cta).toHaveAttribute('href');
    expect(cta.getAttribute('href')).toContain('https://wa.me/34600112233?text=');
  });
});
