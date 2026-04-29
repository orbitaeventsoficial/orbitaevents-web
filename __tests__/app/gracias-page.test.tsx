import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GraciasPage from '@/app/[locale]/gracias/page';
import { WHATSAPP_URL_WITH_MESSAGE } from '@/lib/constants';

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async () => {
    const dict: Record<string, string> = {
      title: 'Gràcies!',
      subtitle: 'Hem rebut el formulari.',
      'response.title': 'Resposta',
      'response.text': 'Resposta en menys de 2 hores',
      'urgent.title': 'Urgent',
      'urgent.whatsapp': 'Escriu-nos per WhatsApp',
      'nextSteps.title': 'Següents passos',
      'nextSteps.step1': 'Pas 1',
      'nextSteps.step2': 'Pas 2',
      'nextSteps.step3': 'Pas 3',
      'nextSteps.step4': 'Pas 4',
      backHome: 'Tornar a inici',
      viewPortfolio: 'Veure portfolio',
      spamNote: 'Sense spam',
    };
    const t = (key: string) => dict[key] ?? key;
    (t as typeof t & { raw: (key: string) => string }).raw = (key: string) => dict[key] ?? key;
    return t;
  },
}));

describe('GraciasPage', () => {
  it('uses the canonical WhatsApp helper for the urgent CTA', async () => {
    const ui = await GraciasPage();

    render(ui);

    expect(screen.getByRole('link', { name: 'Escriu-nos per WhatsApp' })).toHaveAttribute(
      'href',
      WHATSAPP_URL_WITH_MESSAGE('Hola, acabo de enviar el formulario'),
    );
  });
});
