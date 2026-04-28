import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeadLostReasonBadge from '@/app/admin/leads/LeadLostReasonBadge';

describe('LeadLostReasonBadge', () => {
  it('renderitza el motiu manual amb el label canònic', () => {
    render(<LeadLostReasonBadge lostReason="PRICE_TOO_HIGH" />);

    expect(screen.getByText('Motiu')).toBeInTheDocument();
    expect(screen.getByText('Preu massa alt')).toBeInTheDocument();
  });

  it('marca com a automàtica la pèrdua del cron', () => {
    render(<LeadLostReasonBadge lostReason="EVENT_PASSED" />);

    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText("Data d'esdeveniment passada sense conversió")).toBeInTheDocument();
  });

  it('no renderitza res amb un valor buit o invàlid', () => {
    const { container, rerender } = render(<LeadLostReasonBadge lostReason={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<LeadLostReasonBadge lostReason="BOGUS_REASON" />);
    expect(container).toBeEmptyDOMElement();
  });
});
