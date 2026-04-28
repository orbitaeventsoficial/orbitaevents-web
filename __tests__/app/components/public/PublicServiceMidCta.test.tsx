import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PublicServiceMidCta from '@/app/components/public/PublicServiceMidCta';

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('PublicServiceMidCta', () => {
  it('renders the shared mid-funnel CTA and forwards clicks', () => {
    const handleClick = vi.fn();

    render(
      <PublicServiceMidCta
        title="Reserva la teva festa"
        subtitle="Configuració ràpida i sense sorpreses."
        href="/configurador?service=fiestas"
        ctaLabel="Configurar"
        onClick={handleClick}
      />
    );

    expect(screen.getByRole('heading', { name: 'Reserva la teva festa' })).toBeInTheDocument();
    expect(screen.getByText('Configuració ràpida i sense sorpreses.')).toBeInTheDocument();

    const cta = screen.getByRole('link', { name: /Configurar/i });
    expect(cta).toHaveAttribute('href', '/configurador?service=fiestas');

    fireEvent.click(cta);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
