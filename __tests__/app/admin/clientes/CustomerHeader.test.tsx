import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CustomerHeader from '@/app/admin/clientes/[id]/_components/CustomerHeader';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}));

vi.mock('@/app/admin/components/ConfirmDialog', () => ({
  default: () => null,
  useConfirmDialog: () => ({
    confirm: vi.fn(),
    dialogProps: {},
  }),
}));

vi.mock('@/app/admin/clientes/[id]/_components/CustomerHubClient', () => ({
  useHubContext: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/app/admin/clientes/[id]/_components/InsightsBanner', () => ({
  default: () => <div data-testid="insights-banner" />,
}));

vi.mock('@/app/admin/components/MobileQuickActions', () => ({
  default: () => <div data-testid="mobile-quick-actions" />,
}));

function makeCustomerHubData() {
  return {
    customer: {
      id: 'cust-1',
      customerNumber: 7,
      name: 'Client Header',
      email: 'client@orbitaevents.com',
      phone: '600111222',
      status: 'ACTIVE',
    },
    kpis: {
      lastContactAt: null,
      nextEventDate: null,
      totalQuoted: 0,
      totalPaid: 0,
      marginEstimated: 0,
    },
    bookings: [],
    proposals: [],
    tasks: [],
    discountCodes: [],
    leads: [],
  contacts: [],
    followUpSummary: undefined,
    commSummary: {
      total: 0,
      lastContactAt: null,
      lastContactChannel: null,
      lastContactDirection: null,
      pendingResponseFrom: null,
      channels: { EMAIL: 0, WHATSAPP: 0, PHONE: 0, OTHER: 0 },
    },
    insights: {
      nextAction: {
        type: 'NONE',
        label: 'Sense acció',
        urgency: 'LOW',
        context: null,
      },
      commercialRisk: {
        level: 'NONE',
        label: 'Sense risc',
        context: null,
      },
      relationalHealth: 'ACTIVE',
    },
  };
}

describe('CustomerHeader', () => {
  it('obre el redactor canònic del Customer Hub en clicar l’email visible', () => {
    render(
      <CustomerHeader
        data={makeCustomerHubData() as any}
        tab="summary"
        setTab={vi.fn()}
      />,
    );

    expect(screen.getByRole('link', { name: 'client@orbitaevents.com' })).toHaveAttribute(
      'href',
      '/admin/inbox/compose?customerId=cust-1',
    );
  });
});
