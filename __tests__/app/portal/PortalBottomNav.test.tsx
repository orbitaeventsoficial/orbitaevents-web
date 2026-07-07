import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PortalBottomNav from '@/app/[locale]/portal/[token]/PortalBottomNav';

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
}));

function renderBottomNav() {
  return render(
    <PortalBottomNav
      basePath="/es/portal/raw-token"
      accentHex="#22d3ee"
      labels={{
        ariaLabel: 'Navegación del portal',
        hub: 'Portal',
        payments: 'Pagos',
        timeline: 'Proceso',
        contract: 'Contrato',
        gallery: 'Fotos',
      }}
    />,
  );
}

describe('PortalBottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/es/portal/raw-token/payments');
  });

  it('usa el nom accessible rebut del locale del portal', () => {
    renderBottomNav();

    expect(screen.getByRole('navigation', { name: 'Navegación del portal' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navegació del portal' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pagos' })).toHaveAttribute('aria-current', 'page');
  });
});
