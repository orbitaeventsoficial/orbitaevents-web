import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BookingConfirmedPage from '@/app/[locale]/reserva-confirmada/page';

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ namespace }: { locale: string; namespace: string }) => {
    const dicts: Record<string, Record<string, string>> = {
      'booking.confirmed': {
        title: 'Sol·licitud de reserva rebuda',
        referenceLabel: 'Referència',
        message: 'Hem rebut la teva sol·licitud de reserva i hem bloquejat provisionalment la data mentre revisem disponibilitat i detalls.',
        'nextSteps.title': 'Propers passos:',
        'nextSteps.review.title': 'Revisió de disponibilitat',
        'nextSteps.review.description': 'El nostre equip revisarà la sol·licitud.',
        'nextSteps.finalConfirmation.title': 'Confirmació final',
        'nextSteps.finalConfirmation.description': "T'enviarem un contracte.",
        'nextSteps.payment.title': 'Paga i senyal',
        'nextSteps.payment.description': 'Rebràs les instruccions.',
        'actions.home': "Tornar a l'inici",
        'actions.portfolio': 'Veure portfolio',
        'contact.question': 'Tens alguna pregunta?',
      },
      'booking.confirmed.meta': {
        title: 'Sol·licitud de reserva rebuda | Òrbita Events',
        description: "Hem rebut la teva sol·licitud de reserva i t'enviarem els propers passos.",
      },
    };
    const dict = dicts[namespace] ?? {};
    return (key: string) => dict[key] ?? key;
  },
}));

describe('BookingConfirmedPage', () => {
  it('manté el locale i el copy del namespace booking.confirmed', async () => {
    const ui = await BookingConfirmedPage({
        params: { locale: 'ca' },
        searchParams: { ref: 'OE-2026-001' },
    });

    render(ui);

    expect(screen.getByText('Sol·licitud de reserva rebuda')).toBeInTheDocument();
    expect(screen.getByText(/Hem rebut la teva sol·licitud de reserva/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Tornar a l'inici" })).toHaveAttribute('href', '/ca');
    expect(screen.getByRole('link', { name: 'Veure portfolio' })).toHaveAttribute('href', '/ca/portfolio');
  });
});
