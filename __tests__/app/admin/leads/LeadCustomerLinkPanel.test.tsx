import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LeadCustomerLinkPanel from '@/app/admin/leads/[id]/LeadCustomerLinkPanel';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/app/admin/components/ToastProvider', () => ({
  useToast: () => ({
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  }),
}));

describe('LeadCustomerLinkPanel', () => {
  it('manté visible el pont cap al Customer Hub quan el lead ja està vinculat', () => {
    render(
      <LeadCustomerLinkPanel
        leadId="lead-1"
        preview={{
          kind: 'already-linked',
          customer: {
            customerId: 'cust-1',
            customerName: 'Client Actiu',
            customerEmail: 'client@orbitaevents.com',
            customerPhone: '600111222',
            customerDni: null,
            matchedBy: [],
            confidence: 'strong',
          },
        }}
      />,
    );

    expect(screen.getByLabelText('Lead vinculat al Customer Hub')).toBeInTheDocument();
    expect(screen.getByText('Aquest lead ja forma part del client')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir Customer Hub' })).toHaveAttribute(
      'href',
      '/admin/clientes/cust-1?tab=summary',
    );
    expect(screen.getByRole('link', { name: 'Veure entrades del client' })).toHaveAttribute(
      'href',
      '/admin/clientes/cust-1?tab=leads',
    );
  });
});
