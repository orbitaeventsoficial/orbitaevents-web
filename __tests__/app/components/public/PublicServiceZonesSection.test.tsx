import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PublicServiceZonesSection from '@/app/components/public/PublicServiceZonesSection';

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('PublicServiceZonesSection', () => {
  it('renders the shared coverage title and zone cards (default h2 heading)', () => {
    render(
      <PublicServiceZonesSection
        title="Zones de cobertura"
        zones={[
          {
            id: 'barcelona',
            href: '/servicios/discomovil-barcelona',
            icon: '🏙️',
            label: 'Barcelona',
            description: 'Àrea metropolitana',
          },
          {
            id: 'maresme',
            href: '/servicios/discomovil-maresme',
            icon: '🏖️',
            label: 'Maresme',
            description: 'Costa i interior',
          },
        ]}
        columnsClassName="grid-cols-1 md:grid-cols-2"
      />
    );

    const heading = screen.getByRole('heading', { name: 'Zones de cobertura' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H2');
    expect(screen.getByRole('link', { name: /Barcelona/i })).toHaveAttribute('href', '/servicios/discomovil-barcelona');
    expect(screen.getByRole('link', { name: /Maresme/i })).toHaveAttribute('href', '/servicios/discomovil-maresme');
    expect(screen.getByText('Àrea metropolitana')).toBeInTheDocument();
    expect(screen.getByText('Costa i interior')).toBeInTheDocument();
  });

  it('renders the optional badge, subtitle and h3 heading when provided (bodas variant)', () => {
    render(
      <PublicServiceZonesSection
        title="Cobrim tota Catalunya"
        subtitle="Sense cost de desplaçament en zones principals"
        badge={{ icon: <span data-testid="map-pin">📍</span>, label: 'Cobertura activa' }}
        headingLevel="h3"
        zones={[
          {
            id: 'girona',
            href: '/servicios/dj-bodas-girona',
            icon: '🏛️',
            label: 'Girona',
            description: 'Masies i castells',
          },
        ]}
      />
    );

    const heading = screen.getByRole('heading', { name: 'Cobrim tota Catalunya' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
    expect(screen.getByText('Cobertura activa')).toBeInTheDocument();
    expect(screen.getByTestId('map-pin')).toBeInTheDocument();
    expect(screen.getByText('Sense cost de desplaçament en zones principals')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Girona/i })).toHaveAttribute('href', '/servicios/dj-bodas-girona');
  });
});
