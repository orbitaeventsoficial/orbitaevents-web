import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TestimonialForm from '@/app/components/reviews/TestimonialForm';

const fetchMock = vi.fn();

vi.mock('next-intl', () => ({
  useTranslations: () => {
    const dict: Record<string, string> = {
      'gamified.steps.rating': 'Valoració',
      'gamified.steps.comment': 'Comentari',
      'gamified.steps.media': 'Foto/Vídeo',
      'gamified.steps.contact': 'Contacte',
      'gamified.navigation.currentReward': 'Recompensa actual:',
      'gamified.rating.title': "Com va ser l'experiència?",
      'gamified.rating.starLabel': 'Valoració {rating} de 5: {label}',
      'gamified.emojiMessages.4': 'Genial!',
      'gamified.comment.title': "Explica'ns més",
      'gamified.comment.commentPlaceholder': 'Explica com va anar el teu event...',
      'gamified.media.title': 'Afegeix foto o vídeo',
      'gamified.media.addPhoto': 'Afegir foto',
      'gamified.media.photoDiscount': '+5% descompte',
      'gamified.media.addVideo': 'Afegir vídeo',
      'gamified.media.videoDiscount': '+10% descompte',
      'gamified.nps.googleShare': 'També vull deixar-ho a Google',
      'gamified.nps.googleDiscount': '+5% descompte extra!',
      'gamified.consent.showName': 'Mostrar el meu nom a la web',
      'gamified.rewards.photo': 'Foto +5%',
      'gamified.rewards.video': 'Video +10%',
      'gamified.rewards.google': 'Google +5%',
      'gamified.rewards.photoDone': 'Foto afegida',
      'gamified.rewards.videoDone': 'Video afegit',
      'gamified.rewards.googleDone': 'Google activat',
      'gamified.yourData.title': 'Les teves dades',
      'gamified.navigation.previous': 'Anterior',
      'gamified.navigation.next': 'Següent',
      'gamified.navigation.submit': 'Enviar opinió',
      'gamified.navigation.submitting': 'Enviant...',
      'validation.commentMin': 'El comentari ha de tenir mínim 10 caràcters',
      'form.ratingLabels.4': 'Molt bé!',
      'form.name': 'Nom',
      'form.email': 'Email',
      'form.phoneOptional': 'Telèfon (opcional)',
      'errors.submitError': 'No hem pogut enviar la teva opinió. Torna-ho a provar.',
    };

    return (key: string, values?: Record<string, string | number>) => {
      const value = dict[key] ?? key;
      return value
        .replace('{rating}', String(values?.rating ?? ''))
        .replace('{label}', String(values?.label ?? ''));
    };
  },
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function completeRequiredReviewForm() {
  fireEvent.click(screen.getByRole('button', { name: 'Valoració 4 de 5: Molt bé!' }));
  fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
  fireEvent.change(screen.getByRole('textbox', { name: "Explica'ns més" }), {
    target: { value: 'Una experiencia molt bona i molt professional.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
  fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
  fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Client Test' } });
  fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'client@example.com' } });
}

describe('TestimonialForm', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('dona nom accessible i estat seleccionat a les estrelles de valoracio', () => {
    render(<TestimonialForm />);

    const fourthStar = screen.getByRole('button', { name: 'Valoració 4 de 5: Molt bé!' });
    expect(screen.getByText('Foto +5%')).toBeInTheDocument();
    expect(screen.getByText('Video +10%')).toBeInTheDocument();
    expect(screen.getByText('Google +5%')).toBeInTheDocument();

    expect(fourthStar).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(fourthStar);

    expect(fourthStar).toHaveAttribute('aria-pressed', 'true');
  });

  it("anuncia l'error d'enviament com a alerta accessible", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'raw backend error' }),
    });

    render(<TestimonialForm token="tok-1" bookingRef="OE-2026-001" />);

    fireEvent.click(screen.getByRole('button', { name: 'Valoració 4 de 5: Molt bé!' }));
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));

    fireEvent.change(screen.getByRole('textbox', { name: "Explica'ns més" }), {
      target: { value: 'Una experiencia molt bona i molt professional.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));

    expect(screen.getByLabelText(/Afegir foto/)).toHaveAttribute('type', 'url');
    expect(screen.getByLabelText(/Afegir vídeo/)).toHaveAttribute('type', 'url');
    fireEvent.click(screen.getByRole('button', { name: 'Següent' }));
    fireEvent.change(screen.getByLabelText('Nom *'), { target: { value: 'Client Test' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'client@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar opinió' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hem pogut enviar la teva opinió. Torna-ho a provar.',
    );
    expect(fetchMock).toHaveBeenCalledWith('/api/testimonials', expect.objectContaining({ method: 'POST' }));
  });

  it('omet token i referencia del payload quan no hi ha context public', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ discountCode: 'OE-OK1234', discountPercent: 5 }),
    });

    render(<TestimonialForm />);

    completeRequiredReviewForm();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar opinió' }));

    expect(await screen.findByText('OE-OK1234')).toBeInTheDocument();

    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(init.body));
    expect(payload).not.toHaveProperty('token');
    expect(payload).not.toHaveProperty('bookingRef');
  });
});
