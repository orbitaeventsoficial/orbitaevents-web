import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockAccess, mockReadFile, mockLoadCanviValidations } = vi.hoisted(() => ({
  mockAccess: vi.fn(),
  mockReadFile: vi.fn(),
  mockLoadCanviValidations: vi.fn(),
}));

vi.mock('fs', () => ({
  __esModule: true,
  default: {
    promises: {
      access: mockAccess,
      readFile: mockReadFile,
    },
  },
  promises: {
    access: mockAccess,
    readFile: mockReadFile,
  },
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/admin/docs/protocol/ProtocolValidationToggle', () => ({
  default: ({ canviN }: { canviN: number }) => <div data-testid={`toggle-${canviN}`}>toggle-{canviN}</div>,
}));

vi.mock('@/lib/services/protocolValidationsService', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/protocolValidationsService')>(
    '@/lib/services/protocolValidationsService',
  );

  return {
    ...actual,
    loadCanviValidations: mockLoadCanviValidations,
  };
});

import AdminProtocolPage from '@/app/admin/docs/protocol/page';

const PROTOCOL_MD = [
  '## 6.14 Infra / Dev / Operativa',
  '**PENDENT CRÍTIC**: evitar regressions silencioses en repo gran.',
  '',
  '### Canvi #487 — 2026-05-04 — claude (FET)',
  '**Validació humana del protocol.**',
  '- Bullet 487',
  '',
  '### Canvi #486 — 2026-05-04 — codex (FET)',
  '**Shortcut pendent net.**',
  '- Bullet 486',
].join('\n');

describe('AdminProtocolPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
    mockReadFile.mockResolvedValue(PROTOCOL_MD);
  });

  it('renderitza el shortcut del primer pendent i els comptadors humans correctes', async () => {
    mockLoadCanviValidations.mockResolvedValue(
      new Map([
        [487, { canviN: 487, validatedAt: '2026-05-04T10:00:00.000Z', validatedBy: 'OWNER' }],
        [999, { canviN: 999, validatedAt: '2026-05-04T12:00:00.000Z', validatedBy: 'OWNER' }],
      ]),
    );

    const ui = await AdminProtocolPage({
      searchParams: Promise.resolve({}),
    });

    render(ui);

    expect(screen.getByRole('link', { name: 'Obrir primer pendent · #486' })).toHaveAttribute(
      'href',
      '/admin/docs/protocol?validation=pending&canvi=486#canvi-486',
    );
    expect(screen.getByText('Pendents · 1')).toBeInTheDocument();
    expect(screen.getByText('50% · 1 pendents.')).toBeInTheDocument();
    expect(screen.getByText('Vista actual: 1/2 validats · 50%.')).toBeInTheDocument();
    expect(screen.getByText('Següent pendent: #486 · codex')).toBeInTheDocument();
  });

  it('obre automàticament els detalls pendents quan el filtre és pending', async () => {
    mockLoadCanviValidations.mockResolvedValue(
      new Map([
        [487, { canviN: 487, validatedAt: '2026-05-04T10:00:00.000Z', validatedBy: 'OWNER' }],
      ]),
    );

    const ui = await AdminProtocolPage({
      searchParams: Promise.resolve({ validation: 'pending' }),
    });

    const { container } = render(ui);
    const pendingDetails = container.querySelector('#canvi-486');

    expect(screen.getByText('Pendents de validació (1)')).toBeInTheDocument();
    expect(pendingDetails).toHaveAttribute('open');
    expect(screen.getByTestId('toggle-486')).toBeInTheDocument();
  });

  it('renderitza la secció enfocada i amaga el shortcut quan tot el subconjunt està validat', async () => {
    mockLoadCanviValidations.mockResolvedValue(
      new Map([
        [487, { canviN: 487, validatedAt: '2026-05-04T10:00:00.000Z', validatedBy: 'OWNER' }],
        [486, { canviN: 486, validatedAt: '2026-05-04T11:00:00.000Z', validatedBy: 'OWNER' }],
      ]),
    );

    const ui = await AdminProtocolPage({
      searchParams: Promise.resolve({ seccio: '6.14', q: 'infra', validation: 'pending' }),
    });

    render(ui);

    expect(screen.getByText('§6.14 — Infra / Dev / Operativa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tornar a tot el protocol' })).toHaveAttribute(
      'href',
      '/admin/docs/protocol',
    );
    expect(screen.getByRole('link', { name: 'Manual de possibilitats' })).toHaveAttribute(
      'href',
      '/admin/manual',
    );
    expect(screen.getByText('Sense pendents en aquesta cerca')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Obrir primer pendent/i })).not.toBeInTheDocument();
    expect(screen.getByText('Cap pendent amb aquesta cerca')).toBeInTheDocument();
  });

  it('renderitza la vista validated amb cerca i empty state de seccions quan no hi ha coincidències', async () => {
    mockLoadCanviValidations.mockResolvedValue(
      new Map([
        [487, { canviN: 487, validatedAt: '2026-05-04T10:00:00.000Z', validatedBy: 'OWNER' }],
        [486, { canviN: 486, validatedAt: '2026-05-04T11:00:00.000Z', validatedBy: 'OWNER' }],
      ]),
    );

    const ui = await AdminProtocolPage({
      searchParams: Promise.resolve({ validation: 'validated', q: 'codex' }),
    });

    render(ui);

    expect(screen.getByText('Validats humans (1)')).toBeInTheDocument();
    expect(screen.getByText('1 canvi ja validat humanament amb cerca "codex".')).toBeInTheDocument();
    expect(screen.getByText('Cap secció amb aquesta cerca')).toBeInTheDocument();
    expect(screen.getByText('No hi ha cap secció del protocol que coincideixi amb "codex".')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Validats · 1' })).toHaveAttribute(
      'href',
      '/admin/docs/protocol?validation=validated&q=codex',
    );
    expect(screen.getByText('Sense pendents en aquesta cerca')).toBeInTheDocument();
  });
});
