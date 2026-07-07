import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TestimonialForm from '../../../app/components/reviews/TestimonialForm';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      'errors.submitError': "No hem pogut enviar la teva opinio. Torna-ho a provar.",
      'success.title': 'Gracies per la teva opinio',
      'success.exclusiveCode': 'Codi exclusiu',
      'success.discount': 'de descompte',
      'success.validFor': 'Valid per al proxim event',
      'success.codeByEmail': 'Tambe el rebras per email',
      'success.backHome': 'Torna a inici',
      'gamified.steps.rating': 'Puntuacio',
      'gamified.steps.comment': 'Comentari',
      'gamified.steps.media': 'Multimedia',
      'gamified.steps.contact': 'Contacte',
      'gamified.navigation.currentReward': 'Recompensa actual',
      'gamified.navigation.previous': 'Anterior',
      'gamified.navigation.next': 'Seguent',
      'gamified.navigation.submit': 'Enviar valoracio',
      'gamified.navigation.submitting': 'Enviant',
      'gamified.rating.title': 'Com ho valores?',
      'gamified.emojiMessages.5': 'Perfecte',
      'gamified.comment.title': 'Explica com va anar',
      'gamified.comment.commentPlaceholder': 'La teva opinio',
      'gamified.media.title': 'Afegeix material',
      'gamified.media.addPhoto': 'Afegeix foto',
      'gamified.media.photoDiscount': '+5%',
      'gamified.media.addVideo': 'Afegeix video',
      'gamified.media.videoDiscount': '+10%',
      'gamified.nps.googleShare': 'Ho puc compartir a Google',
      'gamified.nps.googleDiscount': '+5%',
      'gamified.consent.showName': 'Pots publicar el meu nom',
      'gamified.yourData.title': 'Les teves dades',
      'validation.commentMin': 'minim 10 caracters',
      'form.name': 'Nom',
      'form.phoneOptional': 'Telefon opcional',
    };
    return dict[key] ?? key;
  },
}));

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => {
  const MotionDiv = ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    ...props
  }: {
    children?: ReactNode;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
  }) => <div {...props}>{children}</div>;

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: { div: MotionDiv },
  };
});

const GENERIC_ERROR = "No hem pogut enviar la teva opinio. Torna-ho a provar.";

function fillAndSubmit(container: HTMLElement) {
  fireEvent.click(screen.getAllByRole('button', { name: '★' })[4]);
  fireEvent.click(screen.getByRole('button', { name: /Seguent/i }));

  fireEvent.change(screen.getByPlaceholderText('La teva opinio'), {
    target: { value: 'Una experiencia molt bona i ben portada.' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Seguent/i }));

  fireEvent.click(screen.getByRole('button', { name: /Seguent/i }));

  const nameInput = container.querySelector('input[type="text"]');
  const emailInput = container.querySelector('input[type="email"]');
  if (!nameInput || !emailInput) throw new Error('testimonial contact inputs not found');

  fireEvent.change(nameInput, { target: { value: 'Laia Soler' } });
  fireEvent.change(emailInput, { target: { value: 'laia@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Enviar valoracio/i }));
}

describe('TestimonialForm', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no mostra el literal del backend quan el submit falla', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Database connection failed' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<TestimonialForm />);
    fillAndSubmit(container);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(/Database connection failed/i)).not.toBeInTheDocument();
  });

  it('no mostra errors tecnics de xarxa al client', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<TestimonialForm />);
    fillAndSubmit(container);

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/i)).not.toBeInTheDocument();
  });

  it('no mostra errors de JSON malformat al client', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<TestimonialForm />);
    fillAndSubmit(container);

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected end of JSON input/i)).not.toBeInTheDocument();
  });
});
