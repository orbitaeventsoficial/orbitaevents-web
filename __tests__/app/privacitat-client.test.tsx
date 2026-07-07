import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { AnchorHTMLAttributes, FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PrivacitatClient from '@/app/[locale]/privacitat/client';

const { mockFetchWithCsrf } = vi.hoisted(() => ({
  mockFetchWithCsrf: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  fetchWithCsrf: mockFetchWithCsrf,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, number>) => {
    const dict: Record<string, string> = {
      title: 'Portal de privacitat',
      subtitle: 'Gestiona els teus drets RGPD',
      'selectStep.heading': 'Que vols fer?',
      'selectStep.subheading': 'Tria una opcio',
      'selectStep.infoBox.title': 'Resposta',
      'selectStep.infoBox.text': 'Et respondrem dins el termini legal.',
      'requestTypes.ACCESS.title': 'Acces a dades',
      'requestTypes.ACCESS.description': 'Rep una copia de les dades.',
      'requestTypes.ACCESS.label': 'Acces',
      'requestTypes.PORTABILITY.title': 'Portabilitat',
      'requestTypes.PORTABILITY.description': 'Rep les dades en format portable.',
      'requestTypes.PORTABILITY.label': 'Portabilitat',
      'requestTypes.RECTIFICATION.title': 'Rectificacio',
      'requestTypes.RECTIFICATION.description': 'Corregeix dades.',
      'requestTypes.RECTIFICATION.label': 'Rectificacio',
      'requestTypes.RECTIFICATION.descriptionLabel': 'Que vols corregir?',
      'requestTypes.ERASURE.title': 'Supressio',
      'requestTypes.ERASURE.description': 'Elimina dades.',
      'requestTypes.ERASURE.label': 'Supressio',
      'requestTypes.OBJECTION.title': 'Oposicio',
      'requestTypes.OBJECTION.description': 'Oposa-t al tractament.',
      'requestTypes.OBJECTION.label': 'Oposicio',
      'requestTypes.OBJECTION.descriptionLabel': 'Motiu',
      'requestTypes.RESTRICTION.title': 'Limitacio',
      'requestTypes.RESTRICTION.description': 'Limita el tractament.',
      'requestTypes.RESTRICTION.label': 'Limitacio',
      'requestTypes.RESTRICTION.descriptionLabel': 'Motiu',
      'form.backButton': 'Tornar',
      'form.fullName': 'Nom complet',
      'form.required': 'obligatori',
      'form.fullNamePlaceholder': 'El teu nom',
      'form.email': 'Email',
      'form.emailPlaceholder': 'el-teu@email.com',
      'form.emailHint': 'Farem servir aquest email per respondre.',
      'form.phone': 'Telefon',
      'form.phoneOptional': 'opcional',
      'form.phonePlaceholder': '+34 600 000 000',
      'form.descriptionPlaceholder': 'Explica el cas',
      'form.characterCount': `${values?.count ?? 0} caracters`,
      'form.gdprConsent': 'Accepto la',
      'form.privacyPolicy': 'politica de privacitat',
      'form.gdprConsentText': 'i confirmo la identitat.',
      'form.submitButton': 'Enviar sollicitud',
      'form.submitting': 'Enviant',
      'form.errorDefault': 'No hem pogut registrar la sollicitud. Torna-ho a provar.',
      'form.errorConnection': 'No hem pogut connectar. Revisa la connexio i torna-ho a provar.',
      'footer.privacyPolicy': 'Politica de privacitat',
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

vi.mock('@/app/components/public/PublicPageHeader', () => ({
  default: ({ title, description }: { title: string; description: string }) => (
    <header>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  ),
}));

vi.mock('framer-motion', () => {
  type MotionProps = {
    children?: ReactNode;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: unknown;
  };

  const MotionDiv = ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    ...props
  }: HTMLAttributes<HTMLDivElement> & MotionProps) => <div {...props}>{children}</div>;

  const MotionForm = ({
    children,
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    ...props
  }: FormHTMLAttributes<HTMLFormElement> & MotionProps) => <form {...props}>{children}</form>;

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    motion: {
      div: MotionDiv,
      form: MotionForm,
    },
  };
});

const DEFAULT_ERROR = 'No hem pogut registrar la sollicitud. Torna-ho a provar.';
const CONNECTION_ERROR = 'No hem pogut connectar. Revisa la connexio i torna-ho a provar.';

function fillAndSubmitPrivacyRequest() {
  fireEvent.click(screen.getByRole('button', { name: /Acces a dades/i }));
  fireEvent.change(screen.getByLabelText(/Nom complet/i), { target: { value: 'Laia Soler' } });
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'laia@example.com' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /Enviar sollicitud/i }));
}

describe('PrivacitatClient', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('no mostra el literal del backend quan la sol·licitud falla', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      json: vi.fn().mockResolvedValue({ success: false, error: 'Prisma P2002 duplicate request' }),
    });

    render(<PrivacitatClient />);
    fillAndSubmitPrivacyRequest();

    await waitFor(() => expect(mockFetchWithCsrf).toHaveBeenCalledOnce());
    expect(await screen.findByText(DEFAULT_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(/Prisma P2002/i)).not.toBeInTheDocument();
  });

  it('no mostra errors de JSON malformat al client', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected end of JSON input')),
    });

    render(<PrivacitatClient />);
    fillAndSubmitPrivacyRequest();

    expect(await screen.findByText(DEFAULT_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(/Unexpected end of JSON input/i)).not.toBeInTheDocument();
  });

  it('no mostra errors tecnics de connexio al client', async () => {
    mockFetchWithCsrf.mockRejectedValue(new Error('Failed to fetch'));

    render(<PrivacitatClient />);
    fillAndSubmitPrivacyRequest();

    expect(await screen.findByText(CONNECTION_ERROR)).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch/i)).not.toBeInTheDocument();
  });
});
