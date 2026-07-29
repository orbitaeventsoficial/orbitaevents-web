import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PaymentSuccessPage from '@/app/[locale]/portal/payment-success/page';

describe('PaymentSuccessPage', () => {
  it('mostra el copy específic per pagament final', () => {
    render(<PaymentSuccessPage params={{ locale: 'ca' }} searchParams={{ type: 'remaining', ref: 'OE-2026-001' }} />);

    expect(screen.getByRole('heading', { name: 'Pagament confirmat' })).toBeInTheDocument();
    expect(screen.getByText('Hem rebut el pagament final correctament. Gràcies!')).toBeInTheDocument();
    expect(screen.getByText('OE-2026-001')).toBeInTheDocument();
  });

  it('usa el copy genèric si el tipus de pagament no és conegut', () => {
    render(<PaymentSuccessPage params={{ locale: 'ca' }} searchParams={{ type: 'unknown' }} />);

    expect(screen.getByText('Hem rebut el pagament correctament.')).toBeInTheDocument();
    expect(screen.queryByText('Hem rebut la paga i senyal correctament. La teva reserva queda confirmada.')).not.toBeInTheDocument();
  });

  it('tolera searchParams amb arrays i renderitza nomes el primer ref', () => {
    render(<PaymentSuccessPage params={{ locale: 'ca' }} searchParams={{ type: ['deposit', 'remaining'], ref: [' OE-2026-002 ', 'OE-2026-003'] }} />);

    expect(screen.getByText('Hem rebut la paga i senyal correctament. La teva reserva queda confirmada.')).toBeInTheDocument();
    expect(screen.getByText('OE-2026-002')).toBeInTheDocument();
    expect(screen.queryByText('OE-2026-003')).not.toBeInTheDocument();
  });
});
