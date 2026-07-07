import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ClientPortalPageHeader from '@/app/components/public/ClientPortalPageHeader';

describe('ClientPortalPageHeader', () => {
  it('manté la fletxa de retorn fora del nom accessible del link', () => {
    render(
      <ClientPortalPageHeader
        backHref="/ca/portal/raw-token"
        backLabel="Tornar al portal"
        eyebrow="Contracte"
        title="Contracte del teu esdeveniment"
        accentColor="#22d3ee"
      />,
    );

    expect(screen.getByRole('link', { name: 'Tornar al portal' })).toHaveAttribute('href', '/ca/portal/raw-token');
    expect(screen.queryByRole('link', { name: '← Tornar al portal' })).not.toBeInTheDocument();
  });
});
