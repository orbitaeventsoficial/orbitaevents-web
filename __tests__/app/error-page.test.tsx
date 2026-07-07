import { render, screen } from '@testing-library/react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ErrorPage from '@/app/[locale]/error';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dict: Record<string, string> = {
      title: 'Alguna cosa no ha anat be',
      defaultMessage: 'Error inesperat a la web.',
      reassurance: 'Ho tenim controlat.',
      technicalDetails: 'Detalls tecnics',
      tryAgain: 'Torna-ho a provar',
      backToHome: 'Torna a inici',
      contactHelp: 'Contacta',
      persistentProblem: 'Si el problema continua,',
      contactUs: 'contacta amb nosaltres',
      errorCode: 'Codi error:',
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

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

vi.mock('framer-motion', () => {
  type MotionProps = {
    children?: ReactNode;
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
  };

  const MotionDiv = ({
    children,
    initial: _initial,
    animate: _animate,
    transition: _transition,
    ...props
  }: HTMLAttributes<HTMLDivElement> & MotionProps) => <div {...props}>{children}</div>;

  return {
    motion: {
      div: MotionDiv,
      button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & MotionProps) => (
        <button {...props}>{children}</button>
      ),
    },
  };
});

describe('public locale error page', () => {
  it('no mostra error.message a la UI publica', () => {
    const error = new Error('Database connection string leaked');
    (error as Error & { digest?: string }).digest = 'digest-123';

    render(<ErrorPage error={error as Error & { digest?: string }} reset={vi.fn()} />);

    expect(screen.getByText('Error inesperat a la web.')).toBeInTheDocument();
    expect(screen.queryByText(/Database connection string leaked/i)).not.toBeInTheDocument();
    expect(screen.getByText(/digest-123/i)).toBeInTheDocument();
  });
});
