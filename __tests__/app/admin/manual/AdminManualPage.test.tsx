import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

vi.mock('fs', () => ({
  __esModule: true,
  default: {
    promises: {
      readFile: mockReadFile,
    },
  },
  promises: {
    readFile: mockReadFile,
  },
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AdminManualPage from '@/app/admin/manual/page';

const PROTOCOL_MD = [
  '### Canvi #131 — 2026-04-10 — codex (FET)',
  '**Attribution multi-touch.**',
  '',
  '### Canvi #380 — 2026-04-24 — codex (FET)',
  '**Command palette.**',
].join('\n');

describe('AdminManualPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue(PROTOCOL_MD);
  });

  it('renderitza el roadmap pendent amb CTA directe a §6.16', async () => {
    const ui = await AdminManualPage();

    render(ui);

    expect(
      screen.getByRole('heading', { name: 'Marketing Analytics Hub amb integracions externes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Obrir §6.16 al protocol' })).toHaveAttribute(
      'href',
      '/admin/docs/protocol?seccio=6.16#seccio-6-16',
    );
    expect(screen.queryByRole('link', { name: 'Obrir §6.15 al protocol' })).not.toBeInTheDocument();
  });
});
