import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ValoracioClient, { normalizeValoracioParam } from '@/app/[locale]/valoracio/client';
import { generateMetadata } from '@/app/[locale]/valoracio/page';

const mocks = vi.hoisted(() => ({
  searchParamsGet: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mocks.searchParamsGet,
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      eyebrow: 'Post-event',
      title: 'Com va anar el teu esdeveniment?',
      description: 'La teva opinió ens ajuda a cuidar millor cada festa.',
      'signals.trust.title': '2 minuts',
      'signals.trust.text': 'Quatre passos curts i sense registre.',
      'signals.reward.title': 'Fins al 25%',
      'signals.reward.text': 'Més descompte si afegeixes foto, vídeo o Google.',
      'signals.memory.title': 'Record real',
      'signals.memory.text': 'Ens ajuda a millorar.',
    };
    return dict[key] ?? key;
  },
}));

vi.mock('@/app/components/reviews/TestimonialForm', () => ({
  default: ({ token, bookingRef }: { token?: string | null; bookingRef?: string | null }) => (
    <div data-testid="testimonial-form" data-token={token ?? ''} data-booking-ref={bookingRef ?? ''} />
  ),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const dicts: Record<string, Record<string, Record<string, string>>> = {
      ca: {
        'testimonialForm.metadata': {
          title: 'Valora la teva experiència | {brand}',
          description: 'Explica com va anar el teu event amb {brand}.',
        },
      },
      en: {
        'testimonialForm.metadata': {
          title: 'Review your experience | {brand}',
          description: 'Tell us how your event with {brand} went.',
        },
      },
    };
    const dict = dicts[locale]?.[namespace] ?? {};

    return (key: string, values?: Record<string, string>) => (
      dict[key] ?? key
    ).replace('{brand}', values?.brand ?? '');
  },
}));

describe('ValoracioPage', () => {
  it('normalitza token i referencia abans de passar-los al formulari', () => {
    mocks.searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return ' tok-123 ';
      if (key === 'ref') return ' OE-2026-001 ';
      return null;
    });

    render(<ValoracioClient />);

    expect(screen.getByTestId('testimonial-form')).toHaveAttribute('data-token', 'tok-123');
    expect(screen.getByTestId('testimonial-form')).toHaveAttribute('data-booking-ref', 'OE-2026-001');
    expect(screen.getByRole('heading', { name: 'Com va anar el teu esdeveniment?' })).toBeInTheDocument();
    expect(screen.getByText('Fins al 25%')).toBeInTheDocument();
  });

  it('descarta valors buits de query', () => {
    expect(normalizeValoracioParam('   ')).toBeNull();
    expect(normalizeValoracioParam(null)).toBeNull();
    expect(normalizeValoracioParam('  OE-2026-002  ')).toBe('OE-2026-002');
  });

  it('genera metadata localitzada per la ruta post-event', async () => {
    const metadata = await generateMetadata({ params: { locale: 'en-US' } });

    expect(metadata.title).toBe('Review your experience | Òrbita Events');
    expect(metadata.description).toBe('Tell us how your event with Òrbita Events went.');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
